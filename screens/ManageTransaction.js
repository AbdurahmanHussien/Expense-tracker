import { useLayoutEffect, useContext, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import IconButton from "../components/UI/IconButton";
import { useTheme } from "../store/theme-context";
import { AppContext } from "../store/app-context";
import TransactionForm from "../components/ManageExpense/ExpenseForm";
import {
  insertTransaction,
  updateTransaction as updateTransactionDB,
  deleteTransaction as deleteTransactionDB,
} from "../utils/database";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import ErrorOverlay from "../components/UI/ErrorOverlay";

function ManageTransaction({ route, navigation }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState();
  const { theme } = useTheme();
  const colors = theme.colors;

  const editedTxId = route.params?.transactionId;
  const initialType = route.params?.initialType;
  const isEditing = !!editedTxId;
  const appCtx = useContext(AppContext);
  const styles = getStyles(colors);

  const selectedTx = appCtx.transactions.find((tx) => tx.id === editedTxId);

  const defaultValues = selectedTx
    ? selectedTx
    : initialType
      ? { type: initialType }
      : undefined;

  useLayoutEffect(() => {
    const type = selectedTx?.type || initialType || "expense";
    const titles = {
      expense: isEditing ? "Edit Expense" : "Add Expense",
      income: isEditing ? "Edit Income" : "Add Income",
      transfer: isEditing ? "Edit Transfer" : "New Transfer",
    };
    navigation.setOptions({
      title:
        titles[type] || (isEditing ? "Edit Transaction" : "Add Transaction"),
    });
  }, [navigation, isEditing, selectedTx, initialType]);

  function errorHandler() {
    setError(null);
  }

  async function deleteHandler() {
    setIsSubmitting(true);
    try {
      await deleteTransactionDB(editedTxId);
      appCtx.deleteTransaction(editedTxId);
      navigation.goBack();
    } catch (err) {
      setError(err.message || "Failed to delete transaction");
      setIsSubmitting(false);
    }
  }

  function cancelHandler() {
    navigation.goBack();
  }

  async function confirmHandler(txData) {
    setIsSubmitting(true);
    try {
      const dbData = {
        ...txData,
        date: txData.date.toISOString().slice(0, 10),
      };
      if (isEditing) {
        await updateTransactionDB(editedTxId, dbData);
        appCtx.updateTransaction(editedTxId, txData);
      } else {
        const id = await insertTransaction(dbData);
        appCtx.addTransaction({ ...txData, id });
      }
      navigation.goBack();
    } catch (err) {
      setError(err.message || "Failed to save transaction");
      setIsSubmitting(false);
    }
  }

  if (isSubmitting) {
    return <LoadingOverlay />;
  }
  if (error && !isSubmitting) {
    return <ErrorOverlay message={error} onConfirm={errorHandler} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <TransactionForm
        onCancel={cancelHandler}
        onSubmit={confirmHandler}
        submitButtonLabel={isEditing ? "Update" : "Add"}
        defaultValues={defaultValues}
      />
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

export default ManageTransaction;

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 0,
      backgroundColor: colors.primary700,
    },
    contentContainer: {
      padding: 24,
    },
    deleteContainer: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: "center",
    },
  });
