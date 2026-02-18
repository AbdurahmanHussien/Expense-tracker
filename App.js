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

import ManageTransaction from "./screens/ManageTransaction";
import ManageAccount from "./screens/ManageAccount";
import ManageCategories from "./screens/ManageCategories";
import RecentExpenses from "./screens/RecentExpenses";
import AllExpenses from "./screens/AllExpenses";
import Accounts from "./screens/Accounts";
import Analytics from "./screens/Analytics";

import IconButton from "./components/UI/IconButton";
import LoadingOverlay from "./components/UI/LoadingOverlay";
import AppContextProvider, { AppContext } from "./store/app-context";
import { ThemeProvider, useTheme } from "./store/theme-context";
import { LanguageProvider, LANG_STORAGE_KEY } from "./store/language-context";
import {
  initDB,
  fetchAccounts as fetchAccountsDB,
  fetchTransactions as fetchTransactionsDB,
  fetchCategories as fetchCategoriesDB,
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
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: 70,
          paddingTop: 1,
        },
        tabBarActiveTintColor: colors.primary400,
        tabBarInactiveTintColor: colors.gray500,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
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
      appCtx.setAccounts(accounts);
      appCtx.setCategories(categories);
      appCtx.setTransactions(transactions);
      setIsLoading(false);
    }
    init();
  }, []);

  if (isLoading) return <LoadingOverlay />;

  return (
    <LanguageProvider initialLanguage={initialLanguage}>
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
        </Stack.Navigator>
      </NavigationContainer>
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
