import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../store/theme-context";
import { getFormattedDate } from "../../utils/date";

function DatePickerInput({ label, value, onDateChange, style, isInvalid }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = getStyles(colors);
  const [date, setDate] = useState(() => {
    if (value) {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  });
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) setDate(parsed);
    }
  }, [value]);

  useEffect(() => {
    if (!value) {
      onDateChange(getFormattedDate(new Date()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeHandler(event, selectedDate) {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (event.type === "set" && selectedDate) {
      setDate(selectedDate);
      onDateChange(getFormattedDate(selectedDate));
    }
  }

  function showPickerHandler() {
    setShowPicker(true);
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={showPickerHandler}
        style={[styles.input, isInvalid && styles.inputInvalid]}
      >
        <Text style={styles.inputText}>{getFormattedDate(date)}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={changeHandler}
          display={Platform.OS === "ios" ? "spinner" : "default"}
        />
      )}
    </View>
  );
}

export default DatePickerInput;

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 4,
      marginVertical: 12,
      flex: 1,
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
      fontSize: 16,
      minHeight: 52,
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputText: {
      color: colors.gray800,
      fontSize: 16,
    },
    inputInvalid: {
      backgroundColor: colors.error50,
      borderColor: colors.error500,
    },
  });
