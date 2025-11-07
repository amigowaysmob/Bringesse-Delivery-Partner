import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, Text, StyleSheet,
  Image, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { wp, hp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { useDispatch, useSelector } from 'react-redux';
import { fetchData } from '../api/api';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
const UserProfileCard = ({ userstatus }) => {
  const [isOnline] = useState(userstatus);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const siteDetails = useSelector(state => state.Auth?.siteDetails);
  const accessToken = useSelector(state => state.Auth?.accessToken);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const dispatch = useDispatch();
  const fullName = `${profileDetails?.first_name || ''} ${profileDetails?.last_name || ''}`.trim();
  const address = profileDetails?.location || t('No address available');
  useEffect(() => {
    fetchProfileData();
  }, []);
  const navigation = useNavigation();

  const fetchProfileData = async () => {
    // Alert.alert( siteDetails?.media_url)
    if (!accessToken || !profileDetails?.driver_id) return;
    try {
      const data = await fetchData('profile/' + profileDetails?.driver_id, 'GET', null, {
        Authorization: `${accessToken}`,
        driver_id: profileDetails.driver_id,
        device_id: await DeviceInfo.getUniqueId(),
      });
      if (!data?.ok && data?.status == 'false') {
        // Alert.alert('Session Expired', 'Please log in again.', )
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'login-screen' }],
        });
      }
      dispatch({
        type: 'PROFILE_DETAILS',
        payload: data,
      });
    } catch (error) {
      console.error('profile API Error:', error);
    }
  };

  if (!profileDetails?.live_status) return null;

  return (
    <>
      <View style={[
        styles.card,
        { backgroundColor: COLORS[theme].background }
      ]}>
        <Image
          source={{ uri: siteDetails?.media_url + 'drivers/images/' + profileDetails?.driver_image }}
          style={styles.profileImage}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", width: wp(68) }}>
            <View style={styles.infoContainer}>
              <Text numberOfLines={1} style={[
                poppins.regular.h8,
                styles.nameText,
                { color: COLORS[theme].textPrimary }
              ]}>
                {profileDetails?.first_name + ' ' + profileDetails?.last_name || t('No Name')}
              </Text>
              <Text numberOfLines={2} style={[
                poppins.regular.h9,
                styles.addressText,
                { color: COLORS[theme].primary }
              ]}>
                {address}
              </Text>
            </View>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS[theme].cardBackground, paddingHorizontal: wp(1) ,height:wp(6),borderRadius:wp(1)}}>
                <Text style={[
                  poppins.regular.h6,
                  { color: COLORS[theme].primary, alignSelf: "center" }
                ]}>
                  {` ${profileDetails?.rating} `}
                </Text>
                <MaterialCommunityIcon
                  name={'star'}
                  size={wp(4.5)}
                  color={COLORS[theme].textPrimary}
                />
              </View>
            </View>
          </View>

          {/* Buttons-like views */}
          <View style={styles.buttonRow}>
            <View style={[styles.infoBox, { backgroundColor: COLORS[theme].card }]}>
              <Text style={[poppins.medium.h8, { color: COLORS[theme].textPrimary }]}>
                {`${profileDetails?.currency_symbol} ${profileDetails?.wallet_balance}`}
              </Text>
              <Text style={[poppins.medium.h8, { color: COLORS[theme].textPrimary }]}>
                {t('balance')}
              </Text>
            </View>
            <View style={[styles.infoBox, { backgroundColor: COLORS[theme].card }]}>
              <Text style={[poppins.medium.h8, { color: COLORS[theme].textPrimary }]}>
                {profileDetails?.order_completed}
              </Text>
              <Text style={[poppins.medium.h8, { color: COLORS[theme].textPrimary }]}>
                {t('completed')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

export default UserProfileCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    borderRadius: wp(2),
    borderWidth: wp(0.3),
    borderColor: '#ccc',
    margin: wp(2),
  },
  profileImage: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    marginRight: wp(4),
    backgroundColor: '#e0e0e0',
  },
  infoContainer: {
    width: wp(40)
  },
  nameText: {
    marginBottom: hp(0.5),
  },
  addressText: {
    marginBottom: hp(0.5),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1),
    width: wp(68),
  },
  infoBox: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: wp(2),
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: wp(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
