import { createContext, useReducer, useState } from "react";
import { fetchUsdToEgpRate } from "../utils/currency";

export const AppContext = createContext({
  transactions: [],
  accounts: [],
  categories: [],
  exchangeRate: null,
  exchangeRateLoading: false,
  addTransaction: (txData) => {},
  setTransactions: (transactions) => {},
  deleteTransaction: (id) => {},
  updateTransaction: (id, txData) => {},
  addAccount: (accountData) => {},
  setAccounts: (accounts) => {},
  deleteAccount: (id) => {},
  updateAccount: (id, accountData) => {},
  getAccountBalance: (accountId) => 0,
  addCategory: (categoryData) => {},
  setCategories: (categories) => {},
  deleteCategory: (id) => {},
  updateCategory: (id, categoryData) => {},
  refreshExchangeRate: async () => {},
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

export default function AppContextProvider({ children }) {
  const [transactionsState, txDispatch] = useReducer(transactionsReducer, []);
  const [accountsState, accDispatch] = useReducer(accountsReducer, []);
  const [categoriesState, catDispatch] = useReducer(categoriesReducer, []);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);

  async function refreshExchangeRate() {
    setExchangeRateLoading(true);
    try {
      const rate = await fetchUsdToEgpRate();
      setExchangeRate(rate);
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

  function getAccountBalance(accountId) {
    const account = accountsState.find((a) => a.id === accountId);
    if (!account) return 0;

    let balance = account.initial_balance;
    transactionsState.forEach((tx) => {
      if (tx.type === "income" && tx.account_id === accountId) {
        balance += tx.amount;
      } else if (tx.type === "expense" && tx.account_id === accountId) {
        balance -= tx.amount;
      } else if (tx.type === "transfer") {
        if (tx.account_id === accountId) {
          balance -= tx.amount;
        }
        if (tx.transfer_to_account_id === accountId) {
          // Use received_amount for cross-currency transfers, fallback to amount
          balance += tx.received_amount != null ? tx.received_amount : tx.amount;
        }
      }
    });
    return balance;
  }

  const value = {
    transactions: transactionsState,
    accounts: accountsState,
    categories: categoriesState,
    exchangeRate,
    exchangeRateLoading,
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
    refreshExchangeRate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
