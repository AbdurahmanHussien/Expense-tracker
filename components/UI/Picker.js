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
        style={[styles.input, isInvalid && styles.inputInvalid]}
      >
        <Text style={selectedItem ? styles.inputText : styles.placeholderText}>
          {selectedItem ? selectedItem.label : "Select..."}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={colors.gray500}
        />
      </Pressable>
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label || "Select"}</Text>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.option,
                    item.value === selectedValue && styles.selectedOption,
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === selectedValue && styles.selectedOptionText,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === selectedValue && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary400}
                    />
                  )}
                </Pressable>
              )}
            />
          </View>
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
      marginVertical: 12,
    },
    label: {
      fontSize: 13,
      color: colors.gray700,
      marginBottom: 8,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 52,
    },
    inputInvalid: {
      backgroundColor: colors.error50,
      borderColor: colors.error500,
    },
    inputText: {
      color: colors.gray800,
      fontSize: 16,
    },
    placeholderText: {
      color: colors.gray500,
      fontSize: 16,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: 20,
      padding: 20,
      width: "80%",
      maxHeight: "60%",
      elevation: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.gray800,
      marginBottom: 16,
      textAlign: "center",
    },
    option: {
      padding: 16,
      borderRadius: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    selectedOption: {
      backgroundColor: colors.primary100,
    },
    optionText: {
      fontSize: 16,
      color: colors.gray800,
    },
    selectedOptionText: {
      color: colors.primary400,
      fontWeight: "600",
    },
  });
