import { useState, useContext, useLayoutEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    Modal,
    TextInput,
    ScrollView,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { useTheme } from "../store/theme-context";
import { AppContext } from "../store/app-context";
import {
    insertGoal as insertGoalDB,
    updateGoal as updateGoalDB,
    deleteGoal as deleteGoalDB,
} from "../utils/database";

const ICON_OPTIONS = [
    "flag", "star", "heart", "rocket", "home", "car", "airplane", "gift",
    "phone-portrait", "laptop", "camera", "headset", "shirt", "bag-handle",
    "book", "school", "fitness", "leaf", "paw", "musical-notes",
    "cash", "card", "trending-up", "diamond",
];

const COLOR_OPTIONS = [
    "#FF6B6B", "#FF8E53", "#FFA07A", "#FFD700",
    "#F7DC6F", "#ADFF2F", "#58D68D", "#4ECDC4",
    "#45B7D1", "#3498DB", "#2980B9", "#9B59B6",
    "#BB8FCE", "#E91E63", "#F06292", "#ADB5BD",
];

export default function SavingsGoals({ navigation }) {
    const { theme } = useTheme();
    const colors = theme.colors;
    const { goals, addGoal, updateGoalLocal, deleteGoalLocal } = useContext(AppContext);
    const styles = getStyles(colors);
    const { t } = useTranslation();

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("goals.title") });
    }, [navigation, t]);

    // ── Modal state ──────────────────────────────────────────────────
    const [modalVisible, setModalVisible] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null); // null = new, object = edit
    const [name, setName] = useState("");
    const [target, setTarget] = useState("");
    const [saved, setSaved] = useState("");
    const [deadline, setDeadline] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("flag");
    const [selectedColor, setSelectedColor] = useState("#4ECDC4");
    const [isSaving, setIsSaving] = useState(false);

    function openAddModal() {
        setEditingGoal(null);
        setName("");
        setTarget("");
        setSaved("0");
        setDeadline("");
        setSelectedIcon("flag");
        setSelectedColor("#4ECDC4");
        setModalVisible(true);
    }

    function openEditModal(goal) {
        setEditingGoal(goal);
        setName(goal.name);
        setTarget(goal.target_amount.toString());
        setSaved(goal.saved_amount.toString());
        setDeadline(goal.deadline || "");
        setSelectedIcon(goal.icon);
        setSelectedColor(goal.color);
        setModalVisible(true);
    }

    async function handleSave() {
        if (!name.trim()) return;
        const targetNum = parseFloat(target);
        const savedNum = parseFloat(saved) || 0;
        if (isNaN(targetNum) || targetNum <= 0) return;

        setIsSaving(true);
        try {
            if (editingGoal) {
                await updateGoalDB(
                    editingGoal.id, name.trim(), selectedIcon, selectedColor,
                    targetNum, savedNum, deadline.trim() || null
                );
                updateGoalLocal(editingGoal.id, {
                    name: name.trim(), icon: selectedIcon, color: selectedColor,
                    target_amount: targetNum, saved_amount: savedNum,
                    deadline: deadline.trim() || null,
                });
            } else {
                const id = await insertGoalDB(
                    name.trim(), selectedIcon, selectedColor,
                    targetNum, savedNum, deadline.trim() || null
                );
                addGoal({
                    id, name: name.trim(), icon: selectedIcon, color: selectedColor,
                    target_amount: targetNum, saved_amount: savedNum,
                    deadline: deadline.trim() || null,
                    created_at: new Date().toISOString(),
                });
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setModalVisible(false);
        } catch (e) {
            console.error(e);
            Alert.alert(t("common.error"), t("form.failedSave"));
        } finally {
            setIsSaving(false);
        }
    }

    function confirmDelete(goal) {
        Alert.alert(
            t("goals.deleteGoal"),
            t("goals.deleteGoalMsg", { name: goal.name }),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteGoalDB(goal.id);
                            deleteGoalLocal(goal.id);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        } catch (e) {
                            console.error(e);
                            Alert.alert(t("common.error"), t("form.failedDelete"));
                        }
                    },
                },
            ]
        );
    }

    function renderGoal({ item }) {
        const percent = item.target_amount > 0
            ? Math.min((item.saved_amount / item.target_amount) * 100, 100)
            : 0;
        const isAchieved = item.saved_amount >= item.target_amount;
        const isNear = percent >= 80 && !isAchieved;

        const barColor = isAchieved
            ? colors.incomeColor
            : isNear
                ? colors.accent500
                : item.color;

        return (
            <Pressable
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                onPress={() => openEditModal(item)}
            >
                {/* Color accent bar on left */}
                <View style={[styles.accentBar, { backgroundColor: item.color }]} />

                <View style={styles.cardBody}>
                    {/* Header row */}
                    <View style={styles.cardHeader}>
                        <View style={styles.cardLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: item.color + "22" }]}>
                                <Ionicons name={item.icon} size={22} color={item.color} />
                            </View>
                            <View style={styles.cardTitleBlock}>
                                <Text style={styles.goalName} numberOfLines={1}>{item.name}</Text>
                                {item.deadline ? (
                                    <Text style={styles.goalDeadline}>
                                        <Ionicons name="calendar-outline" size={11} color={colors.gray500} /> {item.deadline}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                        <Pressable onPress={() => confirmDelete(item)} hitSlop={10} style={styles.deleteBtn}>
                            <Ionicons name="trash-outline" size={17} color={colors.error500} />
                        </Pressable>
                    </View>

                    {/* Progress bar */}
                    <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: barColor }]} />
                    </View>

                    {/* Amounts row */}
                    <View style={styles.amountsRow}>
                        {isAchieved ? (
                            <Text style={[styles.achievedText, { color: colors.incomeColor }]}>
                                {t("goals.achieved")}
                            </Text>
                        ) : (
                            <Text style={styles.progressText}>
                                {t("goals.progress", { percent: percent.toFixed(0) })}
                            </Text>
                        )}
                        <Text style={styles.amountText}>
                            <Text style={{ color: barColor, fontWeight: "800" }}>
                                {item.saved_amount.toFixed(0)}
                            </Text>
                            {" / "}
                            {item.target_amount.toFixed(0)}
                        </Text>
                    </View>
                </View>
            </Pressable>
        );
    }

    const isFormValid = name.trim().length > 0 && parseFloat(target) > 0;

    return (
        <View style={styles.container}>
            <FlatList
                data={goals}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderGoal}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="ribbon-outline" size={54} color={colors.gray500} style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyTitle}>{t("goals.noGoals")}</Text>
                        <Text style={styles.emptyHint}>{t("goals.noGoalsHint")}</Text>
                    </View>
                }
            />

            {/* FAB */}
            <Pressable style={styles.fab} onPress={openAddModal}>
                <Ionicons name="add-circle" size={22} color="white" />
                <Text style={styles.fabText}>{t("goals.addGoal")}</Text>
            </Pressable>

            {/* Add / Edit Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
                    <Pressable style={styles.modalCard} onPress={() => { }}>
                        <Text style={styles.modalTitle}>
                            {editingGoal ? t("goals.editGoal") : t("goals.newGoal")}
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Name */}
                            <TextInput
                                style={styles.input}
                                placeholder={t("goals.namePlaceholder")}
                                placeholderTextColor={colors.gray500}
                                value={name}
                                onChangeText={setName}
                                maxLength={40}
                            />

                            {/* Target */}
                            <Text style={styles.label}>{t("goals.target")}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="5000"
                                placeholderTextColor={colors.gray500}
                                value={target}
                                onChangeText={setTarget}
                                keyboardType="numeric"
                            />

                            {/* Saved */}
                            <Text style={styles.label}>{t("goals.saved")}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor={colors.gray500}
                                value={saved}
                                onChangeText={setSaved}
                                keyboardType="numeric"
                            />

                            {/* Deadline */}
                            <Text style={styles.label}>{t("goals.deadline")}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t("goals.deadlinePlaceholder")}
                                placeholderTextColor={colors.gray500}
                                value={deadline}
                                onChangeText={setDeadline}
                            />

                            {/* Icon picker */}
                            <Text style={styles.label}>{t("categories.icon")}</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.iconScroll}
                            >
                                {ICON_OPTIONS.map((icon) => (
                                    <Pressable
                                        key={icon}
                                        onPress={() => setSelectedIcon(icon)}
                                        style={[
                                            styles.iconOption,
                                            selectedIcon === icon && {
                                                backgroundColor: selectedColor + "44",
                                                borderColor: selectedColor,
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={icon}
                                            size={22}
                                            color={selectedIcon === icon ? selectedColor : colors.gray500}
                                        />
                                    </Pressable>
                                ))}
                            </ScrollView>

                            {/* Color picker */}
                            <Text style={styles.label}>{t("categories.color")}</Text>
                            <View style={styles.colorGrid}>
                                {COLOR_OPTIONS.map((color) => (
                                    <Pressable
                                        key={color}
                                        onPress={() => setSelectedColor(color)}
                                        style={[
                                            styles.colorDot,
                                            { backgroundColor: color },
                                            selectedColor === color && styles.colorDotSelected,
                                        ]}
                                    >
                                        {selectedColor === color && (
                                            <Ionicons name="checkmark" size={14} color="white" />
                                        )}
                                    </Pressable>
                                ))}
                            </View>

                            {/* Preview */}
                            <View style={styles.preview}>
                                <View style={[styles.previewIcon, { backgroundColor: selectedColor + "22" }]}>
                                    <Ionicons name={selectedIcon} size={24} color={selectedColor} />
                                </View>
                                <Text style={[styles.previewName, { color: colors.gray800 }]}>
                                    {name || t("categories.preview")}
                                </Text>
                            </View>
                        </ScrollView>

                        {/* Buttons */}
                        <View style={styles.modalButtons}>
                            <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>{t("common.cancel")}</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.saveBtn, (!isFormValid || isSaving) && { opacity: 0.5 }]}
                                onPress={handleSave}
                                disabled={!isFormValid || isSaving}
                            >
                                <Text style={styles.saveBtnText}>{t("common.save")}</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const getStyles = (colors) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.gray100 },
        list: { padding: 16, paddingBottom: 110 },

        // Goal card
        card: {
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: 20,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
            elevation: 2,
            shadowColor: "#000",
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
        },
        accentBar: { width: 5 },
        cardBody: { flex: 1, padding: 14 },
        cardHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
        },
        cardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
        iconCircle: {
            width: 44, height: 44, borderRadius: 14,
            justifyContent: "center", alignItems: "center",
        },
        cardTitleBlock: { flex: 1 },
        goalName: {
            fontSize: 15, fontWeight: "700",
            color: colors.gray800, letterSpacing: -0.2,
        },
        goalDeadline: { fontSize: 11, color: colors.gray500, marginTop: 2, fontWeight: "500" },
        deleteBtn: { padding: 4 },

        barTrack: {
            height: 7, backgroundColor: colors.primary50,
            borderRadius: 4, overflow: "hidden", marginBottom: 8,
        },
        barFill: { height: 7, borderRadius: 4 },

        amountsRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        progressText: { fontSize: 11, fontWeight: "600", color: colors.gray500 },
        achievedText: { fontSize: 11, fontWeight: "700" },
        amountText: { fontSize: 12, fontWeight: "600", color: colors.gray500 },

        // Empty state
        emptyContainer: {
            flex: 1, alignItems: "center", justifyContent: "center",
            paddingTop: 80, paddingHorizontal: 32,
        },
        emptyTitle: {
            fontSize: 18, fontWeight: "700",
            color: colors.gray700, marginBottom: 8, textAlign: "center",
        },
        emptyHint: {
            fontSize: 13, color: colors.gray500,
            textAlign: "center", lineHeight: 20,
        },

        // FAB
        fab: {
            position: "absolute", bottom: 24, left: 24, right: 24,
            backgroundColor: colors.primary500,
            borderRadius: 20, flexDirection: "row",
            alignItems: "center", justifyContent: "center",
            gap: 8, paddingVertical: 16,
            elevation: 8,
            shadowColor: colors.primary500,
            shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
        },
        fabText: { color: "white", fontSize: 16, fontWeight: "700" },

        // Modal
        overlay: {
            flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "flex-end",
        },
        modalCard: {
            backgroundColor: colors.surfaceElevated,
            borderTopLeftRadius: 32, borderTopRightRadius: 32,
            padding: 24, paddingBottom: 40, maxHeight: "92%",
        },
        modalTitle: {
            fontSize: 20, fontWeight: "700", color: colors.gray800,
            marginBottom: 20, textAlign: "center",
        },
        label: {
            fontSize: 12, fontWeight: "700", color: colors.gray500,
            textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10,
        },
        input: {
            backgroundColor: colors.surface, borderRadius: 16,
            borderWidth: 1.5, borderColor: colors.border,
            padding: 14, fontSize: 16, color: colors.gray800, marginBottom: 18,
        },
        iconScroll: { marginBottom: 20 },
        iconOption: {
            width: 44, height: 44, borderRadius: 12,
            justifyContent: "center", alignItems: "center",
            marginRight: 8, borderWidth: 1.5, borderColor: "transparent",
            backgroundColor: colors.surface,
        },
        colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
        colorDot: {
            width: 32, height: 32, borderRadius: 16,
            justifyContent: "center", alignItems: "center",
        },
        colorDotSelected: {
            borderWidth: 3, borderColor: "white",
            elevation: 4, shadowColor: "#000",
            shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3,
        },
        preview: {
            flexDirection: "row", alignItems: "center", gap: 12,
            backgroundColor: colors.surface, borderRadius: 16,
            padding: 14, marginBottom: 20,
            borderWidth: 1, borderColor: colors.border,
        },
        previewIcon: {
            width: 46, height: 46, borderRadius: 15,
            justifyContent: "center", alignItems: "center",
        },
        previewName: { fontSize: 16, fontWeight: "700" },

        // Modal buttons
        modalButtons: { flexDirection: "row", gap: 12, marginTop: 4 },
        cancelBtn: {
            flex: 1, padding: 16, borderRadius: 16, alignItems: "center",
            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
        },
        cancelBtnText: { color: colors.gray500, fontWeight: "700", fontSize: 15 },
        saveBtn: {
            flex: 1, padding: 16, borderRadius: 16, alignItems: "center",
            backgroundColor: colors.primary500,
            elevation: 3, shadowColor: colors.primary500,
            shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3,
        },
        saveBtnText: { color: "white", fontWeight: "700", fontSize: 15 },
    });
