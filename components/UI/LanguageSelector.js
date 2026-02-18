import { useState } from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../store/theme-context";
import { useLanguage } from "../../store/language-context";

const LANGUAGES = [
  { code: "en", flag: "🇬🇧", label: "English", native: "English" },
  { code: "ar", flag: "🇸🇦", label: "Arabic", native: "العربية" },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = theme.colors;
  const [modalVisible, setModalVisible] = useState(false);
  const s = getStyles(colors);

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <>
      {/* ── Settings row ── */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      >
        <View style={s.rowIcon}>
          <Ionicons name="language-outline" size={18} color={colors.primary400} />
        </View>
        <Text style={s.rowLabel}>{t("common.language")}</Text>
        <View style={s.rowRight}>
          <Text style={s.rowValue}>{current.flag} {current.native}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
        </View>
      </Pressable>

      {/* ── Language picker bottom sheet ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={s.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{t("language.selectLanguage")}</Text>

            <View style={s.optionsRow}>
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <Pressable
                    key={lang.code}
                    onPress={() => {
                      setModalVisible(false);
                      if (language !== lang.code) setLanguage(lang.code);
                    }}
                    style={({ pressed }) => [
                      s.optionCard,
                      isSelected && s.optionCardActive,
                      pressed && s.optionCardPressed,
                    ]}
                  >
                    <Text style={s.optionFlag}>{lang.flag}</Text>
                    <Text style={[s.optionNative, isSelected && s.optionNativeActive]}>
                      {lang.native}
                    </Text>
                    <Text style={[s.optionSub, isSelected && s.optionSubActive]}>
                      {lang.label}
                    </Text>
                    {isSelected && (
                      <View style={s.checkBadge}>
                        <Ionicons name="checkmark" size={13} color="white" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={({ pressed }) => [s.cancelBtn, pressed && { opacity: 0.7 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={s.cancelBtnText}>{t("common.cancel")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    /* ── Settings row ── */
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowPressed: { opacity: 0.7 },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primary100,
      justifyContent: "center",
      alignItems: "center",
    },
    rowLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.gray800,
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    rowValue: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.gray500,
    },

    /* ── Bottom sheet ── */
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      paddingBottom: 36,
      alignItems: "center",
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 20,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.gray800,
      marginBottom: 24,
    },

    /* ── Language option cards ── */
    optionsRow: {
      flexDirection: "row",
      gap: 14,
      width: "100%",
      marginBottom: 20,
    },
    optionCard: {
      flex: 1,
      alignItems: "center",
      gap: 8,
      paddingVertical: 20,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
    },
    optionCardActive: {
      borderColor: colors.primary400,
      backgroundColor: colors.primary50,
    },
    optionCardPressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
    optionFlag: { fontSize: 36 },
    optionNative: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.gray800,
    },
    optionNativeActive: { color: colors.primary400 },
    optionSub: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.gray500,
    },
    optionSubActive: { color: colors.primary400 },
    checkBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary400,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },

    /* ── Cancel button ── */
    cancelBtn: {
      width: "100%",
      paddingVertical: 15,
      borderRadius: 16,
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelBtnText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.gray500,
    },
  });
