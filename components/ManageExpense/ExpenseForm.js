import { View, Text, StyleSheet, Pressable } from "react-native";
import { useContext, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import Input from "./Input";
import DatePickerInput from "./DatePicker";
import Picker from "../UI/Picker";
import Button from "../UI/Button";
import { useTheme } from "../../store/theme-context";
import { getFormattedDate } from "../../utils/date";
import { AppContext } from "../../store/app-context";

function TransactionForm({
  submitButtonLabel,
  onSubmit,
  onCancel,
  defaultValues,
}) {
  const { accounts } = useContext(AppContext);
  const { theme } = useTheme();
  const colors = theme.colors;

  const TYPES = [
    {
      value: "expense",
      label: "Expense",
      icon: "arrow-up-circle",
      color: colors.error500,
    },
    {
      value: "income",
      label: "Income",
      icon: "arrow-down-circle",
      color: colors.success500,
    },
    {
      value: "transfer",
      label: "Transfer",
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
  });

  const isTransfer = inputs.type.value === "transfer";

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
    };

    const amountIsValid = !isNaN(txData.amount) && txData.amount > 0;
    const dateIsValid = txData.date instanceof Date && !isNaN(txData.date);
    const descriptionIsValid = txData.description.trim().length > 0;
    const accountIsValid = txData.account_id !== null;
    const transferAccountIsValid =
      !isTransfer ||
      (txData.transfer_to_account_id !== null &&
        txData.transfer_to_account_id !== txData.account_id);

    if (
      !amountIsValid ||
      !dateIsValid ||
      !descriptionIsValid ||
      !accountIsValid ||
      !transferAccountIsValid
    ) {
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
    label: acc.name,
  }));

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
        <Text style={styles.amountLabel}>Amount</Text>
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
            errorMessage="Enter a valid amount"
          />
          <Text style={[styles.currencySymbol, { color: selectedType?.color }]}>
            EGP
          </Text>
        </View>
      </View>

      {/* ── Details Section ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Details</Text>

        <Input
          label="Description"
          textInputConfig={{
            multiline: true,
            onChangeText: inputChangeHandler.bind(this, "description"),
            value: inputs.description.value,
            placeholder: "What was this for?",
          }}
          multiline={true}
          isInvalid={!inputs.description.isValid}
          errorMessage="Please enter a description"
        />

        <DatePickerInput
          label="Date"
          value={inputs.date.value}
          onDateChange={inputChangeHandler.bind(this, "date")}
          isInvalid={!inputs.date.isValid}
          errorMessage="Please pick a valid date"
        />
      </View>

      {/* ── Account Section ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {isTransfer ? "Accounts" : "Account"}
        </Text>

        {isTransfer ? (
          <>
            <Picker
              label="From"
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
              label="To"
              selectedValue={inputs.transfer_to_account_id.value}
              onValueChange={(val) =>
                inputChangeHandler("transfer_to_account_id", val)
              }
              items={accountItems}
              isInvalid={!inputs.transfer_to_account_id.isValid}
            />
            {!inputs.transfer_to_account_id.isValid && (
              <Text style={styles.inlineError}>
                Select a different target account
              </Text>
            )}
          </>
        ) : (
          <Picker
            label="Account"
            selectedValue={inputs.account_id.value}
            onValueChange={(val) => inputChangeHandler("account_id", val)}
            items={accountItems}
            isInvalid={!inputs.account_id.isValid}
          />
        )}
        {!inputs.account_id.isValid && (
          <Text style={styles.inlineError}>Please select an account</Text>
        )}
      </View>

      {/* ── Action Buttons ── */}
      <View style={styles.buttons}>
        <Button style={styles.submitButton} onPress={submitHandler}>
          {submitButtonLabel}
        </Button>
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default TransactionForm;

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
