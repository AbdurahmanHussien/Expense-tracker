# SpendWise - Expense Tracker

A React Native mobile application for tracking personal finances. Manage multiple accounts, record expenses, income, and transfers, and view transaction summaries — all stored locally on your device.

## Features

- **Transaction Management** — Add, edit, and delete transactions with support for three types: expense, income, and transfer between accounts.
- **Account Management** — Create and manage multiple accounts (e.g. Cash, Bank, Savings) with initial balances and real-time balance calculation.
- **Recent & All Transactions** — View recent transactions filtered by 7 days, 2 weeks, or 1 month, or browse the complete history.
- **Summary Cards** — See total income and expenses at a glance with color-coded indicators.
- **Transfer Support** — Move money between accounts with dedicated transfer transactions.
- **Dark / Light Theme** — Automatically adapts to your system color scheme preference.
- **Local Data Persistence** — All data is stored locally using SQLite, no internet connection required.
- **Form Validation** — Inline error messages to guide correct input.

## Tech Stack

| Category       | Technology                                  |
| -------------- | ------------------------------------------- |
| Framework      | React Native 0.81 + Expo SDK 54            |
| Navigation     | React Navigation 7 (Bottom Tabs + Stack)   |
| State          | React Context API with `useReducer`        |
| Database       | expo-sqlite (SQLite)                        |
| Icons          | Ionicons (`@expo/vector-icons`)            |
| Date Picker    | `@react-native-community/datetimepicker`   |

## Project Structure

```
Expense-tracker/
├── App.js                         # Root component & navigation setup
├── screens/
│   ├── RecentExpenses.js          # Filtered recent transactions
│   ├── AllExpenses.js             # Full transaction history
│   ├── Accounts.js                # Account list with balances
│   ├── ManageTransaction.js       # Add / edit / delete a transaction
│   └── ManageAccount.js           # Add / edit / delete an account
├── components/
│   ├── ManageExpense/
│   │   ├── ExpenseForm.js         # Transaction form
│   │   ├── DatePicker.js          # Date picker component
│   │   └── Input.js               # Reusable text input
│   ├── ExpensesOutput/
│   │   ├── ExpensesOutput.js      # Transaction list container
│   │   ├── ExpensesSummary.js     # Income / expense summary
│   │   ├── ExpensesList.js        # FlatList wrapper
│   │   └── ExpenseItem.js         # Single transaction row
│   └── UI/
│       ├── Button.js              # Reusable button
│       ├── IconButton.js          # Icon-only button
│       ├── Picker.js              # Dropdown picker
│       ├── LoadingOverlay.js      # Loading spinner overlay
│       └── ErrorOverlay.js        # Error message overlay
├── store/
│   ├── app-context.js             # Transactions & accounts state
│   └── theme-context.js           # Theme management
├── utils/
│   ├── database.js                # SQLite operations
│   └── date.js                    # Date formatting helpers
├── constants/
│   └── styles.js                  # Theme colors & shared styles
└── assets/                        # App icons & splash screen
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android emulator, iOS simulator, or the **Expo Go** app on a physical device

### Installation

```bash
# Clone or navigate to the project directory
cd Expense-tracker

# Install dependencies
npm install
```

### Running the App

```bash
# Start the Expo development server
npx expo start
```

Then press:
- **a** to open on an Android emulator
- **i** to open on an iOS simulator
- Scan the QR code with Expo Go on your phone

### Building for Production

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

## How It Works

1. **On first launch**, a default "Cash" account is created with a $0 balance.
2. **Add accounts** for different wallets or bank accounts with an optional initial balance.
3. **Record transactions** — choose a type (expense, income, or transfer), enter an amount, pick a date, and select the relevant account.
4. **View summaries** on the Recent Expenses tab, filtered by time period, or see everything under All Expenses.
5. **Account balances** are calculated automatically from the initial balance plus all associated transactions.

## License

This project is for educational purposes as part of a React Native course.
