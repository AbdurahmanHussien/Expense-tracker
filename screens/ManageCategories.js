import { useState, useContext, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { useTheme } from "../store/theme-context";
import { AppContext } from "../store/app-context";
import {
  insertCategory as insertCategoryDB,
  deleteCategory as deleteCategoryDB,
  upsertBudget as upsertBudgetDB,
  deleteBudget as deleteBudgetDB,
} from "../utils/database";

const ICON_OPTIONS = [
  "restaurant", "fast-food", "cafe", "beer",
  "car", "bus", "airplane", "bicycle",
  "bag-handle", "cart", "shirt", "gift",
  "receipt", "home", "flash", "wifi",
  "film", "game-controller", "musical-notes", "headset",
  "medical", "fitness", "heart", "bandage",
  "school", "book", "library", "laptop",
  "cash", "card", "trending-up", "trending-down",
  "phone-portrait", "camera", "paw", "leaf",
  "ellipsis-horizontal-circle",
];

const COLOR_OPTIONS = [
  "#FF6B6B", "#FF8E53", "#FFA07A", "#FFD700",
  "#F7DC6F", "#ADFF2F", "#58D68D", "#4ECDC4",
  "#45B7D1", "#3498DB", "#2980B9", "#9B59B6",
  "#BB8FCE", "#E91E63", "#F06292", "#ADB5BD",
  "#78909C", "#8D6E63",
];

export default function ManageCategories({ navigation }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { categories, addCategory, deleteCategory, budgets, upsertBudget, deleteBudget } = useContext(AppContext);
  const styles = getStyles(colors);
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t("nav.categories") });
  }, [navigation, t]);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("ellipsis-horizontal-circle");
  const [selectedColor, setSelectedColor] = useState("#4ECDC4");
  const [budgetInput, setBudgetInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [budgetModalCat, setBudgetModalCat] = useState(null);
  const [budgetModalValue, setBudgetModalValue] = useState("");

  function openModal() {
    setName("");
    setSelectedIcon("ellipsis-horizontal-circle");
    setSelectedColor("#4ECDC4");
    setBudgetInput("");
    setModalVisible(true);
  }

  async function saveCategory() {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const id = await insertCategoryDB(name.trim(), selectedIcon, selectedColor, false);
      addCategory({ id, name: name.trim(), icon: selectedIcon, color: selectedColor, is_default: 0 });

      // Save budget if provided
      const limit = parseFloat(budgetInput);
      if (!isNaN(limit) && limit > 0) {
        await upsertBudgetDB(id, limit);
        upsertBudget(id, limit);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }

  function openBudgetModal(cat) {
    const existing = budgets.find((b) => b.category_id === cat.id);
    setBudgetModalCat(cat);
    setBudgetModalValue(existing ? existing.monthly_limit.toString() : "");
  }

  async function saveBudgetForCategory() {
    if (!budgetModalCat) return;
    const limit = parseFloat(budgetModalValue);
    if (!isNaN(limit) && limit > 0) {
      await upsertBudgetDB(budgetModalCat.id, limit);
      upsertBudget(budgetModalCat.id, limit);
    } else {
      await deleteBudgetDB(budgetModalCat.id);
      deleteBudget(budgetModalCat.id);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBudgetModalCat(null);
  }

  function confirmDelete(cat) {
    Alert.alert(
      t("categories.deleteCategory"),
      t("categories.deleteCategoryMsg", { name: cat.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            await deleteCategoryDB(cat.id);
            deleteCategory(cat.id);
          },
        },
      ]
    );
  }

  function renderCategory({ item }) {
    const budget = budgets.find((b) => b.category_id === item.id);
    return (
      <View style={styles.categoryRow}>
        <Pressable
          style={styles.categoryMain}
          onPress={() => openBudgetModal(item)}
        >
          <View style={[styles.iconCircle, { backgroundColor: item.color + "33" }]}>
            <Ionicons name={item.icon} size={22} color={item.color} />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.name}</Text>
            {budget && (
              <Text style={styles.budgetLabel}>
                {t("budget.limit")}: {budget.monthly_limit.toFixed(0)} EGP/mo
              </Text>
            )}
          </View>
        </Pressable>
        {item.is_default ? (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>{t("categories.default")}</Text>
          </View>
        ) : (
          <Pressable
            onPress={() => confirmDelete(item)}
            style={styles.deleteBtn}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error500} />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCategory}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <Pressable style={styles.addButton} onPress={openModal}>
        <Ionicons name="add-circle" size={22} color="white" />
        <Text style={styles.addButtonText}>{t("categories.addCategory")}</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => { }}>
            <Text style={styles.modalTitle}>{t("categories.newCategory")}</Text>

            <TextInput
              style={styles.nameInput}
              placeholder={t("categories.categoryNamePlaceholder")}
              placeholderTextColor={colors.gray500}
              value={name}
              onChangeText={setName}
              maxLength={30}
            />

            <Text style={styles.sectionLabel}>{t("categories.icon")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.iconScroll}
            >
              {ICON_OPTIONS.map((icon) => (
                <Pressable
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && {
                      backgroundColor: selectedColor + "44",
                      borderColor: selectedColor,
                    },
                  ]}
                >
                  <Ionicons
                    name={icon}
                    size={22}
                    color={selectedIcon === icon ? selectedColor : colors.gray500}
                  />
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>{t("categories.color")}</Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorDotSelected,
                  ]}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </Pressable>
              ))}
            </View>

            <View style={styles.previewRow}>
              <View style={[styles.previewCircle, { backgroundColor: selectedColor + "33" }]}>
                <Ionicons name={selectedIcon} size={24} color={selectedColor} />
              </View>
              <Text style={[styles.previewName, { color: colors.gray800 }]}>
                {name || t("categories.preview")}
              </Text>
            </View>

            {/* Budget input */}
            <Text style={styles.sectionLabel}>{t("budget.monthlyBudget")}</Text>
            <TextInput
              style={styles.nameInput}
              placeholder={t("budget.budgetPlaceholder")}
              placeholderTextColor={colors.gray500}
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.saveBtn,
                  (!name.trim() || isSaving) && styles.saveBtnDisabled,
                ]}
                onPress={saveCategory}
                disabled={!name.trim() || isSaving}
              >
                <Text style={styles.saveBtnText}>{t("common.save")}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Budget Edit Modal */}
      <Modal
        visible={!!budgetModalCat}
        transparent
        animationType="fade"
        onRequestClose={() => setBudgetModalCat(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setBudgetModalCat(null)}
        >
          <Pressable style={[styles.modalCard, { paddingBottom: 24 }]} onPress={() => { }}>
            <Text style={styles.modalTitle}>
              {t("budget.setBudget")} — {budgetModalCat?.name}
            </Text>
            <TextInput
              style={styles.nameInput}
              placeholder={t("budget.budgetPlaceholder")}
              placeholderTextColor={colors.gray500}
              value={budgetModalValue}
              onChangeText={setBudgetModalValue}
              keyboardType="numeric"
              autoFocus
            />
            <Text style={styles.budgetHint}>{t("budget.clearHint")}</Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setBudgetModalCat(null)}
              >
                <Text style={styles.cancelBtnText}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={saveBudgetForCategory}>
                <Text style={styles.saveBtnText}>{t("common.save")}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.gray100,
    },
    list: {
      padding: 16,
      paddingBottom: 100,
    },
    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 1,
      shadowColor: "#000",
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
    },
    separator: {
      height: 8,
    },
    iconCircle: {
      width: 46,
      height: 46,
      borderRadius: 15,
      justifyContent: "center",
      alignItems: "center",
    },
    categoryName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.gray800,
    },
    categoryMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    categoryInfo: {
      flex: 1,
    },
    budgetLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.gray500,
      marginTop: 2,
    },
    budgetHint: {
      fontSize: 11,
      color: colors.gray500,
      marginTop: 4,
      marginBottom: 12,
    },
    defaultBadge: {
      backgroundColor: colors.primary100,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    defaultBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primary400,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    deleteBtn: {
      padding: 4,
    },
    addButton: {
      position: "absolute",
      bottom: 24,
      left: 24,
      right: 24,
      backgroundColor: colors.primary500,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      elevation: 8,
      shadowColor: colors.primary500,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
    },
    addButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "700",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      paddingBottom: 40,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.gray800,
      marginBottom: 20,
      textAlign: "center",
    },
    nameInput: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: 14,
      fontSize: 16,
      color: colors.gray800,
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.gray500,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    iconScroll: {
      marginBottom: 20,
    },
    iconOption: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
      borderWidth: 1.5,
      borderColor: "transparent",
      backgroundColor: colors.surface,
    },
    colorGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 20,
    },
    colorDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    colorDotSelected: {
      borderWidth: 3,
      borderColor: "white",
      elevation: 4,
      shadowColor: "#000",
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewCircle: {
      width: 46,
      height: 46,
      borderRadius: 15,
      justifyContent: "center",
      alignItems: "center",
    },
    previewName: {
      fontSize: 16,
      fontWeight: "700",
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
    },
    cancelBtn: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelBtnText: {
      color: colors.gray500,
      fontWeight: "700",
      fontSize: 15,
    },
    saveBtn: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
      backgroundColor: colors.primary500,
      elevation: 3,
      shadowColor: colors.primary500,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      color: "white",
      fontWeight: "700",
      fontSize: 15,
    },
  });
