import { View, Text, StyleSheet } from "react-native";
import { useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../store/theme-context";
import { AppContext } from "../../store/app-context";

export default function CategoryChart({ transactions }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { categories } = useContext(AppContext);
  const styles = getStyles(colors);

  // Only expense transactions with a category
  const expenseTxs = transactions.filter(
    (tx) => tx.type === "expense" && tx.category_id != null
  );

  if (expenseTxs.length === 0 || categories.length === 0) return null;

  // Sum per category
  const totals = {};
  expenseTxs.forEach((tx) => {
    totals[tx.category_id] = (totals[tx.category_id] || 0) + tx.amount;
  });

  const totalAll = Object.values(totals).reduce((a, b) => a + b, 0);

  // Sort descending
  const sorted = Object.entries(totals)
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === Number(catId));
      return { cat, amount };
    })
    .filter((item) => item.cat)
    .sort((a, b) => b.amount - a.amount);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="pie-chart" size={18} color={colors.primary400} />
        <Text style={styles.title}>Spending by Category</Text>
      </View>

      {sorted.map(({ cat, amount }) => {
        const share = totalAll > 0 ? ((amount / totalAll) * 100).toFixed(0) : "0";
        return (
          <View key={cat.id} style={styles.row}>
            <View style={styles.labelRow}>
              <View style={[styles.iconCircle, { backgroundColor: cat.color + "26" }]}>
                <Ionicons name={cat.icon} size={14} color={cat.color} />
              </View>
              <Text style={styles.catName} numberOfLines={1}>
                {cat.name}
              </Text>
              <Text style={styles.share}>{share}%</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${share}%`, backgroundColor: cat.color },
                ]}
              />
            </View>
            <Text style={[styles.amount, { color: cat.color }]}>
              {amount.toFixed(2)} EGP
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 3,
      shadowColor: "#000",
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },
    title: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.gray800,
    },
    row: {
      marginBottom: 12,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    iconCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      justifyContent: "center",
      alignItems: "center",
    },
    catName: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      color: colors.gray800,
    },
    share: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.gray500,
      minWidth: 32,
      textAlign: "right",
    },
    barTrack: {
      height: 8,
      width: "100%",
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 4,
    },
    barFill: {
      height: 8,
      borderRadius: 4,
    },
    amount: {
      fontSize: 12,
      fontWeight: "700",
      textAlign: "right",
    },
  });
