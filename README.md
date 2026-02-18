# 💰 SpendWise — Expense Tracker

A feature-rich **React Native** mobile app for personal finance management. Track expenses, income, and transfers across multiple accounts and currencies — all stored locally on your device with a beautiful, modern UI.

---

## ✨ Features

### Core Finance
- **Transactions** — Add, edit, and delete transactions with three types: **expense**, **income**, and **transfer** between accounts.
- **Multiple Accounts** — Create and manage accounts (Cash, Bank, Savings, etc.) with initial balances and real-time balance calculation.
- **Multi-Currency Support** — Accounts can hold **EGP** or **USD**. Live exchange rates are fetched from the [Exchange Rate API](https://open.er-api.com/) with a 1-hour cache.
- **Cross-Currency Transfers** — Transfer between accounts of different currencies with automatic conversion and a separate `received_amount` field.

### Analytics & Insights
- **Analytics Dashboard** — Hero card showing total balance with trend indicator, income/expense/net summary cards, and a **category pie chart**.
- **Period Filter** — View analytics for 7 days, 2 weeks, 1 month, 3 months, or all time.
- **Category Breakdown** — Visual pie chart showing expense distribution across categories.

### Category Management
- **8 Default Categories** — Food & Dining, Transport, Shopping, Bills & Utilities, Entertainment, Health, Education, and Other.
- **Custom Categories** — Create your own categories with a choice of **37 Ionicons** and **18 colors**, with a live preview.
- **Delete Custom Categories** — Remove user-created categories (default categories are protected).

### Transactions View
- **Recent Transactions** — Filter by 7 days, 2 weeks, or 1 month with period selector pills.
- **All Transactions** — Browse the complete transaction history sorted by date.
- **Transaction Summary** — Color-coded income/expense totals displayed above the list.

### User Experience
- **Dark / Light Theme** — Automatically adapts to your system color scheme using the "Indigo Finance" design palette.
- **Internationalization (i18n)** — Full support for **English** and **Arabic**, including **RTL layout** for Arabic.
- **Language Selector** — Switch languages from the Accounts tab; Arabic triggers an RTL layout restart prompt.
- **Smooth Transitions** — Modal slide-from-bottom for creating/editing, fade transitions between screens.
- **Form Validation** — Inline error messages with visual indicators for invalid inputs.
- **Loading & Error States** — Full-screen overlays for loading states and error recovery.

### Data & Storage
- **Local-First** — All data persisted in **SQLite** via `expo-sqlite`. No internet required for core functionality.
- **Auto-Migration** — Database schema evolves gracefully with safe `ALTER TABLE` migrations wrapped in try/catch.
- **First-Launch Setup** — On first run, a default "Cash" account (EGP, balance 0) and all 8 default categories are created automatically.

---

## 🛠 Tech Stack

| Category          | Technology                                     |
| ----------------- | ---------------------------------------------- |
| Framework         | React Native 0.81 + Expo SDK 54               |
| Navigation        | React Navigation 7 (Bottom Tabs + Stack)       |
| State Management  | React Context API + `useReducer`               |
| Database          | expo-sqlite (SQLite with WAL mode)             |
| Internationalization | i18next + react-i18next                     |
| Icons             | Ionicons (`@expo/vector-icons`)                |
| Date Picker       | `@react-native-community/datetimepicker`       |
| Storage           | `@react-native-async-storage/async-storage`    |
| Theming           | System color scheme detection (`useColorScheme`)|

---

## 📁 Project Structure

```
Expense-tracker/
├── App.js                             # Root component, navigation, DB initialization
├── index.js                           # App entry point
├── app.json                           # Expo configuration (bundle ID: com.spendwise.app)
│
├── screens/
│   ├── RecentExpenses.js              # Filtered recent transactions (7d / 2w / 1m)
│   ├── AllExpenses.js                 # Full transaction history
│   ├── Analytics.js                   # Dashboard: balance hero, stats, category chart
│   ├── Accounts.js                    # Account list, total balance, language selector
│   ├── ManageTransaction.js           # Add / edit / delete a transaction
│   ├── ManageAccount.js               # Add / edit / delete an account (with currency)
│   └── ManageCategories.js            # View, add, delete categories (icon + color picker)
│
├── components/
│   ├── ManageExpense/
│   │   ├── ExpenseForm.js             # Full transaction form (type, amount, date, account, category)
│   │   ├── DatePicker.js              # Date picker component
│   │   └── Input.js                   # Reusable text input with validation
│   ├── ExpensesOutput/
│   │   ├── ExpensesOutput.js          # Transaction list container with summary
│   │   ├── ExpensesSummary.js         # Income / expense totals summary card
│   │   ├── ExpensesList.js            # FlatList wrapper for transactions
│   │   ├── ExpenseItem.js             # Single transaction row (icon, category, amount)
│   │   └── CategoryChart.js           # Pie chart for category-wise expense breakdown
│   └── UI/
│       ├── Button.js                  # Reusable styled button (solid / flat)
│       ├── IconButton.js              # Icon-only pressable button
│       ├── Picker.js                  # Custom dropdown picker
│       ├── LanguageSelector.js        # Language switch component (EN ↔ AR)
│       ├── LoadingOverlay.js          # Full-screen loading spinner
│       └── ErrorOverlay.js            # Full-screen error with retry
│
├── store/
│   ├── app-context.js                 # Transactions, accounts, categories, exchange rate state
│   ├── theme-context.js               # Auto dark/light theme provider
│   └── language-context.js            # Language state + RTL management
│
├── utils/
│   ├── database.js                    # SQLite init, migrations, CRUD operations
│   ├── currency.js                    # Exchange rate fetching, currency conversion
│   ├── date.js                        # Date formatting & arithmetic helpers
│   └── i18n.js                        # i18next initialization & configuration
│
├── constants/
│   └── styles.js                      # "Indigo Finance" theme — light & dark color palettes
│
├── locales/
│   ├── en.json                        # English translations
│   └── ar.json                        # Arabic translations
│
└── assets/                            # App icon, adaptive icon, splash screen, favicon
```

---

## 🗺 Navigation

```
Bottom Tab Navigator
├── Recent    (hourglass icon)   → RecentExpenses screen
├── All       (list icon)        → AllExpenses screen
├── Analytics (bar-chart icon)   → Analytics screen
└── Accounts  (wallet icon)      → Accounts screen

Stack Navigator (modals)
├── ManageTransaction   → slide-from-bottom modal
├── ManageAccount       → slide-from-bottom modal
└── ManageCategories    → slide-from-bottom modal
```

---

## 🗃 Database Schema

Three SQLite tables with automatic migrations:

| Table            | Key Columns                                                                           |
| ---------------- | ------------------------------------------------------------------------------------- |
| `accounts`       | `id`, `name`, `initial_balance`, `currency` (EGP / USD)                              |
| `transactions`   | `id`, `type` (expense/income/transfer), `description`, `amount`, `date`, `account_id`, `transfer_to_account_id`, `category_id`, `received_amount` |
| `categories`     | `id`, `name`, `icon`, `color`, `is_default`                                          |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android emulator, iOS simulator, or **Expo Go** on a physical device

### Installation

```bash
# Navigate to the project directory
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
- **a** — open on Android emulator
- **i** — open on iOS simulator
- **Scan QR** — open with Expo Go on your phone

### Building for Production

```bash
# Android APK / AAB
npx expo run:android

# iOS
npx expo run:ios
```

---

## 🎨 Design System — "Indigo Finance"

The app uses a custom **Indigo Finance** color palette inspired by modern fintech apps (Linear, Vercel, Revolut, N26):

| Token               | Light Mode          | Dark Mode           |
| -------------------- | ------------------- | ------------------- |
| Primary              | `#4F46E5` (Indigo)  | `#6366F1` (Indigo)  |
| Income               | `#059669` (Emerald) | `#34D399` (Emerald) |
| Expense              | `#DC2626` (Red)     | `#F87171` (Red)     |
| Transfer             | `#7C3AED` (Violet)  | `#A78BFA` (Violet)  |
| Background           | `#F1F5F9` (Slate)   | `#13121F` (Deep Indigo) |
| Surface              | `#FFFFFF`           | `#1C1B2E`           |

---

## 🔄 How It Works

1. **First launch** — The database initializes, creates a default "Cash" account (EGP, ₹0), and seeds 8 default categories.
2. **Add accounts** — Create accounts for different wallets or banks, choose EGP or USD currency.
3. **Record transactions** — Pick a type (expense/income/transfer), enter amount, select date, choose account and category.
4. **Cross-currency transfers** — When transferring between accounts with different currencies, the exchange rate is fetched and conversion is applied automatically.
5. **View analytics** — The Analytics tab shows total balance, income vs. expenses for a selected period, and a category breakdown chart.
6. **Manage categories** — Add custom categories from the Analytics tab with your choice of icon and color.
7. **Switch language** — Toggle between English and Arabic from the Accounts tab. Arabic activates RTL layout.
8. **Balances update live** — Account balances are derived in real-time from the initial balance plus all associated transactions.

---

## 📄 License

This project is for educational purposes as part of a React Native course.
