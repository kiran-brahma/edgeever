import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { RefreshCw } from "./icons";
import { Pressable, Text } from "./LocalizedText";
import { useMobileLocale } from "../lib/mobile-locale";
import { useMobileUpdate } from "../lib/mobile-update";
import { useMobileTheme, resolveMobileThemeStyles } from "../lib/mobile-theme";

export const MobileUpdateCard = () => {
  const { resolvedLocale } = useMobileLocale();
  const { resolvedTheme } = useMobileTheme();
  const { checkForUpdate, isSupported, status } = useMobileUpdate();
  const english = resolvedLocale === "en-US";
  const busy = status === "checking" || status === "downloading";
  const styles = resolveMobileThemeStyles(baseStyles, resolvedTheme);
  const statusLabel = status === "checking"
    ? (english ? "Checking…" : "Checking…")
    : status === "downloading"
      ? (english ? "Downloading…" : "Downloading…")
      : status === "ready"
        ? (english ? "Downloaded; restart to apply" : "Downloaded; restart to apply")
        : (english ? "Check for updates" : "Check for updates");

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.title}>{english ? "App updates" : "App updates"}</Text>
        <Text style={styles.description}>
          {english
            ? "EdgeEver automatically checks for compatible in-app updates. Manual checks also look for newer installable versions."
            : "Kiran Brahma Notes automatically checks for compatible in-app updates; manual checks also look for newer app package versions."}
        </Text>
        <Text style={styles.version}>
          {english ? "Current version" : "Current version"}: v{Updates.runtimeVersion ?? Constants.expoConfig?.version ?? "unknown"}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy, disabled: busy }}
        disabled={busy}
        onPress={() => void checkForUpdate()}
        style={[styles.button, busy && styles.buttonDisabled]}
      >
        {busy ? <ActivityIndicator color="#047857" size="small" /> : <RefreshCw color="#047857" size={16} />}
        <Text style={styles.buttonText}>{statusLabel}</Text>
      </Pressable>
      {!isSupported ? (
        <Text style={styles.hint}>
          {english ? "Available in installed release builds." : "This feature is enabled in installed release builds."}
        </Text>
      ) : null}
    </View>
  );
};

const baseStyles = StyleSheet.create({
  card: {
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    gap: 12,
    padding: 16,
  },
  copy: {
    gap: 4,
  },
  title: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
  },
  description: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 17,
  },
  version: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 14,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#047857",
    fontSize: 13,
    fontWeight: "700",
  },
  hint: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 16,
  },
});
