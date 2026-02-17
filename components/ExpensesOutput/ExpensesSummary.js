import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../store/theme-context";

function ExpensesSummary({ transactions, periodName }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = getStyles(colors);

  const income = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.period}>{periodName}</Text>
      <View style={styles.amounts}>
        <Text style={styles.income}>+{income.toFixed(2)} EGP</Text>
        <Text style={styles.expense}>-{expenses.toFixed(2)} EGP</Text>
      </View>
    </View>
  );
}

export default ExpensesSummary;

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      padding: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.primary500,
      borderRadius: 20,
      marginBottom: 20,
      elevation: 6,
      shadowColor: "#000",
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
    },
    period: {
      fontSize: 14,
      fontWeight: "600",
      color: "rgba(255,255,255,0.85)",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    amounts: {
      alignItems: "flex-end",
      gap: 4,
    },
    income: {
      fontSize: 16,
      fontWeight: "700",
      color: "#4ade80",
    },
    expense: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fca5a5",
    },
  });
