import React, { useEffect, useState } from 'react';
import {
  Alert, BackHandler, Linking, Platform, StyleSheet, Text, TextInput, View, StatusBar, TouchableOpacity,
  Image, ActivityIndicator, ToastAndroid,
  Dimensions, NativeEventEmitter, NativeModules,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { PermissionsAndroid } from 'react-native';
import {
  SafeAreaProvider, SafeAreaView, useSafeAreaInsets,
} from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { Provider, useSelector } from 'react-redux';
import { store as configureStore } from 'react-boilerplate-redux-saga-hoc';
import {
  PaperProvider, DefaultTheme,
  configureFonts, MD2LightTheme,
  MD2DarkTheme, Card,
} from 'react-native-paper';
import InitialRouter from './app/navigation/initial_router';
import { fontConfig } from './app/resources/fonts';
import { ThemeProvider, useTheme } from './app/context/ThemeContext';
import { LanguageProvider } from './app/context/LanguageContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './app/config/i18';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from './app/navigation/RootNavigation';
import { fetchData } from './app/api/api';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { IMAGE_ASSETS } from './app/resources/images';
import HyperSdkReact from 'hyper-sdk-react';
const { width, height } = Dimensions.get('window');
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;
// Disable font scaling globally
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;

const store = configureStore({});

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

function App(): React.JSX.Element {
  const [network, setNetwork] = useState(true);
  const [notificationData, setNotificationData] = useState<any>(null);

  useEffect(() => {
    // block:start:create-hyper-services-instance

    HyperSdkReact.createHyperServices();

    // block:end:create-hyper-services-instance

    // Creating initiate payload JSON object
    // block:start:create-initiate-payload

    const initiate_payload = {
      requestId: 'test',
      service: 'in.juspay.hyperpay',
      payload: {
        action: 'initiate',
        merchantId: 'amigoways',
        clientId: 'amigoways',
        environment: 'production',
      },
    };

    // block:end:create-initiate-payload

    // Calling initiate on hyperService instance to boot up payment engine.
    // block:start:initiate-sdk

    HyperSdkReact.initiate(JSON.stringify(initiate_payload));

    // block:end:initiate-sdk
  }, []);

  // block:start:event-handling-initiate
  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NativeModules.HyperSdkReact);
    const eventListener = eventEmitter.addListener('HyperEvent', resp => {
      const data = JSON.parse(resp);
      const event = data.event || '';
      switch (event) {
        case 'initiate_result':
          // logging the initiate result
          console.log('Initiate result', data);
          break;
        default:
          console.log(data);
      }
    });
    return () => {
      eventListener.remove();
    };
  }, []);


  // NETWORK CHECK
  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (!state.isConnected) openNetworkSettings();
      else setNetwork(true);
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

  // Background notification press handler
  useEffect(() => {
    const unsubscribeBackground = notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
        const data = detail.notification?.data;
        if (data?.scope === 'new_booking') {
          await AsyncStorage.setItem('NOTIFICATION_DATA', JSON.stringify(data));
          navigate('PendingHistory'); // Navigate to pending bookings screen
        }
      }
    });
    return unsubscribeBackground;
  }, []);
  // FOREGROUND notifications
  useEffect(() => {
    checkPushNotificationPermission();

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const data = remoteMessage?.data || {};
      if (data.scope === 'new_booking' || data.scope === 'new_order') {
        await AsyncStorage.setItem('NOTIFICATION_DATA', JSON.stringify(data));
        setNotificationData(data);
        await onDisplayNotification({
          title: 'New Transport Booking',
          body: data.message || 'You have a new booking request.',
          data,
        });
      } else if (data.message === 'subscription_started') {
        ToastAndroid.show(data.message, ToastAndroid.LONG);
      }
    });

    // Check stored notification if app opened from killed state
    (async () => {
      const storedData = await AsyncStorage.getItem('NOTIFICATION_DATA');
      if (storedData) setNotificationData(JSON.parse(storedData));
    })();

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

  async function onDisplayNotification({ title, body, data }: { title: string; body: string; data?: any }) {
    await notifee.requestPermission();
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });
    await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
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
const MainApp = ({ notificationData, clearNotification }: { notificationData: any; clearNotification: () => void }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const currentTheme = isDark ? darkTheme : lightTheme;
  const profile = useSelector((state: any) => state.Auth?.profile);
  const [loading, setLoading] = useState(false);

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
        await AsyncStorage.setItem('ACCEPTEDBOOKING', JSON.stringify({
          message: res?.message,
          pickupLocation: res?.pickupLocation,
          dropLocation: res?.dropLocation,
          bookingUid: notificationData?.booking_uid,
          bId: notificationData?.booking_id,
          status: 'accepted',
        }));
        clearNotification();
        navigate('BookingAction', { bid: notificationData?.booking_id, acceptStatus: 'accept' });
      } else {
        showMessage({ message: res?.message, type: 'danger' });
        await AsyncStorage.removeItem('ACCEPTEDBOOKING');
        clearNotification();
      }
    } catch (e) {
      showMessage({ message: 'Failed to accept booking', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };
  const handleReject = async () => {
    // showMessage({ message: 'Booking rejected.', type: 'info' });
    clearNotification();
  };
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View style={[styles.container]}>
        <View style={{ flex: 1, opacity: notificationData ? 0.3 : 1, pointerEvents: notificationData ? 'none' : 'auto' }}>
          <InitialRouter />
        </View>

        <FlashMessage position="top" />

        {notificationData && profile?.driver_id && (
          <View style={styles.overlayContainer}>
            <TouchableOpacity activeOpacity={1} style={styles.overlayTouchable}>
              <Card style={[styles.cardContainer, { backgroundColor: isDark ? '#333' : '#FF3B30' }]}>
                <View style={styles.cardContent}>
                  <Image source={IMAGE_ASSETS.delivery_boy_image} style={styles.image} />
                  <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>{notificationData?.message || 'New Booking!'}</Text>
                    <Text style={styles.cardSubtitle}>Booking ID: {notificationData?.booking_uid}</Text>
                    <Text style={styles.label}>Pickup:</Text>
                    <Text style={styles.value}>{notificationData?.pickupLocation}</Text>
                    {notificationData?.dropLocation && <>
                      <Text style={styles.label}>Drop:</Text>
                      <Text style={styles.value}>{notificationData?.dropLocation}</Text>
                    </>}
                    {notificationData?.driver_fare && <>
                      <Text style={styles.label}>Driver Fare:</Text>
                      <Text style={styles.value}>{notificationData?.driver_fare}</Text>
                    </>}
                    {loading ? <ActivityIndicator size="small" color="#fff" style={{ marginTop: hp(1.5) }} /> :
                      <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={handleReject}>
                          <Text style={[styles.buttonText, { color: '#ff0000' }]}>Close</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={handleAccept}>
                          <Text style={styles.buttonText}>Accept</Text>
                        </TouchableOpacity>
                      </View>}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, height: '120%' },
  container: { flex: 1 },
  overlayContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 999,
  },
  overlayTouchable: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  cardContainer: { position: 'absolute', width: wp(92), alignSelf: 'center', borderRadius: 14, padding: wp(4), elevation: 8 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  image: { width: wp(22), height: wp(22), resizeMode: 'contain', marginRight: wp(3) },
  textContainer: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: wp(5), fontWeight: 'bold' },
  cardSubtitle: { color: '#fff', fontSize: wp(3.8), marginVertical: 3 },
  label: { color: '#fff', fontSize: wp(3.6), fontWeight: '600' },
  value: { color: '#fff', fontSize: wp(3.5) },
  buttonRow: { flexDirection: 'row', marginTop: hp(1.5), justifyContent: 'space-between' },
  button: { flex: 1, paddingVertical: hp(1.8), borderRadius: 8, alignItems: 'center', marginHorizontal: wp(1.5) },
  acceptButton: { backgroundColor: '#4CAF50' },
  rejectButton: { backgroundColor: '#fff' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: wp(4) },
});
export default App;