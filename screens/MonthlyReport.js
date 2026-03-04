import { useContext, useState, useMemo, useLayoutEffect } from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Dimensions,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../store/theme-context";
import { AppContext } from "../store/app-context";
import { convertToEgp } from "../utils/currency";
import SpendingHeatmap from "../components/ExpensesOutput/SpendingHeatmap";

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function MonthlyReport({ navigation }) {
    const { transactions, accounts, exchangeRate } = useContext(AppContext);
    const { theme, isDark } = useTheme();
    const colors = theme.colors;
    const { t } = useTranslation();
    const styles = getStyles(colors);

    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

    const toEgp = (tx) => {
        const acc = accounts.find((a) => a.id === tx.account_id);
        const currency = acc?.currency || "EGP";
        if (currency === "EGP" || !exchangeRate) return tx.amount;
        return convertToEgp(tx.amount, currency, exchangeRate);
    };

    const monthlyData = useMemo(() => {
        const data = Array.from({ length: 12 }, (_, i) => ({
            month: i,
            label: MONTHS[i],
            income: 0,
            expenses: 0,
        }));

        transactions.forEach((tx) => {
            const date = tx.date;
            if (date.getFullYear() !== selectedYear) return;
            if (tx.type === "transfer") return;

            const monthIdx = date.getMonth();
            const amount = toEgp(tx);
            if (tx.type === "income") {
                data[monthIdx].income += amount;
            } else if (tx.type === "expense") {
                data[monthIdx].expenses += amount;
            }
        });

        return data;
    }, [transactions, selectedYear, exchangeRate, accounts]);

    const maxValue = Math.max(
        ...monthlyData.map((d) => Math.max(d.income, d.expenses)),
        1
    );

    const totalIncome = monthlyData.reduce((s, d) => s + d.income, 0);
    const totalExpenses = monthlyData.reduce((s, d) => s + d.expenses, 0);
    const totalNet = totalIncome - totalExpenses;

    const years = useMemo(() => {
        const ySet = new Set();
        ySet.add(now.getFullYear());
        transactions.forEach((tx) => ySet.add(tx.date.getFullYear()));
        return [...ySet].sort((a, b) => b - a);
    }, [transactions]);

    const currentMonthIdx = now.getMonth();
    const currentMonth = monthlyData[currentMonthIdx];
    const prevMonth =
        currentMonthIdx > 0 ? monthlyData[currentMonthIdx - 1] : null;

    const expenseChange =
        prevMonth && prevMonth.expenses > 0
            ? ((currentMonth.expenses - prevMonth.expenses) / prevMonth.expenses) * 100
            : null;

    const gradientColors = isDark
        ? ["#4338CA", "#6366F1", "#7C3AED"]
        : ["#4F46E5", "#6366F1", "#8B5CF6"];

    useLayoutEffect(() => {
        navigation.setOptions({
            title: t("monthly.title"),
            headerStyle: {
                backgroundColor: colors.primary800,
                elevation: 0,
                shadowOpacity: 0,
            },
            headerTintColor: colors.gray800,
        });
    }, [navigation, colors, t]);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
        >
            {/* Hero summary */}
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
            >
                <View style={styles.heroDecor1} />
                <View style={styles.heroDecor2} />

                <Text style={styles.heroLabel}>{t("monthly.yearSummary")}</Text>
                <Text style={styles.heroAmount}>{totalNet.toFixed(2)} EGP</Text>

                <View style={styles.heroRow}>
                    <View style={styles.heroStat}>
                        <Ionicons name="arrow-down-circle" size={16} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.heroStatText}>
                            +{totalIncome.toFixed(0)} EGP
                        </Text>
                    </View>
                    <View style={styles.heroStat}>
                        <Ionicons name="arrow-up-circle" size={16} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.heroStatText}>
                            -{totalExpenses.toFixed(0)} EGP
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Year selector */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.yearRow}
            >
                {years.map((y) => (
                    <Pressable
                        key={y}
                        style={[styles.yearChip, y === selectedYear && styles.yearChipActive]}
                        onPress={() => setSelectedYear(y)}
                    >
                        <Text style={[styles.yearChipText, y === selectedYear && styles.yearChipTextActive]}>
                            {y}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Month-over-month change */}
            {expenseChange !== null && selectedYear === now.getFullYear() && (
                <View style={styles.changeCard}>
                    <Ionicons
                        name={expenseChange > 0 ? "trending-up" : "trending-down"}
                        size={20}
                        color={expenseChange > 0 ? colors.expenseColor : colors.incomeColor}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.changeTitle}>{t("monthly.vsLastMonth")}</Text>
                        <Text style={styles.changeValue}>
                            {expenseChange > 0 ? "+" : ""}
                            {expenseChange.toFixed(1)}% {t("monthly.inExpenses")}
                        </Text>
                    </View>
                </View>
            )}

            {/* Chart */}
            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>{t("monthly.monthlyBreakdown")}</Text>

                {monthlyData.map((d) => {
                    const incomeWidth = (d.income / maxValue) * 100;
                    const expenseWidth = (d.expenses / maxValue) * 100;
                    const hasData = d.income > 0 || d.expenses > 0;

                    return (
                        <View key={d.month} style={styles.barGroup}>
                            <Text style={styles.barLabel}>{d.label}</Text>
                            <View style={styles.barCol}>
                                {/* Income bar */}
                                <View style={styles.barRow}>
                                    <View
                                        style={[
                                            styles.bar,
                                            styles.barIncome,
                                            { width: `${Math.max(incomeWidth, hasData ? 2 : 0)}%` },
                                        ]}
                                    />
                                </View>
                                {/* Expense bar */}
                                <View style={styles.barRow}>
                                    <View
                                        style={[
                                            styles.bar,
                                            styles.barExpense,
                                            { width: `${Math.max(expenseWidth, hasData ? 2 : 0)}%` },
                                        ]}
                                    />
                                </View>
                            </View>
                            <Text style={styles.barAmount}>
                                {hasData ? `-${d.expenses.toFixed(0)}` : ""}
                            </Text>
                        </View>
                    );
                })}

                {/* Legend */}
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.incomeColor }]} />
                        <Text style={styles.legendText}>{t("summary.income")}</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.expenseColor }]} />
                        <Text style={styles.legendText}>{t("summary.expenses")}</Text>
                    </View>
                </View>
            </View>

            {/* Month cards */}
            <Text style={styles.sectionTitle}>{t("monthly.details")}</Text>
            {monthlyData
                .filter((d) => d.income > 0 || d.expenses > 0)
                .reverse()
                .map((d) => {
                    const net = d.income - d.expenses;
                    return (
                        <View key={d.month} style={[styles.monthCard, { borderLeftColor: net >= 0 ? colors.incomeColor : colors.expenseColor }]}>
                            <View style={styles.monthHeader}>
                                <Text style={styles.monthName}>
                                    {MONTHS[d.month]} {selectedYear}
                                </Text>
                                <Text
                                    style={[
                                        styles.monthNet,
                                        { color: net >= 0 ? colors.incomeColor : colors.expenseColor },
                                    ]}
                                >
                                    {net >= 0 ? "+" : ""}
                                    {net.toFixed(2)} EGP
                                </Text>
                            </View>
                            <View style={styles.monthStats}>
                                <View style={styles.monthStatItem}>
                                    <Ionicons name="arrow-down-circle" size={14} color={colors.incomeColor} />
                                    <Text style={styles.monthStatVal}>
                                        +{d.income.toFixed(0)}
                                    </Text>
                                </View>
                                <View style={styles.monthStatItem}>
                                    <Ionicons name="arrow-up-circle" size={14} color={colors.expenseColor} />
                                    <Text style={styles.monthStatVal}>
                                        -{d.expenses.toFixed(0)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}

            <View style={{ height: 20 }} />

            {/* Spending Heatmap */}
            <SpendingHeatmap
                transactions={transactions}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
            />

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

export default MonthlyReport;


const getStyles = (colors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.gray100,

        },
        hero: {
            margin: 16,
            padding: 22,
            borderRadius: 24,
            overflow: "hidden",
            elevation: 8,
            shadowColor: "#4F46E5",
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
        },
        heroDecor1: {
            position: "absolute",
            top: -30,
            right: -30,
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "rgba(255,255,255,0.06)",
        },
        heroDecor2: {
            position: "absolute",
            bottom: -15,
            left: -15,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: "rgba(255,255,255,0.04)",
        },
        heroLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: "rgba(255,255,255,0.55)",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 4,
        },
        heroAmount: {
            fontSize: 28,
            fontWeight: "800",
            color: "#FFF",
            marginBottom: 14,
        },
        heroRow: {
            flexDirection: "row",
            gap: 20,
        },
        heroStat: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
        },
        heroStatText: {
            fontSize: 13,
            fontWeight: "700",
            color: "rgba(255,255,255,0.85)",
        },
        yearRow: {
            paddingHorizontal: 16,
            paddingBottom: 12,
            gap: 8,
        },
        yearChip: {
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
        },
        yearChipActive: {
            backgroundColor: colors.primary500,
            borderColor: colors.primary500,
        },
        yearChipText: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.gray500,
        },
        yearChipTextActive: {
            color: "#FFF",
        },
        changeCard: {
            flexDirection: "row",
            alignItems: "center",
            marginHorizontal: 16,
            marginBottom: 12,
            padding: 16,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            elevation: 1,
            shadowColor: "#000",
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
        },
        changeTitle: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.gray500,
            textTransform: "uppercase",
            letterSpacing: 0.5,
        },
        changeValue: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.gray800,
            marginTop: 2,
        },
        chartCard: {
            marginHorizontal: 16,
            marginBottom: 16,
            padding: 18,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
        },
        chartTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.gray800,
            marginBottom: 16,
        },
        barGroup: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
        },
        barLabel: {
            width: 32,
            fontSize: 11,
            fontWeight: "600",
            color: colors.gray500,
        },
        barCol: {
            flex: 1,
            gap: 3,
        },
        barRow: {
            height: 10,
            backgroundColor: colors.primary50,
            borderRadius: 5,
            overflow: "hidden",
        },
        bar: {
            height: 10,
            borderRadius: 5,
        },
        barIncome: {
            backgroundColor: colors.incomeColor,
        },
        barExpense: {
            backgroundColor: colors.expenseColor,
        },
        barAmount: {
            width: 50,
            textAlign: "right",
            fontSize: 10,
            fontWeight: "600",
            color: colors.gray500,
        },
        legend: {
            flexDirection: "row",
            gap: 18,
            marginTop: 14,
            justifyContent: "center",
        },
        legendItem: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },
        legendDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
        },
        legendText: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.gray500,
        },
        sectionTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.gray800,
            paddingHorizontal: 20,
            marginBottom: 10,
        },
        monthCard: {
            marginHorizontal: 16,
            marginBottom: 10,
            padding: 16,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderLeftWidth: 4,
            elevation: 1,
            shadowColor: "#000",
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
        },
        monthHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
        },
        monthName: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.gray800,
        },
        monthNet: {
            fontSize: 14,
            fontWeight: "800",
        },
        monthStats: {
            flexDirection: "row",
            gap: 16,
        },
        monthStatItem: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
        },
        monthStatVal: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.gray500,
        },
    });
