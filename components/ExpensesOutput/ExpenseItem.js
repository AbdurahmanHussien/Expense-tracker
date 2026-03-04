import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useContext, useRef } from "react";
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const TYPE_CONFIG = {
    expense: {
      icon: "arrow-up",
      color: colors.expenseColor,
      bgColor: colors.expenseBg,
      prefix: "-",
    },
    income: {
      icon: "arrow-down",
      color: colors.incomeColor,
      bgColor: colors.incomeBg,
      prefix: "+",
    },
    transfer: {
      icon: "swap-horizontal",
      color: colors.transfer500,
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

  function onPressIn() {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }

  function onPressOut() {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  }

  function pressHandler() {
    navigation.navigate("ManageTransaction", { transactionId: id });
  }

  return (
    <Pressable
      onPress={pressHandler}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View
        style={[styles.item, { transform: [{ scale: scaleAnim }] }]}
      >
        {/* Accent dot */}
        <View style={[styles.accentDot, { backgroundColor: config.color }]} />

        <View style={styles.leftSection}>
          <View
            style={[styles.iconCircle, { backgroundColor: config.bgColor }]}
          >
            <Ionicons name={config.icon} size={22} color={config.color} />
          </View>
          <View style={styles.textSection}>
            <Text style={styles.description} numberOfLines={1}>
              {description}
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
                    { backgroundColor: category.color + "18" },
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
        <View style={styles.rightSection}>
          <Text style={[styles.amount, { color: config.color }]}>
            {config.prefix}
            {amount.toFixed(2)}
          </Text>
          <Text style={styles.currency}>{accountCurrency}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default ExpenseItem;

const getStyles = (colors) =>
  StyleSheet.create({
    item: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      paddingLeft: 12,
      marginVertical: 4,
      marginHorizontal: 2,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 1,
      shadowColor: "#000",
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
    },
    accentDot: {
      width: 4,
      height: 36,
      borderRadius: 2,
      marginRight: 12,
    },
    leftSection: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 12,
    },
    iconCircle: {
      width: 46,
      height: 46,
      borderRadius: 15,
      justifyContent: "center",
      alignItems: "center",
    },
    textSection: {
      flex: 1,
      gap: 4,
    },
    description: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.gray800,
      letterSpacing: -0.2,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 5,
    },
    accountBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
    },
    accountBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      maxWidth: 110,
    },
    categoryBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
    },
    categoryBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      maxWidth: 80,
    },
    rightSection: {
      alignItems: "flex-end",
      marginLeft: 8,
    },
    amount: {
      fontWeight: "700",
      fontSize: 15,
      letterSpacing: -0.3,
    },
    currency: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.gray500,
      marginTop: 1,
    },
  });
