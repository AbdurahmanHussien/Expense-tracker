import * as SQLite from "expo-sqlite";

let db;

export const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", icon: "restaurant", color: "#FF6B6B" },
  { name: "Transport", icon: "car", color: "#4ECDC4" },
  { name: "Shopping", icon: "bag-handle", color: "#45B7D1" },
  { name: "Bills & Utilities", icon: "receipt", color: "#FFA07A" },
  { name: "Entertainment", icon: "film", color: "#BB8FCE" },
  { name: "Health", icon: "medical", color: "#58D68D" },
  { name: "Education", icon: "school", color: "#F7DC6F" },
  { name: "Other", icon: "ellipsis-horizontal-circle", color: "#ADB5BD" },
];

export async function initDB() {
  db = await SQLite.openDatabaseAsync("expenses.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      initial_balance REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'ellipsis-horizontal-circle',
      color TEXT NOT NULL DEFAULT '#ADB5BD',
      is_default INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('expense','income','transfer')),
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      account_id INTEGER NOT NULL,
      transfer_to_account_id INTEGER,
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (transfer_to_account_id) REFERENCES accounts(id)
    );
  `);

  // Migrations — each wrapped in try/catch so re-runs on existing DB are safe
  try {
    await db.execAsync(
      "ALTER TABLE transactions ADD COLUMN category_id INTEGER REFERENCES categories(id)"
    );
  } catch {}

  try {
    await db.execAsync(
      "ALTER TABLE accounts ADD COLUMN currency TEXT NOT NULL DEFAULT 'EGP'"
    );
  } catch {}

  try {
    await db.execAsync(
      "ALTER TABLE transactions ADD COLUMN received_amount REAL"
    );
  } catch {}

  return db;
}

// ─── Categories ────────────────────────────────────────────────────────────

export async function fetchCategories() {
  return await db.getAllAsync("SELECT * FROM categories ORDER BY is_default DESC, id ASC");
}

export async function insertCategory(name, icon, color, isDefault = false) {
  const result = await db.runAsync(
    "INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, ?)",
    name,
    icon,
    color,
    isDefault ? 1 : 0
  );
  return result.lastInsertRowId;
}

export async function updateCategory(id, name, icon, color) {
  await db.runAsync(
    "UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?",
    name,
    icon,
    color,
    id
  );
}

export async function deleteCategory(id) {
  await db.runAsync("DELETE FROM categories WHERE id = ?", id);
  // Unlink transactions that used this category
  await db.runAsync(
    "UPDATE transactions SET category_id = NULL WHERE category_id = ?",
    id
  );
}

// ─── Accounts ──────────────────────────────────────────────────────────────

export async function insertAccount(name, initialBalance, currency = "EGP") {
  const result = await db.runAsync(
    "INSERT INTO accounts (name, initial_balance, currency) VALUES (?, ?, ?)",
    name,
    initialBalance,
    currency
  );
  return result.lastInsertRowId;
}

export async function fetchAccounts() {
  return await db.getAllAsync("SELECT * FROM accounts ORDER BY id ASC");
}

export async function updateAccount(id, name, initialBalance, currency = "EGP") {
  await db.runAsync(
    "UPDATE accounts SET name = ?, initial_balance = ?, currency = ? WHERE id = ?",
    name,
    initialBalance,
    currency,
    id
  );
}

export async function deleteAccount(id) {
  await db.runAsync("DELETE FROM accounts WHERE id = ?", id);
}

// ─── Transactions ──────────────────────────────────────────────────────────

export async function insertTransaction(tx) {
  const result = await db.runAsync(
    "INSERT INTO transactions (type, description, amount, date, account_id, transfer_to_account_id, category_id, received_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    tx.type,
    tx.description,
    tx.amount,
    tx.date,
    tx.account_id,
    tx.transfer_to_account_id || null,
    tx.category_id || null,
    tx.received_amount ?? null
  );
  return result.lastInsertRowId;
}

export async function fetchTransactions() {
  const rows = await db.getAllAsync(
    "SELECT * FROM transactions ORDER BY date DESC, id DESC"
  );
  return rows.map((row) => ({
    ...row,
    date: new Date(row.date),
  }));
}

export async function updateTransaction(id, tx) {
  await db.runAsync(
    "UPDATE transactions SET type = ?, description = ?, amount = ?, date = ?, account_id = ?, transfer_to_account_id = ?, category_id = ?, received_amount = ? WHERE id = ?",
    tx.type,
    tx.description,
    tx.amount,
    tx.date,
    tx.account_id,
    tx.transfer_to_account_id || null,
    tx.category_id || null,
    tx.received_amount ?? null,
    id
  );
}

export async function deleteTransaction(id) {
  await db.runAsync("DELETE FROM transactions WHERE id = ?", id);
}

export async function countTransactionsForAccount(accountId) {
  const result = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM transactions WHERE account_id = ? OR transfer_to_account_id = ?",
    accountId,
    accountId
  );
  return result?.count || 0;
}
