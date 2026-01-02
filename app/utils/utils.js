import AsyncStorage from '@react-native-async-storage/async-storage';
export async function getUserData() {
  return await AsyncStorage.getItem('user_data');
}
export async function getAccesstoken() {
  return await AsyncStorage.getItem("access_token");
}
export async function getrefreshtoken() {
  return await AsyncStorage.getItem("refresh_token");
}


