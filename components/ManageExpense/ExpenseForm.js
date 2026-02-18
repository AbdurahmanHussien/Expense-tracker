import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useContext, useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Input from "./Input";
import DatePickerInput from "./DatePicker";
import Picker from "../UI/Picker";
import Button from "../UI/Button";
import { useTheme } from "../../store/theme-context";
import { getFormattedDate } from "../../utils/date";
import { AppContext } from "../../store/app-context";
import { fetchUsdToEgpRate, convertCurrency } from "../../utils/currency";

function TransactionForm({
  submitButtonLabel,
  onSubmit,
  onCancel,
  defaultValues,
}) {
  const { accounts, categories } = useContext(AppContext);
  const { theme } = useTheme();
  const colors = theme.colors;
  const { t } = useTranslation();

  const TYPES = [
    {
      value: "expense",
      label: t("form.expense"),
      icon: "arrow-up-circle",
      color: colors.error500,
    },
    {
      value: "income",
      label: t("form.income"),
      icon: "arrow-down-circle",
      color: colors.success500,
    },
    {
      value: "transfer",
      label: t("form.transfer"),
      icon: "swap-horizontal-outline",
      color: colors.transfer500,
    },
  ];

  const [inputs, setInputs] = useState({
    type: {
      value: defaultValues?.type || "expense",
      isValid: true,
    },
    amount: {
      value:
        defaultValues?.amount != null ? defaultValues.amount.toString() : "",
      isValid: true,
    },
    date: {
      value: defaultValues?.date ? getFormattedDate(defaultValues.date) : "",
      isValid: true,
    },
    description: {
      value: defaultValues ? defaultValues.description || "" : "",
      isValid: true,
    },
    account_id: {
      value:
        defaultValues?.account_id ||
        (accounts.length > 0 ? accounts[0].id : null),
      isValid: true,
    },
    transfer_to_account_id: {
      value: defaultValues?.transfer_to_account_id || null,
      isValid: true,
    },
    category_id: {
      value: defaultValues?.category_id || null,
      isValid: true,
    },
  });

  // Exchange rate state for cross-currency transfers
  const [exchangeRate, setExchangeRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState(null);

  const isTransfer = inputs.type.value === "transfer";

  const fromAccount = accounts.find((a) => a.id === inputs.account_id.value);
  const toAccount = accounts.find(
    (a) => a.id === inputs.transfer_to_account_id.value
  );
  const fromCurrency = fromAccount?.currency || "EGP";
  const toCurrency = toAccount?.currency || "EGP";
  const isCrossCurrency =
    isTransfer &&
    toAccount != null &&
    fromAccount != null &&
    fromCurrency !== toCurrency;

  const loadRate = useCallback(async () => {
    setRateLoading(true);
    setRateError(null);
    try {
      const rate = await fetchUsdToEgpRate();
      setExchangeRate(rate);
    } catch {
      setRateError(t("form.rateFetchError"));
    } finally {
      setRateLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isCrossCurrency) {
      loadRate();
    }
  }, [isCrossCurrency, loadRate]);

  const receivedAmount =
    isCrossCurrency && exchangeRate && inputs.amount.value
      ? convertCurrency(+inputs.amount.value, fromCurrency, toCurrency, exchangeRate)
      : null;

  function inputChangeHandler(inputIdentifier, value) {
    setInputs((cur) => ({
      ...cur,
      [inputIdentifier]: { value, isValid: true },
    }));
  }

  function typeChangeHandler(type) {
    setInputs((cur) => ({
      ...cur,
      type: { value: type, isValid: true },
      ...(type === "transfer"
        ? { category_id: { value: null, isValid: true } }
        : {}),
    }));
  }

  function submitHandler() {
    const txData = {
      type: inputs.type.value,
      amount: +inputs.amount.value,
      date: new Date(inputs.date.value),
      description: inputs.description.value,
      account_id: inputs.account_id.value,
      transfer_to_account_id: isTransfer
        ? inputs.transfer_to_account_id.value
        : null,
      category_id: !isTransfer ? inputs.category_id.value : null,
      received_amount: isCrossCurrency && receivedAmount != null
        ? receivedAmount
        : null,
    };

    const amountIsValid = !isNaN(txData.amount) && txData.amount > 0;
    const dateIsValid = txData.date instanceof Date && !isNaN(txData.date);
    const descriptionIsValid = txData.description.trim().length > 0;
    const accountIsValid = txData.account_id !== null;
    const transferAccountIsValid =
      !isTransfer ||
      (txData.transfer_to_account_id !== null &&
        txData.transfer_to_account_id !== txData.account_id);

    if (!amountIsValid || !dateIsValid || !descriptionIsValid || !accountIsValid || !transferAccountIsValid) {
      setInputs((cur) => ({
        ...cur,
        amount: { ...cur.amount, isValid: amountIsValid },
        date: { ...cur.date, isValid: dateIsValid },
        description: { ...cur.description, isValid: descriptionIsValid },
        account_id: { ...cur.account_id, isValid: accountIsValid },
        transfer_to_account_id: {
          ...cur.transfer_to_account_id,
          isValid: transferAccountIsValid,
        },
      }));
      return;
    }

    onSubmit(txData);
  }

  const accountItems = accounts.map((acc) => ({
    value: acc.id,
    label: `${acc.name} (${acc.currency || "EGP"})`,
    walletIcon: true,
  }));

  const categoryItems = [
    { value: null, label: t("form.none") },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
      icon: cat.icon,
      color: cat.color,
    })),
  ];

  const selectedType = TYPES.find((t) => t.value === inputs.type.value);
  const styles = getStyles(colors);

  return (
    <View style={styles.form}>
      {/* ── Type Selector ── */}
      <View style={styles.typeSelector}>
        {TYPES.map((type) => {
          const isActive = inputs.type.value === type.value;
          return (
            <Pressable
              key={type.value}
              onPress={() => typeChangeHandler(type.value)}
              style={[
                styles.typeButton,
                isActive && {
                  backgroundColor: type.color,
                  borderColor: type.color,
                },
              ]}
            >
              <Ionicons
                name={type.icon}
                size={20}
                color={isActive ? "white" : colors.gray500}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  isActive && styles.typeButtonTextActive,
                ]}
              >
                {type.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Amount Card ── */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>
          {isCrossCurrency ? t("form.amountCurrency", { currency: fromCurrency }) : t("form.amount")}
        </Text>
        <View style={styles.amountRow}>
          <Input
            textInputConfig={{
              keyboardType: "decimal-pad",
              onChangeText: inputChangeHandler.bind(this, "amount"),
              value: inputs.amount.value,
              placeholder: "0.00",
              placeholderTextColor: colors.gray500,
            }}
            style={styles.amountInput}
            inputStyle={styles.amountInputField}
            isInvalid={!inputs.amount.isValid}
            errorMessage={t("form.errorAmount")}
          />
          <Text style={[styles.currencySymbol, { color: selectedType?.color }]}>
            {isCrossCurrency ? fromCurrency : (fromAccount?.currency || "EGP")}
          </Text>
        </View>
      </View>

      {/* ── Currency Conversion Panel ── */}
      {isCrossCurrency && (
        <View style={styles.conversionCard}>
          <View style={styles.conversionHeader}>
            <Ionicons name="swap-horizontal" size={18} color={colors.transfer500} />
            <Text style={styles.conversionTitle}>{t("form.currencyConversion")}</Text>
            <Pressable onPress={loadRate} style={styles.refreshButton} disabled={rateLoading}>
              {rateLoading ? (
                <ActivityIndicator size={14} color={colors.primary400} />
              ) : (
                <Ionicons name="refresh" size={16} color={colors.primary400} />
              )}
            </Pressable>
          </View>

          {rateError && (
            <Text style={styles.rateError}>{rateError}</Text>
          )}

          {exchangeRate && !rateLoading && (
            <>
              <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>{t("form.exchangeRate")}</Text>
                <Text style={styles.rateValue}>
                  1 USD = {exchangeRate.toFixed(2)} EGP
                </Text>
              </View>

              {receivedAmount != null && inputs.amount.value !== "" && (
                <View style={styles.conversionResult}>
                  <View style={styles.conversionFrom}>
                    <Text style={styles.conversionCurrency}>{fromCurrency}</Text>
                    <Text style={styles.conversionAmount}>
                      {(+inputs.amount.value).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.conversionArrow}>
                    <Ionicons name="arrow-forward" size={20} color={colors.transfer500} />
                  </View>
                  <View style={styles.conversionTo}>
                    <Text style={styles.conversionCurrency}>{toCurrency}</Text>
                    <Text style={[styles.conversionAmount, { color: colors.transfer500 }]}>
                      {receivedAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          {rateLoading && !exchangeRate && (
            <View style={styles.rateLoadingRow}>
              <ActivityIndicator size="small" color={colors.primary400} />
              <Text style={styles.rateLoadingText}>{t("form.fetchingRate")}</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Details Section ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t("form.details")}</Text>

        <Input
          label={t("form.description")}
          textInputConfig={{
            multiline: true,
            scrollEnabled: false,
            onChangeText: inputChangeHandler.bind(this, "description"),
            value: inputs.description.value,
            placeholder: t("form.descriptionPlaceholder"),
          }}
          multiline={true}
          isInvalid={!inputs.description.isValid}
          errorMessage={t("form.errorDescription")}
        />

        <DatePickerInput
          label={t("form.date")}
          value={inputs.date.value}
          onDateChange={inputChangeHandler.bind(this, "date")}
          isInvalid={!inputs.date.isValid}
          errorMessage={t("form.errorDate")}
        />
      </View>

      {/* ── Account Section ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {isTransfer ? t("form.accounts") : t("form.account")}
        </Text>

        {isTransfer ? (
          <>
            <Picker
              label={t("form.from")}
              selectedValue={inputs.account_id.value}
              onValueChange={(val) => inputChangeHandler("account_id", val)}
              items={accountItems}
              isInvalid={!inputs.account_id.isValid}
            />
            <View style={styles.transferArrow}>
              <View style={styles.transferArrowLine} />
              <View style={styles.transferArrowIcon}>
                <Ionicons
                  name="arrow-down"
                  size={16}
                  color={colors.transfer500}
                />
              </View>
              <View style={styles.transferArrowLine} />
            </View>
            <Picker
              label={t("form.to")}
              selectedValue={inputs.transfer_to_account_id.value}
              onValueChange={(val) =>
                inputChangeHandler("transfer_to_account_id", val)
              }
              items={accountItems}
              isInvalid={!inputs.transfer_to_account_id.isValid}
            />
            {!inputs.transfer_to_account_id.isValid && (
              <Text style={styles.inlineError}>
                {t("form.errorTransferAccount")}
              </Text>
            )}
          </>
        ) : (
          <Picker
            selectedValue={inputs.account_id.value}
            onValueChange={(val) => inputChangeHandler("account_id", val)}
            items={accountItems}
            isInvalid={!inputs.account_id.isValid}
          />
        )}
        {!inputs.account_id.isValid && (
          <Text style={styles.inlineError}>{t("form.errorAccount")}</Text>
        )}
      </View>

      {/* ── Category Section (expense / income only) ── */}
      {!isTransfer && categories.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t("form.category")}</Text>
          <CategoryPicker
            categories={categories}
            selectedId={inputs.category_id.value}
            onSelect={(id) => inputChangeHandler("category_id", id)}
            colors={colors}
          />
        </View>
      )}

      {/* ── Action Buttons ── */}
      <View style={styles.buttons}>
        <Button style={styles.submitButton} onPress={submitHandler}>
          {submitButtonLabel}
        </Button>
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>{t("common.cancel")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CategoryPicker({ categories, selectedId, onSelect, colors }) {
  const styles = getCategoryPickerStyles(colors);
  const { t } = useTranslation();
  return (
    <View style={styles.grid}>
      {/* "None" option */}
      <Pressable
        onPress={() => onSelect(null)}
        style={[styles.chip, selectedId === null && styles.chipSelected]}
      >
        <Ionicons
          name="close-circle-outline"
          size={16}
          color={selectedId === null ? colors.primary400 : colors.gray500}
        />
        <Text
          style={[
            styles.chipText,
            selectedId === null && styles.chipTextSelected,
          ]}
        >
          {t("form.none")}
        </Text>
      </Pressable>

      {categories.map((cat) => {
        const isSelected = selectedId === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={[
              styles.chip,
              isSelected && {
                backgroundColor: cat.color + "33",
                borderColor: cat.color,
              },
            ]}
          >
            <Ionicons
              name={cat.icon}
              size={16}
              color={isSelected ? cat.color : colors.gray500}
            />
            <Text
              style={[
                styles.chipText,
                isSelected && { color: cat.color, fontWeight: "700" },
              ]}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default TransactionForm;

const getCategoryPickerStyles = (colors) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingTop: 4,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    chipSelected: {
      backgroundColor: colors.primary100,
      borderColor: colors.primary400,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.gray500,
    },
    chipTextSelected: {
      color: colors.primary400,
    },
  });

const getStyles = (colors) =>
  StyleSheet.create({
    form: {
      gap: 16,
    },

    /* ── Type Selector ── */
    typeSelector: {
      flexDirection: "row",
      gap: 8,
      padding: 4,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    typeButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.gray500,
    },
    typeButtonTextActive: {
      color: "white",
      fontWeight: "700",
    },

    /* ── Amount Card ── */
    amountCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    amountLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.gray500,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    currencySymbol: {
      fontSize: 32,
      fontWeight: "700",
      marginRight: 4,
    },
    amountInput: {
      marginVertical: 0,
      marginHorizontal: 0,
    },
    amountInputField: {
      fontSize: 36,
      fontWeight: "700",
      textAlign: "center",
      padding: 8,
      borderWidth: 0,
      backgroundColor: "transparent",
      color: colors.gray800,
      minWidth: 120,
    },

    /* ── Currency Conversion Card ── */
    conversionCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1.5,
      borderColor: colors.transfer500 + "55",
      gap: 10,
    },
    conversionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    conversionTitle: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      color: colors.transfer500,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    refreshButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary50,
      alignItems: "center",
      justifyContent: "center",
    },
    rateRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    rateLabel: {
      fontSize: 13,
      color: colors.gray500,
      fontWeight: "500",
    },
    rateValue: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.gray800,
    },
    rateError: {
      fontSize: 12,
      color: colors.error500,
      fontStyle: "italic",
    },
    rateLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 4,
    },
    rateLoadingText: {
      fontSize: 13,
      color: colors.gray500,
    },
    conversionResult: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary50,
      borderRadius: 14,
      padding: 12,
      gap: 8,
    },
    conversionFrom: {
      flex: 1,
      alignItems: "center",
    },
    conversionTo: {
      flex: 1,
      alignItems: "center",
    },
    conversionArrow: {
      alignItems: "center",
      justifyContent: "center",
    },
    conversionCurrency: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.gray500,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    conversionAmount: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.gray800,
    },

    /* ── Section Card ── */
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.gray500,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 4,
      marginLeft: 4,
    },

    /* ── Transfer Arrow ── */
    transferArrow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: -4,
    },
    transferArrowLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    transferArrowIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.primary50,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 8,
    },

    /* ── Inline errors ── */
    inlineError: {
      color: colors.error500,
      fontSize: 12,
      fontWeight: "500",
      marginTop: 2,
      marginLeft: 4,
    },

    /* ── Action Buttons ── */
    buttons: {
      marginTop: 8,
      gap: 12,
    },
    submitButton: {
      width: "100%",
    },
    cancelButton: {
      alignItems: "center",
      paddingVertical: 12,
    },
    cancelText: {
      color: colors.gray500,
      fontSize: 15,
      fontWeight: "600",
    },
  });
