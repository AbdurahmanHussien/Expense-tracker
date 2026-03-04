import { useState, useEffect, useCallback } from "react";
import { View, Text, AppState, StyleSheet, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../store/theme-context";
import { APP_LOCK_KEY } from "./SecurityToggle";

export default function SecurityWrapper({ children }) {
    const [isLocked, setIsLocked] = useState(false);
    const [appState, setAppState] = useState(AppState.currentState);
    const { theme } = useTheme();
    const colors = theme.colors;
    const { t } = useTranslation();

    const authenticate = useCallback(async () => {
        // Small delay to ensure the UI is ready before calling the native modal
        setTimeout(async () => {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: t("security.unlockPrompt"),
                fallbackLabel: t("common.cancel"),
            });

            if (result.success) {
                setIsLocked(false);
            }
        }, 100);
    }, [t]);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", async (nextAppState) => {
            if (appState.match(/inactive|background/) && nextAppState === "active") {
                const stored = await AsyncStorage.getItem(APP_LOCK_KEY);
                if (stored === "true") {
                    setIsLocked(true);
                    authenticate();
                }
            }
            setAppState(nextAppState);
        });

        return () => {
            subscription.remove();
        };
    }, [appState, authenticate]);

    // Also check on initial mount
    useEffect(() => {
        async function checkInitial() {
            const stored = await AsyncStorage.getItem(APP_LOCK_KEY);
            if (stored === "true") {
                setIsLocked(true);
                authenticate();
            }
        }
        checkInitial();
    }, [authenticate]);

    if (isLocked) {
        return (
            <View style={[styles.lockScreen, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="lock-closed" size={64} color={colors.primary400} />
                <Text style={[styles.title, { color: colors.gray800 }]}>{t("security.unlockPrompt")}</Text>
                <Text style={[styles.subtitle, { color: colors.gray500 }]}>{t("security.unlockSecondaryPrompt")}</Text>
                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        { backgroundColor: colors.primary500 },
                        pressed && styles.buttonPressed
                    ]}
                    onPress={authenticate}
                >
                    <Text style={styles.buttonText}>{t("security.unlockButton")}</Text>
                </Pressable>
            </View>
        );
    }

    return children;
}

const styles = StyleSheet.create({
    lockScreen: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        marginTop: 24,
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        textAlign: "center",
        marginBottom: 48,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
    },
    buttonPressed: {
        opacity: 0.8,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});
