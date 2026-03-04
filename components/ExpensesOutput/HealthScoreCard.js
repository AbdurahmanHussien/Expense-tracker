import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../store/theme-context";

function PillarBar({ label, value, color, colors }) {
    return (
        <View style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.gray500 }}>{label}</Text>
                <Text style={{ fontSize: 11, fontWeight: "800", color }}>{Math.round(value)}%</Text>
            </View>
            <View style={{ height: 6, backgroundColor: colors.primary50 || "#EEF2FF", borderRadius: 3, overflow: "hidden" }}>
                <View style={{ width: `${Math.min(value, 100)}%`, height: 6, backgroundColor: color, borderRadius: 3 }} />
            </View>
        </View>
    );
}

export default function HealthScoreCard({ transactions, budgets, goals, accounts, exchangeRate }) {
    const { theme } = useTheme();
    const colors = theme.colors;
    const { t } = useTranslation();
    const styles = getStyles(colors);

    const { score, savingsRate, budgetScore, goalsScore, tipKey } = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const thisMonthTx = transactions.filter(tx => tx.date >= startOfMonth);
        const income = thisMonthTx.filter(tx => tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
        const expenses = thisMonthTx.filter(tx => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);

        // Pillar 1: Savings rate (0-40 pts)
        let savingsRate = 0;
        let savingsPts = 0;
        if (income > 0) {
            savingsRate = Math.max(0, ((income - expenses) / income) * 100);
            savingsPts = Math.min(40, (savingsRate / 100) * 40);
        } else {
            savingsPts = expenses === 0 ? 20 : 0;
            savingsRate = expenses === 0 ? 50 : 0;
        }

        // Pillar 2: Budget adherence (0-30 pts)
        let budgetScore = 100;
        let budgetPts = 30;
        if (budgets.length > 0) {
            const pcts = budgets.map(b => {
                const spent = thisMonthTx
                    .filter(tx => tx.type === "expense" && tx.category_id === b.category_id)
                    .reduce((s, tx) => s + tx.amount, 0);
                return b.monthly_limit > 0 ? Math.min((spent / b.monthly_limit) * 100, 150) : 0;
            });
            const avgUsage = pcts.reduce((s, p) => s + p, 0) / pcts.length;
            budgetScore = Math.max(0, 100 - avgUsage);
            budgetPts = (budgetScore / 100) * 30;
        }

        // Pillar 3: Goals progress (0-30 pts)
        let goalsScore = 0;
        let goalsPts = 0;
        if (goals.length > 0) {
            const progresses = goals.map(g =>
                g.target_amount > 0 ? Math.min((g.saved_amount / g.target_amount) * 100, 100) : 0
            );
            goalsScore = progresses.reduce((s, p) => s + p, 0) / progresses.length;
            goalsPts = (goalsScore / 100) * 30;
        } else {
            goalsPts = 15; goalsScore = 50;
        }

        const score = Math.round(savingsPts + budgetPts + goalsPts);

        // Tip: point at weakest pillar
        const pillarRatios = [savingsRate / 100, budgetScore / 100, goalsScore / 100];
        const worstIdx = pillarRatios.indexOf(Math.min(...pillarRatios));
        const tipKeys = ["insights.tipSavings", "insights.tipBudget", "insights.tipGoals"];

        return { score, savingsRate, budgetScore, goalsScore, tipKey: tipKeys[worstIdx] };
    }, [transactions, budgets, goals, accounts, exchangeRate]);

    const scoreColor = score >= 70 ? "#22C55E" : score >= 40 ? "#F59E0B" : "#EF4444";
    const scoreLabel = score >= 70
        ? t("insights.scoreExcellent")
        : score >= 40 ? t("insights.scoreGood") : t("insights.scoreNeedsWork");

    return (
        <View style={styles.card}>
            {/* Score row */}
            <View style={styles.topRow}>
                <View style={styles.scoreLeft}>
                    <Text style={styles.scoreLabelSmall}>{t("insights.healthTitle")}</Text>
                    <View style={styles.scoreRow}>
                        <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}</Text>
                        <Text style={styles.scoreOf}>/100</Text>
                    </View>
                    <View style={[styles.scoreBadge, { backgroundColor: scoreColor + "22" }]}>
                        <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>{scoreLabel}</Text>
                    </View>
                </View>
                {/* Arc indicator (simple) */}
                <View style={styles.arcContainer}>
                    <View style={[styles.arcOuter, { borderColor: scoreColor + "33" }]}>
                        <View style={[styles.arcInner, { borderColor: scoreColor }]}>
                            <Ionicons
                                name={score >= 70 ? "heart" : score >= 40 ? "pulse" : "alert-circle"}
                                size={26}
                                color={scoreColor}
                            />
                        </View>
                    </View>
                </View>
            </View>

            {/* Pillar bars */}
            <View style={styles.pillars}>
                <PillarBar label={t("insights.pillarSavings")} value={savingsRate} color="#22C55E" colors={colors} />
                <PillarBar label={t("insights.pillarBudget")} value={budgetScore} color="#6366F1" colors={colors} />
                <PillarBar label={t("insights.pillarGoals")} value={goalsScore} color="#F59E0B" colors={colors} />
            </View>

            {/* Tip */}
            <View style={styles.tip}>
                <Ionicons name="bulb-outline" size={13} color={colors.primary400} />
                <Text style={styles.tipText}>{t(tipKey)}</Text>
            </View>
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
    topRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
    scoreLeft: { flex: 1 },
    scoreLabelSmall: {
        fontSize: 11, fontWeight: "700", color: colors.gray500,
        textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
    },
    scoreRow: { flexDirection: "row", alignItems: "baseline", gap: 2, marginBottom: 6 },
    scoreNum: { fontSize: 44, fontWeight: "800", letterSpacing: -1 },
    scoreOf: { fontSize: 16, fontWeight: "600", color: colors.gray500 },
    scoreBadge: {
        alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    scoreBadgeText: { fontSize: 12, fontWeight: "700" },
    arcContainer: { width: 80, height: 80, justifyContent: "center", alignItems: "center" },
    arcOuter: {
        width: 76, height: 76, borderRadius: 38, borderWidth: 10,
        justifyContent: "center", alignItems: "center",
    },
    arcInner: {
        width: 54, height: 54, borderRadius: 27, borderWidth: 4,
        justifyContent: "center", alignItems: "center",
    },
    pillars: { marginBottom: 14 },
    tip: { flexDirection: "row", alignItems: "flex-start", gap: 7, backgroundColor: colors.primary50 || "#EEF2FF", borderRadius: 12, padding: 10 },
    tipText: { flex: 1, fontSize: 12, color: colors.gray700, fontWeight: "500", lineHeight: 18 },
});
