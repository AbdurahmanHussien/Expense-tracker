import { useState, useContext, useLayoutEffect, useMemo } from "react";
import {
    View, Text, StyleSheet, FlatList, Pressable,
    Modal, TextInput, ScrollView, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../store/theme-context";
import { AppContext } from "../store/app-context";
import {
    insertBill as insertBillDB,
    updateBill as updateBillDB,
    deleteBill as deleteBillDB,
    insertTransaction,
} from "../utils/database";

const ICON_OPTIONS = [
    "receipt", "flash", "water", "wifi", "phone-portrait", "home",
    "car", "medical", "school", "tv", "musical-notes", "shirt",
    "fitness", "restaurant", "card", "bag-handle",
];
const COLOR_OPTIONS = [
    "#FF6B6B", "#FF8E53", "#FFA07A", "#FFD700",
    "#58D68D", "#4ECDC4", "#45B7D1", "#3498DB",
    "#9B59B6", "#BB8FCE", "#E91E63", "#ADB5BD",
];

function daysUntilDue(dueDay) {
    const now = new Date();
    const today = now.getDate();
    if (dueDay >= today) return dueDay - today;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
    return Math.ceil((nextMonth - now) / 86400000);
}

function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    return n + (s[(n - 20) % 10] || s[n] || s[0]);
}

export default function BillReminders({ navigation }) {
    const { theme, isDark } = useTheme();
    const colors = theme.colors;
    const { bills, accounts, addBill, updateBillLocal, deleteBillLocal, addTransaction } = useContext(AppContext);
    const { t } = useTranslation();
    const styles = getStyles(colors);

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("bills.title") });
    }, [navigation, t]);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingBill, setEditingBill] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDay, setDueDay] = useState("1");
    const [selectedIcon, setSelectedIcon] = useState("receipt");
    const [selectedColor, setSelectedColor] = useState("#FF6B6B");

    function openAdd() {
        setEditingBill(null);
        setName(""); setAmount(""); setDueDay("1");
        setSelectedIcon("receipt"); setSelectedColor("#FF6B6B");
        setModalVisible(true);
    }

    function openEdit(bill) {
        setEditingBill(bill);
        setName(bill.name); setAmount(bill.amount.toString());
        setDueDay(bill.due_day.toString());
        setSelectedIcon(bill.icon); setSelectedColor(bill.color);
        setModalVisible(true);
    }

    async function handleSave() {
        const d = parseInt(dueDay);
        if (!name.trim() || isNaN(d) || d < 1 || d > 31) return;
        setIsSaving(true);
        try {
            const data = { name: name.trim(), amount: parseFloat(amount) || 0, icon: selectedIcon, color: selectedColor, due_day: d, is_active: 1 };
            if (editingBill) {
                await updateBillDB(editingBill.id, data);
                updateBillLocal(editingBill.id, data);
            } else {
                const id = await insertBillDB(data);
                addBill({ id, ...data });
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

    function confirmDelete(bill) {
        Alert.alert(t("bills.delete"), t("bills.deleteMsg", { name: bill.name }), [
            { text: t("common.cancel"), style: "cancel" },
            {
                text: t("common.delete"), style: "destructive",
                onPress: async () => {
                    try {
                        await deleteBillDB(bill.id);
                        deleteBillLocal(bill.id);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    } catch (e) {
                        Alert.alert(t("common.error"), t("form.failedDelete"));
                    }
                },
            },
        ]);
    }

    async function markPaid(bill) {
        if (!accounts.length) return;
        Alert.alert(t("bills.markPaid"), t("bills.markPaidMsg", { name: bill.name }), [
            { text: t("common.cancel"), style: "cancel" },
            {
                text: t("bills.confirm"), onPress: async () => {
                    try {
                        const now = new Date();
                        const txData = {
                            type: "expense", description: bill.name,
                            amount: bill.amount || 0, account_id: accounts[0].id,
                            transfer_to_account_id: null, category_id: null,
                            received_amount: null,
                            date: now.toISOString().slice(0, 10),
                        };
                        const id = await insertTransaction(txData);
                        addTransaction({ ...txData, id, date: now });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } catch (e) {
                        Alert.alert(t("common.error"), t("form.failedSave"));
                    }
                },
            },
        ]);
    }

    const sortedBills = useMemo(() =>
        [...bills].sort((a, b) => daysUntilDue(a.due_day) - daysUntilDue(b.due_day)), [bills]);

    function urgencyColor(days) {
        if (days <= 2) return colors.error500;
        if (days <= 7) return colors.accent500 || "#F59E0B";
        return colors.incomeColor;
    }

    function renderBill({ item }) {
        const days = daysUntilDue(item.due_day);
        const uc = urgencyColor(days);
        return (
            <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={() => openEdit(item)}>
                <View style={[styles.cardAccent, { backgroundColor: item.color }]} />
                <View style={[styles.billIcon, { backgroundColor: item.color + "22" }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.billName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.billDue}>{t("bills.dueEvery", { day: ordinal(item.due_day) })}</Text>
                </View>
                <View style={styles.cardRight}>
                    {item.amount > 0 && <Text style={styles.billAmount}>{item.amount.toFixed(0)}</Text>}
                    <View style={[styles.urgencyBadge, { backgroundColor: uc + "22" }]}>
                        <Text style={[styles.urgencyText, { color: uc }]}>
                            {days === 0 ? t("bills.dueToday") : t("bills.dueIn", { days })}
                        </Text>
                    </View>
                </View>
                <Pressable onPress={() => markPaid(item)} style={styles.paidBtn} hitSlop={8}>
                    <Ionicons name="checkmark-circle-outline" size={22} color={colors.incomeColor} />
                </Pressable>
                <Pressable onPress={() => confirmDelete(item)} style={styles.deleteBtn} hitSlop={8}>
                    <Ionicons name="trash-outline" size={16} color={colors.error500} />
                </Pressable>
            </Pressable>
        );
    }

    const isFormValid = name.trim().length > 0 && parseInt(dueDay) >= 1 && parseInt(dueDay) <= 31;

    const gradientColors = isDark ? ["#4338CA", "#6366F1", "#7C3AED"] : ["#4F46E5", "#6366F1", "#8B5CF6"];

    return (
        <View style={styles.container}>
            <FlatList
                ListHeaderComponent={
                    <LinearGradient colors={gradientColors} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <View style={styles.heroDecor} />
                        <Ionicons name="calendar-number-outline" size={28} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.heroTitle}>{t("bills.heroTitle")}</Text>
                        <Text style={styles.heroSub}>{t("bills.heroSub", { count: bills.length })}</Text>
                    </LinearGradient>
                }
                data={sortedBills}
                keyExtractor={i => i.id.toString()}
                renderItem={renderBill}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="receipt-outline" size={54} color={colors.gray500} style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyTitle}>{t("bills.noItems")}</Text>
                        <Text style={styles.emptyHint}>{t("bills.noItemsHint")}</Text>
                    </View>
                }
            />

            <Pressable style={styles.fab} onPress={openAdd}>
                <Ionicons name="add-circle" size={22} color="white" />
                <Text style={styles.fabText}>{t("bills.add")}</Text>
            </Pressable>

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
                    <Pressable style={styles.modalCard} onPress={() => { }}>
                        <Text style={styles.modalTitle}>{editingBill ? t("bills.edit") : t("bills.new")}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <TextInput
                                style={styles.input}
                                placeholder={t("bills.namePlaceholder")}
                                placeholderTextColor={colors.gray500}
                                value={name} onChangeText={setName}
                            />
                            <Text style={styles.label}>{t("bills.amount")} ({t("bills.optional")})</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor={colors.gray500}
                                value={amount} onChangeText={setAmount}
                                keyboardType="numeric"
                            />
                            <Text style={styles.label}>{t("bills.dueDayLabel")}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="1-31"
                                placeholderTextColor={colors.gray500}
                                value={dueDay} onChangeText={setDueDay}
                                keyboardType="numeric" maxLength={2}
                            />
                            <Text style={styles.label}>{t("categories.icon")}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
                                {ICON_OPTIONS.map(icon => (
                                    <Pressable
                                        key={icon}
                                        style={[styles.iconOption, selectedIcon === icon && { backgroundColor: selectedColor + "44", borderColor: selectedColor }]}
                                        onPress={() => setSelectedIcon(icon)}
                                    >
                                        <Ionicons name={icon} size={20} color={selectedIcon === icon ? selectedColor : colors.gray500} />
                                    </Pressable>
                                ))}
                            </ScrollView>
                            <Text style={styles.label}>{t("categories.color")}</Text>
                            <View style={styles.colorGrid}>
                                {COLOR_OPTIONS.map(color => (
                                    <Pressable
                                        key={color}
                                        style={[styles.colorDot, { backgroundColor: color }, selectedColor === color && styles.colorDotSelected]}
                                        onPress={() => setSelectedColor(color)}
                                    >
                                        {selectedColor === color && <Ionicons name="checkmark" size={13} color="white" />}
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>
                        <View style={styles.modalButtons}>
                            <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>{t("common.cancel")}</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.saveBtn, (!isFormValid || isSaving) && { opacity: 0.5 }]}
                                onPress={handleSave} disabled={!isFormValid || isSaving}
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

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.gray100 },
    hero: {
        margin: 16, marginBottom: 8, borderRadius: 20, padding: 22,
        alignItems: "center", overflow: "hidden",
        elevation: 6, shadowColor: "#4F46E5", shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3,
    },
    heroDecor: {
        position: "absolute", top: -30, right: -30, width: 100, height: 100,
        borderRadius: 50, backgroundColor: "rgba(255,255,255,0.06)",
    },
    heroTitle: { fontSize: 18, fontWeight: "800", color: "white", marginTop: 8 },
    heroSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 },
    list: { padding: 16, paddingBottom: 110 },
    card: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: colors.surface, borderRadius: 18, marginBottom: 10,
        borderWidth: 1, borderColor: colors.border, overflow: "hidden",
        elevation: 2, shadowColor: "#000", shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05,
    },
    cardAccent: { width: 5, alignSelf: "stretch" },
    billIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginHorizontal: 12 },
    cardInfo: { flex: 1, paddingVertical: 14 },
    billName: { fontSize: 14, fontWeight: "700", color: colors.gray800, marginBottom: 3 },
    billDue: { fontSize: 11, color: colors.gray500, fontWeight: "500" },
    cardRight: { alignItems: "flex-end", paddingRight: 4 },
    billAmount: { fontSize: 14, fontWeight: "800", color: colors.gray800, marginBottom: 3 },
    urgencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    urgencyText: { fontSize: 10, fontWeight: "700" },
    paidBtn: { padding: 10 },
    deleteBtn: { padding: 10 },
    empty: { alignItems: "center", paddingTop: 40 },
    emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.gray700, marginBottom: 6 },
    emptyHint: { fontSize: 13, color: colors.gray500, textAlign: "center" },
    fab: {
        position: "absolute", bottom: 24, left: 24, right: 24,
        backgroundColor: colors.primary500, borderRadius: 20,
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, paddingVertical: 16, elevation: 8,
        shadowColor: colors.primary500, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35,
    },
    fabText: { color: "white", fontSize: 16, fontWeight: "700" },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
    modalCard: {
        backgroundColor: colors.surfaceElevated, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: 24, paddingBottom: 40, maxHeight: "92%",
    },
    modalTitle: { fontSize: 20, fontWeight: "700", color: colors.gray800, marginBottom: 20, textAlign: "center" },
    label: { fontSize: 12, fontWeight: "700", color: colors.gray500, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
    input: {
        backgroundColor: colors.surface, borderRadius: 16,
        borderWidth: 1.5, borderColor: colors.border,
        padding: 14, fontSize: 16, color: colors.gray800, marginBottom: 18,
    },
    iconScroll: { marginBottom: 20 },
    iconOption: {
        width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center",
        marginRight: 8, borderWidth: 1.5, borderColor: "transparent", backgroundColor: colors.surface,
    },
    colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
    colorDot: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
    colorDotSelected: { borderWidth: 3, borderColor: "white", elevation: 4 },
    modalButtons: { flexDirection: "row", gap: 12, marginTop: 4 },
    cancelBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    cancelBtnText: { color: colors.gray500, fontWeight: "700", fontSize: 15 },
    saveBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: "center", backgroundColor: colors.primary500 },
    saveBtnText: { color: "white", fontWeight: "700", fontSize: 15 },
});
