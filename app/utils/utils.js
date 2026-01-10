import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

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
 * @returns {Promise<boolean>} Returns true if permission is granted, false otherwise
 */
export async function requestLocationPermission() {
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
      // iOS
      const permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      const checkResult = await check(permission);
      
      if (checkResult === RESULTS.GRANTED) {
        return true;
      }
      
      if (checkResult === RESULTS.DENIED) {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      }
      
      if (checkResult === RESULTS.BLOCKED) {
        Alert.alert(
          'Location Permission Required',
          'Location permission is required to use this app. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openSettings() },
          ]
        );
        return false;
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}


