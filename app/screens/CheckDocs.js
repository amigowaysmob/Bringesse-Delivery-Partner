import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchData } from '../api/api';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ToastAndroid } from 'react-native';
const CheckDocs = () => {
  const accessToken = useSelector(state => state.Auth?.accessToken);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );
  const navigation = useNavigation();
  const fetchProfileData = async () => {
    if (!accessToken || !profileDetails?.driver_id) return;
    try {
      const data = await fetchData('profile/' + profileDetails?.driver_id, 'GET', null, {
        Authorization: `${accessToken}`,
        driver_id: profileDetails.driver_id,
        device_id: await DeviceInfo.getUniqueId(),
      });
      if (!data?.ok && data?.status == 'false') {
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'login-screen' }],
        });
      }
      if (
        !data?.aadhar_front  
        && data?.profile_status
      ) {
        ToastAndroid.show('Please complete your document upload to continue.', ToastAndroid.SHORT);
        return navigation.navigate('UploadDriverDocs', { showBackArrow: false });
      };
    } catch (error) {
      console.error('profile API Error:', error);
    }
  };
  return (
    <>
    </>
  );
};
export default CheckDocs;