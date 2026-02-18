import { useState, useContext } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import { AppContext } from "../store/app-context";
import { getDateMinusDays } from "../utils/date";
import { useTheme } from "../store/theme-context";

const FILTER_KEYS = [
  { key: "7days", period: "7days", days: 7 },
  { key: "2weeks", period: "2weeks", days: 14 },
  { key: "1month", period: "1month", days: 30 },
];

function RecentExpenses() {
  const [selectedFilter, setSelectedFilter] = useState(0);
  const { transactions } = useContext(AppContext);
  const { theme } = useTheme();
  const colors = theme.colors;
  const { t } = useTranslation();

  const filter = FILTER_KEYS[selectedFilter];
  const cutoffDate = getDateMinusDays(new Date(), filter.days);

  const recentTransactions = transactions.filter(
    (tx) => tx.date > cutoffDate
  );

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {FILTER_KEYS.map((f, index) => (
          <Pressable
            key={f.key}
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
              {t(`recent.${f.key}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      <ExpensesOutput
        expensesPeriod={t("recent.last", { period: t(`recent.${filter.period}`) })}
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
