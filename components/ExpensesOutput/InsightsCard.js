import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../store/theme-context";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function InsightsCard({ transactions, categories, budgets, accounts }) {
    const { theme } = useTheme();
    const colors = theme.colors;
    const { t } = useTranslation();
    const styles = getStyles(colors);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthExpenses = transactions.filter(tx =>
        tx.type === "expense" && tx.date >= startOfMonth
    );
    const prevMonthExpenses = transactions.filter(tx =>
        tx.type === "expense" && tx.date >= prevMonthStart && tx.date <= prevMonthEnd
    );

    // Account currency map
    const accCurrencyMap = {};
    accounts.forEach(a => { accCurrencyMap[a.id] = a.currency || "EGP"; });

    const insights = [];

    // 1. Top spending category this month
    if (thisMonthExpenses.length > 0) {
        const catTotals = {};
        thisMonthExpenses.forEach(tx => {
            if (tx.category_id) {
                catTotals[tx.category_id] = (catTotals[tx.category_id] || 0) + tx.amount;
            }
        });
        const topCatId = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a])[0];
        const topCat = topCatId ? categories.find(c => c.id === +topCatId) : null;
        if (topCat) {
            insights.push({
                icon: topCat.icon,
                color: topCat.color,
                text: t("insights.topCategory", { name: topCat.name, amount: catTotals[topCatId].toFixed(0) }),
            });
        }
    }

    // 2. Month-over-month expense change
    const thisTotal = thisMonthExpenses.reduce((s, tx) => s + tx.amount, 0);
    const prevTotal = prevMonthExpenses.reduce((s, tx) => s + tx.amount, 0);
    if (prevTotal > 0) {
        const pct = ((thisTotal - prevTotal) / prevTotal) * 100;
        const up = pct > 0;
        insights.push({
            icon: up ? "trending-up" : "trending-down",
            color: up ? colors.expenseColor : colors.incomeColor,
            text: t("insights.momChange", {
                dir: up ? t("insights.more") : t("insights.less"),
                pct: Math.abs(pct).toFixed(0),
            }),
        });
    }

    // 3. Highest spending day of week (overall)
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    transactions.filter(tx => tx.type === "expense").forEach(tx => {
        dayTotals[tx.date.getDay()] += tx.amount;
    });
    const topDay = dayTotals.indexOf(Math.max(...dayTotals));
    if (dayTotals[topDay] > 0) {
        insights.push({
            icon: "calendar",
            color: colors.accent500 || colors.primary500,
            text: t("insights.topDay", { day: DAY_NAMES[topDay] }),
        });
    }

    // 4. Budget closest to being exceeded
    if (budgets.length > 0) {
        let worstBudget = null; let worstPct = 0;
        budgets.forEach(b => {
            const spent = thisMonthExpenses.filter(tx => tx.category_id === b.category_id)
                .reduce((s, tx) => s + tx.amount, 0);
            const pct = b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0;
            if (pct > worstPct) { worstPct = pct; worstBudget = b; }
        });
        if (worstBudget && worstPct >= 60) {
            const cat = categories.find(c => c.id === worstBudget.category_id);
            if (cat) {
                const over = worstPct >= 100;
                insights.push({
                    icon: over ? "warning" : "alert-circle",
                    color: over ? colors.error500 : colors.accent500 || "#F59E0B",
                    text: over
                        ? t("insights.budgetOver", { name: cat.name })
                        : t("insights.budgetNear", { name: cat.name, pct: worstPct.toFixed(0) }),
                });
            }
        }
    }

    if (insights.length === 0) return null;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Ionicons name="bulb" size={16} color={colors.primary400} />
                <Text style={styles.title}>{t("insights.title")}</Text>
            </View>
            {insights.map((ins, i) => (
                <View key={i} style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: ins.color + "22" }]}>
                        <Ionicons name={ins.icon} size={14} color={ins.color} />
                    </View>
                    <Text style={styles.text}>{ins.text}</Text>
                </View>
            ))}
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    card: {
        backgroundColor: colors.surface, borderRadius: 20, padding: 18,
        borderWidth: 1, borderColor: colors.border,
        elevation: 2, shadowColor: "#000", shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05,
    },
    header: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 },
    title: { fontSize: 14, fontWeight: "800", color: colors.gray800, letterSpacing: -0.2 },
    row: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
    dot: {
        width: 28, height: 28, borderRadius: 9,
        justifyContent: "center", alignItems: "center", flexShrink: 0,
    },
    text: { flex: 1, fontSize: 13, color: colors.gray700, fontWeight: "500", lineHeight: 19 },
});
