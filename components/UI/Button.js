import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../store/theme-context";

function Button({ children, onPress, mode, style }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = getStyles(colors);

  return (
    <View style={style}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <View style={[styles.button, mode === "flat" && styles.flat]}>
          <Text style={[styles.buttonText, mode === "flat" && styles.flatText]}>
            {children}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export default Button;

const getStyles = (colors) =>
  StyleSheet.create({
    button: {
      borderRadius: 12,
      padding: 14,
      backgroundColor: colors.primary500,
      elevation: 2,
      shadowColor: "#000",
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
    },
    flat: {
      backgroundColor: "transparent",
      elevation: 0,
      shadowOpacity: 0,
    },
    buttonText: {
      color: "white",
      textAlign: "center",
      fontSize: 16,
      fontWeight: "600",
    },
    flatText: {
      color: colors.gray700,
    },
    pressed: {
      opacity: 0.8,
      backgroundColor: colors.primary400,
      borderRadius: 12,
    },
  });
