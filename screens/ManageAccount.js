import { useLayoutEffect, useContext, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import Input from "../components/ManageExpense/Input";
import Button from "../components/UI/Button";
import IconButton from "../components/UI/IconButton";
import { useTheme } from "../store/theme-context";
import { AppContext } from "../store/app-context";
import { Ionicons } from "@expo/vector-icons";
import {
  insertAccount,
  updateAccount as updateAccountDB,
  deleteAccount as deleteAccountDB,
  countTransactionsForAccount,
} from "../utils/database";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import ErrorOverlay from "../components/UI/ErrorOverlay";

const CURRENCIES = ["EGP", "USD"];

function ManageAccount({ route, navigation }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState();
  const { theme } = useTheme();
  const colors = theme.colors;
  const { t } = useTranslation();

  const editedAccountId = route.params?.accountId;
  const isEditing = !!editedAccountId;
  const appCtx = useContext(AppContext);
  const styles = getStyles(colors);

  const selectedAccount = appCtx.accounts.find(
    (acc) => acc.id === editedAccountId
  );

  const [inputs, setInputs] = useState({
    name: {
      value: selectedAccount ? selectedAccount.name : "",
      isValid: true,
    },
    initial_balance: {
      value: selectedAccount
        ? selectedAccount.initial_balance.toString()
        : "0",
      isValid: true,
    },
  });

  const [currency, setCurrency] = useState(
    selectedAccount?.currency || "EGP"
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? t("nav.editAccount") : t("nav.addAccount"),
    });
  }, [navigation, isEditing, t]);

  function inputChangeHandler(field, value) {
    setInputs((cur) => ({
      ...cur,
      [field]: { value, isValid: true },
    }));
  }

  function errorHandler() {
    setError(null);
  }

  async function submitHandler() {
    const name = inputs.name.value.trim();
    const balance = +inputs.initial_balance.value;

    const nameIsValid = name.length > 0;
    const balanceIsValid = !isNaN(balance);

    if (!nameIsValid || !balanceIsValid) {
      setInputs((cur) => ({
        name: { ...cur.name, isValid: nameIsValid },
        initial_balance: { ...cur.initial_balance, isValid: balanceIsValid },
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateAccountDB(editedAccountId, name, balance, currency);
        appCtx.updateAccount(editedAccountId, {
          name,
          initial_balance: balance,
          currency,
        });
      } else {
        const id = await insertAccount(name, balance, currency);
        appCtx.addAccount({ id, name, initial_balance: balance, currency });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (err) {
      setError(err.message || t("accounts.failedSave"));
      setIsSubmitting(false);
    }
  }

  async function deleteHandler() {
    const count = await countTransactionsForAccount(editedAccountId);
    if (count > 0) {
      Alert.alert(
        t("accounts.cannotDelete"),
        t("accounts.cannotDeleteMsg", { count }),
        [{ text: t("common.ok") }]
      );
      return;
    }

    Alert.alert(
      t("accounts.deleteAccount"),
      t("accounts.deleteAccountConfirm", { name: selectedAccount.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await deleteAccountDB(editedAccountId);
              appCtx.deleteAccount(editedAccountId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              navigation.goBack();
            } catch (err) {
              setError(err.message || t("accounts.failedDelete"));
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  }

  if (isSubmitting) return <LoadingOverlay />;
  if (error && !isSubmitting)
    return <ErrorOverlay message={error} onConfirm={errorHandler} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>
        {isEditing ? t("accounts.editAccount") : t("accounts.newAccount")}
      </Text>
      <Input
        label={t("accounts.accountName")}
        textInputConfig={{
          onChangeText: inputChangeHandler.bind(this, "name"),
          value: inputs.name.value,
          placeholder: t("accounts.accountNamePlaceholder"),
        }}
        isInvalid={!inputs.name.isValid}
      />
      <Input
        label={t("accounts.initialBalance")}
        textInputConfig={{
          keyboardType: "decimal-pad",
          onChangeText: inputChangeHandler.bind(this, "initial_balance"),
          value: inputs.initial_balance.value,
        }}
        isInvalid={!inputs.initial_balance.isValid}
      />

      <View style={styles.currencySection}>
        <Text style={styles.currencyLabel}>{t("accounts.currency")}</Text>
        <View style={styles.currencyRow}>
          {CURRENCIES.map((curr) => {
            const isActive = currency === curr;
            return (
              <Pressable
                key={curr}
                onPress={() => setCurrency(curr)}
                style={[
                  styles.currencyButton,
                  isActive && styles.currencyButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.currencyButtonText,
                    isActive && styles.currencyButtonTextActive,
                  ]}
                >
                  {curr === "USD" ? "🇺🇸 USD" : "🇪🇬 EGP"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {!inputs.name.isValid && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t("accounts.errorName")}</Text>
        </View>
      )}
      {!inputs.initial_balance.isValid && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t("accounts.errorBalance")}</Text>
        </View>
      )}

      <View style={styles.buttons}>
        <Button
          mode="flat"
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          {t("common.cancel")}
        </Button>
        <Button style={styles.button} onPress={submitHandler}>
          {isEditing ? t("common.update") : t("common.add")}
        </Button>
      </View>

      {isEditing && (
        <View style={styles.deleteContainer}>
          <View style={styles.dangerLabel}>
            <Ionicons name="warning" size={14} color={colors.error500} />
            <Text style={styles.dangerLabelText}>{t("accounts.dangerZone")}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
            onPress={deleteHandler}
          >
            <View style={styles.deleteIconWrap}>
              <Ionicons name="trash-outline" size={16} color="#FFF" />
            </View>
            <Text style={styles.deleteButtonText}>{t("accounts.deleteAccount")}</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

export default ManageAccount;

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary700,
    },
    contentContainer: {
      padding: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.gray800,
      marginBottom: 24,
      marginTop: 8,
      textAlign: "center",
    },
    currencySection: {
      marginVertical: 8,
    },
    currencyLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.gray500,
      marginBottom: 8,
      marginLeft: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    currencyRow: {
      flexDirection: "row",
      gap: 12,
    },
    currencyButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    currencyButtonActive: {
      backgroundColor: colors.primary500,
      borderColor: colors.primary500,
      elevation: 2,
      shadowColor: colors.primary500,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
    },
    currencyButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.gray500,
    },
    currencyButtonTextActive: {
      color: "#FFF",
      fontWeight: "800",
    },
    buttons: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 24,
      gap: 12,
    },
    button: {
      minWidth: 120,
      marginHorizontal: 8,
    },
    deleteContainer: {
      marginTop: 32,
      backgroundColor: colors.error50,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.error500 + "30",
    },
    dangerLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 14,
    },
    dangerLabelText: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.error500,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.error500,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    deleteButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    deleteIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    deleteButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#FFF",
      letterSpacing: 0.2,
    },
    errorText: {
      color: colors.error500,
      textAlign: "center",
      margin: 8,
      fontSize: 13,
      fontWeight: "500",
    },
    errorContainer: {
      marginVertical: 4,
      padding: 12,
      backgroundColor: colors.error50,
      borderRadius: 14,
      borderLeftWidth: 4,
      borderLeftColor: colors.error500,
    },
  });
