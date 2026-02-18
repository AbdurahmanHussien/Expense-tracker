import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../store/theme-context";

function Picker({ label, selectedValue, onValueChange, items, style, isInvalid }) {
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = getStyles(colors);
  const selectedItem = items.find((item) => item.value === selectedValue);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          styles.input,
          isInvalid && styles.inputInvalid,
          pressed && styles.inputPressed,
        ]}
      >
        <View style={styles.inputLeft}>
          {selectedItem?.icon && (
            <View
              style={[
                styles.inputIcon,
                { backgroundColor: (selectedItem.color || colors.primary400) + "26" },
              ]}
            >
              <Ionicons
                name={selectedItem.icon}
                size={16}
                color={selectedItem.color || colors.primary400}
              />
            </View>
          )}
          {selectedItem?.walletIcon && (
            <View style={[styles.inputIcon, { backgroundColor: colors.primary100 }]}>
              <Ionicons name="wallet" size={16} color={colors.primary400} />
            </View>
          )}
          <Text style={selectedItem ? styles.inputText : styles.placeholderText}>
            {selectedItem ? selectedItem.label : "Select..."}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={18}
          color={isInvalid ? colors.error500 : colors.gray500}
        />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            {/* Drag handle */}
            <View style={styles.sheetHandle} />

            <Text style={styles.modalTitle}>{label || "Select"}</Text>

            <FlatList
              data={items}
              keyExtractor={(item) =>
                item.value != null ? item.value.toString() : "null"
              }
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.selectedOption,
                      pressed && styles.optionPressed,
                    ]}
                    onPress={() => {
                      onValueChange(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <View style={styles.optionLeft}>
                      {/* Category icon */}
                      {item.icon && (
                        <View
                          style={[
                            styles.optionIconCircle,
                            {
                              backgroundColor:
                                (item.color || colors.primary400) + "26",
                            },
                          ]}
                        >
                          <Ionicons
                            name={item.icon}
                            size={17}
                            color={item.color || colors.primary400}
                          />
                        </View>
                      )}
                      {/* Wallet icon for account items */}
                      {!item.icon && item.walletIcon && (
                        <View
                          style={[
                            styles.optionIconCircle,
                            { backgroundColor: colors.primary100 },
                          ]}
                        >
                          <Ionicons
                            name="wallet"
                            size={17}
                            color={colors.primary400}
                          />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.selectedOptionText,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={colors.primary400}
                        />
                      </View>
                    )}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default Picker;

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 4,
      marginVertical: 10,
    },
    label: {
      fontSize: 12,
      color: colors.gray500,
      marginBottom: 8,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    input: {
      backgroundColor: colors.gray100,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 52,
    },
    inputPressed: {
      opacity: 0.8,
    },
    inputInvalid: {
      backgroundColor: colors.error50,
      borderColor: colors.error500,
    },
    inputLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    inputIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    inputText: {
      color: colors.gray800,
      fontSize: 15,
      fontWeight: "500",
    },
    placeholderText: {
      color: colors.gray500,
      fontSize: 15,
    },

    /* ── Bottom Sheet Modal ── */
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingBottom: 32,
      paddingTop: 12,
      maxHeight: "65%",
      elevation: 20,
      shadowColor: "#000",
      shadowRadius: 20,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.gray800,
      marginBottom: 14,
      textAlign: "center",
      letterSpacing: 0.1,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },

    /* ── Options ── */
    option: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 14,
    },
    optionPressed: {
      backgroundColor: colors.primary50,
    },
    selectedOption: {
      backgroundColor: colors.primary100,
    },
    optionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    optionIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    optionText: {
      fontSize: 16,
      color: colors.gray800,
      fontWeight: "500",
    },
    selectedOptionText: {
      color: colors.primary400,
      fontWeight: "700",
    },
    checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary100,
      justifyContent: "center",
      alignItems: "center",
    },
  });
