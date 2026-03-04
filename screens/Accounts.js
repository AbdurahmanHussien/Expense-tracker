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
import { LinearGradient } from "expo-linear-gradient";
import { AppContext } from "../store/app-context";
import { useTheme } from "../store/theme-context";
import { convertToEgp } from "../utils/currency";
import LanguageSelector from "../components/UI/LanguageSelector";
import SecurityToggle from "../components/UI/SecurityToggle";
import DatabaseBackup from "../components/UI/DatabaseBackup";

function Accounts() {
  const navigation = useNavigation();
  const {
    accounts,
    getAccountBalance,
    exchangeRate,
    exchangeRateLoading,
    exchangeRateError,
    refreshExchangeRate,
  } = useContext(AppContext);
  const { theme, isDark } = useTheme();
  const colors = theme.colors;
  const { t } = useTranslation();

  const gradientColors = isDark
    ? ["#4338CA", "#6366F1", "#7C3AED"]
    : ["#4F46E5", "#6366F1", "#8B5CF6"];

  const hasMultiCurrency = accounts.some(
    (a) => (a.currency || "EGP") !== "EGP",
  );

  useEffect(() => {
    if (hasMultiCurrency && !exchangeRate) {
      refreshExchangeRate();
    }
  }, [hasMultiCurrency, refreshExchangeRate]);

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
              name={isUsd ? "card" : "wallet"}
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
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.totalCard}
      >
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
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
        {/* Stale / failed rate warning */}
        {hasMultiCurrency && exchangeRateError && !exchangeRateLoading && (
          <Pressable onPress={refreshExchangeRate} style={styles.rateWarningBtn}>
            <Ionicons name="warning-outline" size={14} color="#F59E0B" />
            <Text style={styles.rateWarningText}>
              {exchangeRate ? t("accounts.rateStale") : t("accounts.rateUnavailable")}
            </Text>
          </Pressable>
        )}
      </LinearGradient>

      {accounts.length > 0 ? (
        <FlatList
          data={accounts}
          renderItem={renderAccountItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>{t("database.title")}</Text>
              <DatabaseBackup />
              <Text style={styles.sectionTitle}>{t("nav.accounts")}</Text>
              <SecurityToggle />
              <LanguageSelector />
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t("accounts.noAccounts")}</Text>
          <Text style={styles.emptySubText}>{t("accounts.noAccountsHint")}</Text>
          <View style={styles.settingsSectionEmpty}>
            <Text style={styles.sectionTitle}>{t("database.title")}</Text>
            <DatabaseBackup />
            <Text style={styles.sectionTitle}>{t("nav.accounts")}</Text>
            <SecurityToggle />
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
      borderRadius: 24,
      alignItems: "center",
      elevation: 8,
      shadowColor: "#4F46E5",
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      overflow: "hidden",
    },
    heroDecor1: {
      position: "absolute",
      top: -30,
      right: -30,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "rgba(255,255,255,0.06)",
    },
    heroDecor2: {
      position: "absolute",
      bottom: -15,
      left: -15,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "rgba(255,255,255,0.04)",
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
    rateWarningBtn: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "rgba(245,158,11,0.2)",
      borderWidth: 1,
      borderColor: "rgba(245,158,11,0.4)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    rateWarningText: {
      fontSize: 12,
      color: "#FCD34D",
      fontWeight: "600",
    },
    list: {
      padding: 24,
      paddingTop: 16,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 18,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 1,
      shadowColor: "#000",
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
    },
    cardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      flex: 1,
    },
    cardRight: {
      alignItems: "flex-end",
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.primary100,
      justifyContent: "center",
      alignItems: "center",
    },
    iconContainerUsd: {
      backgroundColor: colors.error50,
    },
    accountName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.gray800,
      letterSpacing: -0.2,
    },
    currencyBadge: {
      marginTop: 4,
      backgroundColor: colors.primary50,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      alignSelf: "flex-start",
    },
    currencyBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primary400,
    },
    currencyBadgeTextUsd: {
      color: colors.error500,
    },
    balance: {
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    egpEquiv: {
      fontSize: 11,
      color: colors.gray500,
      marginTop: 2,
      fontWeight: "600",
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.97 }],
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
      paddingBottom: 80,
    },
    settingsSectionEmpty: {
      width: "100%",
      paddingHorizontal: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.gray500,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
      marginLeft: 4,
    },
  });
