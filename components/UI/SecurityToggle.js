import { useState, useEffect } from "react";
import { View, Text, Switch, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useTheme } from "../../store/theme-context";

export const APP_LOCK_KEY = "expense_app_lock_enabled";

export default function SecurityToggle() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const colors = theme.colors;
    const s = getStyles(colors);

    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        async function loadState() {
            const stored = await AsyncStorage.getItem(APP_LOCK_KEY);
            if (stored === "true") {
                setIsEnabled(true);
            }
        }
        loadState();
    }, []);

    async function handleToggle(value) {
        if (value) {
            // Trying to enable app lock, check if hardware supports it
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                Alert.alert("Error", t("security.notSupported"));
                return;
            }

            // Authenticate once before enabling
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: t("security.unlockPrompt"),
                fallbackLabel: t("common.cancel"),
            });

            if (result.success) {
                setIsEnabled(true);
                await AsyncStorage.setItem(APP_LOCK_KEY, "true");
            }
        } else {
            // Disabling
            setIsEnabled(false);
            await AsyncStorage.setItem(APP_LOCK_KEY, "false");
        }
    }

    return (
        <View style={s.row}>
            <View style={s.rowIcon}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.primary400} />
            </View>
            <View style={s.texts}>
                <Text style={s.rowLabel}>{t("security.appLock")}</Text>
                <Text style={s.rowSub}>{t("security.appLockDesc")}</Text>
            </View>
            <Switch
                value={isEnabled}
                onValueChange={handleToggle}
                trackColor={{ false: colors.gray300, true: colors.primary400 }}
                thumbColor={"white"}
            />
        </View>
    );
}

const getStyles = (colors) =>
    StyleSheet.create({
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 10,
        },
        rowIcon: {
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.primary100,
            justifyContent: "center",
            alignItems: "center",
        },
        texts: {
            flex: 1,
            justifyContent: "center",
        },
        rowLabel: {
            fontSize: 15,
            fontWeight: "600",
            color: colors.gray800,
        },
        rowSub: {
            fontSize: 12,
            fontWeight: "500",
            color: colors.gray500,
            marginTop: 2,
        },
    });
