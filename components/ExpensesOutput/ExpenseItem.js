import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../store/theme-context";
import { getFormattedDate } from "../../utils/date";
import { AppContext } from "../../store/app-context";

function ExpenseItem({
  id,
  description,
  amount,
  date,
  type,
  account_id,
  transfer_to_account_id,
  category_id,
}) {
  const navigation = useNavigation();
  const { accounts, categories } = useContext(AppContext);
  const { theme } = useTheme();
  const colors = theme.colors;

  const TYPE_CONFIG = {
    expense: {
      icon: "arrow-up",
      color: colors.expenseColor,
      borderColor: colors.expenseColor,
      bgColor: colors.expenseBg,
      prefix: "-",
    },
    income: {
      icon: "arrow-down",
      color: colors.incomeColor,
      borderColor: colors.incomeColor,
      bgColor: colors.incomeBg,
      prefix: "+",
    },
    transfer: {
      icon: "swap-horizontal",
      color: colors.transfer500,
      borderColor: colors.transfer500,
      bgColor: colors.primary100,
      prefix: "",
    },
  };

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.expense;
  const styles = getStyles(colors);
  const account = accounts.find((a) => a.id === account_id);
  const accountName = account?.name || "";
  const accountCurrency = account?.currency || "EGP";
  const toAccountName = transfer_to_account_id
    ? accounts.find((a) => a.id === transfer_to_account_id)?.name || ""
    : "";

  const category = category_id
    ? categories.find((c) => c.id === category_id)
    : null;

  function pressHandler() {
    navigation.navigate("ManageTransaction", { transactionId: id });
  }

  return (
    <Pressable
      style={({ pressed }) => pressed && styles.pressed}
      onPress={pressHandler}
    >
      <View style={[styles.item, { borderLeftColor: config.borderColor }]}>
        <View style={styles.leftSection}>
          <View
            style={[styles.iconCircle, { backgroundColor: config.bgColor }]}
          >
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>
          <View style={styles.textSection}>
            <Text style={styles.description} numberOfLines={1}>
              {description}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {getFormattedDate(date)}
            </Text>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.accountBadge,
                  { backgroundColor: config.bgColor },
                ]}
              >
                <Ionicons
                  name="wallet-outline"
                  size={10}
                  color={config.color}
                />
                <Text
                  style={[styles.accountBadgeText, { color: config.color }]}
                  numberOfLines={1}
                >
                  {type === "transfer"
                    ? `${accountName} → ${toAccountName}`
                    : accountName}
                </Text>
              </View>
              {category && (
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: category.color + "26" },
                  ]}
                >
                  <Ionicons
                    name={category.icon}
                    size={10}
                    color={category.color}
                  />
                  <Text
                    style={[
                      styles.categoryBadgeText,
                      { color: category.color },
                    ]}
                    numberOfLines={1}
                  >
                    {category.name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View
          style={[styles.amountContainer, { backgroundColor: config.bgColor }]}
        >
          <Text style={[styles.amount, { color: config.color }]}>
            {config.prefix}
            {amount.toFixed(2)} {accountCurrency}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default ExpenseItem;

const getStyles = (colors) =>
  StyleSheet.create({
    item: {
      padding: 16,
      marginVertical: 5,
      marginHorizontal: 4,
      backgroundColor: colors.surface,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
      shadowColor: "#000",
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      borderLeftWidth: 4,
    },
    leftSection: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 12,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    textSection: {
      flex: 1,
    },
    description: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.gray800,
      marginBottom: 4,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
    },
    meta: {
      fontSize: 12,
      color: colors.gray500,
      marginBottom: 4,
    },
    accountBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    accountBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      maxWidth: 120,
    },
    categoryBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    categoryBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      maxWidth: 80,
    },
    amountContainer: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 85,
      alignItems: "center",
    },
    amount: {
      fontWeight: "600",
      fontSize: 14,
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
  });
