import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import ExpensesSummary from "./ExpensesSummary";
import ExpensesList from "./ExpensesList";
import { useTheme } from "../../store/theme-context";

function ExpensesOutput({ transactions, expensesPeriod }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = getStyles(colors);
  const { t } = useTranslation();

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ExpensesSummary periodName={expensesPeriod} transactions={transactions} />
      {transactions.length > 0 ? (
        <ExpensesList transactions={transactions} />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.infoText}>{t("summary.noTransactions")}</Text>
        </View>
      )}
    </ScrollView>
  );
}

export default ExpensesOutput;

const getStyles = (colors) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.gray100,
    },
    container: {
      padding: 20,
      paddingBottom: 32,
    },
    emptyContainer: {
      alignItems: "center",
      marginTop: 64,
    },
    infoText: {
      color: colors.gray500,
      fontSize: 16,
      textAlign: "center",
      fontWeight: "500",
    },
  });
