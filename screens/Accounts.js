import { useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AppContext } from "../store/app-context";
import { useTheme } from "../store/theme-context";
import { convertToEgp } from "../utils/currency";
import LanguageSelector from "../components/UI/LanguageSelector";

function Accounts() {
  const navigation = useNavigation();
  const {
    accounts,
    getAccountBalance,
    exchangeRate,
    exchangeRateLoading,
    refreshExchangeRate,
  } = useContext(AppContext);
  const { theme } = useTheme();
  const colors = theme.colors;
  const { t } = useTranslation();

  const hasMultiCurrency = accounts.some(
    (a) => (a.currency || "EGP") !== "EGP",
  );

  useEffect(() => {
    if (hasMultiCurrency && !exchangeRate) {
      refreshExchangeRate();
    }
  }, [hasMultiCurrency]);

  const totalBalanceEgp = accounts.reduce((sum, acc) => {
    const balance = getAccountBalance(acc.id);
    const currency = acc.currency || "EGP";
    if (currency === "EGP") return sum + balance;
    if (exchangeRate)
      return sum + convertToEgp(balance, currency, exchangeRate);
    return sum;
  }, 0);

  const styles = getStyles(colors);

  function renderAccountItem({ item }) {
    const balance = getAccountBalance(item.id);
    const currency = item.currency || "EGP";
    const isPositive = balance >= 0;
    const isUsd = currency === "USD";

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        onPress={() =>
          navigation.navigate("ManageAccount", { accountId: item.id })
        }
      >
        <View style={styles.cardLeft}>
          <View
            style={[styles.iconContainer, isUsd && styles.iconContainerUsd]}
          >
            <Ionicons
              name="wallet"
              size={24}
              color={isUsd ? colors.error500 : colors.primary400}
            />
          </View>
          <View>
            <Text style={styles.accountName}>{item.name}</Text>
            <View style={styles.currencyBadge}>
              <Text
                style={[
                  styles.currencyBadgeText,
                  isUsd && styles.currencyBadgeTextUsd,
                ]}
              >
                {isUsd ? "🇺🇸 USD" : "🇪🇬 EGP"}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text
            style={[
              styles.balance,
              { color: isPositive ? colors.incomeColor : colors.expenseColor },
            ]}
          >
            {balance.toFixed(2)} {currency}
          </Text>
          {isUsd && exchangeRate && (
            <Text style={styles.egpEquiv}>
              ≈ {convertToEgp(balance, "USD", exchangeRate).toFixed(0)} EGP
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>{t("accounts.totalBalanceEgp")}</Text>
        {hasMultiCurrency && exchangeRateLoading ? (
          <ActivityIndicator
            size="small"
            color="white"
            style={{ marginTop: 8 }}
          />
        ) : (
          <Text style={styles.totalAmount}>
            {totalBalanceEgp.toFixed(2)} EGP
          </Text>
        )}
        {hasMultiCurrency && exchangeRate && !exchangeRateLoading && (
          <Text style={styles.rateNote}>
            1 USD = {exchangeRate.toFixed(2)} EGP
          </Text>
        )}
        {hasMultiCurrency && !exchangeRate && !exchangeRateLoading && (
          <Pressable onPress={refreshExchangeRate} style={styles.rateRetryBtn}>
            <Ionicons name="refresh" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.rateRetryText}>{t("accounts.fetchRate")}</Text>
          </Pressable>
        )}
      </View>

      {accounts.length > 0 ? (
        <FlatList
          data={accounts}
          renderItem={renderAccountItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <View style={styles.settingsSection}>
              <LanguageSelector />
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t("accounts.noAccounts")}</Text>
          <Text style={styles.emptySubText}>{t("accounts.noAccountsHint")}</Text>
          <View style={styles.settingsSectionEmpty}>
            <LanguageSelector />
          </View>
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
      elevation: 4,
      shadowColor: colors.primary500,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
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
    rateNote: {
      marginTop: 6,
      fontSize: 12,
      color: "rgba(255,255,255,0.65)",
      fontWeight: "500",
    },
    rateRetryBtn: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    rateRetryText: {
      fontSize: 12,
      color: "rgba(255,255,255,0.85)",
      fontWeight: "600",
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
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
      shadowColor: "#000",
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
    },
    cardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      flex: 1,
    },
    cardRight: {
      alignItems: "flex-end",
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary100,
      justifyContent: "center",
      alignItems: "center",
    },
    iconContainerUsd: {
      backgroundColor: colors.error50,
    },
    accountName: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.gray800,
    },
    currencyBadge: {
      marginTop: 2,
    },
    currencyBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary400,
    },
    currencyBadgeTextUsd: {
      color: colors.error500,
    },
    balance: {
      fontSize: 20,
      fontWeight: "700",
    },
    egpEquiv: {
      fontSize: 12,
      color: colors.gray500,
      marginTop: 2,
      fontWeight: "500",
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
      marginBottom: 32,
    },
    settingsSection: {
      marginTop: 8,
      paddingBottom: 8,
    },
    settingsSectionEmpty: {
      width: "100%",
      paddingHorizontal: 24,
    },
  });
