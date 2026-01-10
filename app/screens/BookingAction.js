import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Alert, Image,
  ToastAndroid, TouchableOpacity,
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MapView, { Marker, Polyline, AnimatedRegion } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { IMAGE_ASSETS } from '../resources/images';
import polyline from '@mapbox/polyline';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import BookingConfirmModal from './BookingConfirmModal';
import BookingDetailsModal from './BookingDetailsModal';
import io from 'socket.io-client';  // <-- Import socket.io-client
import AsyncStorage from '@react-native-async-storage/async-storage';


const GOOGLE_MAPS_APIKEY = 'AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc'; // replace with your key
const SOCKET_URL = 'https://www.bringesse.com:3000/';
const BookingAction = ({ route }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const profile = useSelector(state => state.Auth.profile);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  
  const navigation = useNavigation()
  const { bid, acceptStatus } = route.params;
  const locationWatcher = useRef(null); // to store watch ID
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [currentLoc, setCurrentLoc] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [confirmModalShow, setconfirmModal] = useState(false);
  const [orderStatus, setOrderStatus] = useState(acceptStatus != '' ? acceptStatus : '');
  const siteDetails = useSelector(state => state.Auth?.siteDetails);
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch booking details
  const fnGetBookingDetails = async () => {
    try {
      // setLoading(true);
      // Alert.alert(bid)
      if (!bid || !profile?.driver_id) return;
      const response = await fetchData('/transport/bookingdetails', 'POST', {
        booking_id: bid,
        driver_id: profile?.driver_id,
      });
      if (response?.status === true) {
        setBookingDetails(response?.data?.[0]);
        // Alert.alert('Booking Details Fetched',JSON.stringify(response?.data?.[0].drop))
        console.log(response?.data?.[0], "Booking Details");
      } else {
        ToastAndroid.show(response?.message || 'Failed to fetch booking details', ToastAndroid.SHORT);
      }
    } catch (err) {
      console.error('Booking fetch error:', err);
    } finally {
      setLoading(false);
    }
  };
  // Get user location
  const getLocation = () => {
    Geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setCurrentLoc({ latitude, longitude });
      },
      error => {
        // Alert.alert('Location Error', error.message || 'Failed to get location');
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000,
        forceRequestLocation: true,
        showLocationDialog: true,
      }
    );
  };

  // Fetch route from current location to pickup location
  const fetchRoute = async (origin, destination) => {
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const data = await resp.json();
      if (data.routes?.length) {
        const pts = polyline.decode(data.routes[0].overview_polyline.points);
        const coords = pts.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
        setRouteCoordinates(coords);
      }
    } catch (err) {
      console.error('Directions error:', err);
    }
  };
  const handleStatusAccept = async () => {
    if (orderStatus != 'accept') return
    try {
      let driverInfo = {
        driver_id: profile?.driver_id,
        porfilePic: siteDetails?.media_url + 'drivers/images/' + profileDetails?.driver_image,
        driverName: profileDetails?.first_name,
        phone_no: profileDetails?.phone_no,
        vehicle_no: profileDetails?.vehicle_no
      }
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('bookingStatusUpdate', bid, orderStatus, driverInfo); // <--- EMIT HERE
        console.log('Socket emitted bookingStatusUpdate:', bid, orderStatus, driverInfo);
        setOrderStatus(null)
      }
    } catch (err) {
      Alert.alert('Error', 'Could not update status');
      console.log(err, "err")
    } finally {
    }
  };
  // Status update handler
  const handleStatusUpdate = async (newStatus, enteredOTP = '') => {
    // Alert.alert('Confirm', `Are you sure you want to mark as ${newStatus}?`)
    console.log(newStatus, "newStatus")
    try {
      const payload = {
        booking_id: bid,
        booking_status: newStatus,
        driver_id: profile?.driver_id,
      };
      let driverInfo = {
        driver_id: profile?.driver_id,
        porfilePic: siteDetails?.media_url + 'drivers/images/' + profileDetails?.driver_image,
        driverName: profileDetails?.first_name,
        phone_no: profileDetails?.phone_no,
        vehicle_no: profileDetails?.vehicle_no
      }
      if (newStatus === 'picked') {
        payload.otp = Number(enteredOTP);
      }
      else {
        payload.completeOtp = Number(enteredOTP);

      }
      const resp = await fetchData('/transport/updatebooking', 'POST', payload);
      if (resp?.status === true) {
        setOrderStatus(newStatus)
        ToastAndroid.show(`Status updated to ${newStatus}`, ToastAndroid.SHORT);
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('bookingStatusUpdate', bid, newStatus, driverInfo); // <--- EMIT HERE
          console.log('Socket emitted bookingStatusUpdate:', bid, newStatus);
        }
        fnGetBookingDetails();
        if (newStatus == 'cancelled' || newStatus == 'completed') {
          await AsyncStorage.removeItem('ACCEPTEDBOOKING');
          navigation.goBack();
        }
      } else {
        ToastAndroid.show(resp?.message || 'Failed to update status', ToastAndroid.SHORT);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not update status');
    } finally {
      setconfirmModal(false);
    }
  };
  useEffect(() => {
    if (mapRef.current && currentLoc) {
      mapRef.current.animateToRegion({
        latitude: currentLoc.latitude,
        longitude: currentLoc.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [currentLoc]);

  useEffect(() => {
    if (!bid || !profile) return;
    // Connect socket
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      forceNew: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });
    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      socketRef.current.emit('joinBookingRoom', bid, 'driver');
      handleStatusAccept(); // Custom function to handle booking status acceptance
    });
    // ✅ Listen for booking cancellation event from server
    socketRef.current.on('usercancelBooking', ({ bookingId, status }) => {
      console.log('🚨 Booking cancelled by user:', bookingId, status);

      if (bookingId === bid) {
        setOrderStatus('cancelled');
        ToastAndroid.show('User has cancelled the booking', ToastAndroid.LONG);
        setBookingDetails(prev => ({ ...prev, status: 'cancelled' }));
        AsyncStorage.removeItem('ACCEPTEDBOOKING');
        navigation.goBack();
      }
    });
    socketRef.current.on('connect_error', (err) => {
      console.log('Socket connect error:', err);
    });
    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // Start watching location
    locationWatcher.current = Geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newLoc = { latitude, longitude };
        setCurrentLoc(newLoc); // Update the current location in state
        if (socketRef.current || socketRef.current.connected) {
          console.log('Emitting driver location:', latitude, longitude);
          socketRef.current.emit('driverLocation', bid, { latitude, longitude });
        }
      },
      (error) => {
        console.warn('Location error:', error.message);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Trigger on a 10-meter change
        interval: 5000, // Frequency in ms (Android only)
        fastestInterval: 3000, // How quickly it updates on location changes
        showsBackgroundLocationIndicator: true, // Shows indicator when app is in background
      }
    );
    // Cleanup function when the component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('Socket disconnected on unmount');
      }

      if (locationWatcher.current !== null) {
        Geolocation.clearWatch(locationWatcher.current);
        locationWatcher.current = null;
        console.log('Location watcher cleared');
      }
    };
  }, [bid, profile]);

  useEffect(() => {
    // Run immediately once
    fnGetBookingDetails();
    // Run every 2 seconds
    const interval = setInterval(() => {
      fnGetBookingDetails();
    }, 2000);

    // Cleanup when component unmounts or when `bid` changes
    return () => clearInterval(interval);
  }, [bid]);


  useFocusEffect(
    useCallback(() => {
      getLocation();
    }, [bid])
  );

  useEffect(() => {
    if (currentLoc && bookingDetails?.pickupLocation?.coordinates) {
      const pickup = bookingDetails.pickupLocation.coordinates;
      fetchRoute(currentLoc, {
        latitude: pickup[1],
        longitude: pickup[0],
      });
    }
  }, [currentLoc, bookingDetails]);

  const getProgressIndex = () => {
    if (bookingDetails?.status === 'accepted') return 0;
    if (bookingDetails?.status === 'picked') return 1;
    if (bookingDetails?.status === 'completed') return 2;
    if (bookingDetails?.status === 'cancelled') return 3;

    return 0;
  };

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <HeaderBar title={t('BookingAction')} showBackArrow />
        <ActivityIndicator size="large" color={COLORS[theme].primary} />
      </View>
    );
  }

  if (!bookingDetails) {
    return (
      <View style={{ flex: 1 }}>
        <HeaderBar title={t('Booking')} showBackArrow />
        <Text style={[poppins.regular.h5, { color: COLORS[theme].textPrimary }]}>
          {t('No booking details')}
        </Text>
      </View>
    );
  }

  const {
    customer,
    uniqueId,
    pickupLocation,
    status: bookingStatus,
  } = bookingDetails;
  const pickupCoords = pickupLocation?.coordinates;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('Booking')} showBackArrow />
      {bookingStatus !== 'cancelled' ?
        <>

          {currentLoc && bookingStatus !== 'picked' && (

            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: currentLoc.latitude,
                longitude: currentLoc.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {/* DRIVER MARKER */}
              <Marker
                coordinate={currentLoc} // driver coordinates
                title="Me"
                tracksViewChanges={false}
              >
                <Image
                  source={{
                    uri:
                      siteDetails?.media_url +
                      'vehicles/' +
                      profileDetails?.vechile_image?.image,
                  }}
                  style={{ width: wp(10), height: wp(10), borderRadius: wp(5) }}
                  resizeMode="contain"
                />
              </Marker>
              {/* PICKUP MARKER */}
              {pickupCoords && (
                <Marker
                  coordinate={{ latitude: pickupCoords[1], longitude: pickupCoords[0] }}
                  title="Pickup"
                  pinColor="red"
                />
              )}

              {/* ROUTE */}
              {routeCoordinates.length > 0 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeWidth={4}
                  strokeColor={COLORS[theme].accent}
                />
              )}
            </MapView>

          )}
        </>
        :
        <MaterialCommunityIcon
          name={'close-circle-outline'}
          size={wp(25)}
          style={{ borderRadius: wp(0), alignSelf: "center" }}
          color={COLORS[theme].accent}
        />
      }
      <View style={[styles.card, { backgroundColor: COLORS[theme].viewBackground, borderWidth: wp(0.5), borderColor: "#ddd" }]}>
        <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary, marginBottom: wp(2) }]}>
          Booking ID: {uniqueId}
        </Text>
        <View
          style={{
            borderColor: COLORS[theme].accent,
            borderRadius: wp(6),
            alignItems: 'center',
            paddingVertical: wp(2),
            backgroundColor: "transparent",
            // borderWidth: wp(0.4)
          }}
        >
          <Text style={[poppins.semi_bold.h6, { color: bookingStatus == 'completed' ? 'green' : COLORS[theme].accent, textTransform: "capitalize" }]}>
            {`Booking ${bookingStatus}`}
          </Text>
        </View>

        {/* ✅ Fixed Progress Bar */}
        {bookingStatus !== 'cancelled' &&
          <>
            <View style={styles.progressWrapper}>
              {['Accepted', 'Picked', 'Completed'].map((label, idx) => {
                const isCompleted = idx <= getProgressIndex();
                return (
                  <React.Fragment key={idx}>
                    <View style={styles.step}>
                      <MaterialCommunityIcon
                        name={isCompleted ? "check-circle-outline" : "circle-outline"}
                        size={wp(8)}
                        color={COLORS[theme].accent}
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
                            backgroundColor:
                              idx < getProgressIndex()
                                ? COLORS[theme].accent
                                : COLORS[theme].border,
                          },
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={[styles.viewDetailsBtn, { borderColor: COLORS[theme].accent }]}
                onPress={() => setShowDetailsModal(true)}
              >
                <Text style={[poppins.regular.h6, { color: COLORS[theme].accent }]}>
                  View Booking
                </Text>
              </TouchableOpacity>
              {
                bookingStatus == 'accepted' &&
                <TouchableOpacity
                  style={[styles.viewDetailsBtn, { borderColor: COLORS[theme].accent, backgroundColor: "#FFF" }]}
                  onPress={() => handleStatusUpdate('cancelled')}
                >
                  <Text style={[poppins.regular.h6, { color: COLORS[theme].accent }]}>
                    Cancel Order
                  </Text>
                </TouchableOpacity>
              }

            </View>
            {bookingStatus !== 'completed' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: COLORS[theme].accent }]}
                onPress={() => setconfirmModal(true)}
              >
                <Text style={[poppins.semi_bold.h5, { color: COLORS[theme].white }]}>
                  {bookingStatus === 'accepted' ? 'Start Pickup' : 'Mark Completed'}
                </Text>
              </TouchableOpacity>
            )}
          </>}
      </View>
      {showDetailsModal && (
        <BookingDetailsModal
          visible={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          booking={bookingDetails}
          theme={theme}
        />
      )}
      {confirmModalShow && (
        <BookingConfirmModal
          theme={theme}
          status={bookingStatus}
          onConfirm={handleStatusUpdate}
          onClose={() => setconfirmModal(false)}
        />
      )}
    </GestureHandlerRootView>
  );
};
const styles = StyleSheet.create({
  map: { width: wp(100), height: hp(90) },
  card: {
    position: 'absolute', bottom: hp(1),
    left: wp(2), right: wp(2), padding: wp(4),
    borderRadius: wp(2), elevation: 3,
  }, viewDetailsBtn: {
    paddingVertical: hp(1.2),
    borderWidth: 1, borderRadius: wp(2),
    alignItems: 'center', marginBottom: hp(1.5), width: wp(42)
  }, progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    marginVertical: hp(2), paddingHorizontal: wp(2),
  }, step: {
    alignItems: 'center', width: wp(20),
  }, progressLine: {
    height: 2, flex: 1,
    marginHorizontal: wp(1), position: "relative", bottom: hp(1),
  }, actionButton: {
    paddingVertical: hp(1.5), borderRadius: wp(2),
    alignItems: 'center',
  },
});
export default BookingAction;