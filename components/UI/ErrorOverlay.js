import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../store/theme-context";
import Button from "./Button";

function ErrorOverlay({ message, onConfirm }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>An error occurred!</Text>
      <Text style={styles.text}>{message}</Text>
      <Button onPress={onConfirm}>Okay</Button>
    </View>
  );
}

export default ErrorOverlay;

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.gray100,
      padding: 24,
    },
    text: {
      color: colors.gray700,
      textAlign: "center",
      marginBottom: 24,
      fontSize: 15,
    },
    title: {
      color: colors.error500,
      textAlign: "center",
      marginBottom: 16,
      fontSize: 24,
      fontWeight: "700",
    },
  });
