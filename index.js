// index.js
import 'react-native-gesture-handler';
import { AppRegistry, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { name as appName } from './app.json';
import { navigate } from './app/navigation/RootNavigation';
import App from './App';

// DEV tools
if (__DEV__) {
  require('./app/debugger/ReactotronConfig');
}

// ------------------------------
// Helper: Schedule data removal from AsyncStorage
// ------------------------------
const scheduleDataRemoval = async (key, delayMs = 600000) => {
  try {
    console.log(`⏱ Scheduling deletion of ${key} in ${delayMs / 1000} seconds`);
    setTimeout(async () => {
      try {
        await AsyncStorage.removeItem(key);
        console.log(`🧹 ${key} removed from AsyncStorage after 10 minutes`);
      } catch (err) {
        console.error('Error removing stored data:', err);
      }
    }, delayMs);
  } catch (error) {
    console.error('Error scheduling data removal:', error);
  }
};

// ------------------------------
// Notifee: Background Event (notification tap)
// ------------------------------
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Notification pressed in background:', detail.notification);
    navigate('PendingHistory'); // Navigate to your screen
  }
});

// ------------------------------
// Notifee: Foreground Event (notification tap)
// ------------------------------
notifee.onForegroundEvent(({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Notification pressed in foreground:', detail.notification);
    navigate('PendingHistory'); // Navigate to your screen
  }
});

// ------------------------------
// FCM: Background message handler
// ------------------------------
messaging().setBackgroundMessageHandler(async remoteMessage => {
  try {
    const data = remoteMessage?.data || {};
    const title = data.scope === 'new_booking' ? 'New Transport Booking' : data.scope || 'Notification';
    const body = data.message || 'You have a new message.';

    // Optional: Save notification data temporarily
    if (data.scope === 'new_booking') {
      await AsyncStorage.setItem('NOTIFICATION_DATA', JSON.stringify(data));
      scheduleDataRemoval('NOTIFICATION_DATA', 10 * 60 * 1000); // 10 min
      console.log('💾 Notification data saved:', data);
    }

    // Create Android notification channel (high importance)
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    // Display local notification
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        sound: 'default',
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
      ios: { sound: 'default' },
    });
  } catch (error) {
    console.error('Error handling background message:', error);
  }
});

// ------------------------------
// FCM: Foreground message listener
// ------------------------------
messaging().onMessage(async remoteMessage => {
  try {
    const data = remoteMessage?.data || {};
    const title = data.scope === 'new_booking' ? 'New Transport Booking' : data.scope || 'Notification';
    const body = data.message || 'You have a new message.';

    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    await notifee.displayNotification({
      title,
      body,
      android: { channelId, smallIcon: 'ic_launcher', sound: 'default' },
      ios: { sound: 'default' },
    });
  } catch (err) {
    console.error('Foreground notification error:', err);
  }
});

// ------------------------------
// Polling: Display notification every second (for testing)
// ------------------------------
const startOneSecondNotificationLoop = async () => {
  setInterval(async () => {
    try {
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      await notifee.displayNotification({
        title: 'Reminder',
        body: 'This notification appears every second!',
        android: { channelId, smallIcon: 'ic_launcher', importance: AndroidImportance.HIGH },
        ios: { sound: 'default' },
      });
    } catch (err) {
      console.error('One-second notification error:', err);
    }
  }, 1000); // 1 second
};

// Start the interval when app loads
// startOneSecondNotificationLoop();

// ------------------------------
// Register main App component
// ------------------------------
AppRegistry.registerComponent(appName, () => App);
