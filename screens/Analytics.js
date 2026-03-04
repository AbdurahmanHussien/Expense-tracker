import { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../store/theme-context";
import { AppContext } from "../store/app-context";
import { getDateMinusDays } from "../utils/date";
import { convertToEgp } from "../utils/currency";
import CategoryChart from "../components/ExpensesOutput/CategoryChart";
import InsightsCard from "../components/ExpensesOutput/InsightsCard";
import HealthScoreCard from "../components/ExpensesOutput/HealthScoreCard";

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState(0);
  const { transactions, accounts, categories, budgets, goals, getAccountBalance, exchangeRate } = useContext(AppContext);
  const { theme, isDark } = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation();
  const styles = getStyles(colors);
  const { t } = useTranslation();

  const gradientColors = isDark
    ? ["#4338CA", "#6366F1", "#7C3AED"]
    : ["#4F46E5", "#6366F1", "#8B5CF6"];

  const PERIODS = [
    { labelKey: "period7d", days: 7 },
    { labelKey: "period2w", days: 14 },
    { labelKey: "periodThisMonth", days: "thisMonth" },
  ];

  const period = PERIODS[selectedPeriod];

  const getStartOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const filtered =
    period.days === null
      ? transactions
      : period.days === "thisMonth"
        ? transactions.filter((tx) => tx.date >= getStartOfMonth())
        : transactions.filter(
          (tx) => tx.date > getDateMinusDays(new Date(), period.days)
        );

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + convertToEgp(getAccountBalance(acc.id), acc.currency || "EGP", exchangeRate),
    0
  );
  const balancePositive = totalBalance >= 0;

  // Build a lookup so we can resolve each transaction's account currency
  const accountCurrencyMap = {};
  accounts.forEach((acc) => { accountCurrencyMap[acc.id] = acc.currency || "EGP"; });

  const income = filtered
    .filter((tx) => tx.type === "income")
    .reduce((s, tx) => s + convertToEgp(tx.amount, accountCurrencyMap[tx.account_id] || "EGP", exchangeRate), 0);
  const expenses = filtered
    .filter((tx) => tx.type === "expense")
    .reduce((s, tx) => s + convertToEgp(tx.amount, accountCurrencyMap[tx.account_id] || "EGP", exchangeRate), 0);
  const net = income - expenses;
  const netPositive = net >= 0;

  const hasExpenses = filtered.some(
    (tx) => tx.type === "expense" && tx.category_id != null
  );

  const periodLabel = t(`analytics.${period.labelKey}`);
  const noExpensesSuffix =
    typeof period.days === "number"
      ? t("analytics.noExpensesSuffix", { label: periodLabel })
      : t("analytics.noExpensesYet");

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Balance Hero ── */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <Text style={styles.heroLabel}>{t("analytics.totalBalance")}</Text>
        <View style={styles.heroAmountRow}>
          <Text style={styles.heroAmount}>{totalBalance.toFixed(2)} EGP</Text>
          <View style={[
            styles.heroPill,
            { backgroundColor: balancePositive ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)" }
          ]}>
            <Ionicons
              name={balancePositive ? "trending-up" : "trending-down"}
              size={12}
              color="rgba(255,255,255,0.9)"
            />
            <Text style={styles.heroPillText}>
              {balancePositive ? t("analytics.positive") : t("analytics.negative")}
            </Text>
          </View>
        </View>
        <View style={styles.heroAccounts}>
          <Ionicons name="wallet-outline" size={13} color="rgba(255,255,255,0.45)" />
          <Text style={styles.heroAccountsText}>
            {t(accounts.length === 1 ? "analytics.accounts_one" : "analytics.accounts_other", { count: accounts.length })}
          </Text>
        </View>
      </LinearGradient>

      {/* ── Period Selector ── */}
      <View style={styles.periodRow}>
        {PERIODS.map((p, i) => (
          <Pressable
            key={p.labelKey}
            onPress={() => setSelectedPeriod(i)}
            style={[styles.periodBtn, i === selectedPeriod && styles.periodBtnActive]}
          >
            <Text style={[styles.periodBtnText, i === selectedPeriod && styles.periodBtnTextActive]}>
              {t(`analytics.${p.labelKey}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Health Score Card ── */}
      <HealthScoreCard
        transactions={transactions}
        budgets={budgets}
        goals={goals}
        accounts={accounts}
        exchangeRate={exchangeRate}
      />

      {/* ── Quick Stats ── */}
      <View style={styles.statsRow}>
        <StatCard
          label={t("analytics.income")}
          value={`+${income.toFixed(2)}`}
          color={colors.incomeColor}
          bg={colors.incomeBg}
          icon="arrow-down"
          colors={colors}
        />
        <StatCard
          label={t("analytics.expenses")}
          value={`-${expenses.toFixed(2)}`}
          color={colors.expenseColor}
          bg={colors.expenseBg}
          icon="arrow-up"
          colors={colors}
        />
        <StatCard
          label={t("analytics.net")}
          value={`${netPositive ? "+" : ""}${net.toFixed(2)}`}
          color={netPositive ? colors.incomeColor : colors.expenseColor}
          bg={netPositive ? colors.incomeBg : colors.expenseBg}
          icon={netPositive ? "trending-up" : "trending-down"}
          colors={colors}
        />
      </View>

      {/* ── Spending Insights ── */}
      <InsightsCard
        transactions={transactions}
        categories={categories}
        budgets={budgets}
        accounts={accounts}
      />

      {/* ── Category Chart ── */}
      {hasExpenses ? (
        <CategoryChart transactions={filtered} />
      ) : (
        <View style={styles.emptyChart}>
          <Ionicons name="pie-chart-outline" size={36} color={colors.gray500} />
          <Text style={styles.emptyChartText}>
            {t("analytics.noExpenses", { suffix: noExpensesSuffix })}
          </Text>
          <Text style={styles.emptyChartSub}>
            {t("analytics.categoriseHint")}
          </Text>
        </View>
      )}

      {/* ── Manage Categories ── */}
      <Pressable
        style={({ pressed }) => [styles.manageBtn, pressed && styles.manageBtnPressed]}
        onPress={() => navigation.navigate("ManageCategories")}
      >
        <View style={styles.manageBtnIcon}>
          <Ionicons name="pricetags-outline" size={18} color={colors.primary400} />
        </View>
        <Text style={styles.manageBtnText}>{t("analytics.manageCategories")}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
      </Pressable>

      {/* ── Monthly Report ── */}
      <Pressable
        style={({ pressed }) => [styles.manageBtn, pressed && styles.manageBtnPressed]}
        onPress={() => navigation.navigate("MonthlyReport")}
      >
        <View style={[styles.manageBtnIcon, { backgroundColor: colors.accent500 + "18" }]}>
          <Ionicons name="calendar-outline" size={18} color={colors.accent500} />
        </View>
        <Text style={styles.manageBtnText}>{t("monthly.title")}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
      </Pressable>

      {/* ── Savings Goals ── */}
      <Pressable
        style={({ pressed }) => [styles.manageBtn, pressed && styles.manageBtnPressed]}
        onPress={() => navigation.navigate("SavingsGoals")}
      >
        <View style={[styles.manageBtnIcon, { backgroundColor: colors.incomeColor + "18" }]}>
          <Ionicons name="ribbon-outline" size={18} color={colors.incomeColor} />
        </View>
        <Text style={styles.manageBtnText}>{t("goals.title")}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
      </Pressable>

      {/* ── Recurring Transactions ── */}
      <Pressable
        style={({ pressed }) => [styles.manageBtn, pressed && styles.manageBtnPressed]}
        onPress={() => navigation.navigate("RecurringTransactions")}
      >
        <View style={[styles.manageBtnIcon, { backgroundColor: colors.primary400 + "18" }]}>
          <Ionicons name="repeat-outline" size={18} color={colors.primary400} />
        </View>
        <Text style={styles.manageBtnText}>{t("recurring.title")}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
      </Pressable>

      {/* ── Bill Reminders ── */}
      <Pressable
        style={({ pressed }) => [styles.manageBtn, pressed && styles.manageBtnPressed]}
        onPress={() => navigation.navigate("BillReminders")}
      >
        <View style={[styles.manageBtnIcon, { backgroundColor: colors.expenseColor + "18" }]}>
          <Ionicons name="receipt-outline" size={18} color={colors.expenseColor} />
        </View>
        <Text style={styles.manageBtnText}>{t("bills.title")}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
      </Pressable>

      <View style={{ height: 90 }} />
    </ScrollView>
  );
}

function StatCard({ label, value, color, bg, icon, colors }) {
  const styles = getStatStyles(colors);
  return (
    <View style={styles.card}>
      <View style={[styles.topAccent, { backgroundColor: color }]} />
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.currency}>EGP</Text>
    </View>
  );
}

const getStatStyles = (colors) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      elevation: 2,
      shadowColor: "#000",
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
    },
    topAccent: {
      position: "absolute",
      top: 0,
      left: 16,
      right: 16,
      height: 3,
      borderBottomLeftRadius: 3,
      borderBottomRightRadius: 3,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
      marginTop: 4,
    },
    label: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.gray500,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    value: {
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    currency: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.gray500,
      marginTop: 1,
    },
  });

const getStyles = (colors) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.gray100,
    },
    container: {
      padding: 20,
      paddingBottom: 40,
      gap: 14,
    },
    heroCard: {
      backgroundColor: colors.primary500,
      borderRadius: 24,
      padding: 24,
      elevation: 8,
      shadowColor: "#4F46E5",
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      overflow: "hidden",
    },
    heroDecor1: {
      position: "absolute",
      top: -30,
      right: -30,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(255,255,255,0.06)",
    },
    heroDecor2: {
      position: "absolute",
      bottom: -20,
      left: -20,
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(255,255,255,0.04)",
    },
    heroLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: "rgba(255,255,255,0.55)",
      textTransform: "uppercase",
      letterSpacing: 1.1,
      marginBottom: 6,
    },
    heroAmountRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    heroAmount: {
      fontSize: 32,
      fontWeight: "800",
      color: "#FFFFFF",
      letterSpacing: -0.5,
    },
    heroPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 20,
    },
    heroPillText: {
      fontSize: 11,
      fontWeight: "700",
      color: "rgba(255,255,255,0.9)",
    },
    heroAccounts: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    heroAccountsText: {
      fontSize: 12,
      color: "rgba(255,255,255,0.45)",
      fontWeight: "500",
    },
    periodRow: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 4,
      gap: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 14,
    },
    periodBtnActive: {
      backgroundColor: colors.primary500,
      elevation: 3,
      shadowColor: colors.primary500,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
    },
    periodBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.gray500,
    },
    periodBtnTextActive: {
      color: "white",
    },
    statsRow: {
      flexDirection: "row",
      gap: 8,
    },
    emptyChart: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 32,
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyChartText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.gray700,
      textAlign: "center",
    },
    emptyChartSub: {
      fontSize: 12,
      color: colors.gray500,
      textAlign: "center",
      lineHeight: 18,
    },
    manageBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 1,
      shadowColor: "#000",
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
    },
    manageBtnPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    manageBtnIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.primary100,
      justifyContent: "center",
      alignItems: "center",
    },
    manageBtnText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: colors.gray800,
    },
  });
