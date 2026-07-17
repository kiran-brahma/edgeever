import { useCallback, useMemo, useRef, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert, BackHandler, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { RefreshCw } from "lucide-react-native";
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from "react-native-webview";
import { useSession } from "../lib/session";

type NativeBridgeMessage =
  | { type: "download"; filename?: string; dataUrl?: string }
  | { type: "logout" }
  | { type: "unauthorized" };

const SAFE_DOWNLOAD_NAME = /[^a-zA-Z0-9._\-\u4e00-\u9fff]/g;

export const PwaWorkspaceScreen = () => {
  const { session, signOut } = useSession();
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  if (!session) {
    return null;
  }

  const instanceOrigin = new URL(session.baseUrl).origin;
  const injectedJavaScriptBeforeContentLoaded = useMemo(
    () => createBridgeScript(instanceOrigin, session.token),
    [instanceOrigin, session.token]
  );

  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      let message: NativeBridgeMessage;

      try {
        message = JSON.parse(event.nativeEvent.data) as NativeBridgeMessage;
      } catch {
        return;
      }

      if (message.type === "logout" || message.type === "unauthorized") {
        await signOut();
        return;
      }

      if (message.type !== "download" || !message.dataUrl) {
        return;
      }

      try {
        await shareDataUrl(message.dataUrl, message.filename);
      } catch (error) {
        Alert.alert("导出失败", error instanceof Error ? error.message : "无法保存导出文件");
      }
    },
    [signOut]
  );

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (!canGoBack) {
          return false;
        }

        webViewRef.current?.goBack();
        return true;
      });

      return () => subscription.remove();
    }, [canGoBack])
  );

  const allowNavigation = useCallback(
    (request: { url: string }) => {
      if (request.url === "about:blank") {
        return true;
      }

      try {
        const target = new URL(request.url);
        if (target.origin === instanceOrigin) {
          return true;
        }
      } catch {
        return false;
      }

      void Linking.openURL(request.url);
      return false;
    },
    [instanceOrigin]
  );

  if (loadError) {
    return (
      <SafeAreaView style={styles.errorSafeArea}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>无法打开 EdgeEver</Text>
          <Text style={styles.errorMessage}>{loadError}</Text>
          <Text numberOfLines={2} style={styles.instanceUrl}>{session.baseUrl}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setLoadError(null)}
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
          >
            <RefreshCw color="#ffffff" size={17} />
            <Text style={styles.retryButtonText}>重新加载</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.switchButton}>
            <Text style={styles.switchButtonText}>退出并切换实例</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <WebView
        ref={webViewRef}
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        cacheEnabled
        domStorageEnabled
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={["https://*", "http://*", "about:*"]}
        pullToRefreshEnabled
        setSupportMultipleWindows={false}
        sharedCookiesEnabled
        source={{ uri: session.baseUrl }}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        onContentProcessDidTerminate={() => webViewRef.current?.reload()}
        onError={(event) => setLoadError(event.nativeEvent.description || "网络连接失败")}
        onHttpError={(event) => {
          if (event.nativeEvent.statusCode >= 500) {
            setLoadError(`实例返回 HTTP ${event.nativeEvent.statusCode}`);
          }
        }}
        onMessage={handleMessage}
        onNavigationStateChange={(state: WebViewNavigation) => setCanGoBack(state.canGoBack)}
        onShouldStartLoadWithRequest={allowNavigation}
        style={styles.webView}
      />
    </SafeAreaView>
  );
};

const createBridgeScript = (instanceOrigin: string, token: string) => `
(() => {
  if (window.__EDGE_EVER_NATIVE_BRIDGE__) return;
  window.__EDGE_EVER_NATIVE_BRIDGE__ = true;

  const instanceOrigin = ${JSON.stringify(instanceOrigin)};
  const sessionToken = ${JSON.stringify(token)};
  const post = (payload) => window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
  const originalFetch = window.fetch.bind(window);
  const originalCreateObjectURL = URL.createObjectURL.bind(URL);
  const downloadBlobs = new Map();

  window.fetch = async (input, init = {}) => {
    const requestUrl = new URL(typeof input === "string" ? input : input.url, window.location.href);
    const headers = new Headers(typeof input === "string" ? undefined : input.headers);
    new Headers(init.headers || {}).forEach((value, key) => headers.set(key, value));

    if (requestUrl.origin === instanceOrigin && requestUrl.pathname.startsWith("/api/")) {
      headers.set("Authorization", "Bearer " + sessionToken);
    }

    const response = await originalFetch(input, { ...init, headers });
    if (requestUrl.origin === instanceOrigin && response.status === 401) {
      post({ type: "unauthorized" });
    } else if (requestUrl.origin === instanceOrigin && requestUrl.pathname.endsWith("/auth/logout") && response.ok) {
      post({ type: "logout" });
    }
    return response;
  };

  URL.createObjectURL = (blob) => {
    const url = originalCreateObjectURL(blob);
    downloadBlobs.set(url, blob);
    return url;
  };

  document.addEventListener("click", (event) => {
    const anchor = event.target?.closest?.("a[download]");
    if (!anchor || !anchor.href?.startsWith("blob:")) return;
    const blob = downloadBlobs.get(anchor.href);
    if (!blob) return;

    event.preventDefault();
    const reader = new FileReader();
    reader.onload = () => post({
      type: "download",
      filename: anchor.download || "edgeever-export",
      dataUrl: reader.result,
    });
    reader.readAsDataURL(blob);
  }, true);
})();
true;
`;

const shareDataUrl = async (dataUrl: string, requestedName?: string) => {
  const separator = dataUrl.indexOf(",");
  if (separator < 0 || !dataUrl.slice(0, separator).includes(";base64")) {
    throw new Error("导出文件格式不受支持");
  }

  const filename = (requestedName || "edgeever-export").replace(SAFE_DOWNLOAD_NAME, "_");
  const directory = FileSystem.cacheDirectory;
  if (!directory) {
    throw new Error("无法访问系统缓存目录");
  }

  const fileUri = `${directory}${Date.now()}-${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, dataUrl.slice(separator + 1), {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("当前设备不支持系统分享");
  }

  await Sharing.shareAsync(fileUri);
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  webView: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  errorSafeArea: {
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  errorCard: {
    backgroundColor: "#ffffff",
    borderColor: "#a7f3d0",
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 420,
    padding: 24,
    width: "100%",
  },
  errorTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "800",
  },
  errorMessage: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  instanceUrl: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 8,
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: "#10b981",
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 22,
    minHeight: 46,
  },
  retryButtonPressed: {
    backgroundColor: "#059669",
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  switchButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    minHeight: 42,
  },
  switchButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
});
