import { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { themes } from "../constants/styles";

export const ThemeContext = createContext({
  theme: themes.dark,
  isDark: true,
});

export function ThemeProvider({ children }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ theme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
