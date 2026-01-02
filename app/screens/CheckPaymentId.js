import React, { useCallback, useState } from 'react';
import { Text, ActivityIndicator, View, StyleSheet, ToastAndroid, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { fetchData } from '../api/api';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '../resources/colors';
import { useTheme } from '../context/ThemeContext';
import { wp } from '../resources/dimensions';

const CheckPaymentId = () => {
  const accessToken = useSelector(state => state.Auth?.accessToken);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const navigation = useNavigation();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const fetchProfileData = useCallback(async () => {
    if (!accessToken || !profileDetails?.driver_id) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchData(
        `profile/${profileDetails.driver_id}`,
        'GET',
        null,
        {
          Authorization: `${accessToken}`,
          driver_id: profileDetails.driver_id,
          device_id: await DeviceInfo.getUniqueId(),
        }
      );
      if (!data?.ok && data?.status === 'false') {
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'login-screen' }],
        });
        return;
      }
      if (
        (!data?.payment_id || data?.payment_id === '') &&
        data?.profile_status
      ) {
        // ToastAndroid.show('Please complete your payment details to continue.', ToastAndroid.SHORT);
        navigation.navigate('PaymentDocs', { showBackArrow: false });
      }
    } catch (error) {
      console.error('Profile API Error:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, profileDetails, navigation]);
  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  // ✅ Loader UI
  // if (!loading) {
  //   return (
  //     <View style={styles.container}>
  //       <View style={[
  //         styles.loaderCard,
  //         // { backgroundColor: '#1c1c1c' }
  //       ]}>
  //         <ActivityIndicator size="small" color={COLORS.dark.accent} />
  //         {/* <Text style={styles.loadingText}>Checking profile Information ...</Text> */}
  //       </View>
  //     </View>
  //   );
  // }
  return <View style={{ flex: 1, alignSelf: "center" }} />;
};

export default CheckPaymentId;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 1,
    bottom: wp(5), left: 0, right: wp(4.5),
  },
  loaderCard: {
    // alignItems: 'center',
    elevation: 5,
    width: wp(90),
    alignItems: "flex-end"
  },
  loadingText: {
    marginTop: 15,
    color: '#FFF',
    fontSize: 14,

  },
});
