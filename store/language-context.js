import { createContext, useContext, useState } from "react";
import { I18nManager, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../utils/i18n";

export const LANG_STORAGE_KEY = "@app_language";

const LanguageContext = createContext({
  language: "en",
  setLanguage: async () => {},
});

export function LanguageProvider({ initialLanguage, children }) {
  const [language, setLanguageState] = useState(initialLanguage || "en");

  async function setLanguage(lang) {
    await AsyncStorage.setItem(LANG_STORAGE_KEY, lang);
    await i18n.changeLanguage(lang);
    setLanguageState(lang);

    const needsRTL = lang === "ar";
    if (I18nManager.isRTL !== needsRTL) {
      I18nManager.forceRTL(needsRTL);
      Alert.alert(
        lang === "ar" ? "إعادة التشغيل مطلوبة" : "Restart Required",
        lang === "ar"
          ? "يرجى إعادة تشغيل التطبيق لتطبيق تغيير اللغة."
          : "Please restart the app to apply the language change.",
        [{ text: lang === "ar" ? "موافق" : "OK" }]
      );
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
