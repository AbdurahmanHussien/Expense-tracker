const lightColors = {
  // Primary accent
  primary50: "#eef2ff",
  primary100: "#e0e7ff",
  primary200: "#4338ca",
  primary400: "#6366f1",
  primary500: "#6366f1",
  primary700: "#f5f5ff",
  primary800: "#ffffff",
  // Accent
  accent500: "#fbbf24",
  accent600: "#f59e0b",
  // Error
  error50: "rgba(239, 68, 68, 0.08)",
  error500: "#dc2626",
  // Neutral (light theme)
  gray50: "#f8fafc",
  gray100: "#f1f5f9",
  gray500: "#64748b",
  gray700: "#475569",
  gray800: "#1e293b",
  // Success
  success500: "#16a34a",
  // Transfer
  transfer500: "#2563eb",
  // Surfaces
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  border: "#e2e8f0",
};

const darkColors = {
  // Primary accent (bright for visibility on dark)
  primary50: "rgba(99, 102, 241, 0.08)",
  primary100: "rgba(99, 102, 241, 0.16)",
  primary200: "#a5b4fc",
  primary400: "#818cf8",
  primary500: "#6366f1",
  primary700: "#1a1a35",
  primary800: "#12122a",
  // Accent
  accent500: "#fbbf24",
  accent600: "#f59e0b",
  // Error
  error50: "rgba(248, 113, 113, 0.12)",
  error500: "#f87171",
  // Neutral (dark theme)
  gray50: "#eeeef5",
  gray100: "#0d0d1a",
  gray500: "#6b6b85",
  gray700: "#a8a8c0",
  gray800: "#e0e0ef",
  // Success
  success500: "#4ade80",
  // Transfer
  transfer500: "#60a5fa",
  // Surfaces
  surface: "#1a1a2e",
  surfaceElevated: "#242442",
  border: "#2a2a48",
};

export const themes = {
  light: { colors: lightColors },
  dark: { colors: darkColors },
};

// Maintain backward compatibility
export const GlobalStyles = {
  colors: darkColors,
};
