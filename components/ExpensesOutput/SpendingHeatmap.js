import { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../store/theme-context";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getIntensityColor(amount, max, colors) {
    if (amount === 0) return colors.primary50 || "#EEF2FF";
    const ratio = amount / max;
    if (ratio < 0.25) return "#A7F3D0"; // green
    if (ratio < 0.55) return "#FCD34D"; // amber
    if (ratio < 0.8) return "#FB923C";  // orange
    return "#EF4444";                   // red
}

export default function SpendingHeatmap({ transactions, selectedYear, selectedMonth }) {
    const { theme } = useTheme();
    const colors = theme.colors;
    const { t } = useTranslation();
    const styles = getStyles(colors);
    const [selectedDay, setSelectedDay] = useState(null);

    // Build daily spend map for the selected month
    const { dayMap, maxDay, firstDow, daysInMonth } = useMemo(() => {
        const map = {};
        const daysInM = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const firstDow = new Date(selectedYear, selectedMonth, 1).getDay();

        transactions.forEach(tx => {
            if (tx.type !== "expense") return;
            const d = tx.date;
            if (d.getFullYear() !== selectedYear || d.getMonth() !== selectedMonth) return;
            const day = d.getDate();
            map[day] = (map[day] || 0) + tx.amount;
        });

        const maxDay = Math.max(1, ...Object.values(map));
        return { dayMap: map, maxDay, firstDow, daysInMonth: daysInM };
    }, [transactions, selectedYear, selectedMonth]);

    // Build grid cells (blanks + days)
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    // Selected day transactions
    const selectedDayTxs = selectedDay
        ? transactions.filter(tx => {
            const td = tx.date;
            return tx.type === "expense" &&
                td.getFullYear() === selectedYear &&
                td.getMonth() === selectedMonth &&
                td.getDate() === selectedDay;
        })
        : [];

    const total = Object.values(dayMap).reduce((s, v) => s + v, 0);

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary400} />
                <Text style={styles.title}>{t("heatmap.title")} — {MONTHS_SHORT[selectedMonth]} {selectedYear}</Text>
            </View>

            {total === 0 ? (
                <View style={styles.noData}>
                    <Text style={styles.noDataText}>{t("heatmap.noData")}</Text>
                </View>
            ) : (
                <>
                    {/* Day labels */}
                    <View style={styles.dayRow}>
                        {DAY_LABELS.map((l, i) => (
                            <Text key={i} style={styles.dayLabel}>{l}</Text>
                        ))}
                    </View>

                    {/* Grid */}
                    <View style={styles.grid}>
                        {cells.map((day, i) => {
                            if (!day) return <View key={`blank-${i}`} style={styles.cell} />;
                            const spend = dayMap[day] || 0;
                            const bg = getIntensityColor(spend, maxDay, colors);
                            const isSelected = selectedDay === day;
                            return (
                                <TouchableOpacity
                                    key={day}
                                    style={[styles.cell, { backgroundColor: bg },
                                    isSelected && styles.cellSelected]}
                                    onPress={() => setSelectedDay(isSelected ? null : day)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.cellText, spend > 0 && styles.cellTextDark]}>
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Legend */}
                    <View style={styles.legend}>
                        <Text style={styles.legendLabel}>{t("heatmap.low")}</Text>
                        {["#A7F3D0", "#FCD34D", "#FB923C", "#EF4444"].map(c => (
                            <View key={c} style={[styles.legendDot, { backgroundColor: c }]} />
                        ))}
                        <Text style={styles.legendLabel}>{t("heatmap.high")}</Text>
                    </View>

                    {/* Selected day detail */}
                    {selectedDay && (
                        <View style={styles.dayDetail}>
                            <Text style={styles.dayDetailTitle}>
                                {MONTHS_SHORT[selectedMonth]} {selectedDay} — {(dayMap[selectedDay] || 0).toFixed(0)} EGP
                            </Text>
                            {selectedDayTxs.length === 0 ? (
                                <Text style={styles.dayDetailEmpty}>{t("heatmap.noExpenses")}</Text>
                            ) : (
                                selectedDayTxs.slice(0, 5).map((tx, i) => (
                                    <View key={i} style={styles.dayDetailRow}>
                                        <Text style={styles.dayDetailDesc} numberOfLines={1}>{tx.description}</Text>
                                        <Text style={styles.dayDetailAmount}>{tx.amount.toFixed(0)}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    card: {
        backgroundColor: colors.surface, borderRadius: 20, padding: 18,
        borderWidth: 1, borderColor: colors.border, marginBottom: 16,
        elevation: 2, shadowColor: "#000", shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05,
    },
    header: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 },
    title: { fontSize: 14, fontWeight: "800", color: colors.gray800, flex: 1 },
    noData: { alignItems: "center", paddingVertical: 20 },
    noDataText: { fontSize: 13, color: colors.gray500 },
    dayRow: { flexDirection: "row", marginBottom: 4 },
    dayLabel: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: "700", color: colors.gray500 },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    cell: {
        width: "14.28%", aspectRatio: 1,
        justifyContent: "center", alignItems: "center",
        borderRadius: 6, padding: 1,
    },
    cellSelected: { borderWidth: 2, borderColor: colors.primary500 },
    cellText: { fontSize: 10, fontWeight: "600", color: colors.gray500 },
    cellTextDark: { color: "#1F2937" },
    legend: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12 },
    legendDot: { width: 12, height: 12, borderRadius: 3 },
    legendLabel: { fontSize: 10, fontWeight: "600", color: colors.gray500 },
    dayDetail: {
        marginTop: 14, padding: 14, backgroundColor: colors.gray100,
        borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    },
    dayDetailTitle: { fontSize: 13, fontWeight: "800", color: colors.gray800, marginBottom: 8 },
    dayDetailEmpty: { fontSize: 12, color: colors.gray500 },
    dayDetailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    dayDetailDesc: { fontSize: 12, color: colors.gray700, flex: 1 },
    dayDetailAmount: { fontSize: 12, fontWeight: "700", color: colors.expenseColor },
});
