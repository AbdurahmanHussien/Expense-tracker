import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../store/theme-context";
import { getFormattedDate } from "../../utils/date";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function DatePickerInput({
  label,
  value,
  onDateChange,
  style,
  isInvalid,
  errorMessage,
}) {
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

  function onChangeDate(event, selectedDate) {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (event.type === "set" && selectedDate) {
      setDate(selectedDate);
      onDateChange(getFormattedDate(selectedDate));
    }
  }

  function confirmIOS() {
    onDateChange(getFormattedDate(date));
    setShowPicker(false);
  }

  function cancelIOS() {
    setShowPicker(false);
  }

  const dayName = DAY_NAMES[date.getDay()];
  const dayNum = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  const isToday = getFormattedDate(date) === getFormattedDate(new Date());

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        onPress={() => setShowPicker(true)}
        style={({ pressed }) => [
          styles.trigger,
          isInvalid && styles.triggerInvalid,
          pressed && styles.triggerPressed,
        ]}
      >
        <View style={styles.calendarIcon}>
          <Ionicons
            name="calendar-outline"
            size={22}
            color={colors.primary400}
          />
        </View>

        <View style={styles.dateInfo}>
          <Text style={styles.dateMain}>
            {dayName}, {month} {dayNum}
          </Text>
          <Text style={styles.dateSub}>
            {year}
            {isToday && (
              <Text style={[styles.todayBadge, { color: colors.primary400 }]}>
                {"  "}Today
              </Text>
            )}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
      </Pressable>

      {/* Android: native dialog */}
      {showPicker && Platform.OS === "android" && (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={onChangeDate}
          display="default"
        />
      )}

      {/* iOS: modal bottom sheet */}
      {Platform.OS === "ios" && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={cancelIOS}
        >
          <Pressable style={styles.modalOverlay} onPress={cancelIOS}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Pressable onPress={cancelIOS}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </Pressable>
                <Text style={styles.modalTitle}>Pick a Date</Text>
                <Pressable onPress={confirmIOS}>
                  <Text style={styles.modalDone}>Done</Text>
                </Pressable>
              </View>

              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={onChangeDate}
                textColor={colors.gray800}
                accentColor={colors.primary500}
                style={styles.iosPicker}
              />
            </View>
          </Pressable>
        </Modal>
      )}

      {isInvalid && errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
}

export default DatePickerInput;

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 4,
      marginVertical: 10,
    },
    label: {
      fontSize: 13,
      color: colors.gray700,
      marginBottom: 8,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    /* ── Trigger button ── */
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      gap: 12,
    },
    triggerPressed: {
      opacity: 0.7,
    },
    triggerInvalid: {
      backgroundColor: colors.error50,
      borderColor: colors.error500,
    },
    calendarIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.primary50,
      alignItems: "center",
      justifyContent: "center",
    },
    dateInfo: {
      flex: 1,
    },
    dateMain: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.gray800,
    },
    dateSub: {
      fontSize: 13,
      color: colors.gray500,
      marginTop: 2,
    },
    todayBadge: {
      fontWeight: "600",
    },

    /* ── iOS modal ── */
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    modalSheet: {
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 32,
    },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.gray500,
      alignSelf: "center",
      marginTop: 10,
      marginBottom: 8,
      opacity: 0.4,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalCancel: {
      fontSize: 16,
      color: colors.gray500,
      fontWeight: "500",
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.gray800,
    },
    modalDone: {
      fontSize: 16,
      color: colors.primary400,
      fontWeight: "700",
    },
    iosPicker: {
      height: 200,
      marginHorizontal: 16,
    },

    /* ── Error ── */
    errorText: {
      color: colors.error500,
      fontSize: 12,
      fontWeight: "500",
      marginTop: 6,
      marginLeft: 2,
    },
  });
