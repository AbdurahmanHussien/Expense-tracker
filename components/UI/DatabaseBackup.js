import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as Updates from "expo-updates";
import { checkpointDB, closeDB } from "../../utils/database";
import { useTheme } from "../../store/theme-context";

export default function DatabaseBackup() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const colors = theme.colors;
    const s = getStyles(colors);

    // The local database file path
    const dbUri = `${FileSystem.documentDirectory}SQLite/expenses.db`;

    async function handleBackup() {
        try {
            const dbExists = await FileSystem.getInfoAsync(dbUri);
            if (!dbExists.exists) {
                Alert.alert(t("database.errorTitle"), t("database.errorMsg"));
                return;
            }

            // Force SQLite to write the WAL file to the main DB file before taking the backup
            await checkpointDB();

            // We copy it to the cache directory with a clear name before sharing
            const backupUri = `${FileSystem.cacheDirectory}SpendWise_Backup_${new Date().toISOString().split('T')[0]}.db`;
            await FileSystem.copyAsync({
                from: dbUri,
                to: backupUri,
            });

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(backupUri, {
                    mimeType: "application/octet-stream",
                    dialogTitle: t("database.backup"),
                });
            }
        } catch (err) {
            console.error("Backup failed:", err);
            Alert.alert(t("database.errorTitle"), t("database.errorMsg"));
        }
    }

    async function handleRestore() {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/octet-stream", "application/x-sqlite3", "*/*"],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return; // User canceled
            }

            const file = result.assets[0];

            // Extremely basic validation to ensure they at least picked a .db file
            if (!file.name.endsWith(".db")) {
                Alert.alert(t("database.errorTitle"), t("database.invalidFile"));
                return;
            }

            Alert.alert(
                t("database.restoreConfirmTitle"),
                t("database.restoreConfirmMsg"),
                [
                    { text: t("common.cancel"), style: "cancel" },
                    {
                        text: t("database.restore"),
                        style: "destructive",
                        onPress: async () => {
                            try {
                                // Ensure the SQLite directory exists
                                const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
                                const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
                                if (!dirInfo.exists) {
                                    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
                                }

                                // Extremely Important: Close the active DB connection before overwriting
                                await closeDB();

                                // Overwrite the existing DB file
                                await FileSystem.copyAsync({
                                    from: file.uri,
                                    to: dbUri,
                                });

                                // Extremely Important: Delete the -wal and -shm files if they exist
                                // Otherwise SQLite will try to read the old data from the old WAL file!
                                const walUri = `${FileSystem.documentDirectory}SQLite/expenses.db-wal`;
                                const shmUri = `${FileSystem.documentDirectory}SQLite/expenses.db-shm`;

                                try { await FileSystem.deleteAsync(walUri, { idempotent: true }); } catch { }
                                try { await FileSystem.deleteAsync(shmUri, { idempotent: true }); } catch { }

                                Alert.alert("Success", t("database.restoreSuccess"), [
                                    {
                                        text: t("common.ok"),
                                        onPress: async () => {
                                            // Real app reload
                                            try {
                                                await Updates.reloadAsync();
                                            } catch (e) {

                                                // We are likely in Expo Go, manual restart needed
                                                console.log("Expo Go: Restart manually");
                                            }
                                        },
                                    },
                                ]);
                            } catch (err) {
                                console.error("Restore copy failed:", err);
                                Alert.alert(t("database.errorTitle"), t("database.errorMsg"));
                            }
                        },
                    },
                ]
            );
        } catch (err) {
            console.error("Restore failed:", err);
            Alert.alert(t("database.errorTitle"), t("database.errorMsg"));
        }
    }

    return (
        <View style={s.container}>
            {/* Backup Button */}
            <Pressable
                style={({ pressed }) => [s.row, pressed && s.rowPressed]}
                onPress={handleBackup}
            >
                <View style={s.iconWrapper}>
                    <Ionicons name="cloud-download-outline" size={20} color={colors.primary400} />
                </View>
                <View style={s.textWrapper}>
                    <Text style={s.title}>{t("database.backup")}</Text>
                    <Text style={s.desc}>{t("database.backupDesc")}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
            </Pressable>

            <View style={s.divider} />

            {/* Restore Button */}
            <Pressable
                style={({ pressed }) => [s.row, pressed && s.rowPressed]}
                onPress={handleRestore}
            >
                <View style={[s.iconWrapper, { backgroundColor: colors.expenseBg }]}>
                    <Ionicons name="cloud-upload-outline" size={20} color={colors.expenseColor} />
                </View>
                <View style={s.textWrapper}>
                    <Text style={s.title}>{t("database.restore")}</Text>
                    <Text style={s.desc}>{t("database.restoreDesc")}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
            </Pressable>
        </View>
    );
}

const getStyles = (colors) =>
    StyleSheet.create({
        container: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 10,
            overflow: "hidden",
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            gap: 12,
        },
        rowPressed: {
            backgroundColor: colors.gray100,
        },
        iconWrapper: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.primary100,
            justifyContent: "center",
            alignItems: "center",
        },
        textWrapper: {
            flex: 1,
            justifyContent: "center",
        },
        title: {
            fontSize: 15,
            fontWeight: "600",
            color: colors.gray800,
            marginBottom: 2,
        },
        desc: {
            fontSize: 12,
            color: colors.gray500,
            fontWeight: "500",
        },
        divider: {
            height: 1,
            backgroundColor: colors.border,
            marginLeft: 60,
        },
    });
