import { useState, useContext } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import { AppContext } from "../store/app-context";
import { getDateMinusDays } from "../utils/date";
import { useTheme } from "../store/theme-context";

const FILTERS = [
  { label: "7 Days", days: 7 },
  { label: "2 Weeks", days: 14 },
  { label: "1 Month", days: 30 },
];

function RecentExpenses() {
  const [selectedFilter, setSelectedFilter] = useState(0);
  const { transactions } = useContext(AppContext);
  const { theme } = useTheme();
  const colors = theme.colors;

  const filter = FILTERS[selectedFilter];
  const cutoffDate = getDateMinusDays(new Date(), filter.days);

  const recentTransactions = transactions.filter(
    (tx) => tx.date > cutoffDate
  );

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {FILTERS.map((f, index) => (
          <Pressable
            key={f.days}
            onPress={() => setSelectedFilter(index)}
            style={[
              styles.filterButton,
              index === selectedFilter && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                index === selectedFilter && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <ExpensesOutput
        expensesPeriod={`Last ${filter.label}`}
        transactions={recentTransactions}
      />
    </View>
  );
}

export default RecentExpenses;

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.gray100,
    },
    filterRow: {
      flexDirection: "row",
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 8,
    },
    filterButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary500,
      borderColor: colors.primary500,
    },
    filterText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.gray500,
    },
    filterTextActive: {
      color: "white",
    },
  });
