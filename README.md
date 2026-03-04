# 💰 SpendWise — Expense Tracker

A feature-rich **React Native** mobile app for personal finance management. Track expenses, income, transfers, subscriptions, and savings goals across multiple accounts and currencies — all stored locally on your device with a beautiful, modern UI.

---

## ✨ Features

### Core Finance
- **Transactions** — Add, edit, and delete transactions with three types: **expense**, **income**, and **transfer** between accounts.
- **Multiple Accounts** — Create and manage accounts (Cash, Bank, Savings, etc.) with initial balances and real-time balance calculation.
- **Multi-Currency Support** — Accounts can hold **EGP** or **USD**. Live exchange rates are fetched dynamically with local caching and offline fallback.
- **Cross-Currency Transfers** — Transfer between accounts of different currencies with automatic conversion.

### Advanced Tracking & Automation
- **Recurring Transactions** — Set up daily, weekly, or monthly recurring income/expenses. The app automatically logs them on the due date when you open it.
- **Bill Reminders** — Keep track of upcoming bills with color-coded urgency (red for due within 2 days) and a quick "Mark Paid" button to instantly log the expense.
- **Savings Goals** — Create custom savings goals with target amounts, track your progress visually, and celebrate when you hit 100%.
- **Budgeting** — Set monthly spending limits per category. Enjoy visual progress bars and receive instant push notifications when you approach or exceed your budget.

### Analytics & Insights
- **Financial Health Score** — A comprehensive 0-100 score evaluating your financial wellness based on your savings rate, budget control, and goals progress, along with personalized tips.
- **Smart Spending Insights** — Auto-generated actionable insights (e.g., top spending category, month-over-month comparisons, and highest spending day of the week).
- **Spending Heatmap Calendar** — A visual calendar grid showing your daily spending intensity for the month. Tap any day to see the exact transactions.
- **Category Breakdown** — Visual pie chart representing expense distribution across categories.
- **Period Filters** — Analyze data across different timeframes (Current Month, 7 Days, 2 Weeks, All Time, etc.).

### Categorization & Organization
- **Custom Categories** — Create your own categories with a choice of **37 Ionicons** and **18 colors**, plus 8 built-in protected default categories.
- **Transaction History** — Browse "Recent" or "All" transactions with sticky date headers and color-coded income/expense summaries.

### User Experience
- **Dark / Light Theme** — Beautiful "Indigo Finance" palette that dynamically adapts to your system color scheme.
- **Full Internationalization (i18n)** — Complete support for **English** and **Arabic**, including automatic **RTL (Right-to-Left) layout reversal**.
- **Smooth Animations** — Fluid navigation transitions, slide-from-bottom modals, and tactile haptic feedback on interactions.
- **Push Notifications** — Automated local push notifications for daily reminders and budget alerts.

### Data & Architecture
- **Offline-First SQLite Storage** — Lightning-fast local database (`expo-sqlite`) means no cloud sync delays and complete data privacy.
- **Auto-Migrations** — Robust local schema management that handles initial data seeding (default categories & account) safely.

---

## 🛠 Tech Stack

| Category          | Technology                                     |
| ----------------- | ---------------------------------------------- |
| Framework         | React Native 0.81 + Expo SDK 54                |
| Navigation        | React Navigation 7 (Bottom Tabs + Stack)       |
| State Management  | React Context API + `useReducer`               |
| Database          | `expo-sqlite` (SQLite)                         |
| Internationalization | `i18next` + `react-i18next`                 |
| Icons / UI        | `@expo/vector-icons` (Ionicons)                |
| Push Notifications| `expo-notifications`                           |
| Theming           | System appearance hook + custom ThemeProvider  |

---

## � Database Schema

Powered by 7 SQLite tables with automatic migrations on startup:

| Table                    | Key Columns                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `accounts`               | `id`, `name`, `initial_balance`, `currency` (EGP / USD)                               |
| `transactions`           | `id`, `type`, `description`, `amount`, `date`, `account_id`, `category_id`...         |
| `categories`             | `id`, `name`, `icon`, `color`, `is_default`                                           |
| `budgets`                | `id`, `category_id`, `monthly_limit`                                                  |
| `savings_goals`          | `id`, `name`, `target_amount`, `saved_amount`, `deadline`, `icon`, `color`            |
| `recurring_transactions` | `id`, `type`, `amount`, `frequency`, `next_due`, `is_active`                          |
| `bill_reminders`         | `id`, `name`, `amount`, `due_day`, `icon`, `color`, `is_active`                       |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android emulator, iOS simulator, or **Expo Go** on a physical device

### Installation
```bash
# Clone and navigate to the project directory
git clone https://github.com/yourusername/expense-tracker.git
cd expense-tracker

# Install dependencies
npm install
```

### Running the App
```bash
# Start the Expo development server
npx expo start
```
Then press **a** (Android), **i** (iOS), or scan the QR code with **Expo Go**.

### Building for Production
```bash
npx expo run:android
npx expo run:ios
```

---

## 🎨 Design System — "Indigo Finance"
The app uses a custom modern fintech palette:

- **Primary:** `#6366F1` (Indigo)
- **Income (Positive):** `#34D399` (Emerald)
- **Expense (Negative):** `#F87171` (Red)
- **Surfaces:** Clean whites `#FFFFFF` and deep slates `#1C1B2E` for Dark Mode.

---

## 📄 License
This project is open-source and available for educational purposes.
