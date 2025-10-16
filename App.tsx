import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { PermissionsAndroid } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { Provider } from 'react-redux';
import { store as configureStore } from 'react-boilerplate-redux-saga-hoc';
import {
  PaperProvider,
  DefaultTheme,
  configureFonts,
  MD2LightTheme,
  MD2DarkTheme,
} from 'react-native-paper';
import InitialRouter from './app/navigation/initial_router';
import { fontConfig } from './app/resources/fonts';
import { COLORS } from './app/resources/colors';
import { ThemeProvider, useTheme } from './app/context/ThemeContext';
import { LanguageProvider } from './app/context/LanguageContext';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from './app/config/i18';
import InAppNotification from './app/screens/InAppNotification';

if (Text.defaultProps == null) {
  Text.defaultProps = {};
  Text.defaultProps.allowFontScaling = false;
}

if (TextInput.defaultProps == null) {
  TextInput.defaultProps = {};
  TextInput.defaultProps.allowFontScaling = false;
}

const initialState = {};
const store = configureStore(initialState);

const lightTheme = {
  ...MD2LightTheme,
  roundness: 3,
  colors: {
    ...DefaultTheme.colors,
    text: '#000',
    placeholder: '#919191',
    onPrimary: '#000000',
    primary: '#C4C4C2',
  },
  fonts: configureFonts({ config: fontConfig, isV3: false }),
};

const darkTheme = {
  ...MD2DarkTheme,
  roundness: 3,
  colors: {
    ...DefaultTheme.colors,
    text: '#000',
    placeholder: '#919191',
    onPrimary: '#000000',
    primary: '#C4C4C2',
  },
  fonts: configureFonts({ config: fontConfig, isV3: false }),
};

function App(): React.JSX.Element {
  const [network, setNetwork] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        setNetwork(false);
        openNetworkSettings();
      } else {
        setNetwork(true);
      }
    });

    return unsubscribeNetInfo;
  }, []);

  const openNetworkSettings = () => {
    const buttons = [
      {
        text: 'Open Settings',
        onPress: () => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
          } else {
            Linking.sendIntent('android.settings.SETTINGS');
          }
        },
      },
    ];

    if (Platform.OS === 'android') {
      buttons.unshift({
        text: 'Close',
        onPress: () => BackHandler.exitApp(),
      });
    }

    Alert.alert(
      'No Network Connection',
      'Please enable mobile data from the settings',
      buttons,
      { cancelable: false }
    );
  };

  const [pendingNotification, setPendingNotification] = useState<any>(null);

  useEffect(() => {
    checkPushNotificationPermission();

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM Data:', JSON.stringify(remoteMessage, null, 2));

      const data = remoteMessage.data || {};

      setPendingNotification(data);

      const title = data.scope || 'Notification';
      const body = data.message || 'You have a new message.';
      await onDisplayNotification({ title, body });
    });

    return unsubscribe;
  }, []);

  async function checkPushNotificationPermission() {
    if (Platform.OS === 'ios') {
      await messaging().requestPermission();
    } else {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      } catch (error) {
        console.warn('Notification permission error:', error);
      }
    }
  }

  async function onDisplayNotification({
    title,
    body,
  }: {
    title: string;
    body: string;
  }) {
    await notifee.requestPermission();

    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
      },
    });
  }

  const handleCloseNotification = () => {
    setPendingNotification(null);
  };

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppContainer
          pendingNotification={pendingNotification}
          onCloseNotification={handleCloseNotification}
        />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const AppContainer = ({
  pendingNotification,
  onCloseNotification,
}: {
  pendingNotification: any;
  onCloseNotification: () => void;
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const currentTheme = isDarkMode ? darkTheme : lightTheme;
  const bgColor = COLORS[theme].background;
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar
        translucent
        backgroundColor={bgColor}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <PaperProvider theme={currentTheme}>
        <LanguageProvider>
          <View
            style={{
              flex: 1,
              backgroundColor: bgColor,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            }}
          >
            <Provider store={store}>
              <I18nextProvider i18n={i18n}>
                {pendingNotification && (
                  <InAppNotification
                    title={pendingNotification.scope || 'Notification'}
                    body={pendingNotification.message || 'You have a new message.'}
                    data={JSON.stringify(pendingNotification, null, 2)}
                    onClose={onCloseNotification}
                  />
                )}
                <InitialRouter />
              </I18nextProvider>
            </Provider>
          </View>
        </LanguageProvider>
      </PaperProvider>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
