// ─────────────────────────────────────────────────────────────────────────────
// Palette: "Indigo Finance" — v2 (comfort-tuned)
//
// Light mode:  Warm off-white background (#FAFAF9 stone-50) instead of cold
//              blue-tinted slate. Borders are warm gray-200, text is true
//              neutral gray. Primary stays Indigo for brand recognition but
//              income/expense colors are warmer and more muted.
//
// Dark mode:   Slightly warmer deep tones (#151520 / #1E1E2E) to avoid the
//              "blue screen" fatigue of cold dark themes. Surfaces have a very
//              subtle warm-violet tint. Text is warm off-white, never pure #FFF.
//
// Income = warm teal, Expense = warm rose, Transfer = soft lavender.
// ─────────────────────────────────────────────────────────────────────────────

const lightColors = {
  // Primary — Indigo
  primary50: "rgba(79,70,229,0.06)",
  primary100: "rgba(79,70,229,0.10)",
  primary200: "#4338CA",
  primary400: "#4F46E5",
  primary500: "#4F46E5",
  primary700: "#FAFAF9",   // warm off-white — form section bg
  primary800: "#FFFFFF",   // header background

  // Accent — warm amber
  accent500: "#F59E0B",
  accent600: "#D97706",

  // Semantic — warmer, more muted tones
  incomeColor: "#0D9488",   // teal-600 — warmer than emerald
  incomeBg: "rgba(13,148,136,0.08)",
  expenseColor: "#E11D48",   // rose-600 — warmer than pure red
  expenseBg: "rgba(225,29,72,0.07)",

  // Error — rose instead of harsh red
  error50: "rgba(225,29,72,0.07)",
  error500: "#E11D48",

  // Neutral — warm gray (stone-based, no blue tint)
  gray50: "#FAFAF9",   // stone-50
  gray100: "#F5F5F4",   // stone-100 — main background (warm)
  gray500: "#78716C",   // stone-500 — secondary text
  gray700: "#57534E",   // stone-600 — body text
  gray800: "#1C1917",   // stone-900 — primary text

  // Functional
  success500: "#0D9488",   // teal-600
  transfer500: "#7C3AED",   // violet-600

  // Surfaces — clean white with warm border
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  border: "#E7E5E4",   // stone-200 — warm border
};

const darkColors = {
  // Primary — Indigo (slightly warmer for dark)
  primary50: "rgba(129,140,248,0.08)",
  primary100: "rgba(129,140,248,0.15)",
  primary200: "#A5B4FC",
  primary400: "#818CF8",
  primary500: "#6366F1",
  primary700: "#1A1A2E",   // warm deep indigo — form section bg
  primary800: "#141422",   // deepest bg — header / nav

  // Accent
  accent500: "#FBBF24",
  accent600: "#F59E0B",

  // Semantic — soft, warm pastels for dark bg
  incomeColor: "#2DD4BF",   // teal-400 — warm mint
  incomeBg: "rgba(45,212,191,0.10)",
  expenseColor: "#FB7185",   // rose-400 — warm coral
  expenseBg: "rgba(251,113,133,0.10)",

  // Error — warm rose
  error50: "rgba(251,113,133,0.10)",
  error500: "#FB7185",

  // Neutral — warm gray for dark (no blue fatigue)
  gray50: "#D6D3D1",   // stone-300
  gray100: "#141422",   // main dark background (warm)
  gray500: "#A8A29E",   // stone-400 — muted text
  gray700: "#D6D3D1",   // stone-300 — secondary text
  gray800: "#F5F5F4",   // stone-100 — primary text (warm off-white)

  // Functional
  success500: "#2DD4BF",   // teal-400
  transfer500: "#A78BFA",   // violet-400

  // Surfaces — warm deep tones
  surface: "#1E1E30",   // warm dark card
  surfaceElevated: "#282842",   // warm elevated (modals)
  border: "#2E2D45",   // warm subtle border
};

export const themes = {
  light: { colors: lightColors },
  dark: { colors: darkColors },
};

export const GlobalStyles = { colors: darkColors };
