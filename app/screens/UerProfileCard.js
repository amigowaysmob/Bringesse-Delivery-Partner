import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, Text, StyleSheet, Image, ActivityIndicator,
  Alert,
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const UserProfileCard = ({ userstatus }) => {
  const [isOnline] = useState(userstatus);
  const [loadingRemaining, setLoadingRemaining] = useState(false);
  const [remainingCalls, setRemainingCalls] = useState(null);

  const { theme } = useTheme();
  const { t } = useTranslation();
  const siteDetails = useSelector(state => state.Auth?.siteDetails);
  const accessToken = useSelector(state => state.Auth?.accessToken);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const fullName = `${profileDetails?.first_name || ''} ${profileDetails?.last_name || ''}`.trim();
  const address = profileDetails?.location || t('No address available');

  // 🔹 Fetch main profile data once and on screen focus
  useEffect(() => {
    fetchProfileData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
      fetchRemainingCalls(); // Fetch remaining calls when screen is focused
    }, [])
  );
  // 🔹 Fetch Profile API
  const fetchProfileData = async () => {
    if (!accessToken || !profileDetails?.driver_id) return;
    try {
      const data = await fetchData('profile/' + profileDetails?.driver_id, 'GET', null, {
        Authorization: `${accessToken}`,
        driver_id: profileDetails.driver_id,
        device_id: await DeviceInfo.getUniqueId(),
      });
      // Alert.alert(JSON.stringify(data))
      if (!data?.ok && data?.status == 'false') {
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
      console.error('Profile API Error:', error);
    }
  };

  // 🔹 Fetch Remaining Calls API
  const fetchRemainingCalls = async () => {
    if (!accessToken || !profileDetails?.driver_id) return;
    setLoadingRemaining(true);
    try {
      const res = await fetchData(`remainingcalls/${profileDetails.driver_id}`, 'GET', null, {
        Authorization: `${accessToken}`,
        driver_id: profileDetails.driver_id,
        device_id: await DeviceInfo.getUniqueId(),
      });
      if (res?.ok && res?.data) {
        setRemainingCalls(res.data.remaining_count);
      Alert.alert(JSON.stringify(res.data));

      } else {
        console.warn('Failed to fetch remaining calls');
      }
    } catch (error) {
      console.error('Remaining Calls API Error:', error);
    } finally {
      setLoadingRemaining(false);
    }
  };
  if (!profileDetails?.live_status) return null;
  return (
    <View
      style={[
        { backgroundColor: COLORS[theme].background, alignItems: "center", height: wp(46), borderRadius: wp(2), width: wp(98), alignSelf: "center" }
      ]}
    >
      {/* ---------- PROFILE CARD ---------- */}
      <View style={[styles.card, { backgroundColor: COLORS[theme].background }]}>
        <Image
          source={{ uri: siteDetails?.media_url + 'drivers/images/' + profileDetails?.driver_image }}
          style={styles.profileImage}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", width: wp(68) }}>
            <View style={styles.infoContainer}>
              <Text numberOfLines={1} style={[poppins.regular.h8, styles.nameText, { color: COLORS[theme].textPrimary }]}>
                {fullName || t('No Name')}
              </Text>
              <Text numberOfLines={2} style={[poppins.regular.h9, styles.addressText, { color: COLORS[theme].primary, fontSize: wp(2.3) }]}>
                {address}
              </Text>
            </View>
            <View>
              {profileDetails?.rating !== null && profileDetails?.rating !== undefined && (
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: COLORS[theme].cardBackground,
                  paddingHorizontal: wp(1),
                  height: wp(6),
                  borderRadius: wp(1)
                }}>
                  <Text style={[poppins.regular.h6, { color: COLORS[theme].primary, alignSelf: "center" }]}>
                    {profileDetails?.rating}
                  </Text>
                  <MaterialCommunityIcon
                    name={'star'}
                    size={wp(4.5)}
                    color={COLORS[theme].textPrimary}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
      {/* ---------- STATS BOXES ---------- */}
      <View style={styles.buttonRow}>
        {/* Wallet Balance */}
        <View style={[styles.infoBox, { backgroundColor: COLORS[theme].card }]}>
          <Text style={[poppins.medium.h8, { color: COLORS[theme].textPrimary }]}>
            {`${profileDetails?.currency_symbol || ''} ${profileDetails?.wallet_balance || 0}`}
          </Text>
          <Text style={[poppins.medium.h9, { color: COLORS[theme].textPrimary, textTransform: "capitalize" }]}>
            {t('balance')}
          </Text>
        </View>
        {/* Completed Orders */}
        <View style={[styles.infoBox, { backgroundColor: COLORS[theme].card }]}>
          <Text style={[poppins.medium.h8, { color: COLORS[theme].textPrimary }]}>
            {profileDetails?.order_completed || 0}
          </Text>
          <Text style={[poppins.medium.h9, { color: COLORS[theme].textPrimary, textTransform: "capitalize" }]}>
            {t('completed')}
          </Text>
        </View>

        {/* Remaining Calls */}
        <View style={[styles.infoBox, { backgroundColor: COLORS[theme].accent }]}>
          {loadingRemaining ? (
            <ActivityIndicator color={COLORS[theme].white} size={wp(6)} />
          ) : (
            <>
              <Text style={[poppins.medium.h8, { color: COLORS[theme].white }]}>
                {remainingCalls !== null ? remainingCalls : profileDetails?.remaining_count || 0}
              </Text>
              <Text style={[poppins.medium.h9, { color: COLORS[theme].white, textTransform: "capitalize" }]}>
                {t('Remaining Calls')}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
};
export default UserProfileCard;
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: wp(2),
    marginTop: hp(1.2),
    borderWidth: wp(0.3),
    borderColor: '#ccc',
    margin: wp(2), 
    marginHorizontal: wp(4),
  },
  profileImage: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    marginRight: wp(4),
    backgroundColor: '#e0e0e0',
  },
  infoContainer: { width: wp(40) },
  nameText: { marginBottom: hp(0.5) ,textTransform: 'capitalize'},
  addressText: { marginBottom: hp(0.5) },
  buttonRow: {
    flexDirection: 'row',
    marginTop: hp(1),
    width: wp(90),
  },
  infoBox: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(0),
    borderRadius: wp(2),
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: wp(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
});