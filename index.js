import 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { AppRegistry, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { name as appName } from './app.json';
import { navigate } from './app/navigation/RootNavigation';

import App from './App';

if (__DEV__) {
  require('./app/debugger/ReactotronConfig');
}

// 🕓 Helper function: schedule deletion after 10 minutes
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

// Background handler for notification taps
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Notification pressed in background:', detail.notification);
    navigate('PendingHistory'); // Navigate to pending bookings screen
  }
});

// Foreground handler
notifee.onForegroundEvent(({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Notification pressed in foreground:', detail.notification);
    navigate('PendingHistory'); // Navigate to pending bookings screen
  }
});
// 👇 Background message handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  try {
    const data = remoteMessage?.data || {};
    const title = data.scope === 'new_booking' ? 'New Transport Booking' : data.scope || 'Notification';
    const body = data.message || 'You have a new message.';

    // Store notification data if it's a booking
    // if (data.scope === 'new_booking') {
    //   await AsyncStorage.setItem('NOTIFICATION_DATA', JSON.stringify(data));
    //   scheduleDataRemoval('NOTIFICATION_DATA', 10 * 60 * 1000);
    //   console.log('💾 Notification data saved:', data);
    // }

    // 🔔 Create Android notification channel with default sound
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      sound: 'default', // ensures default notification sound
      importance: AndroidImportance.HIGH,
    });

    // 📱 Display local notification
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        smallIcon: 'ic_launcher', // ensure this exists
        sound: 'default', // default sound
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
      ios: {
        sound: 'default', // default iOS notification sound
      },
    });
  } catch (error) {
    console.error('Error handling background message:', error);
  }
});

AppRegistry.registerComponent(appName, () => App);
