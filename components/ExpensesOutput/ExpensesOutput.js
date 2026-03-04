import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useContext, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../store/theme-context";
import { AppContext } from "../../store/app-context";
import ExpensesSummary from "./ExpensesSummary";
import ExpensesList from "./ExpensesList";

function ExpensesOutput({ transactions, periodName, fallbackText }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { t } = useTranslation();
  const styles = getStyles(colors);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.date - a.date),
    [transactions]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <ExpensesSummary transactions={sorted} periodName={periodName} />

      {sorted.length > 0 ? (
        <ExpensesList transactions={sorted} />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrapper}>
            <Ionicons name="receipt-outline" size={48} color={colors.gray500} />
          </View>
          <Text style={styles.emptyTitle}>{t("summary.noTransactions")}</Text>
          <Text style={styles.emptyHint}>{t("summary.noTransactionsHint")}</Text>
        </View>
      )}

      {/* Bottom spacer for floating tab bar */}
      <View style={{ height: 90 }} />
    </ScrollView>
  );
}

export default ExpensesOutput;

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.gray100,
    },
    contentContainer: {
      padding: 16,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    emptyIconWrapper: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.primary50,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.gray700,
      marginBottom: 6,
      textAlign: "center",
    },
    emptyHint: {
      fontSize: 13,
      color: colors.gray500,
      textAlign: "center",
      lineHeight: 20,
    },
  });
