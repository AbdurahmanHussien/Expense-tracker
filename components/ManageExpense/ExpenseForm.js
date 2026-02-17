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

function TransactionForm({ submitButtonLabel, onSubmit, onCancel, defaultValues }) {
  const { accounts } = useContext(AppContext);
  const { theme } = useTheme();
  const colors = theme.colors;

  const TYPES = [
    {
      value: "expense",
      label: "Expense",
      icon: "arrow-up",
      color: colors.error500,
    },
    {
      value: "income",
      label: "Income",
      icon: "arrow-down",
      color: colors.success500,
    },
    {
      value: "transfer",
      label: "Transfer",
      icon: "swap-horizontal",
      color: colors.transfer500,
    },
  ];

  const [inputs, setInputs] = useState({
    type: {
      value: defaultValues?.type || "expense",
      isValid: true,
    },
    amount: {
      value: defaultValues?.amount != null ? defaultValues.amount.toString() : "",
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

  const styles = getStyles(colors);

  return (
    <View style={styles.form}>
      <Text style={styles.title}>
        {defaultValues?.id ? "Edit" : "New"} Transaction
      </Text>

      <View style={styles.typeSelector}>
        {TYPES.map((type) => (
          <Pressable
            key={type.value}
            onPress={() => typeChangeHandler(type.value)}
            style={[
              styles.typeButton,
              inputs.type.value === type.value && {
                backgroundColor: type.color,
                borderColor: type.color,
              },
            ]}
          >
            <Ionicons
              name={type.icon}
              size={18}
              color={
                inputs.type.value === type.value
                  ? "white"
                  : colors.gray500
              }
            />
            <Text
              style={[
                styles.typeButtonText,
                inputs.type.value === type.value && styles.typeButtonTextActive,
              ]}
            >
              {type.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.inputsRow}>
        <Input
          label="Amount"
          textInputConfig={{
            keyboardType: "decimal-pad",
            onChangeText: inputChangeHandler.bind(this, "amount"),
            value: inputs.amount.value,
          }}
          style={styles.rowInput}
          isInvalid={!inputs.amount.isValid}
        />
        <DatePickerInput
          label="Date"
          value={inputs.date.value}
          onDateChange={inputChangeHandler.bind(this, "date")}
          style={styles.rowInput}
          isInvalid={!inputs.date.isValid}
        />
      </View>

      <Input
        label="Description"
        textInputConfig={{
          multiline: true,
          onChangeText: inputChangeHandler.bind(this, "description"),
          value: inputs.description.value,
        }}
        multiline={true}
        isInvalid={!inputs.description.isValid}
      />

      {isTransfer ? (
        <View style={styles.inputsRow}>
          <Picker
            label="From Account"
            selectedValue={inputs.account_id.value}
            onValueChange={(val) => inputChangeHandler("account_id", val)}
            items={accountItems}
            style={styles.rowInput}
            isInvalid={!inputs.account_id.isValid}
          />
          <Picker
            label="To Account"
            selectedValue={inputs.transfer_to_account_id.value}
            onValueChange={(val) =>
              inputChangeHandler("transfer_to_account_id", val)
            }
            items={accountItems}
            style={styles.rowInput}
            isInvalid={!inputs.transfer_to_account_id.isValid}
          />
        </View>
      ) : (
        <Picker
          label="Account"
          selectedValue={inputs.account_id.value}
          onValueChange={(val) => inputChangeHandler("account_id", val)}
          items={accountItems}
          isInvalid={!inputs.account_id.isValid}
        />
      )}

      {!inputs.amount.isValid && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please enter a valid amount</Text>
        </View>
      )}
      {!inputs.date.isValid && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please enter a valid date</Text>
        </View>
      )}
      {!inputs.description.isValid && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please enter a description</Text>
        </View>
      )}
      {!inputs.account_id.isValid && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please select an account</Text>
        </View>
      )}
      {!inputs.transfer_to_account_id.isValid && isTransfer && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Please select a different target account
          </Text>
        </View>
      )}

      <View style={styles.buttons}>
        <Button mode="flat" style={styles.button} onPress={onCancel}>
          Cancel
        </Button>
        <Button style={styles.button} onPress={submitHandler}>
          {submitButtonLabel}
        </Button>
      </View>
    </View>
  );
}

export default TransactionForm;

const getStyles = (colors) =>
  StyleSheet.create({
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.gray800,
      marginBottom: 24,
      marginTop: 8,
      textAlign: "center",
    },
    form: {
      marginTop: 16,
    },
    typeSelector: {
      flexDirection: "row",
      marginBottom: 16,
      gap: 8,
    },
    typeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.06)",
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.gray500,
    },
    typeButtonTextActive: {
      color: "white",
    },
    inputsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    rowInput: {
      flex: 1,
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
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.error500,
    },
  });
