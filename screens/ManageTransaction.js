import { useLayoutEffect, useContext, useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import IconButton from "../components/UI/IconButton";
import { useTheme } from "../store/theme-context";
import { AppContext } from "../store/app-context";
import TransactionForm from "../components/ManageExpense/ExpenseForm";
import {
  insertTransaction,
  updateTransaction as updateTransactionDB,
  deleteTransaction as deleteTransactionDB,
} from "../utils/database";
import { scheduleBudgetWarningNotification } from "../utils/notifications";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import ErrorOverlay from "../components/UI/ErrorOverlay";

function ManageTransaction({ route, navigation }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState();
  const [keyboardSpace, setKeyboardSpace] = useState(0);
  const { theme, isDark } = useTheme();
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

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardSpace(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardSpace(0)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function errorHandler() {
    setError(null);
  }

  async function deleteHandler() {
    setIsSubmitting(true);
    try {
      await deleteTransactionDB(editedTxId);
      appCtx.deleteTransaction(editedTxId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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

      let newId = editedTxId;
      if (isEditing) {
        await updateTransactionDB(editedTxId, dbData);
        appCtx.updateTransaction(editedTxId, txData);
      } else {
        newId = await insertTransaction(dbData);
        appCtx.addTransaction({ ...txData, id: newId });
      }

      // Check budget thresholds if it is an expense in categorized transaction
      if (txData.type === "expense" && txData.category_id) {
        const budget = appCtx.budgets.find(b => b.category_id === txData.category_id);
        if (budget && budget.monthly_limit > 0) {
          const category = appCtx.categories.find(c => c.id === txData.category_id);
          const catName = category ? category.name : "Category";

          const limit = budget.monthly_limit;
          const currentMonth = txData.date.getMonth();
          const currentYear = txData.date.getFullYear();

          // Calculate total expense for this category in the current month (INCLUDING the newly saved one)
          // Use appCtx.transactions which has just been updated (or we added to it), but wait, the context update might be async or delayed in state.
          // Let's compute directly from the existing state + the diff.

          let previousTotal = 0;
          appCtx.transactions.forEach(tx => {
            if (tx.type === "expense" && tx.category_id === txData.category_id) {
              const d = new Date(tx.date);
              if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                // If editing, don't double count the old amount
                if (isEditing && tx.id === editedTxId) return;
                previousTotal += tx.amount;
              }
            }
          });

          const newTotal = previousTotal + txData.amount;

          const wasOver80 = previousTotal >= limit * 0.8;
          const isOver80 = newTotal >= limit * 0.8;
          const wasOver100 = previousTotal >= limit;
          const isOver100 = newTotal >= limit;

          if (isOver100 && !wasOver100) {
            scheduleBudgetWarningNotification(
              t("notifications.budgetWarning100Title"),
              t("notifications.budgetWarning100Body", { category: catName, amount: (newTotal - limit).toFixed(0) + " " + t("accounts.currency") })
            );
          } else if (isOver80 && !wasOver80 && !isOver100) {
            scheduleBudgetWarningNotification(
              t("notifications.budgetWarning80Title"),
              t("notifications.budgetWarning80Body", { category: catName, percent: ((newTotal / limit) * 100).toFixed(0) })
            );
          }
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const gradientColors = isDark
    ? [colors.primary700, colors.gray100]
    : [colors.primary500 + "18", colors.gray100];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.25 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: keyboardSpace > 0 ? keyboardSpace + 20 : 80 },
            isEditing && { paddingTop: 60 } // add top padding when editing so form fields aren't hidden behind the floating button
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <TransactionForm
            onCancel={cancelHandler}
            onSubmit={confirmHandler}
            submitButtonLabel={isEditing ? t("common.update") : t("common.add")}
            defaultValues={defaultValues}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {isEditing && (
        <View style={styles.floatingDeleteContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.floatingDeleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
            onPress={deleteHandler}
          >
            <Ionicons name="trash" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default ManageTransaction;

const getStyles = (colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.gray100,
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 80,
    },
    floatingDeleteContainer: {
      position: "absolute",
      top: 5,
      right: 20,
      zIndex: 10,
    },
    floatingDeleteButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.error500,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    deleteButtonPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.95 }],
    },
  });
