import { createContext, useMemo, useReducer, useState } from "react";
import { fetchUsdToEgpRate, isExchangeRateStale } from "../utils/currency";

export const AppContext = createContext({
  transactions: [],
  accounts: [],
  categories: [],
  budgets: [],
  exchangeRate: null,
  exchangeRateLoading: false,
  exchangeRateError: false,
  addTransaction: (txData) => { },
  setTransactions: (transactions) => { },
  deleteTransaction: (id) => { },
  updateTransaction: (id, txData) => { },
  addAccount: (accountData) => { },
  setAccounts: (accounts) => { },
  deleteAccount: (id) => { },
  updateAccount: (id, accountData) => { },
  getAccountBalance: (accountId) => 0,
  addCategory: (categoryData) => { },
  setCategories: (categories) => { },
  deleteCategory: (id) => { },
  updateCategory: (id, categoryData) => { },
  setBudgets: (budgets) => { },
  upsertBudget: (categoryId, monthlyLimit) => { },
  deleteBudget: (categoryId) => { },
  goals: [],
  setGoals: (goals) => { },
  addGoal: (goalData) => { },
  updateGoalLocal: (id, goalData) => { },
  deleteGoalLocal: (id) => { },
  recurring: [],
  setRecurring: (items) => { },
  addRecurring: (item) => { },
  updateRecurringLocal: (id, data) => { },
  deleteRecurringLocal: (id) => { },
  bills: [],
  setBills: (items) => { },
  addBill: (item) => { },
  updateBillLocal: (id, data) => { },
  deleteBillLocal: (id) => { },
  refreshExchangeRate: async () => { },
});

function transactionsReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [action.payload, ...state];
    case "SET":
      return action.payload;
    case "DELETE":
      return state.filter((tx) => tx.id !== action.payload);
    case "UPDATE": {
      const index = state.findIndex((tx) => tx.id === action.payload.id);
      if (index === -1) return state;
      const updated = { ...state[index], ...action.payload.data };
      const newState = [...state];
      newState[index] = updated;
      return newState;
    }
    default:
      return state;
  }
}

function accountsReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [...state, action.payload];
    case "SET":
      return action.payload;
    case "DELETE":
      return state.filter((acc) => acc.id !== action.payload);
    case "UPDATE": {
      const index = state.findIndex((acc) => acc.id === action.payload.id);
      if (index === -1) return state;
      const updated = { ...state[index], ...action.payload.data };
      const newState = [...state];
      newState[index] = updated;
      return newState;
    }
    default:
      return state;
  }
}

function categoriesReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [...state, action.payload];
    case "SET":
      return action.payload;
    case "DELETE":
      return state.filter((cat) => cat.id !== action.payload);
    case "UPDATE": {
      const index = state.findIndex((cat) => cat.id === action.payload.id);
      if (index === -1) return state;
      const updated = { ...state[index], ...action.payload.data };
      const newState = [...state];
      newState[index] = updated;
      return newState;
    }
    default:
      return state;
  }
}

function budgetsReducer(state, action) {
  switch (action.type) {
    case "SET":
      return action.payload;
    case "UPSERT": {
      const index = state.findIndex((b) => b.category_id === action.payload.category_id);
      if (index === -1) return [...state, action.payload];
      const newState = [...state];
      newState[index] = { ...newState[index], ...action.payload };
      return newState;
    }
    case "DELETE":
      return state.filter((b) => b.category_id !== action.payload);
    default:
      return state;
  }
}

function goalsReducer(state, action) {
  switch (action.type) {
    case "SET": return action.payload;
    case "ADD": return [action.payload, ...state];
    case "UPDATE": {
      const index = state.findIndex((g) => g.id === action.payload.id);
      if (index === -1) return state;
      const newState = [...state];
      newState[index] = { ...newState[index], ...action.payload.data };
      return newState;
    }
    case "DELETE": return state.filter((g) => g.id !== action.payload);
    default: return state;
  }
}

function recurringReducer(state, action) {
  switch (action.type) {
    case "SET": return action.payload;
    case "ADD": return [action.payload, ...state];
    case "UPDATE": {
      const index = state.findIndex((r) => r.id === action.payload.id);
      if (index === -1) return state;
      const newState = [...state];
      newState[index] = { ...newState[index], ...action.payload.data };
      return newState;
    }
    case "DELETE": return state.filter((r) => r.id !== action.payload);
    default: return state;
  }
}

function billsReducer(state, action) {
  switch (action.type) {
    case "SET": return action.payload;
    case "ADD": return [...state, action.payload];
    case "UPDATE": {
      const index = state.findIndex((b) => b.id === action.payload.id);
      if (index === -1) return state;
      const newState = [...state];
      newState[index] = { ...newState[index], ...action.payload.data };
      return newState;
    }
    case "DELETE": return state.filter((b) => b.id !== action.payload);
    default: return state;
  }
}

export default function AppContextProvider({ children }) {
  const [transactionsState, txDispatch] = useReducer(transactionsReducer, []);
  const [accountsState, accDispatch] = useReducer(accountsReducer, []);
  const [categoriesState, catDispatch] = useReducer(categoriesReducer, []);
  const [budgetsState, budgetDispatch] = useReducer(budgetsReducer, []);
  const [goalsState, goalsDispatch] = useReducer(goalsReducer, []);
  const [recurringState, recurringDispatch] = useReducer(recurringReducer, []);
  const [billsState, billsDispatch] = useReducer(billsReducer, []);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
  const [exchangeRateError, setExchangeRateError] = useState(false);

  async function refreshExchangeRate() {
    setExchangeRateLoading(true);
    setExchangeRateError(false);
    try {
      const rate = await fetchUsdToEgpRate();
      setExchangeRate(rate);
      // If rate came from stale cache, surface that to UI
      if (isExchangeRateStale()) {
        setExchangeRateError(true);
      }
    } catch {
      // No cached rate at all — total failure
      setExchangeRateError(true);
    } finally {
      setExchangeRateLoading(false);
    }
  }

  function addTransaction(txData) {
    txDispatch({ type: "ADD", payload: txData });
  }

  function setTransactions(transactions) {
    txDispatch({ type: "SET", payload: transactions });
  }

  function deleteTransaction(id) {
    txDispatch({ type: "DELETE", payload: id });
  }

  function updateTransaction(id, txData) {
    txDispatch({ type: "UPDATE", payload: { id, data: txData } });
  }

  function addAccount(accountData) {
    accDispatch({ type: "ADD", payload: accountData });
  }

  function setAccounts(accounts) {
    accDispatch({ type: "SET", payload: accounts });
  }

  function deleteAccount(id) {
    accDispatch({ type: "DELETE", payload: id });
  }

  function updateAccount(id, accountData) {
    accDispatch({ type: "UPDATE", payload: { id, data: accountData } });
  }

  function addCategory(categoryData) {
    catDispatch({ type: "ADD", payload: categoryData });
  }

  function setCategories(categories) {
    catDispatch({ type: "SET", payload: categories });
  }

  function deleteCategory(id) {
    catDispatch({ type: "DELETE", payload: id });
  }

  function updateCategory(id, categoryData) {
    catDispatch({ type: "UPDATE", payload: { id, data: categoryData } });
  }

  function setBudgets(budgets) {
    budgetDispatch({ type: "SET", payload: budgets });
  }

  function upsertBudgetLocal(categoryId, monthlyLimit) {
    budgetDispatch({ type: "UPSERT", payload: { category_id: categoryId, monthly_limit: monthlyLimit } });
  }

  function deleteBudgetLocal(categoryId) {
    budgetDispatch({ type: "DELETE", payload: categoryId });
  }

  function setGoals(goals) {
    goalsDispatch({ type: "SET", payload: goals });
  }

  function addGoal(goalData) {
    goalsDispatch({ type: "ADD", payload: goalData });
  }

  function updateGoalLocal(id, goalData) {
    goalsDispatch({ type: "UPDATE", payload: { id, data: goalData } });
  }

  function deleteGoalLocal(id) {
    goalsDispatch({ type: "DELETE", payload: id });
  }

  function setRecurring(items) { recurringDispatch({ type: "SET", payload: items }); }
  function addRecurring(item) { recurringDispatch({ type: "ADD", payload: item }); }
  function updateRecurringLocal(id, data) { recurringDispatch({ type: "UPDATE", payload: { id, data } }); }
  function deleteRecurringLocal(id) { recurringDispatch({ type: "DELETE", payload: id }); }

  function setBills(items) { billsDispatch({ type: "SET", payload: items }); }
  function addBill(item) { billsDispatch({ type: "ADD", payload: item }); }
  function updateBillLocal(id, data) { billsDispatch({ type: "UPDATE", payload: { id, data } }); }
  function deleteBillLocal(id) { billsDispatch({ type: "DELETE", payload: id }); }

  // Recomputes only when accounts or transactions change — O(1) lookup for callers
  const accountBalanceMap = useMemo(() => {
    const map = {};
    accountsState.forEach((account) => {
      map[account.id] = account.initial_balance;
    });
    transactionsState.forEach((tx) => {
      if (tx.type === "income") {
        map[tx.account_id] = (map[tx.account_id] ?? 0) + tx.amount;
      } else if (tx.type === "expense") {
        map[tx.account_id] = (map[tx.account_id] ?? 0) - tx.amount;
      } else if (tx.type === "transfer") {
        map[tx.account_id] = (map[tx.account_id] ?? 0) - tx.amount;
        if (tx.transfer_to_account_id != null) {
          const received = tx.received_amount != null ? tx.received_amount : tx.amount;
          map[tx.transfer_to_account_id] = (map[tx.transfer_to_account_id] ?? 0) + received;
        }
      }
    });
    return map;
  }, [accountsState, transactionsState]);

  function getAccountBalance(accountId) {
    return accountBalanceMap[accountId] ?? 0;
  }

  const value = useMemo(() => ({
    transactions: transactionsState,
    accounts: accountsState,
    categories: categoriesState,
    budgets: budgetsState,
    exchangeRate,
    exchangeRateLoading,
    exchangeRateError,
    addTransaction,
    setTransactions,
    deleteTransaction,
    updateTransaction,
    addAccount,
    setAccounts,
    deleteAccount,
    updateAccount,
    getAccountBalance,
    addCategory,
    setCategories,
    deleteCategory,
    updateCategory,
    setBudgets,
    upsertBudget: upsertBudgetLocal,
    deleteBudget: deleteBudgetLocal,
    goals: goalsState,
    setGoals,
    addGoal,
    updateGoalLocal,
    deleteGoalLocal,
    recurring: recurringState,
    setRecurring,
    addRecurring,
    updateRecurringLocal,
    deleteRecurringLocal,
    bills: billsState,
    setBills,
    addBill,
    updateBillLocal,
    deleteBillLocal,
    refreshExchangeRate,
  }), [
    transactionsState, accountsState, categoriesState, budgetsState,
    goalsState, recurringState, billsState,
    exchangeRate, exchangeRateLoading, exchangeRateError,
    accountBalanceMap,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
