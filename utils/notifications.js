import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const REMINDER_IDENTIFIER = "spend-wise-12h-reminder";


async function requestPermissions() {
    // Channel MUST exist before requesting POST_NOTIFICATIONS on Android 13+
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("reminders", {
            name: "Reminders",
            importance: Notifications.AndroidImportance.HIGH,
            sound: "default",
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#6366f1",
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
            android: {
                allowAlert: true,
                allowSound: true,
                allowVibrate: true,
            },
        });
        finalStatus = status;
    }

    return finalStatus === "granted";
}


export async function setupReminderNotification(title, body) {
    try {
        const granted = await requestPermissions();
        if (!granted) {
            console.warn("Notification permission not granted — skipping reminder setup.");
            return;
        }

        await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => { });

        await Notifications.scheduleNotificationAsync({
            identifier: REMINDER_IDENTIFIER,
            content: {
                title,
                body,
                sound: "default",
                priority: Notifications.AndroidNotificationPriority.HIGH,
                channelId: "reminders",
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 43200, // 12 hours
                repeats: true,
            },
        });
    } catch (error) {
        console.warn("Failed to schedule reminder notification:", error);
    }
}

export async function scheduleBudgetWarningNotification(title, body) {
    try {
        const granted = await requestPermissions();
        if (!granted) {
            console.warn("Notification permission not granted — skipping budget warning.");
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: "default",
                priority: Notifications.AndroidNotificationPriority.HIGH,
                channelId: "reminders",
            },
            trigger: null, // trigger immediately
        });
    } catch (error) {
        console.warn("Failed to schedule budget warning notification:", error);
    }
}
