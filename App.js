import { useState, useEffect, useContext } from "react";
import { View, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n from "./utils/i18n";
import { setupReminderNotification } from "./utils/notifications";

import ManageTransaction from "./screens/ManageTransaction";
import ManageAccount from "./screens/ManageAccount";
import ManageCategories from "./screens/ManageCategories";
import RecentExpenses from "./screens/RecentExpenses";
import AllExpenses from "./screens/AllExpenses";
import Accounts from "./screens/Accounts";
import Analytics from "./screens/Analytics";
import MonthlyReport from "./screens/MonthlyReport";
import SavingsGoals from "./screens/SavingsGoals";
import RecurringTransactions, { advanceDate } from "./screens/RecurringTransactions";
import BillReminders from "./screens/BillReminders";

import IconButton from "./components/UI/IconButton";
import LoadingOverlay from "./components/UI/LoadingOverlay";
import SecurityWrapper from "./components/UI/SecurityWrapper";
import AppContextProvider, { AppContext } from "./store/app-context";
import { ThemeProvider, useTheme } from "./store/theme-context";
import { LanguageProvider, LANG_STORAGE_KEY } from "./store/language-context";
import {
  initDB,
  fetchAccounts as fetchAccountsDB,
  fetchTransactions as fetchTransactionsDB,
  fetchCategories as fetchCategoriesDB,
  fetchBudgets as fetchBudgetsDB,
  fetchGoals as fetchGoalsDB,
  fetchRecurring as fetchRecurringDB,
  fetchBills as fetchBillsDB,
  insertTransaction,
  updateRecurringNextDue,
  insertAccount,
  insertCategory,
  DEFAULT_CATEGORIES,
} from "./utils/database";

const Stack = createStackNavigator();
const BottomTab = createBottomTabNavigator();

function ExpensesOverview() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { t } = useTranslation();

  return (
    <BottomTab.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: colors.primary800,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.primary200,
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 20,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: "#000",
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          height: 64,
          paddingTop: 4,
          paddingBottom: 8,
          marginHorizontal: 12,
          marginBottom: 10,
          borderRadius: 20,
          position: "absolute",
        },
        tabBarActiveTintColor: colors.primary400,
        tabBarInactiveTintColor: colors.gray500,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.2,
        },
        headerRight: () => (
          <IconButton
            icon="add"
            size={24}
            color={colors.primary200}
            onPress={() => navigation.navigate("ManageTransaction")}
          />
        ),
      })}
    >
      <BottomTab.Screen
        name="RecentExpenses"
        component={RecentExpenses}
        options={{
          title: t("nav.recent"),
          tabBarLabel: t("nav.recent"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hourglass" color={color} size={size} />
          ),
        }}
      />
      <BottomTab.Screen
        name="AllExpenses"
        component={AllExpenses}
        options={{
          title: t("nav.all"),
          tabBarLabel: t("nav.all"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Analytics"
        component={Analytics}
        options={{
          title: t("nav.analytics"),
          tabBarLabel: t("nav.analytics"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" color={color} size={size} />
          ),
          headerRight: null,
        }}
      />
      <BottomTab.Screen
        name="Accounts"
        component={Accounts}
        options={({ navigation }) => ({
          title: t("nav.accounts"),
          tabBarLabel: t("nav.accounts"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" color={color} size={size} />
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row" }}>
              <IconButton
                icon="swap-horizontal"
                size={24}
                color={colors.primary200}
                onPress={() =>
                  navigation.navigate("ManageTransaction", {
                    initialType: "transfer",
                  })
                }
              />
              <IconButton
                icon="add"
                size={24}
                color={colors.primary200}
                onPress={() => navigation.navigate("ManageAccount")}
              />
            </View>
          ),
        })}
      />
    </BottomTab.Navigator>
  );
}

function Root({ initialLanguage }) {
  const [isLoading, setIsLoading] = useState(true);
  const appCtx = useContext(AppContext);
  const { theme } = useTheme();
  const colors = theme.colors;

  useEffect(() => {
    async function init() {
      await initDB();

      let accounts = await fetchAccountsDB();
      if (accounts.length === 0) {
        const id = await insertAccount("Cash", 0, "EGP");
        accounts = [{ id, name: "Cash", initial_balance: 0, currency: "EGP" }];
      }

      let categories = await fetchCategoriesDB();
      if (categories.length === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          const id = await insertCategory(cat.name, cat.icon, cat.color, true);
          categories.push({ id, ...cat, is_default: 1 });
        }
      }

      const transactions = await fetchTransactionsDB();
      const budgets = await fetchBudgetsDB();
      const goals = await fetchGoalsDB();
      const recurring = await fetchRecurringDB();
      const bills = await fetchBillsDB();

      appCtx.setAccounts(accounts);
      appCtx.setCategories(categories);
      appCtx.setTransactions(transactions);
      appCtx.setBudgets(budgets);
      appCtx.setGoals(goals);
      appCtx.setRecurring(recurring);
      appCtx.setBills(bills);

      // Auto-log overdue recurring transactions
      const today = new Date().toISOString().slice(0, 10);
      let autoLogged = 0;
      for (const r of recurring) {
        if (!r.is_active || r.next_due > today) continue;
        try {
          const txData = {
            type: r.type, description: r.description, amount: r.amount,
            account_id: r.account_id,
            transfer_to_account_id: r.transfer_to_account_id || null,
            category_id: r.category_id || null,
            received_amount: null,
            date: today,
          };
          const newId = await insertTransaction(txData);
          appCtx.addTransaction({ ...txData, id: newId, date: new Date(today) });
          const nextDue = advanceDate(today, r.frequency);
          await updateRecurringNextDue(r.id, nextDue);
          appCtx.updateRecurringLocal(r.id, { next_due: nextDue });
          autoLogged++;
        } catch (e) { console.warn("Recurring log failed", e); }
      }

      const hasMultiCurrency = accounts.some(
        (a) => (a.currency || "EGP") !== "EGP"
      );
      if (hasMultiCurrency) {
        appCtx.refreshExchangeRate();
      }

      setIsLoading(false);

      // Schedule 12-hour reminder notification
      setupReminderNotification(
        i18n.t("notifications.reminderTitle"),
        i18n.t("notifications.reminderBody")
      );
    }
    init();
  }, []);

  if (isLoading) return <LoadingOverlay />;

  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <SecurityWrapper>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              cardStyle: { backgroundColor: colors.gray100 },
              headerStyle: {
                backgroundColor: colors.primary800,
                elevation: 0,
                shadowOpacity: 0,
              },
              headerTintColor: colors.gray800,
              headerTitleStyle: {
                fontWeight: "700",
                fontSize: 20,
              },
              gestureEnabled: true,
              cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
            }}
          >
            <Stack.Screen
              name="ExpensesOverview"
              component={ExpensesOverview}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ManageTransaction"
              component={ManageTransaction}
              options={{
                ...TransitionPresets.ModalSlideFromBottomIOS,
                gestureEnabled: true,
                gestureDirection: "vertical",
              }}
            />
            <Stack.Screen
              name="ManageAccount"
              component={ManageAccount}
              options={{
                ...TransitionPresets.ModalSlideFromBottomIOS,
                gestureEnabled: true,
                gestureDirection: "vertical",
              }}
            />
            <Stack.Screen
              name="ManageCategories"
              component={ManageCategories}
              options={{
                ...TransitionPresets.ModalSlideFromBottomIOS,
                gestureEnabled: true,
                gestureDirection: "vertical",
              }}
            />
            <Stack.Screen
              name="MonthlyReport"
              component={MonthlyReport}
              options={{
                ...TransitionPresets.ModalSlideFromBottomIOS,
                gestureEnabled: true,
                gestureDirection: "vertical",
              }}
            />
            <Stack.Screen
              name="SavingsGoals"
              component={SavingsGoals}
              options={{
                ...TransitionPresets.ModalSlideFromBottomIOS,
                gestureEnabled: true,
                gestureDirection: "vertical",
              }}
            />
            <Stack.Screen
              name="RecurringTransactions"
              component={RecurringTransactions}
              options={{
                ...TransitionPresets.ModalSlideFromBottomIOS,
                gestureEnabled: true,
                gestureDirection: "vertical",
              }}
            />
            <Stack.Screen
              name="BillReminders"
              component={BillReminders}
              options={{
                ...TransitionPresets.ModalSlideFromBottomIOS,
                gestureEnabled: true,
                gestureDirection: "vertical",
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SecurityWrapper>
    </LanguageProvider>
  );
}

function ThemedStatusBar() {
  const scheme = useColorScheme();
  return <StatusBar style={scheme === "dark" ? "light" : "dark"} />;
}

export default function App() {
  const [initialLanguage, setInitialLanguage] = useState(null);

  useEffect(() => {
    async function loadLanguage() {
      const stored = await AsyncStorage.getItem(LANG_STORAGE_KEY);
      const lang = stored || "en";
      // Apply RTL before any screen renders
      const needsRTL = lang === "ar";
      if (I18nManager.isRTL !== needsRTL) {
        I18nManager.forceRTL(needsRTL);
      }
      await i18n.changeLanguage(lang);
      setInitialLanguage(lang);
    }
    loadLanguage();
  }, []);

  if (!initialLanguage) return null;

  return (
    <SafeAreaProvider>
      <ThemedStatusBar />
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <AppContextProvider>
            <Root initialLanguage={initialLanguage} />
          </AppContextProvider>
        </ThemeProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
