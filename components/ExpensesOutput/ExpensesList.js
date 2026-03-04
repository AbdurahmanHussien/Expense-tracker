import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import ExpenseItem from "./ExpenseItem";
import { useTheme } from "../../store/theme-context";

function ExpensesList({ transactions }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { t } = useTranslation();
  const styles = getStyles(colors);

  // Group transactions by date
  const grouped = {};
  transactions.forEach((tx) => {
    const dateKey = tx.date.toISOString().slice(0, 10);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(tx);
  });

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  function formatDateHeader(dateStr) {
    if (dateStr === today) return t("list.today");
    if (dateStr === yesterday) return t("list.yesterday");
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <View>
      {sortedDates.map((dateKey) => (
        <View key={dateKey}>
          <View style={styles.dateHeader}>
            <View style={styles.dateIconWrap}>
              <Ionicons name="calendar-outline" size={12} color={colors.gray500} />
            </View>
            <Text style={styles.dateText}>{formatDateHeader(dateKey)}</Text>
            <View style={styles.dateLine} />
          </View>
          {grouped[dateKey].map((item) => (
            <ExpenseItem
              key={item.id.toString()}
              id={item.id}
              description={item.description}
              amount={item.amount}
              date={item.date}
              type={item.type}
              account_id={item.account_id}
              transfer_to_account_id={item.transfer_to_account_id}
              category_id={item.category_id}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default ExpensesList;

const getStyles = (colors) =>
  StyleSheet.create({
    dateHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 18,
      marginBottom: 6,
      paddingHorizontal: 4,
    },
    dateIconWrap: {
      width: 22,
      height: 22,
      borderRadius: 7,
      backgroundColor: colors.primary50,
      alignItems: "center",
      justifyContent: "center",
    },
    dateLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dateText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.gray500,
      letterSpacing: 0.3,
    },
  });
