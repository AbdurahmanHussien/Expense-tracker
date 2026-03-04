import { TextInput, View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../store/theme-context";

function Input({
  label,
  style,
  inputStyle,
  textInputConfig,
  multiline,
  isInvalid,
  errorMessage,
}) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = getStyles(colors);

  return (
    <View style={[styles.inputContainer, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...textInputConfig}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          isInvalid && styles.inputInvalid,
          inputStyle,
        ]}
        placeholderTextColor={colors.gray500}
      />
      {isInvalid && errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
}

export default Input;

const getStyles = (colors) =>
  StyleSheet.create({
    inputContainer: {
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
      backgroundColor: colors.surface,
      color: colors.gray800,
      padding: 14,
      borderRadius: 14,
      fontSize: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    inputMultiline: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    inputInvalid: {
      backgroundColor: colors.error50,
      borderColor: colors.error500,
    },
    errorText: {
      color: colors.error500,
      fontSize: 11,
      fontWeight: "600",
      marginTop: 6,
      marginLeft: 2,
    },
  });
