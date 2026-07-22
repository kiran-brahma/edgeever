import { enUS } from "@edgeever/shared/i18n";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readMobileLocalePreference, writeMobileLocalePreference } from "./preferences";

type SupportedMobileLocale = "en-US";
type MobileLocaleContextValue = {
  preference: SupportedMobileLocale;
  resolvedLocale: SupportedMobileLocale;
  setPreference: (preference: SupportedMobileLocale) => void;
  translate: (value: string) => string;
};

// English-only app: runtime translation map is kept empty. The en-US shared i18n strings
// are used directly, and all source strings have been translated to English.
const mobileOnlyTranslations = new Map<string, string>([]);

const flattenStrings = (value: unknown, prefix = "", output = new Map<string, string>()) => {
  if (typeof value === "string") {
    output.set(prefix, value);
    return output;
  }
  if (!value || typeof value !== "object") {
    return output;
  }
  for (const [key, child] of Object.entries(value)) {
    flattenStrings(child, prefix ? `${prefix}.${key}` : key, output);
  }
  return output;
};

const enStrings = flattenStrings(enUS);
const exactTranslations = new Map<string, string>(
  Array.from(mobileOnlyTranslations.entries()).filter(([source, target]) => source !== target)
);
for (const [key, target] of enStrings.entries()) {
  exactTranslations.set(key, target);
}

const resolveSystemLocale = (): SupportedMobileLocale => "en-US";

export const translateMobileText = (value: string, locale: SupportedMobileLocale) => {
  if (locale !== "en-US" || !/[\u3400-\u9fff]/.test(value)) {
    return value;
  }
  return mobileOnlyTranslations.get(value) ?? exactTranslations.get(value) ?? value;
};

let currentResolvedMobileLocale: SupportedMobileLocale = resolveSystemLocale();
export const translateCurrentMobileText = (value: string) => translateMobileText(value, currentResolvedMobileLocale);

const MobileLocaleContext = createContext<MobileLocaleContextValue>({
  preference: "en-US",
  resolvedLocale: resolveSystemLocale(),
  setPreference: () => undefined,
  translate: (value) => value,
});

export const MobileLocaleProvider = ({ children }: { children: ReactNode }) => {
  const [preference, setPreferenceState] = useState<SupportedMobileLocale>("en-US");

  useEffect(() => {
    let active = true;
    void readMobileLocalePreference().then((storedPreference) => {
      if (active) {
        setPreferenceState(storedPreference);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const resolvedLocale = "en-US";
  currentResolvedMobileLocale = resolvedLocale;
  const value = useMemo<MobileLocaleContextValue>(
    () => ({
      preference,
      resolvedLocale,
      setPreference: (nextPreference) => {
        setPreferenceState(nextPreference);
        void writeMobileLocalePreference(nextPreference);
      },
      translate: (text) => translateMobileText(text, resolvedLocale),
    }),
    [preference, resolvedLocale]
  );

  return <MobileLocaleContext.Provider value={value}>{children}</MobileLocaleContext.Provider>;
};

export const useMobileLocale = () => useContext(MobileLocaleContext);
