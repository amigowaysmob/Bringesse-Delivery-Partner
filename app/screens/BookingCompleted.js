import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  ToastAndroid, Image, ScrollView, Linking,
  TouchableOpacity,
} from 'react-native';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { COLORS } from '../resources/colors';
import { useTheme } from '../context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import HeaderBar from '../components/header';
import { useSelector } from 'react-redux';
import { fetchData } from '../api/api';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const BookingCompleted = ({ route }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const profile = useSelector(state => state.Auth.profile);
  const { bid } = route.params;
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState(null);

  const fnGetBookingDetails = async () => {
    try {
      setLoading(true);
      if (!bid || !profile?.driver_id) return;
      const response = await fetchData('/transport/bookingdetails', 'POST', {
        booking_id: bid,
        driver_id: profile.driver_id,
      });
      console?.log(response?.data?.[0], "response?.data?.[0]");
      if (response?.status === true) {
        setBookingDetails(response?.data?.[0]);
      } else {
        ToastAndroid.show(response?.message || 'Failed to fetch booking details', ToastAndroid.SHORT);
      }
    } catch (err) {
      console.error('Booking fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fnGetBookingDetails();
  }, [bid]);

  const getProgressIndex = () => {
    if (bookingDetails?.status === 'accepted') return 0;
    if (bookingDetails?.status === 'picked') return 1;
    if (bookingDetails?.status === 'completed') return 2;
    return 0;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
        <HeaderBar title={t('BookingAction')} showBackArrow />
        <ActivityIndicator size="large" color={COLORS[theme].primary} style={{ marginTop: hp(30) }} />
      </View>
    );
  }

  if (!bookingDetails) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
        <HeaderBar title={t('BookingAction')} showBackArrow />
        <Text style={[poppins.regular.h5, { color: COLORS[theme].textPrimary, textAlign: 'center', marginTop: hp(30) }]}>
          {t('No booking details')}
        </Text>
      </View>
    );
  }

  const {
    customer,
    uniqueId,
    pickupLocation,
    dropLocation,
    pickupAddress,
    dropAddress,
    otp,
    status: bookingStatus,
    createdAt,
    vehicle,
  } = bookingDetails;

  const pickupCoords = pickupLocation?.coordinates;
  const dropCoords = dropLocation?.coordinates;

  const formattedDate = new Date(createdAt).toLocaleString();

  const openDialScreen = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('BookingCompleted')} showBackArrow />
      <ScrollView contentContainerStyle={{ padding: wp(4), paddingBottom: hp(8) }}>
        <View style={[styles.card, { backgroundColor: COLORS[theme].viewBackground, borderWidth: 1, borderColor: '#ddd' }]}>
          <Text style={[poppins.semi_bold.h5, { color: COLORS[theme].textPrimary, marginBottom: hp(1) }]}>
            {t('Booking ID')}: <Text style={{ color: COLORS[theme].accent }}>{uniqueId}</Text>
          </Text>

          {/* Status */}
          <View style={[styles.statusBadge, { backgroundColor: bookingStatus === 'completed' ? '#28a745' : COLORS[theme].accent }]}>
            <MaterialCommunityIcon
              name={bookingStatus === 'completed' ? 'check-circle' : 'progress-clock'}
              size={wp(5)}
              color="#fff"
              style={{ marginRight: wp(1) }}
            />
            <Text style={[poppins.semi_bold.h6, { color: '#fff', textTransform: 'capitalize' }]}>
              {t(`Booking ${bookingStatus}`)}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressWrapper}>
            {['Accepted', 'Picked', 'Completed'].map((label, idx) => {
              const isCompleted = idx <= getProgressIndex();
              return (
                <React.Fragment key={idx}>
                  <View style={styles.step}>
                    <MaterialCommunityIcon
                      name={isCompleted ? "check-circle" : "circle-outline"}
                      size={wp(8)}
                      color={isCompleted ? '#28a745' : COLORS[theme].border}
                    />
                    <Text style={[poppins.regular.h9, { color: COLORS[theme].textPrimary, marginTop: hp(0.5) }]}>
                      {label}
                    </Text>
                  </View>
                  {idx < 2 && (
                    <View
                      style={[
                        styles.progressLine,
                        {
                          backgroundColor: idx < getProgressIndex() ? '#28a745' : COLORS[theme].border,
                        },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* Customer Info */}
          <View style={styles.section}>
            <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].textPrimary, marginBottom: hp(1) }]}>Customer</Text>
            <View style={styles.customerRow}>
              <Image
                source={{ uri: customer?.profileImage }}
                style={styles.profileImage}
                resizeMode="cover"
              />
              <View style={{ marginLeft: wp(3), flex: 1 }}>
                <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].textPrimary }]}>{customer?.name}</Text>
                <TouchableOpacity onPress={() => openDialScreen(customer?.phone)}>
                  <Text style={[poppins.regular.h8, { color: COLORS[theme].primary, marginTop: hp(0.2) }]}>
                    {customer?.phone}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Vehicle Info */}
          <View style={styles.section}>
            <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].textPrimary, marginBottom: hp(1) }]}>Vehicle</Text>
            <View style={styles.customerRow}>
              <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].textPrimary, marginLeft: wp(3) }]}>
                {vehicle?.name}
              </Text>
            </View>
          </View>

          {/* Pickup & Drop */}
          <View style={styles.section}>
            <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].textPrimary, marginBottom: hp(1) }]}>Pickup Location</Text>
            <View style={styles.addressRow}>
              <MaterialCommunityIcon name="map-marker" size={wp(6)} color="#d9534f" />
              <Text style={[poppins.regular.h9, { color: COLORS[theme].textPrimary, marginLeft: wp(2), flex: 1 }]}>
                {pickupAddress}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].textPrimary, marginBottom: hp(1) }]}>Drop Location</Text>
            <View style={styles.addressRow}>
              <MaterialCommunityIcon name="map-marker-check" size={wp(6)} color="#5bc0de" />
              <Text style={[poppins.regular.h9, { color: COLORS[theme].textPrimary, marginLeft: wp(2), flex: 1 }]}>
                {dropAddress}
              </Text>
            </View>
          </View>

          {/* Booking Date */}
          <View style={styles.section}>
            <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].textPrimary }]}>Created At</Text>
            <Text style={[poppins.regular.h9, { color: COLORS[theme].textPrimary }]}>{formattedDate}</Text>
          </View>

        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: wp(4),
    borderRadius: wp(2),
    elevation: 3,
    marginBottom: hp(2),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: wp(10),
    alignSelf: 'flex-start',
    marginBottom: hp(2),
  },
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(3),
    paddingHorizontal: wp(2),
  },
  step: {
    alignItems: 'center',
    width: wp(20),
  },
  progressLine: {
    height: 4,
    flex: 1,
    marginHorizontal: wp(1),
    position: "relative",
    bottom: hp(1.2),
    borderRadius: 2,
  },
  section: {
    marginBottom: hp(3),
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    backgroundColor: '#ccc',
  },
  vehicleImage: {
    width: wp(20),
    height: wp(12),
    borderRadius: wp(1),
    backgroundColor: '#eee',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  otpBox: {
    marginTop: hp(0.5),
    paddingVertical: hp(1),
    paddingHorizontal: wp(5),
    borderWidth: 1.5,
    borderRadius: wp(3),
    alignSelf: 'flex-start',
  },
});

export default BookingCompleted;
