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
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ToastAndroid,
  Dimensions,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { PermissionsAndroid } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { Provider, useSelector } from 'react-redux';
import { store as configureStore } from 'react-boilerplate-redux-saga-hoc';
import {
  PaperProvider,
  DefaultTheme,
  configureFonts,
  MD2LightTheme,
  MD2DarkTheme,
  Card,
} from 'react-native-paper';
import InitialRouter from './app/navigation/initial_router';
import { fontConfig } from './app/resources/fonts';
import { COLORS } from './app/resources/colors';
import { ThemeProvider, useTheme } from './app/context/ThemeContext';
import { LanguageProvider } from './app/context/LanguageContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './app/config/i18';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from './app/navigation/RootNavigation';
import { fetchData } from './app/api/api';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { IMAGE_ASSETS } from './app/resources/images';

// === Responsive Utils ===
const { width, height } = Dimensions.get('window');
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

// Disable font scaling globally
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;

const store = configureStore({});

// ------- THEME SETUP -------
const lightTheme = {
  ...MD2LightTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
    text: '#000',
  },
  fonts: configureFonts({ config: fontConfig, isV3: false }),
};

const darkTheme = {
  ...MD2DarkTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#000000',
    text: '#FFFFFF',
  },
  fonts: configureFonts({ config: fontConfig, isV3: false }),
};

// ------- MAIN APP -------
function App(): React.JSX.Element {
  const [network, setNetwork] = useState(true);
  const [notificationData, setNotificationData] = useState<any>(null);

  // NETWORK CHECK
  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        setNetwork(false);
        openNetworkSettings();
      } else setNetwork(true);
    });
    return unsubscribeNetInfo;
  }, []);

  const openNetworkSettings = () => {
    const buttons = [
      {
        text: 'Open Settings',
        onPress: () => {
          if (Platform.OS === 'ios') Linking.openURL('app-settings:');
          else Linking.sendIntent('android.settings.SETTINGS');
        },
      },
    ];
    if (Platform.OS === 'android') {
      buttons.unshift({ text: 'Close', onPress: () => BackHandler.exitApp() });
    }
    Alert.alert('No Network Connection', 'Please enable mobile data from settings', buttons, {
      cancelable: false,
    });
  };

  // FIREBASE NOTIFICATIONS
  useEffect(() => {
    checkPushNotificationPermission();

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const data = remoteMessage?.data || {};
      if (data.scope === 'new_booking') {
        await AsyncStorage.setItem('NOTIFICATION_DATA', JSON.stringify(data));
        setNotificationData(data);
      }
      await onDisplayNotification({
        title: data.scope || 'Notification',
        body: data.message || 'You have a new message.',
      });
    });

    return unsubscribe;
  }, []);

  async function checkPushNotificationPermission() {
    if (Platform.OS === 'ios') {
      await messaging().requestPermission();
    } else {
      try {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      } catch (error) {
        console.warn('Notification permission error:', error);
      }
    }
  }

  async function onDisplayNotification({ title, body }: { title: string; body: string }) {
    await notifee.requestPermission();
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });
    await notifee.displayNotification({
      title,
      body,
      android: { channelId, smallIcon: 'ic_launcher' },
    });
  }

  const clearNotification = async () => {
    await AsyncStorage.removeItem('NOTIFICATION_DATA');
    setNotificationData(null);
  };

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <PaperProvider theme={lightTheme}>
          <LanguageProvider>
            <Provider store={store}>
              <I18nextProvider i18n={i18n}>
                <MainApp notificationData={notificationData} clearNotification={clearNotification} />
              </I18nextProvider>
            </Provider>
          </LanguageProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

// ------- MAIN APP CONTENT -------
const MainApp = ({
  notificationData,
  clearNotification,
}: {
  notificationData: any;
  clearNotification: () => void;
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';
  const currentTheme = isDark ? darkTheme : lightTheme;
  const profile = useSelector((state: any) => state.Auth?.profile);
  const [loading, setLoading] = useState(false);

  // Accept Booking
  const handleAccept = async () => {
    if (!profile?.driver_id) {
      showMessage({ message: 'Invalid driver profile. Please log in again.', type: 'danger' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetchData('/transport/updatebooking', 'POST', {
        booking_status: 'accept',
        booking_id: notificationData?.booking_id,
        driver_id: profile?.driver_id,
      });
      if (res?.status) {
        showMessage({ message: res?.message, type: 'success' });
        ToastAndroid.show(res?.message, ToastAndroid.SHORT);
        clearNotification();
        navigate('BookingAction', { bid: notificationData?.booking_id });
      } else {
        showMessage({ message: res?.message, type: 'danger' });
      }
    } catch (e) {
      showMessage({ message: 'Failed to accept booking', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };
  const handleReject = async () => {
    showMessage({ message: 'Booking rejected.', type: 'info' });
    clearNotification();
  };
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View style={[styles.container, {  }]}>
        <InitialRouter />
        <FlashMessage position="top" />
        {notificationData && (
          <Card
            style={[
              styles.cardContainer,
              { backgroundColor: isDark ? '#333' : '#FF3B30', marginBottom: insets.bottom + hp(2) },
            ]}
          >
            <View style={styles.cardContent}>
              <Image source={IMAGE_ASSETS.delivery_boy_image} style={styles.image} />
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{notificationData?.message || 'New Booking!'}</Text>
                <Text style={styles.cardSubtitle}>Booking ID: {notificationData?.booking_uid}</Text>
                <Text style={styles.label}>Pickup:</Text>
                <Text style={styles.value}>{notificationData?.pickupLocation}</Text>
                <Text style={styles.label}>Drop:</Text>
                <Text style={styles.value}>{notificationData?.dropLocation}</Text>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" style={{ marginTop: hp(1.5) }} />
                ) : (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.button, styles.rejectButton]}
                      onPress={handleReject}
                    >
                      <Text style={styles.buttonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.acceptButton]}
                      onPress={handleAccept}
                    >
                      <Text style={styles.buttonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Card>
        )}
      </View>
    </SafeAreaView>
  );
};

// ------- STYLES -------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    height: '120%',
  },

  container: {
    flex: 1,
    height: '100%',
  },
  cardContainer: {
    position: 'absolute',
    width: wp(92),
    alignSelf: 'center',
    borderRadius: 14,
    padding: wp(4),
    elevation: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  image: {
    width: wp(22),
    height: wp(22),
    resizeMode: 'contain',
    marginRight: wp(3),
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#fff',
    fontSize: wp(5),
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: '#fff',
    fontSize: wp(3.8),
    marginVertical: 3,
  },
  label: {
    color: '#fff',
    fontSize: wp(3.6),
    fontWeight: '600',
  },
  value: {
    color: '#fff',
    fontSize: wp(3.5),
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: hp(1.5),
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: hp(1.8),
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: wp(1.5),
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF4D4F',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp(4),
  },
});

export default App;