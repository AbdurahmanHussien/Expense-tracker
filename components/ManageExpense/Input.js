import { TextInput, View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../store/theme-context";

function Input({ label, style, textInputConfig, multiline, isInvalid }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = getStyles(colors);

  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...textInputConfig}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          isInvalid && styles.inputInvalid,
        ]}
        placeholderTextColor={colors.gray500}
      />
    </View>
  );
}

export default Input;

const getStyles = (colors) =>
  StyleSheet.create({
    inputContainer: {
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
      color: colors.gray800,
      padding: 14,
      borderRadius: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputMultiline: {
      minHeight: 100,
      textAlignVertical: "top",
    },
    inputContainerInvalid: {
      backgroundColor: colors.error50,
    },
    inputInvalid: {
      backgroundColor: colors.error50,
      borderColor: colors.error500,
    },
  });
