import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../store/theme-context";
import { getFormattedDate } from "../../utils/date";
import { AppContext } from "../../store/app-context";

function ExpenseItem({ id, description, amount, date, type, account_id, transfer_to_account_id }) {
  const navigation = useNavigation();
  const { accounts } = useContext(AppContext);
  const { theme } = useTheme();
  const colors = theme.colors;

  const TYPE_CONFIG = {
    expense: {
      icon: "arrow-up",
      color: colors.error500,
      borderColor: colors.error500,
      bgColor: colors.error50,
      prefix: "-",
    },
    income: {
      icon: "arrow-down",
      color: colors.success500,
      borderColor: colors.success500,
      bgColor: "rgba(74, 222, 128, 0.12)",
      prefix: "+",
    },
    transfer: {
      icon: "swap-horizontal",
      color: colors.transfer500,
      borderColor: colors.transfer500,
      bgColor: "rgba(96, 165, 250, 0.12)",
      prefix: "",
    },
  };

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.expense;
  const styles = getStyles(colors);
  const accountName = accounts.find((a) => a.id === account_id)?.name || "";
  const toAccountName = transfer_to_account_id
    ? accounts.find((a) => a.id === transfer_to_account_id)?.name || ""
    : "";

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
          <View style={[styles.iconCircle, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>
          <View style={styles.textSection}>
            <Text style={styles.description} numberOfLines={1}>
              {description}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {getFormattedDate(date)}
              {type === "transfer"
                ? ` \u00B7 ${accountName} \u2192 ${toAccountName}`
                : ` \u00B7 ${accountName}`}
            </Text>
          </View>
        </View>
        <View style={[styles.amountContainer, { backgroundColor: config.bgColor }]}>
          <Text style={[styles.amount, { color: config.color }]}>
            {config.prefix}${amount.toFixed(2)}
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
      marginVertical: 6,
      marginHorizontal: 4,
      backgroundColor: colors.surface,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 16,
      elevation: 4,
      shadowColor: "#000",
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
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
    meta: {
      fontSize: 12,
      color: colors.gray500,
    },
    amountContainer: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      minWidth: 85,
      alignItems: "center",
    },
    amount: {
      fontWeight: "700",
      fontSize: 15,
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
  });
