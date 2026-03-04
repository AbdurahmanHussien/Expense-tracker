import { useState, useContext } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import { AppContext } from "../store/app-context";
import { getDateMinusDays } from "../utils/date";
import { useTheme } from "../store/theme-context";

const FILTER_KEYS = [
  { key: "7days", period: "7days", days: 7, icon: "today-outline" },
  { key: "2weeks", period: "2weeks", days: 14, icon: "calendar-outline" },
  { key: "1month", period: "1month", days: 30, icon: "calendar-number-outline" },
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
        {FILTER_KEYS.map((f, index) => {
          const active = index === selectedFilter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setSelectedFilter(index)}
              style={[styles.filterButton, active && styles.filterButtonActive]}
            >
              <Ionicons
                name={f.icon}
                size={14}
                color={active ? "#FFF" : colors.gray500}
              />
              <Text
                style={[
                  styles.filterText,
                  active && styles.filterTextActive,
                ]}
              >
                {t(`recent.${f.key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <ExpensesOutput
        periodName={t("recent.last", { period: t(`recent.${filter.period}`) })}
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
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 6,
      gap: 8,
    },
    filterButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 24,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary500,
      borderColor: colors.primary500,
      elevation: 3,
      shadowColor: colors.primary500,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
    },
    filterText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.gray500,
    },
    filterTextActive: {
      color: "white",
    },
  });
