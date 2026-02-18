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
import { useTheme } from "../store/theme-context";
import { AppContext } from "../store/app-context";
import { getDateMinusDays } from "../utils/date";
import CategoryChart from "../components/ExpensesOutput/CategoryChart";

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState(2);
  const { transactions, accounts, getAccountBalance } = useContext(AppContext);
  const { theme } = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation();
  const styles = getStyles(colors);
  const { t } = useTranslation();

  const PERIODS = [
    { labelKey: "period7d", days: 7 },
    { labelKey: "period2w", days: 14 },
    { labelKey: "period1m", days: 30 },
    { labelKey: "period3m", days: 90 },
    { labelKey: "periodAll", days: null },
  ];

  const period = PERIODS[selectedPeriod];
  const filtered =
    period.days === null
      ? transactions
      : transactions.filter(
          (tx) => tx.date > getDateMinusDays(new Date(), period.days)
        );

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + getAccountBalance(acc.id),
    0
  );
  const balancePositive = totalBalance >= 0;

  const income   = filtered.filter((tx) => tx.type === "income" ).reduce((s, tx) => s + tx.amount, 0);
  const expenses = filtered.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);
  const net      = income - expenses;
  const netPositive = net >= 0;

  const hasExpenses = filtered.some(
    (tx) => tx.type === "expense" && tx.category_id != null
  );

  const periodLabel = t(`analytics.${period.labelKey}`);
  const noExpensesSuffix = period.days
    ? t("analytics.noExpensesSuffix", { label: periodLabel })
    : t("analytics.noExpensesYet");

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Balance Hero ── */}
      <View style={styles.heroCard}>
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
      </View>

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
    </ScrollView>
  );
}

function StatCard({ label, value, color, bg, icon, colors }) {
  const styles = getStatStyles(colors);
  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={15} color={color} />
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
      borderRadius: 14,
      padding: 14,
      borderTopWidth: 2,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 1,
      shadowColor: "#000",
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
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
      borderRadius: 20,
      padding: 24,
      elevation: 6,
      shadowColor: colors.primary500,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
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
      borderRadius: 14,
      padding: 4,
      gap: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodBtn: {
      flex: 1,
      paddingVertical: 9,
      alignItems: "center",
      borderRadius: 10,
    },
    periodBtnActive: {
      backgroundColor: colors.primary500,
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
      borderRadius: 16,
      padding: 28,
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyChartText: {
      fontSize: 14,
      fontWeight: "600",
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
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    manageBtnPressed: {
      opacity: 0.7,
    },
    manageBtnIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.primary100,
      justifyContent: "center",
      alignItems: "center",
    },
    manageBtnText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: colors.gray800,
    },
  });
