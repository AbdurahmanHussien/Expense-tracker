import { useState, useEffect, useContext } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import ManageTransaction from "./screens/ManageTransaction";
import ManageAccount from "./screens/ManageAccount";
import RecentExpenses from "./screens/RecentExpenses";
import AllExpenses from "./screens/AllExpenses";
import Accounts from "./screens/Accounts";

import IconButton from "./components/UI/IconButton";
import LoadingOverlay from "./components/UI/LoadingOverlay";
import AppContextProvider, { AppContext } from "./store/app-context";
import { ThemeProvider, useTheme } from "./store/theme-context";
import {
  initDB,
  fetchAccounts as fetchAccountsDB,
  fetchTransactions as fetchTransactionsDB,
  insertAccount,
} from "./utils/database";

const Stack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();

function ExpensesOverview() {
  const { theme } = useTheme();
  const colors = theme.colors;

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
          title: "Recent",
          tabBarLabel: "Recent",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hourglass" color={color} size={size} />
          ),
        }}
      />
      <BottomTab.Screen
        name="AllExpenses"
        component={AllExpenses}
        options={{
          title: "All Transactions",
          tabBarLabel: "All",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Accounts"
        component={Accounts}
        options={({ navigation }) => ({
          title: "Accounts",
          tabBarLabel: "Accounts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" color={color} size={size} />
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row" }}>
              <IconButton
                icon="swap-horizontal"
                size={24}
                color={colors.gray800}
                onPress={() =>
                  navigation.navigate("ManageTransaction", {
                    initialType: "transfer",
                  })
                }
              />
              <IconButton
                icon="add"
                size={24}
                color={colors.gray800}
                onPress={() => navigation.navigate("ManageAccount")}
              />
            </View>
          ),
        })}
      />
    </BottomTab.Navigator>
  );
}

function Root() {
  const [isLoading, setIsLoading] = useState(true);
  const appCtx = useContext(AppContext);
  const { theme } = useTheme();
  const colors = theme.colors;

  useEffect(() => {
    async function init() {
      await initDB();
      let accounts = await fetchAccountsDB();
      if (accounts.length === 0) {
        const id = await insertAccount("Cash", 0);
        accounts = [{ id, name: "Cash", initial_balance: 0 }];
      }
      const transactions = await fetchTransactionsDB();
      appCtx.setAccounts(accounts);
      appCtx.setTransactions(transactions);
      setIsLoading(false);
    }
    init();
  }, []);

  if (isLoading) return <LoadingOverlay />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: colors.gray100 },
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
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="ManageAccount"
          component={ManageAccount}
          options={{ presentation: "modal" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <ThemeProvider>
        <AppContextProvider>
          <Root />
        </AppContextProvider>
      </ThemeProvider>
    </>
  );
}
