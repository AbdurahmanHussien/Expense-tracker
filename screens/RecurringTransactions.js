import { useState, useContext, useLayoutEffect } from "react";
import {
    View, Text, StyleSheet, FlatList, Pressable, Modal,
    TextInput, ScrollView, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { useTheme } from "../store/theme-context";
import { AppContext } from "../store/app-context";
import {
    insertRecurring as insertRecurringDB,
    updateRecurring as updateRecurringDB,
    deleteRecurring as deleteRecurringDB,
} from "../utils/database";

const FREQUENCIES = ["daily", "weekly", "monthly"];
const TYPES = ["expense", "income", "transfer"];

function nextDueDate(frequency) {
    const d = new Date();
    if (frequency === "daily") d.setDate(d.getDate() + 1);
    else if (frequency === "weekly") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
}

function advanceDate(dateStr, frequency) {
    const d = new Date(dateStr);
    if (frequency === "daily") d.setDate(d.getDate() + 1);
    else if (frequency === "weekly") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
}

export { advanceDate };

export default function RecurringTransactions({ navigation }) {
    const { theme } = useTheme();
    const colors = theme.colors;
    const {
        recurring, accounts, categories,
        addRecurring, updateRecurringLocal, deleteRecurringLocal,
    } = useContext(AppContext);
    const { t } = useTranslation();
    const styles = getStyles(colors);

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("recurring.title") });
    }, [navigation, t]);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form fields
    const [txType, setTxType] = useState("expense");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [accountId, setAccountId] = useState(null);
    const [toAccountId, setToAccountId] = useState(null);
    const [categoryId, setCategoryId] = useState(null);
    const [frequency, setFrequency] = useState("monthly");

    function openAdd() {
        setEditingItem(null);
        setTxType("expense"); setDescription(""); setAmount("");
        setAccountId(accounts[0]?.id ?? null); setToAccountId(null);
        setCategoryId(null); setFrequency("monthly");
        setModalVisible(true);
    }

    function openEdit(item) {
        setEditingItem(item);
        setTxType(item.type); setDescription(item.description);
        setAmount(item.amount.toString()); setAccountId(item.account_id);
        setToAccountId(item.transfer_to_account_id ?? null);
        setCategoryId(item.category_id ?? null); setFrequency(item.frequency);
        setModalVisible(true);
    }

    async function handleSave() {
        if (!description.trim() || !parseFloat(amount) || !accountId) return;
        setIsSaving(true);
        try {
            const data = {
                type: txType, description: description.trim(),
                amount: parseFloat(amount), account_id: accountId,
                transfer_to_account_id: txType === "transfer" ? toAccountId : null,
                category_id: categoryId, frequency,
                next_due: editingItem ? editingItem.next_due : nextDueDate(frequency),
                is_active: 1,
            };
            if (editingItem) {
                await updateRecurringDB(editingItem.id, data);
                updateRecurringLocal(editingItem.id, data);
            } else {
                const id = await insertRecurringDB(data);
                addRecurring({ id, ...data });
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

    function confirmDelete(item) {
        Alert.alert(t("recurring.delete"), t("recurring.deleteMsg", { name: item.description }), [
            { text: t("common.cancel"), style: "cancel" },
            {
                text: t("common.delete"), style: "destructive",
                onPress: async () => {
                    try {
                        await deleteRecurringDB(item.id);
                        deleteRecurringLocal(item.id);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    } catch (e) {
                        Alert.alert(t("common.error"), t("form.failedDelete"));
                    }
                },
            },
        ]);
    }

    const TYPE_CONFIG = {
        expense: { icon: "arrow-up-circle", color: colors.expenseColor, bg: colors.expenseBg },
        income: { icon: "arrow-down-circle", color: colors.incomeColor, bg: colors.incomeBg },
        transfer: { icon: "swap-horizontal-circle", color: colors.transfer500, bg: colors.primary100 },
    };

    const FREQ_ICONS = { daily: "today", weekly: "calendar-outline", monthly: "calendar-number" };

    function renderItem({ item }) {
        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.expense;
        const acc = accounts.find(a => a.id === item.account_id);
        const daysUntil = Math.ceil((new Date(item.next_due) - new Date()) / 86400000);
        const dueSoon = daysUntil <= 3;

        return (
            <Pressable
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
                onPress={() => openEdit(item)}
            >
                <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />
                <View style={[styles.typeIcon, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
                    <View style={styles.cardMeta}>
                        <Ionicons name={FREQ_ICONS[item.frequency]} size={11} color={colors.gray500} />
                        <Text style={styles.cardMetaText}>{t(`recurring.freq_${item.frequency}`)}</Text>
                        {acc && <Text style={styles.cardMetaText}>· {acc.name}</Text>}
                    </View>
                </View>
                <View style={styles.cardRight}>
                    <Text style={[styles.cardAmount, { color: cfg.color }]}>{item.amount.toFixed(0)}</Text>
                    <Text style={[styles.dueText, { color: dueSoon ? colors.error500 : colors.gray500 }]}>
                        {daysUntil <= 0 ? t("recurring.dueToday") : t("recurring.dueIn", { days: daysUntil })}
                    </Text>
                </View>
                <Pressable onPress={() => confirmDelete(item)} hitSlop={10} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color={colors.error500} />
                </Pressable>
            </Pressable>
        );
    }

    const isFormValid = description.trim().length > 0 && parseFloat(amount) > 0 && !!accountId;

    return (
        <View style={styles.container}>
            <FlatList
                data={recurring}
                keyExtractor={i => i.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="repeat-outline" size={54} color={colors.gray500} style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyTitle}>{t("recurring.noItems")}</Text>
                        <Text style={styles.emptyHint}>{t("recurring.noItemsHint")}</Text>
                    </View>
                }
            />

            <Pressable style={styles.fab} onPress={openAdd}>
                <Ionicons name="add-circle" size={22} color="white" />
                <Text style={styles.fabText}>{t("recurring.add")}</Text>
            </Pressable>

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
                    <Pressable style={styles.modalCard} onPress={() => { }}>
                        <Text style={styles.modalTitle}>{editingItem ? t("recurring.edit") : t("recurring.new")}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>

                            {/* Type selector */}
                            <Text style={styles.label}>{t("form.type")}</Text>
                            <View style={styles.segRow}>
                                {TYPES.map(tp => {
                                    const c = TYPE_CONFIG[tp];
                                    return (
                                        <Pressable
                                            key={tp}
                                            style={[styles.seg, txType === tp && { backgroundColor: c.color }]}
                                            onPress={() => setTxType(tp)}
                                        >
                                            <Ionicons name={c.icon} size={14} color={txType === tp ? "white" : colors.gray500} />
                                            <Text style={[styles.segText, txType === tp && { color: "white" }]}>
                                                {t(`form.${tp}`)}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>

                            {/* Description */}
                            <TextInput
                                style={styles.input}
                                placeholder={t("form.description")}
                                placeholderTextColor={colors.gray500}
                                value={description}
                                onChangeText={setDescription}
                            />

                            {/* Amount */}
                            <TextInput
                                style={styles.input}
                                placeholder={t("form.amount")}
                                placeholderTextColor={colors.gray500}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                            />

                            {/* Account */}
                            <Text style={styles.label}>{t("form.account")}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                {accounts.map(acc => (
                                    <Pressable
                                        key={acc.id}
                                        style={[styles.chip, accountId === acc.id && styles.chipActive]}
                                        onPress={() => setAccountId(acc.id)}
                                    >
                                        <Text style={[styles.chipText, accountId === acc.id && styles.chipTextActive]}>
                                            {acc.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>

                            {/* To Account (transfer only) */}
                            {txType === "transfer" && (
                                <>
                                    <Text style={styles.label}>{t("form.to")}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                        {accounts.filter(a => a.id !== accountId).map(acc => (
                                            <Pressable
                                                key={acc.id}
                                                style={[styles.chip, toAccountId === acc.id && styles.chipActive]}
                                                onPress={() => setToAccountId(acc.id)}
                                            >
                                                <Text style={[styles.chipText, toAccountId === acc.id && styles.chipTextActive]}>
                                                    {acc.name}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </>
                            )}

                            {/* Category (expense only) */}
                            {txType === "expense" && (
                                <>
                                    <Text style={styles.label}>{t("form.category")}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                        <Pressable
                                            style={[styles.chip, categoryId === null && styles.chipActive]}
                                            onPress={() => setCategoryId(null)}
                                        >
                                            <Text style={[styles.chipText, categoryId === null && styles.chipTextActive]}>
                                                {t("form.none")}
                                            </Text>
                                        </Pressable>
                                        {categories.map(cat => (
                                            <Pressable
                                                key={cat.id}
                                                style={[styles.chip, categoryId === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                                                onPress={() => setCategoryId(cat.id)}
                                            >
                                                <Ionicons name={cat.icon} size={12} color={categoryId === cat.id ? "white" : cat.color} />
                                                <Text style={[styles.chipText, categoryId === cat.id && { color: "white" }]}>
                                                    {cat.name}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </>
                            )}

                            {/* Frequency */}
                            <Text style={styles.label}>{t("recurring.frequency")}</Text>
                            <View style={styles.segRow}>
                                {FREQUENCIES.map(f => (
                                    <Pressable
                                        key={f}
                                        style={[styles.seg, frequency === f && { backgroundColor: colors.primary500 }]}
                                        onPress={() => setFrequency(f)}
                                    >
                                        <Ionicons name={FREQ_ICONS[f]} size={13} color={frequency === f ? "white" : colors.gray500} />
                                        <Text style={[styles.segText, frequency === f && { color: "white" }]}>
                                            {t(`recurring.freq_${f}`)}
                                        </Text>
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

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.gray100 },
    list: { padding: 16, paddingBottom: 110 },
    card: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: colors.surface, borderRadius: 18, marginBottom: 10,
        borderWidth: 1, borderColor: colors.border, overflow: "hidden",
        elevation: 2, shadowColor: "#000", shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05,
    },
    cardAccent: { width: 5, alignSelf: "stretch" },
    typeIcon: {
        width: 40, height: 40, borderRadius: 12,
        justifyContent: "center", alignItems: "center", marginHorizontal: 12,
    },
    cardInfo: { flex: 1, paddingVertical: 14 },
    cardDesc: { fontSize: 14, fontWeight: "700", color: colors.gray800, marginBottom: 3 },
    cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
    cardMetaText: { fontSize: 11, color: colors.gray500, fontWeight: "500" },
    cardRight: { alignItems: "flex-end", paddingRight: 8 },
    cardAmount: { fontSize: 15, fontWeight: "800" },
    dueText: { fontSize: 10, fontWeight: "600", marginTop: 2 },
    deleteBtn: { padding: 12 },
    empty: { alignItems: "center", paddingTop: 80 },
    emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.gray700, marginBottom: 6 },
    emptyHint: { fontSize: 13, color: colors.gray500, textAlign: "center" },
    fab: {
        position: "absolute", bottom: 24, left: 24, right: 24,
        backgroundColor: colors.primary500, borderRadius: 20,
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, paddingVertical: 16, elevation: 8,
        shadowColor: colors.primary500, shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35,
    },
    fabText: { color: "white", fontSize: 16, fontWeight: "700" },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
    modalCard: {
        backgroundColor: colors.surfaceElevated,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: 24, paddingBottom: 40, maxHeight: "92%",
    },
    modalTitle: { fontSize: 20, fontWeight: "700", color: colors.gray800, marginBottom: 20, textAlign: "center" },
    label: {
        fontSize: 12, fontWeight: "700", color: colors.gray500,
        textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10,
    },
    input: {
        backgroundColor: colors.surface, borderRadius: 16,
        borderWidth: 1.5, borderColor: colors.border,
        padding: 14, fontSize: 16, color: colors.gray800, marginBottom: 18,
    },
    segRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
    seg: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 5, paddingVertical: 10, borderRadius: 14,
        backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    },
    segText: { fontSize: 12, fontWeight: "700", color: colors.gray500 },
    chipScroll: { marginBottom: 18 },
    chip: {
        flexDirection: "row", alignItems: "center", gap: 5,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24,
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginRight: 8,
    },
    chipActive: { backgroundColor: colors.primary500, borderColor: colors.primary500 },
    chipText: { fontSize: 12, fontWeight: "700", color: colors.gray500 },
    chipTextActive: { color: "#FFF" },
    modalButtons: { flexDirection: "row", gap: 12, marginTop: 4 },
    cancelBtn: {
        flex: 1, padding: 16, borderRadius: 16, alignItems: "center",
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    cancelBtnText: { color: colors.gray500, fontWeight: "700", fontSize: 15 },
    saveBtn: {
        flex: 1, padding: 16, borderRadius: 16, alignItems: "center",
        backgroundColor: colors.primary500, elevation: 3,
        shadowColor: colors.primary500, shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3,
    },
    saveBtnText: { color: "white", fontWeight: "700", fontSize: 15 },
});
