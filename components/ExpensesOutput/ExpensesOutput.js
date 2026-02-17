import { View, Text, StyleSheet } from "react-native";
import ExpensesSummary from "./ExpensesSummary";
import ExpensesList from "./ExpensesList";
import { useTheme } from "../../store/theme-context";

function ExpensesOutput({ transactions, expensesPeriod }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <ExpensesSummary periodName={expensesPeriod} transactions={transactions} />
      {transactions.length > 0 ? (
        <ExpensesList transactions={transactions} />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.infoText}>No transactions found</Text>
        </View>
      )}
    </View>
  );
}

export default ExpensesOutput;

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      padding: 24,
      backgroundColor: colors.gray100,
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    infoText: {
      color: colors.gray500,
      fontSize: 16,
      textAlign: "center",
      marginTop: 48,
      fontWeight: "500",
    },
  });
