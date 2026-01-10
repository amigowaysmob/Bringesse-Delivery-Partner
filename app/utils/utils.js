import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export async function getUserData() {
  return await AsyncStorage.getItem('user_data');
}
export async function getAccesstoken() {
  return await AsyncStorage.getItem("access_token");
}
export async function getrefreshtoken() {
  return await AsyncStorage.getItem("refresh_token");
}

/**
 * Request location permission for both iOS and Android
 * Uses react-native-geolocation-service's requestAuthorization for iOS
 * @param {string} authorizationLevel - iOS only: 'whenInUse' or 'always' (default: 'whenInUse')
 * @returns {Promise<boolean>} Returns true if permission is granted, false otherwise
 */
export async function requestLocationPermission(authorizationLevel = 'whenInUse') {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to show your position on the map.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      // iOS - Use react-native-geolocation-service's requestAuthorization
      try {
        const result = await Geolocation.requestAuthorization(authorizationLevel);
        
        switch (result) {
          case 'granted':
            return true;
          case 'denied':
            Alert.alert(
              'Location Permission Denied',
              'Location permission is required to use this app. Please enable it in Settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings', 
                  onPress: () => Linking.openSettings() 
                },
              ]
            );
            return false;
          case 'restricted':
            Alert.alert(
              'Location Permission Restricted',
              'Location permission is restricted on this device. Please contact your administrator.',
              [{ text: 'OK' }]
            );
            return false;
          case 'disabled':
            Alert.alert(
              'Location Services Disabled',
              'Location services are disabled. Please enable them in Settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings', 
                  onPress: () => Linking.openSettings() 
                },
              ]
            );
            return false;
          default:
            console.warn('Unknown authorization status:', result);
            return false;
        }
      } catch (error) {
        console.error('Error requesting iOS location authorization:', error);
        return false;
      }
    }
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}


