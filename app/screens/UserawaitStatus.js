import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { wp, hp } from '../resources/dimensions';
import { useDispatch, useSelector } from 'react-redux';
import LottieView from 'lottie-react-native'; // ✅ import Lottie
import { IMAGE_ASSETS } from '../resources/images';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { use } from 'i18next';
import { poppins } from '../resources/fonts';

const UserawaitStatus = ({ userstatus }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const siteDetails = useSelector(state => state.Auth?.siteDetails);
  const accessToken = useSelector(state => state.Auth?.accessToken);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const dispatch = useDispatch();
  const fetchProfileData = async () => {
    if (!accessToken || !profile?.driver_id) return;
    try {
      const data = await fetchData('profile/' + profileDetails?.driver_id, 'GET', null, {
        Authorization: `${accessToken}`,
        driver_id: profileDetails.driver_id,
        device_id: await DeviceInfo.getUniqueId(),
      });
      if (data?.status == 'false') {
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'login-screen' }],
        });
      }
      else {
        dispatch({ type: 'UPDATE_PROFILE', payload: data });
        dispatch({ type: 'PROFILE_DETAILS', payload: data });
      }
      console.log(data, 'Profile Data Fetched');
    } catch (error) {
      console.error('profile API Error:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchPeriodically = async () => {
      if (!isMounted) return;
      if (!userstatus) {
        await fetchProfileData();
      }
      // Call again after 5 seconds (5000 ms)
      if (isMounted) {
        setTimeout(fetchPeriodically, 5000);
      }
    };
    fetchPeriodically();
    return () => {
      isMounted = false; // cleanup to stop the loop when component unmounts
    };
  }, [userstatus, fetchProfileData]);

  // If userstatus is true (active), hide this component
  if (userstatus) return null;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: COLORS[theme].background },
      ]}
    >
      {/* Lottie Animation */}
      <LottieView
        source={IMAGE_ASSETS?.loading} // ✅ your Lottie file
        autoPlay
        loop
        style={styles.lottie}
      />
      {/* Optional Text */}
      <Text
        style={[poppins.regular.h5,
        styles.waitText,
        { color: COLORS[theme].textPrimary },
        ]}
      >
        {'Your account is under review. Please wait...'}
      </Text>
    </View>
  );
};
export default UserawaitStatus;
const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: wp(95),
    borderRadius: wp(4),
    borderColor: '#ccc', borderWidth: wp(0.4),
    height:wp(40),
  },
  lottie: {
    width: wp(50),
    height: wp(35),
    marginBottom:hp(4)
  },
  waitText: {
    fontSize: wp(3.5),
    fontWeight: '600',
    position: 'absolute', bottom: hp(1)
  },
});
