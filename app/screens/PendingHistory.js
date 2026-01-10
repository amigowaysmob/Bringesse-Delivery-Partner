import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, ToastAndroid,
} from 'react-native';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { COLORS } from '../resources/colors';
import { useTheme } from '../context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import HeaderBar from '../components/header';
import { fetchData } from '../api/api';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import useCurrentLocation from '../hooks/useCurrentLocation';
import { navigate } from '../navigation/RootNavigation';
import ConfirmModal from '../components/header/ConfirmModal';
import messaging from '@react-native-firebase/messaging';

const PendingHistory = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const profile = useSelector(state => state.Auth.profile);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const accessToken = useSelector(state => state.Auth.accessToken);
  const [pendingList, setPendingList] = useState([]);
  const { location, locationLoading } = useCurrentLocation();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false); // For initial list loader
  const [refreshing, setRefreshing] = useState(false); // ⭐ Pull-to-refresh
  // -----------------------------------------------------------------------
  // FETCH PENDING REQUEST API
  // -----------------------------------------------------------------------
  const fetchPendingRequest = useCallback(async () => {
    if (!accessToken || !profile?.driver_id || !location) return;
    if (!refreshing) setListLoading(true); // Only show full loader if not refreshing
    const headers = {
      Authorization: `${accessToken}`,
      driver_id: profile.driver_id,
    };
    const payLoad = {
      driverId: profile.driver_id,
      lat: location.latitude,
      lon: location.longitude,
      vehicleId: profileDetails?.vehicle_type,
    };
    try {
      const data = await fetchData('transport/pendingrequest', 'POST', payLoad, headers);
      if (!data?.ok && data?.status === 'false') {
        await AsyncStorage.clear();
        navigation.reset({ index: 0, routes: [{ name: 'login-screen' }] });
        return;
      }
      if (Array.isArray(data.pendingBookings)) {
        setPendingList(data.pendingBookings);
      }
    } catch (err) {
      console.error('API Error:', err);
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, profile, profileDetails, location, navigation, refreshing]);
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      try {
        fetchPendingRequest();
      } catch (err) {
        console.error('Error handling FCM message:', err);
      }
    });
    return unsubscribe;
  }, [fetchPendingRequest]);
  
  useEffect(() => {
    fetchPendingRequest();
  }, [fetchPendingRequest]);
  const acceptBooking = async () => {
    if (!selectedBooking) return;
    setAcceptLoading(true);

    try {
      const payload = {
        booking_status: 'accept',
        booking_id: selectedBooking.booking_id,
        driver_id: profile?.driver_id,
      };
      const res = await fetchData('/transport/updatebooking', 'POST', payload, null);

      if (res?.status === true) {
        ToastAndroid.show(res.message, ToastAndroid.SHORT);

        const bookingData = {
          message: selectedBooking?.message,
          pickupLocation: selectedBooking?.pickupLocation,
          dropLocation: selectedBooking?.dropLocation,
          bookingUid: selectedBooking?.booking_uid,
          bId: selectedBooking?.booking_id,
          status: 'accepted',
        };

        await AsyncStorage.setItem('ACCEPTEDBOOKING', JSON.stringify(bookingData));

        setPendingList(prev =>
          prev.filter(item => item.booking_id !== selectedBooking.booking_id)
        );

        navigate('BookingAction', {
          bid: selectedBooking.booking_id,
          acceptStatus: 'accept',
        });
      } else {
        ToastAndroid.show(res?.message || 'Failed to accept booking', ToastAndroid.SHORT);
      }
    } catch (err) {
      console.error('Accept booking error:', err);
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
    } finally {
      setAcceptLoading(false);
      setConfirmVisible(false);
    }
  };

  // -----------------------------------------------------------------------
  // LOADING LOCATION SCREEN
  // -----------------------------------------------------------------------
  if (locationLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
        <HeaderBar title={t('Pending Requests')} showBackArrow />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS[theme].accent} />
          <Text style={[poppins.regular.h7, { marginTop: wp(2), color: COLORS[theme].textPrimary }]}>
            Getting location...
          </Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  // -----------------------------------------------------------------------
  // RENDER ITEM
  // -----------------------------------------------------------------------
  const renderItem = ({ item }) => {
    const distanceKM = item.driverDistance;
    const reqDate = item.booking_time
      ? moment(item.booking_time).format('DD MMM YYYY, hh:mm A')
      : '';

    return (
      <View style={[styles.card, { backgroundColor: COLORS[theme].viewBackground }]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcon
            name="clock-alert"
            size={wp(8)}
            color={COLORS[theme].accent}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].textPrimary }]}>
            Booking ID: {item.booking_uid}
          </Text>

          <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary }]}>
            Pickup: {item.pickupLocation}
          </Text>

          {item.dropLocation && (
            <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary }]}>
              Drop: {item.dropLocation}
            </Text>
          )}
          <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>
            Distance: {distanceKM} km
          </Text>
          <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>
            Status: {item.booking_status}
          </Text>
          {
            item?.driver_fare != "" &&
            <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>
              Driver Fare: {item?.driver_fare}
            </Text>
          }
          {reqDate && (
            <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary, marginTop: wp(1) }]}>
              {reqDate}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: 'green' }]}
            onPress={() => {
              setSelectedBooking(item);
              setConfirmVisible(true);
            }}
          >
            <Text style={[poppins.semi_bold.h7, { color: '#fff' }]}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  // -----------------------------------------------------------------------
  // MAIN UI
  // -----------------------------------------------------------------------
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('Pending Requests')} showBackArrow />

      {listLoading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS[theme].accent} />
        </View>
      ) : (
        <FlatList
          data={pendingList}
          keyExtractor={(item, index) => item.booking_id || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.scrollContent}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchPendingRequest();
          }}
          ListEmptyComponent={
            <View style={{ padding: wp(5), alignItems: 'center' }}>
              <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>
                No pending requests found.
              </Text>
            </View>
          }
        />
      )}

      <ConfirmModal
        visible={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={acceptBooking}
        loading={acceptLoading}
        title="Confirm Accept"
        message={`Are you sure you want to accept booking ID: ${selectedBooking?.booking_uid}?`}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: hp(1),
    paddingBottom: hp(5),
    gap: wp(3),
    marginHorizontal: wp(3),
  },
  card: {
    flexDirection: 'row',
    padding: wp(4),
    borderRadius: wp(2),
    elevation: 2,
    borderWidth: wp(0.4),
    borderColor: '#ddd',
  },
  iconContainer: {
    marginRight: wp(4),
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  acceptBtn: {
    marginTop: wp(3),
    paddingVertical: wp(2.5),
    alignItems: 'center',
    borderRadius: wp(2),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PendingHistory;
