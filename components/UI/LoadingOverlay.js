import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "../../store/theme-context";

export default function LoadingOverlay() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary400} />
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.gray100,
    },
  });
