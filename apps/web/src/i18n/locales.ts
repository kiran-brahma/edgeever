export const supportedLocales = ["en-US"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];
export type AppLocalePreference = "system" | SupportedLocale;

export const defaultLocale: SupportedLocale = "en-US";

export const localeStorageKey = "edgeever.locale.preference";
const legacyLocaleStorageKey = "edgeever.locale";

export const localeLabels: Record<SupportedLocale, string> = {
  "en-US": "English",
};

export const normalizeLocale = (locale: string | null | undefined): SupportedLocale | null => {
  if (!locale) {
    return null;
  }

  const normalized = locale.toLowerCase();

  if (normalized === "en" || normalized === "en-us" || normalized.startsWith("en-")) {
    return "en-US";
  }

  return null;
};

export const readStoredLocale = (): SupportedLocale | null => {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    return normalizeLocale(window.localStorage.getItem(localeStorageKey));
  } catch {
    return null;
  }
};

export const writeStoredLocale = (locale: SupportedLocale) => {
  try {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(localeStorageKey, locale);
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
};

export const clearStoredLocale = () => {
  try {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(localeStorageKey);
    window.localStorage.removeItem(legacyLocaleStorageKey);
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
};

export const getAppLocalePreference = (): AppLocalePreference => readStoredLocale() ?? "system";

export const getBrowserLocale = (): SupportedLocale | null => {
  if (typeof navigator === "undefined") {
    return null;
  }

  const browserLocales = navigator.languages?.length ? navigator.languages : [navigator.language];

  for (const locale of browserLocales) {
    const supported = normalizeLocale(locale);

    if (supported) {
      return supported;
    }
  }

  return null;
};

export const getInitialLocale = () => readStoredLocale() ?? getBrowserLocale() ?? defaultLocale;
