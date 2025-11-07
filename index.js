import 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './App';

if (__DEV__) {
  require('./app/debugger/ReactotronConfig');
}

// 👇 Background message handler must be declared outside the component
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📩 Message handled in the background!', remoteMessage);
  try {
    const data = remoteMessage.data || {};
    const title = data.scope || 'Notification';
    const body = data.message || 'You have a new message.';
    // Create channel for Android
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });
    // Display notification
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        smallIcon: 'ic_launcher', // make sure you have this in res/mipmap
      },
    });
  } catch (error) {
    console.error('Error handling background message:', error);
  }
});

AppRegistry.registerComponent(appName, () => App);
