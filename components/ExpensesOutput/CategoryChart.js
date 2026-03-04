import { View, Text, StyleSheet } from "react-native";
import { useContext, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../store/theme-context";
import { AppContext } from "../../store/app-context";
import { convertToEgp } from "../../utils/currency";

function CategoryChart({ transactions }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { categories, accounts, exchangeRate, budgets, transactions: allTransactions } = useContext(AppContext);
  const { t } = useTranslation();
  const styles = getStyles(colors);

  // Current-month start — for budget comparisons (always monthly, independent of period filter)
  const startOfMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  // Spending per category for the selected period (used for the share bar)
  const expensesByCategory = {};
  transactions.forEach((tx) => {
    if (tx.type !== "expense" || !tx.category_id) return;
    const acc = accounts.find((a) => a.id === tx.account_id);
    const currency = acc?.currency || "EGP";
    const amtEgp =
      currency === "EGP" || !exchangeRate
        ? tx.amount
        : convertToEgp(tx.amount, currency, exchangeRate);
    expensesByCategory[tx.category_id] =
      (expensesByCategory[tx.category_id] || 0) + amtEgp;
  });

  // Spending per category for the CURRENT MONTH only (used for budget bars)
  const thisMonthByCategory = useMemo(() => {
    const map = {};
    allTransactions.forEach((tx) => {
      if (tx.type !== "expense" || !tx.category_id) return;
      if (tx.date < startOfMonth) return;
      const acc = accounts.find((a) => a.id === tx.account_id);
      const currency = acc?.currency || "EGP";
      const amtEgp =
        currency === "EGP" || !exchangeRate
          ? tx.amount
          : convertToEgp(tx.amount, currency, exchangeRate);
      map[tx.category_id] = (map[tx.category_id] || 0) + amtEgp;
    });
    return map;
  }, [allTransactions, accounts, exchangeRate, startOfMonth]);

  const total = Object.values(expensesByCategory).reduce(
    (sum, val) => sum + val,
    0
  );

  const sorted = Object.entries(expensesByCategory)
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === Number(catId));
      return { cat, amount };
    })
    .filter((item) => item.cat)
    .sort((a, b) => b.amount - a.amount);

  if (sorted.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="pie-chart" size={18} color={colors.primary400} />
        <Text style={styles.title}>{t("analytics.spendingByCategory")}</Text>
      </View>

      {sorted.map(({ cat, amount }) => {
        const share = total > 0 ? (amount / total) * 100 : 0;
        const budget = budgets.find((b) => b.category_id === cat.id);
        const budgetLimit = budget?.monthly_limit;
        // Always compare budget against current-month spending (not the selected period)
        const monthlySpent = thisMonthByCategory[cat.id] || 0;
        const budgetPercent = budgetLimit ? (monthlySpent / budgetLimit) * 100 : null;
        const isOverBudget = budgetPercent && budgetPercent >= 100;
        const isNearBudget = budgetPercent && budgetPercent >= 80 && budgetPercent < 100;

        return (
          <View key={cat.id} style={styles.row}>
            <View style={styles.rowHeader}>
              <View style={styles.catInfo}>
                <View style={[styles.iconCircle, { backgroundColor: cat.color + "20" }]}>
                  <Ionicons name={cat.icon} size={14} color={cat.color} />
                </View>
                <Text style={styles.catName} numberOfLines={1}>
                  {cat.name}
                </Text>
              </View>
              <View style={styles.amountCol}>
                <Text style={styles.catAmount}>
                  {amount.toFixed(0)} EGP
                </Text>
                <Text style={styles.catPercent}>{share.toFixed(0)}%</Text>
              </View>
            </View>

            {/* Spending bar */}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${share}%`,
                    backgroundColor: cat.color,
                  },
                ]}
              />
            </View>

            {/* Budget progress */}
            {budgetLimit && (
              <View style={styles.budgetRow}>
                <View style={styles.budgetBarTrack}>
                  <View
                    style={[
                      styles.budgetBarFill,
                      {
                        width: `${Math.min(budgetPercent, 100)}%`,
                        backgroundColor: isOverBudget
                          ? colors.error500
                          : isNearBudget
                            ? colors.accent500
                            : colors.incomeColor,
                      },
                    ]}
                  />
                </View>
                <View style={styles.budgetInfo}>
                  {isOverBudget && (
                    <Ionicons name="warning" size={11} color={colors.error500} />
                  )}
                  {isNearBudget && (
                    <Ionicons name="alert-circle" size={11} color={colors.accent500} />
                  )}
                  <Text
                    style={[
                      styles.budgetText,
                      isOverBudget && { color: colors.error500 },
                      isNearBudget && { color: colors.accent500 },
                    ]}
                  >
                    {monthlySpent.toFixed(0)} / {budgetLimit.toFixed(0)} EGP
                  </Text>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default CategoryChart;

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },
    title: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.gray800,
    },
    row: {
      marginBottom: 14,
    },
    rowHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    catInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    iconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    catName: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.gray800,
      flex: 1,
    },
    amountCol: {
      alignItems: "flex-end",
    },
    catAmount: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.gray800,
    },
    catPercent: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.gray500,
    },
    barTrack: {
      height: 6,
      backgroundColor: colors.primary50,
      borderRadius: 3,
      overflow: "hidden",
    },
    barFill: {
      height: 6,
      borderRadius: 3,
    },
    budgetRow: {
      marginTop: 5,
    },
    budgetBarTrack: {
      height: 4,
      backgroundColor: colors.primary50,
      borderRadius: 2,
      overflow: "hidden",
    },
    budgetBarFill: {
      height: 4,
      borderRadius: 2,
    },
    budgetInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 3,
    },
    budgetText: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.gray500,
    },
  });
