// index.js
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
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
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Notification pressed in background:', detail.notification);
    navigate('PendingHistory'); // Navigate to your screen
  }
});
notifee.onForegroundEvent(({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Notification pressed in foreground:', detail.notification);
    navigate('PendingHistory'); // Navigate to your screen
  }
});
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
AppRegistry.registerComponent(appName, () => App);
