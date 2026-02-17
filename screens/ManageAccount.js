import { useLayoutEffect, useContext, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import Input from "../components/ManageExpense/Input";
import Button from "../components/UI/Button";
import IconButton from "../components/UI/IconButton";
import { useTheme } from "../store/theme-context";
import { AppContext } from "../store/app-context";
import {
  insertAccount,
  updateAccount as updateAccountDB,
  deleteAccount as deleteAccountDB,
  countTransactionsForAccount,
} from "../utils/database";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import ErrorOverlay from "../components/UI/ErrorOverlay";

function ManageAccount({ route, navigation }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState();
  const { theme } = useTheme();
  const colors = theme.colors;

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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? "Edit Account" : "Add Account",
    });
  }, [navigation, isEditing]);

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
        await updateAccountDB(editedAccountId, name, balance);
        appCtx.updateAccount(editedAccountId, {
          name,
          initial_balance: balance,
        });
      } else {
        const id = await insertAccount(name, balance);
        appCtx.addAccount({ id, name, initial_balance: balance });
      }
      navigation.goBack();
    } catch (err) {
      setError(err.message || "Failed to save account");
      setIsSubmitting(false);
    }
  }

  async function deleteHandler() {
    const count = await countTransactionsForAccount(editedAccountId);
    if (count > 0) {
      Alert.alert(
        "Cannot Delete",
        `This account has ${count} transaction(s). Delete or reassign them first.`,
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert("Delete Account", `Delete "${selectedAccount.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsSubmitting(true);
          try {
            await deleteAccountDB(editedAccountId);
            appCtx.deleteAccount(editedAccountId);
            navigation.goBack();
          } catch (err) {
            setError(err.message || "Failed to delete account");
            setIsSubmitting(false);
          }
        },
      },
    ]);
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
        {isEditing ? "Edit Account" : "New Account"}
      </Text>
      <Input
        label="Account Name"
        textInputConfig={{
          onChangeText: inputChangeHandler.bind(this, "name"),
          value: inputs.name.value,
          placeholder: "e.g. Cash, Bank, Savings",
        }}
        isInvalid={!inputs.name.isValid}
      />
      <Input
        label="Initial Balance"
        textInputConfig={{
          keyboardType: "decimal-pad",
          onChangeText: inputChangeHandler.bind(this, "initial_balance"),
          value: inputs.initial_balance.value,
        }}
        isInvalid={!inputs.initial_balance.isValid}
      />

      {!inputs.name.isValid && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please enter an account name</Text>
        </View>
      )}
      {!inputs.initial_balance.isValid && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please enter a valid balance</Text>
        </View>
      )}

      <View style={styles.buttons}>
        <Button
          mode="flat"
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          Cancel
        </Button>
        <Button style={styles.button} onPress={submitHandler}>
          {isEditing ? "Update" : "Add"}
        </Button>
      </View>

      {isEditing && (
        <View style={styles.deleteContainer}>
          <IconButton
            icon="trash"
            size={36}
            color={colors.error500}
            onPress={deleteHandler}
          />
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
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: "center",
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
