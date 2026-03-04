import { useContext, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { AppContext } from "../store/app-context";
import { useTheme } from "../store/theme-context";
import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import IconButton from "../components/UI/IconButton";

function AllExpenses() {
  const { transactions, accounts, categories } = useContext(AppContext);
  const { theme } = useTheme();
  const colors = theme.colors;
  const { t } = useTranslation();
  const styles = getStyles(colors);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState(null);
  const [filterCategoryId, setFilterCategoryId] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(() => {
    let result = transactions;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((tx) =>
        tx.description.toLowerCase().includes(query)
      );
    }

    if (filterType) {
      result = result.filter((tx) => tx.type === filterType);
    }

    if (filterCategoryId) {
      result = result.filter((tx) => tx.category_id === filterCategoryId);
    }

    return result;
  }, [transactions, searchQuery, filterType, filterCategoryId]);

  const typeFilters = [
    { key: null, label: t("search.all"), icon: "layers-outline" },
    { key: "expense", label: t("form.expense"), icon: "arrow-up-circle-outline" },
    { key: "income", label: t("form.income"), icon: "arrow-down-circle-outline" },
    { key: "transfer", label: t("form.transfer"), icon: "swap-horizontal-outline" },
  ];

  const hasFilters = searchQuery || filterType || filterCategoryId;

  async function exportToCSV() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const header = "Date,Type,Category,Account,Amount,Description\n";
      const rows = filtered.map(tx => {
        const cat = categories.find(c => c.id === tx.category_id);
        const catName = cat ? cat.name : "";
        const acc = accounts.find(a => a.id === tx.account_id);
        const accName = acc ? acc.name : "";

        // Wrap every text field in quotes and escape internal double-quotes
        const csvField = (val) => `"${String(val).replace(/"/g, '""')}"`;

        return `${tx.date.toISOString().split('T')[0]},${csvField(tx.type)},${csvField(catName)},${csvField(accName)},${tx.amount},${csvField(tx.description || "")}`;
      }).join("\n");

      const csvData = header + rows;

      const uri = FileSystem.documentDirectory + "transactions_export.csv";
      await FileSystem.writeAsStringAsync(uri, csvData, { encoding: "utf8" });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "text/csv",
          dialogTitle: t("all.export"),
          UTI: "public.comma-separated-values-text"
        });
      }
    } catch (err) {
      console.error(err);
      alert(t("all.exportError"));
    }
  }

  return (
    <View style={styles.container}>
      {/* Search and Export Bar */}
      <View style={styles.topRow}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Ionicons
            name="search"
            size={18}
            color={searchFocused ? colors.primary400 : colors.gray500}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t("search.placeholder")}
            placeholderTextColor={colors.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.gray500} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]}
          onPress={exportToCSV}
        >
          <Ionicons name="download-outline" size={22} color={colors.primary500} />
        </Pressable>
      </View>

      {/* Type Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.filterRow}
        contentContainerStyle={styles.filterRowContent}
      >
        {typeFilters.map((f) => {
          const active = filterType === f.key;
          return (
            <Pressable
              key={f.key ?? "all"}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilterType(f.key)}
            >
              <Ionicons
                name={f.icon}
                size={15}
                color={active ? "#FFF" : colors.gray500}
              />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}

        {/* Category filter chips */}
        {categories.map((cat) => {
          const active = filterCategoryId === cat.id;
          return (
            <Pressable
              key={`cat-${cat.id}`}
              style={[
                styles.chip,
                active && { backgroundColor: cat.color, borderColor: cat.color },
              ]}
              onPress={() => setFilterCategoryId(active ? null : cat.id)}
            >
              <Ionicons
                name={cat.icon}
                size={15}
                color={active ? "#FFF" : cat.color}
              />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Results count */}
      {hasFilters && (
        <View style={styles.resultBar}>
          <View style={styles.resultPill}>
            <Text style={styles.resultText}>
              {t("search.results", { count: filtered.length })}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setSearchQuery("");
              setFilterType(null);
              setFilterCategoryId(null);
            }}
            hitSlop={8}
          >
            <Text style={styles.clearText}>{t("search.clearAll")}</Text>
          </Pressable>
        </View>
      )}

      <ExpensesOutput
        transactions={filtered}
        periodName={t("all.total")}
        fallbackText={t("summary.noTransactions")}
      />
    </View>
  );
}

export default AllExpenses;

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.gray100,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
      gap: 12,
    },
    searchBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 11,
      gap: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    searchBarFocused: {
      borderColor: colors.primary400,
      backgroundColor: colors.surface,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.gray800,
      padding: 0,
    },
    filterRow: {
      maxHeight: 52,
    },
    filterRowContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 24,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary500,
      borderColor: colors.primary500,
      elevation: 2,
      shadowColor: colors.primary500,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.gray500,
    },
    chipTextActive: {
      color: "#FFF",
    },
    resultBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 6,
    },
    resultPill: {
      backgroundColor: colors.primary50,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
    },
    resultText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary400,
    },
    clearText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary400,
    },
    exportBtn: {
      width: 44,
      height: 44,
      backgroundColor: colors.surface,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    pressed: {
      opacity: 0.7,
      backgroundColor: colors.gray200,
    },
  });
