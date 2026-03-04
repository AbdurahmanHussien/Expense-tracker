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
  } catch { }

  try {
    await db.execAsync(
      "ALTER TABLE accounts ADD COLUMN currency TEXT NOT NULL DEFAULT 'EGP'"
    );
  } catch { }

  try {
    await db.execAsync(
      "ALTER TABLE transactions ADD COLUMN received_amount REAL"
    );
  } catch { }

  // Budgets table
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL UNIQUE,
        monthly_limit REAL NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    `);
  } catch { }

  // Savings goals table
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'flag',
        color TEXT NOT NULL DEFAULT '#4ECDC4',
        target_amount REAL NOT NULL,
        saved_amount REAL NOT NULL DEFAULT 0,
        deadline TEXT,
        created_at TEXT NOT NULL
      );
    `);
  } catch { }

  // Recurring transactions table
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('expense','income','transfer')),
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        account_id INTEGER NOT NULL,
        transfer_to_account_id INTEGER,
        category_id INTEGER,
        frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly','monthly')),
        next_due TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1
      );
    `);
  } catch { }

  // Bill reminders table
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS bill_reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        icon TEXT NOT NULL DEFAULT 'receipt',
        color TEXT NOT NULL DEFAULT '#FF6B6B',
        due_day INTEGER NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1
      );
    `);
  } catch { }

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

// ─── Budgets ───────────────────────────────────────────────────────────────

export async function fetchBudgets() {
  return await db.getAllAsync("SELECT * FROM budgets ORDER BY id ASC");
}

export async function upsertBudget(categoryId, monthlyLimit) {
  await db.runAsync(
    `INSERT INTO budgets (category_id, monthly_limit) VALUES (?, ?)
     ON CONFLICT(category_id) DO UPDATE SET monthly_limit = excluded.monthly_limit`,
    categoryId,
    monthlyLimit
  );
}

export async function deleteBudget(categoryId) {
  await db.runAsync("DELETE FROM budgets WHERE category_id = ?", categoryId);
}

export async function checkpointDB() {
  try {
    await db.execAsync("PRAGMA wal_checkpoint(FULL);");
  } catch (error) {
    console.log("Checkpoint failed", error);
  }
}

// ─── Savings Goals ─────────────────────────────────────────────────────────

export async function fetchGoals() {
  return await db.getAllAsync("SELECT * FROM savings_goals ORDER BY created_at DESC");
}

export async function insertGoal(name, icon, color, targetAmount, savedAmount, deadline) {
  const result = await db.runAsync(
    "INSERT INTO savings_goals (name, icon, color, target_amount, saved_amount, deadline, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    name, icon, color, targetAmount, savedAmount, deadline || null,
    new Date().toISOString()
  );
  return result.lastInsertRowId;
}

export async function updateGoal(id, name, icon, color, targetAmount, savedAmount, deadline) {
  await db.runAsync(
    "UPDATE savings_goals SET name = ?, icon = ?, color = ?, target_amount = ?, saved_amount = ?, deadline = ? WHERE id = ?",
    name, icon, color, targetAmount, savedAmount, deadline || null, id
  );
}

export async function deleteGoal(id) {
  await db.runAsync("DELETE FROM savings_goals WHERE id = ?", id);
}

export async function closeDB() {
  if (db) {
    try {
      await db.closeAsync();
    } catch (e) {
      console.log("Error closing DB", e);
    }
  }
}

// ─── Recurring Transactions ────────────────────────────────────────────────

export async function fetchRecurring() {
  return await db.getAllAsync("SELECT * FROM recurring_transactions ORDER BY next_due ASC");
}

export async function insertRecurring(r) {
  const result = await db.runAsync(
    "INSERT INTO recurring_transactions (type, description, amount, account_id, transfer_to_account_id, category_id, frequency, next_due, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
    r.type, r.description, r.amount, r.account_id,
    r.transfer_to_account_id || null, r.category_id || null,
    r.frequency, r.next_due
  );
  return result.lastInsertRowId;
}

export async function updateRecurring(id, r) {
  await db.runAsync(
    "UPDATE recurring_transactions SET type=?, description=?, amount=?, account_id=?, transfer_to_account_id=?, category_id=?, frequency=?, next_due=?, is_active=? WHERE id=?",
    r.type, r.description, r.amount, r.account_id,
    r.transfer_to_account_id || null, r.category_id || null,
    r.frequency, r.next_due, r.is_active ? 1 : 0, id
  );
}

export async function updateRecurringNextDue(id, nextDue) {
  await db.runAsync("UPDATE recurring_transactions SET next_due=? WHERE id=?", nextDue, id);
}

export async function deleteRecurring(id) {
  await db.runAsync("DELETE FROM recurring_transactions WHERE id=?", id);
}

// ─── Bill Reminders ────────────────────────────────────────────────────────

export async function fetchBills() {
  return await db.getAllAsync("SELECT * FROM bill_reminders ORDER BY due_day ASC");
}

export async function insertBill(b) {
  const result = await db.runAsync(
    "INSERT INTO bill_reminders (name, amount, icon, color, due_day, is_active) VALUES (?, ?, ?, ?, ?, 1)",
    b.name, b.amount, b.icon, b.color, b.due_day
  );
  return result.lastInsertRowId;
}

export async function updateBill(id, b) {
  await db.runAsync(
    "UPDATE bill_reminders SET name=?, amount=?, icon=?, color=?, due_day=?, is_active=? WHERE id=?",
    b.name, b.amount, b.icon, b.color, b.due_day, b.is_active ? 1 : 0, id
  );
}

export async function deleteBill(id) {
  await db.runAsync("DELETE FROM bill_reminders WHERE id=?", id);
}
