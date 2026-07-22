import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Constants from "expo-constants";
import { AppState, Linking, Platform, type AppStateStatus } from "react-native";
import * as Updates from "expo-updates";
import { Alert } from "../components/LocalizedText";
import { useMobileLocale } from "./mobile-locale";
import { findNewerMobileRelease, GITHUB_LATEST_RELEASE_URL, GOOGLE_PLAY_URL, type MobileRelease } from "./mobile-release";

const FOREGROUND_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

type MobileUpdateStatus = "idle" | "checking" | "downloading" | "ready";

type MobileUpdateContextValue = {
  checkForUpdate: () => Promise<void>;
  isSupported: boolean;
  status: MobileUpdateStatus;
};

const MobileUpdateContext = createContext<MobileUpdateContextValue>({
  checkForUpdate: async () => undefined,
  isSupported: false,
  status: "idle",
});

export const MobileUpdateProvider = ({ children }: { children: ReactNode }) => {
  const { resolvedLocale } = useMobileLocale();
  const [status, setStatus] = useState<MobileUpdateStatus>("idle");
  const activeCheckRef = useRef<Promise<void> | null>(null);
  const lastAutomaticCheckRef = useRef(0);
  const isSupported = !__DEV__ && Updates.isEnabled;
  const english = resolvedLocale === "en-US";
  const installedVersion = Updates.runtimeVersion ?? Constants.expoConfig?.version ?? null;

  const openUpdateUrl = useCallback((url: string) => {
    void Linking.openURL(url).catch(() => {
      Alert.alert(
        english ? "Unable to open update page" : "Unable to open update page",
        english ? "Open the app store or GitHub Releases and try again." : "Please open the app store or GitHub Releases and try again."
      );
    });
  }, [english]);

  const showInstallableUpdatePrompt = useCallback((release: MobileRelease) => {
    Alert.alert(
      english ? "New app version available" : "New app version available",
      english
        ? `Version v${release.version} is available. This update includes an installable app package and cannot be applied as an in-app update.`
        : `A new installable version v${release.version} is available. This includes a new app package and cannot be done via in-app update.`,
      [
        { text: english ? "Later" : "Later", style: "cancel" },
        { text: "Google Play", onPress: () => openUpdateUrl(GOOGLE_PLAY_URL) },
        { text: "GitHub", onPress: () => openUpdateUrl(GITHUB_LATEST_RELEASE_URL) },
      ]
    );
  }, [english, openUpdateUrl]);

  const restart = useCallback(async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      Alert.alert(
        english ? "Unable to restart" : "Unable to restart",
        english ? `Close and reopen EdgeEver to apply the update.\n\n${detail}` : `Close and reopen Kiran Brahma Notes to apply the update.\n\n${detail}`
      );
    }
  }, [english]);

  const showRestartPrompt = useCallback(() => {
    Alert.alert(
      english ? "Update ready" : "Update ready",
      english
        ? "The update has been downloaded. Restart EdgeEver now to apply it?"
        : "The new version has downloaded. Restart Kiran Brahma Notes to apply the update?",
      [
        { text: english ? "Later" : "Later", style: "cancel" },
        { text: english ? "Restart now" : "Restart now", onPress: () => void restart() },
      ]
    );
  }, [english, restart]);

  const runCheck = useCallback((userInitiated: boolean) => {
    if (activeCheckRef.current) {
      return activeCheckRef.current;
    }

    if (!isSupported) {
      if (userInitiated) {
        Alert.alert(
          english ? "Updates unavailable" : "Updates unavailable",
          english
            ? "Update checks are available in installed release builds, not Expo Go or development builds."
            : "Update checks only work in installed release builds; Expo Go and development builds are not supported."
        );
      }
      return Promise.resolve();
    }

    const check = (async () => {
      let installableReleaseCheckFailed = false;
      try {
        setStatus("checking");

        if (userInitiated && Platform.OS === "android") {
          try {
            if (!installedVersion) {
              throw new Error("Installed app version is unavailable");
            }
            const release = await findNewerMobileRelease(installedVersion);
            if (release) {
              setStatus("idle");
              showInstallableUpdatePrompt(release);
              return;
            }
          } catch {
            installableReleaseCheckFailed = true;
          }
        }

        const result = await Updates.checkForUpdateAsync();

        if (!result.isAvailable) {
          setStatus("idle");
          if (userInitiated) {
            if (installableReleaseCheckFailed) {
              Alert.alert(
                english ? "Unable to fully check for updates" : "Unable to fully check for updates",
                english
                  ? "No compatible in-app update was found, but the latest installable app version could not be verified. Check your connection and try again."
                  : "No compatible in-app update found, and the latest app package version could not be confirmed. Check your connection and try again."
              );
            } else {
              Alert.alert(
                english ? "You're up to date" : "You're up to date",
                english ? "No newer app package or compatible in-app update is available." : "There is no newer app package or compatible in-app update available."
              );
            }
          }
          return;
        }

        setStatus("downloading");
        await Updates.fetchUpdateAsync();
        setStatus("ready");
        showRestartPrompt();
      } catch (error) {
        setStatus("idle");
        if (userInitiated) {
          const detail = error instanceof Error ? error.message : String(error);
          Alert.alert(
            english ? "Unable to check for updates" : "Unable to check for updates",
            english ? `Check your connection and try again.\n\n${detail}` : `Check your connection and try again.\n\n${detail}`
          );
        }
      }
    })();

    activeCheckRef.current = check;
    void check.finally(() => {
      activeCheckRef.current = null;
    });
    return check;
  }, [english, installedVersion, isSupported, showInstallableUpdatePrompt, showRestartPrompt]);

  useEffect(() => {
    const attemptAutomaticCheck = () => {
      if (Date.now() - lastAutomaticCheckRef.current < FOREGROUND_CHECK_INTERVAL_MS) {
        return;
      }
      lastAutomaticCheckRef.current = Date.now();
      void runCheck(false);
    };
    const timer = setTimeout(attemptAutomaticCheck, 1_500);
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") {
        attemptAutomaticCheck();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [runCheck]);

  const value = useMemo<MobileUpdateContextValue>(
    () => ({
      checkForUpdate: () => {
        if (status === "ready") {
          showRestartPrompt();
          return Promise.resolve();
        }
        return runCheck(true);
      },
      isSupported,
      status,
    }),
    [isSupported, runCheck, showRestartPrompt, status]
  );

  return <MobileUpdateContext.Provider value={value}>{children}</MobileUpdateContext.Provider>;
};

export const useMobileUpdate = () => useContext(MobileUpdateContext);
