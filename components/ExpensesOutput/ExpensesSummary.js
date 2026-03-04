import { View, Text, StyleSheet } from "react-native";
import { useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../store/theme-context";
import { AppContext } from "../../store/app-context";
import { convertToEgp } from "../../utils/currency";

function ExpensesSummary({ transactions, periodName }) {
  const { theme, isDark } = useTheme();
  const colors = theme.colors;
  const styles = getStyles(colors);
  const { t } = useTranslation();

  const { accounts, getAccountBalance, exchangeRate } = useContext(AppContext);

  const totalBalance = accounts.reduce((sum, acc) => {
    const balance = getAccountBalance(acc.id);
    const currency = acc.currency || "EGP";
    if (currency === "EGP") return sum + balance;
    if (exchangeRate) return sum + convertToEgp(balance, currency, exchangeRate);
    return sum;
  }, 0);
  const balancePositive = totalBalance >= 0;

  const toEgp = (tx) => {
    const acc = accounts.find((a) => a.id === tx.account_id);
    const currency = acc?.currency || "EGP";
    if (currency === "EGP" || !exchangeRate) return tx.amount;
    return convertToEgp(tx.amount, currency, exchangeRate);
  };

  const income = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + toEgp(tx), 0);
  const expenses = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + toEgp(tx), 0);
  const net = income - expenses;
  const netPositive = net >= 0;

  const gradientColors = isDark
    ? ["#4338CA", "#6366F1", "#7C3AED"]
    : ["#4F46E5", "#6366F1", "#8B5CF6"];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      {/* ── Total Balance ── */}
      <Text style={styles.balanceLabel}>{t("summary.totalBalance")}</Text>
      <View style={styles.balanceRow}>
        <Text style={styles.balanceAmount}>
          {totalBalance.toFixed(2)} EGP
        </Text>
        <View style={[
          styles.statusPill,
          { backgroundColor: balancePositive ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)" }
        ]}>
          <Ionicons
            name={balancePositive ? "trending-up" : "trending-down"}
            size={12}
            color="rgba(255,255,255,0.9)"
          />
          <Text style={styles.statusPillText}>
            {balancePositive ? t("summary.positive") : t("summary.negative")}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Period + Net ── */}
      <View style={styles.periodRow}>
        <Text style={styles.periodLabel}>{periodName}</Text>
        <View style={styles.netBadge}>
          <Ionicons
            name={netPositive ? "add" : "remove"}
            size={12}
            color="rgba(255,255,255,0.8)"
          />
          <Text style={styles.netText}>
            {Math.abs(net).toFixed(2)} EGP
          </Text>
        </View>
      </View>

      {/* ── Income / Expenses ── */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Ionicons name="arrow-down" size={13} color="rgba(255,255,255,0.85)" />
          </View>
          <View>
            <Text style={styles.statLabel}>{t("summary.income")}</Text>
            <Text style={styles.statValue}>+{income.toFixed(2)} EGP</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.statIcon, styles.statIconExpense]}>
            <Ionicons name="arrow-up" size={13} color="rgba(255,255,255,0.85)" />
          </View>
          <View>
            <Text style={styles.statLabel}>{t("summary.expenses")}</Text>
            <Text style={styles.statValue}>-{expenses.toFixed(2)} EGP</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

export default ExpensesSummary;

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      padding: 22,
      borderRadius: 24,
      marginBottom: 16,
      elevation: 8,
      shadowColor: "#4F46E5",
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      overflow: "hidden",
    },
    decorCircle1: {
      position: "absolute",
      top: -30,
      right: -30,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(255,255,255,0.06)",
    },
    decorCircle2: {
      position: "absolute",
      bottom: -20,
      left: -20,
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(255,255,255,0.04)",
    },
    balanceLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: "rgba(255,255,255,0.55)",
      textTransform: "uppercase",
      letterSpacing: 1.1,
      marginBottom: 6,
    },
    balanceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },
    balanceAmount: {
      fontSize: 30,
      fontWeight: "800",
      color: "#FFFFFF",
      letterSpacing: -0.5,
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    statusPillText: {
      fontSize: 11,
      fontWeight: "700",
      color: "rgba(255,255,255,0.9)",
    },
    divider: {
      height: 1,
      backgroundColor: "rgba(255,255,255,0.15)",
      marginBottom: 14,
    },
    periodRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    periodLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: "rgba(255,255,255,0.6)",
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
    netBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 20,
    },
    netText: {
      fontSize: 12,
      fontWeight: "700",
      color: "rgba(255,255,255,0.9)",
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    statItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    statIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.18)",
      justifyContent: "center",
      alignItems: "center",
    },
    statIconExpense: {
      backgroundColor: "rgba(0,0,0,0.15)",
    },
    statLabel: {
      fontSize: 10,
      color: "rgba(255,255,255,0.5)",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    statValue: {
      fontSize: 13,
      fontWeight: "700",
      color: "#FFFFFF",
      marginTop: 1,
    },
    statDivider: {
      width: 1,
      height: 34,
      backgroundColor: "rgba(255,255,255,0.15)",
      marginHorizontal: 12,
    },
  });
