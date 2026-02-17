import * as SQLite from "expo-sqlite";

let db;

export async function initDB() {
  db = await SQLite.openDatabaseAsync("expenses.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      initial_balance REAL NOT NULL DEFAULT 0
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
  return db;
}

export async function insertAccount(name, initialBalance) {
  const result = await db.runAsync(
    "INSERT INTO accounts (name, initial_balance) VALUES (?, ?)",
    name,
    initialBalance
  );
  return result.lastInsertRowId;
}

export async function fetchAccounts() {
  return await db.getAllAsync("SELECT * FROM accounts ORDER BY id ASC");
}

export async function updateAccount(id, name, initialBalance) {
  await db.runAsync(
    "UPDATE accounts SET name = ?, initial_balance = ? WHERE id = ?",
    name,
    initialBalance,
    id
  );
}

export async function deleteAccount(id) {
  await db.runAsync("DELETE FROM accounts WHERE id = ?", id);
}

export async function insertTransaction(tx) {
  const result = await db.runAsync(
    "INSERT INTO transactions (type, description, amount, date, account_id, transfer_to_account_id) VALUES (?, ?, ?, ?, ?, ?)",
    tx.type,
    tx.description,
    tx.amount,
    tx.date,
    tx.account_id,
    tx.transfer_to_account_id || null
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
    "UPDATE transactions SET type = ?, description = ?, amount = ?, date = ?, account_id = ?, transfer_to_account_id = ? WHERE id = ?",
    tx.type,
    tx.description,
    tx.amount,
    tx.date,
    tx.account_id,
    tx.transfer_to_account_id || null,
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
