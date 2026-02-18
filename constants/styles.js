// ─────────────────────────────────────────────────────────────────────────────
// Palette: "Indigo Finance"
//
// Light mode uses a cool slate background (Tailwind slate-100) with a
// deep Indigo primary (#4F46E5) — the same hue used by Linear, Vercel, and
// many modern fintech apps.  Borders are soft slate-200 instead of harsh grays.
//
// Dark mode keeps eye-comfort as the priority but adds a subtle indigo tint to
// surfaces (#1C1B2E / #252441) so it reads as "branded dark" rather than
// generic charcoal.
//
// Income/expense colors are desaturated soft tones (not neon), and the
// balance number is ALWAYS white — never colored — matching Revolut, N26,
// Monzo, PayPal, and every other top finance app.
// ─────────────────────────────────────────────────────────────────────────────

const lightColors = {
  // Primary — Indigo (Tailwind indigo-600 / indigo-500)
  primary50:  "rgba(79,70,229,0.07)",
  primary100: "rgba(79,70,229,0.12)",
  primary200: "#4338CA",   // indigo-700 — icons & tinted text
  primary400: "#4F46E5",   // indigo-600 — active states
  primary500: "#4F46E5",   // indigo-600 — hero cards / buttons
  primary700: "#F5F3FF",   // very light violet — form section bg
  primary800: "#FFFFFF",   // header background

  // Accent
  accent500:  "#F59E0B",
  accent600:  "#D97706",

  // Semantic — income / expense (Tailwind emerald / red, darker for light bg)
  incomeColor:  "#059669",   // emerald-600
  incomeBg:     "rgba(5,150,105,0.08)",
  expenseColor: "#DC2626",   // red-600
  expenseBg:    "rgba(220,38,38,0.08)",

  // Error
  error50:    "rgba(220,38,38,0.08)",
  error500:   "#DC2626",

  // Neutral — Tailwind Slate (slightly blue-tinted for a "fresh" feel)
  gray50:     "#F8FAFC",   // slate-50
  gray100:    "#F1F5F9",   // slate-100 — main background
  gray500:    "#64748B",   // slate-500 — secondary text
  gray700:    "#475569",   // slate-600 — body text
  gray800:    "#0F172A",   // slate-900 — primary text (deep navy-black)

  // Functional
  success500:  "#059669",
  transfer500: "#7C3AED",   // violet-700

  // Surfaces
  surface:         "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  border:          "#E2E8F0",   // slate-200 — soft border
};

const darkColors = {
  // Primary — Indigo (same hue, brightened for dark backgrounds)
  primary50:  "rgba(99,102,241,0.1)",
  primary100: "rgba(99,102,241,0.18)",
  primary200: "#A5B4FC",   // indigo-300 — icons & tinted text on dark
  primary400: "#818CF8",   // indigo-400 — active tint
  primary500: "#6366F1",   // indigo-500 — buttons / hero cards
  primary700: "#1C1B2E",   // deep indigo surface — form section bg
  primary800: "#13121F",   // deepest bg — header / nav background

  // Accent
  accent500:  "#FBBF24",
  accent600:  "#F59E0B",

  // Semantic — income / expense (soft tones — NOT neon)
  incomeColor:  "#34D399",   // emerald-400 — soft sage green
  incomeBg:     "rgba(52,211,153,0.12)",
  expenseColor: "#F87171",   // red-400 — soft coral
  expenseBg:    "rgba(248,113,113,0.12)",

  // Error
  error50:    "rgba(248,113,113,0.12)",
  error500:   "#F87171",

  // Neutral — Slate on dark (warm enough to avoid blue-screen fatigue)
  gray50:     "#E2E8F0",   // slate-200
  gray100:    "#13121F",   // deepest bg — main background
  gray500:    "#94A3B8",   // slate-400 — muted text
  gray700:    "#CBD5E1",   // slate-300 — secondary text
  gray800:    "#F1F5F9",   // slate-100 — primary text (crisp off-white)

  // Functional
  success500:  "#34D399",
  transfer500: "#A78BFA",   // violet-400 — soft lavender

  // Surfaces — deep indigo-tinted dark
  surface:         "#1C1B2E",   // branded dark card background
  surfaceElevated: "#252441",   // slightly lighter for modals / elevated cards
  border:          "#2E2D4A",   // subtle indigo-tinted border
};

export const themes = {
  light: { colors: lightColors },
  dark:  { colors: darkColors },
};

export const GlobalStyles = { colors: darkColors };
