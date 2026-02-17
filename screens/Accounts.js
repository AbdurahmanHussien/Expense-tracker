import { useContext } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AppContext } from "../store/app-context";
import { useTheme } from "../store/theme-context";

function Accounts() {
  const navigation = useNavigation();
  const { accounts, getAccountBalance } = useContext(AppContext);
  const { theme } = useTheme();
  const colors = theme.colors;

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + getAccountBalance(acc.id),
    0,
  );

  const styles = getStyles(colors);

  function renderAccountItem({ item }) {
    const balance = getAccountBalance(item.id);
    const isPositive = balance >= 0;

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        onPress={() =>
          navigation.navigate("ManageAccount", { accountId: item.id })
        }
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="wallet" size={24} color={colors.primary400} />
          </View>
          <Text style={styles.accountName}>{item.name}</Text>
        </View>
        <Text
          style={[
            styles.balance,
            {
              color: isPositive ? colors.success500 : colors.error500,
            },
          ]}
        >
          {balance.toFixed(2)} EGP
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Balance</Text>
        <Text style={styles.totalAmount}>{totalBalance.toFixed(2)} EGP</Text>
      </View>
      {accounts.length > 0 ? (
        <FlatList
          data={accounts}
          renderItem={renderAccountItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No accounts yet</Text>
          <Text style={styles.emptySubText}>
            Tap + to create your first account
          </Text>
        </View>
      )}
    </View>
  );
}

export default Accounts;

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.gray100,
    },
    totalCard: {
      margin: 24,
      marginBottom: 8,
      padding: 24,
      backgroundColor: colors.primary500,
      borderRadius: 20,
      alignItems: "center",
      elevation: 6,
      shadowColor: "#000",
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: "rgba(255,255,255,0.75)",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    totalAmount: {
      fontSize: 36,
      fontWeight: "700",
      color: "white",
    },
    list: {
      padding: 24,
      paddingTop: 16,
    },
    card: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 16,
      marginBottom: 12,
      elevation: 4,
      shadowColor: "#000",
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
    },
    cardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary100,
      justifyContent: "center",
      alignItems: "center",
    },
    accountName: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.gray800,
    },
    balance: {
      fontSize: 20,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.gray500,
      marginBottom: 8,
    },
    emptySubText: {
      fontSize: 14,
      color: colors.gray500,
    },
  });
