import { useLayoutEffect, useContext, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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
      expense: isEditing ? t("nav.editExpense") : t("nav.addExpense"),
      income: isEditing ? t("nav.editIncome") : t("nav.addIncome"),
      transfer: isEditing ? t("nav.editTransfer") : t("nav.addTransfer"),
    };
    navigation.setOptions({
      title: titles[type] || (isEditing ? t("nav.editTransaction") : t("nav.addTransaction")),
    });
  }, [navigation, isEditing, selectedTx, initialType, t]);

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
      setError(err.message || t("form.failedDelete"));
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
      setError(err.message || t("form.failedSave"));
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
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      <TransactionForm
        onCancel={cancelHandler}
        onSubmit={confirmHandler}
        submitButtonLabel={isEditing ? t("common.update") : t("common.add")}
        defaultValues={defaultValues}
      />

      {isEditing && (
        <View style={styles.deleteContainer}>
          <View style={styles.deleteDivider} />
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
            onPress={deleteHandler}
          >
            <View style={styles.deleteIconWrap}>
              <Ionicons name="trash-outline" size={18} color={colors.error500} />
            </View>
            <Text style={styles.deleteButtonText}>{t("form.deleteTransaction")}</Text>
          </Pressable>
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
      backgroundColor: colors.primary700,
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 40,
    },
    deleteContainer: {
      marginTop: 28,
    },
    deleteDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 20,
    },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.error50,
      borderWidth: 1.5,
      borderColor: colors.error500,
      borderRadius: 16,
      paddingVertical: 15,
      paddingHorizontal: 20,
    },
    deleteButtonPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.98 }],
    },
    deleteIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: "rgba(220,38,38,0.12)",
      justifyContent: "center",
      alignItems: "center",
    },
    deleteButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.error500,
      letterSpacing: 0.2,
    },
  });
