import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, StyleSheet, PermissionsAndroid, Platform,
  Alert, Image, Text, TouchableOpacity,
} from 'react-native';
import MapView, { Marker} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../resources/colors';
import { hp, wp } from '../../../resources/dimensions';
import FlashMessage from 'react-native-flash-message';
import { IMAGE_ASSETS } from '../../../resources/images';
import UserToggleStatus from '../../UserToggleStatus';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import UerProfileCard from '../../UerProfileCard';
import messaging from '@react-native-firebase/messaging';
import { poppins } from '../../../resources/fonts';
import InAppNotification from '../../InAppNotification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import polyline from '@mapbox/polyline';

const GOOGLE_MAPS_APIKEY = 'AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc';
const HomeScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [location, setLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const mapRef = useRef(null);
  const profile = useSelector(state => state?.Auth?.profile);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const [notificationData, setNotificationData] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [acceptedBooking, setAcceptedBooking] = useState(null);
  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your location.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
      },
      error => {
        console.error('Geolocation error:', error);
        Alert.alert('Location Error', error.message || 'Failed to get location.');
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

  const fetchRouteDirections = async (startLoc, destLoc) => {
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc.latitude},${startLoc.longitude}&destination=${destLoc.latitude},${destLoc.longitude}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const respJson = await resp.json();
      if (respJson.routes.length) {
        const route = respJson.routes[0];
        const points = polyline.decode(route.overview_polyline.points);
        const coords = points.map(point => ({
          latitude: point[0],
          longitude: point[1],
        }));
        setRouteCoordinates(coords);

        // Get distance and duration from first leg
        const leg = route.legs[0];
        setDistance(leg.distance.text);   // e.g. "10.4 km"
        setDuration(leg.duration.text);   // e.g. "24 mins"

        if (mapRef.current) {
          mapRef.current.fitToCoordinates(coords, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      } else {
        Alert.alert('No route found');
      }
    } catch (error) {
      console.error('Directions error:', error);
      Alert.alert('Error', 'Failed to get directions');
    }
  };

  // Center map on user's location
  const centerMapToLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  };

  // Listen to notification and store it
  useFocusEffect(
    useCallback(() => {
      getLocation();
      AsyncStorage.getItem('NOTIFICATION_DATA').then(data => {
        if (data) {
          const parsedData = JSON.parse(data);
          setNotificationData(parsedData);
        }
      });
      AsyncStorage.getItem('ACCEPTEDBOOKING').then(data => {
        if (data) {
          const parsedData = JSON.parse(data);
          setAcceptedBooking(parsedData);
          // Alert the user with booking ID if stored
          // if (parsedData) {
          //   console.log('acceptedBooking acceptedBooking ID', `Booking ID: ${acceptedBooking?.bId}`);
          // }
        }
        else {
          setAcceptedBooking(null)
        }
      });
    }, [])
  );

  // FCM notification handler
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      try {
        const data = remoteMessage?.data;
        // console.log('Received FCM message:', data?.scope == 'booking_completed');
        if (data?.scope == 'booking_completed') {
          // ALERT
          await AsyncStorage.removeItem('ACCEPTEDBOOKING');
          setAcceptedBooking(null)
        }
        if (data?.booking_uid) {
          console.log('Received FCM message:', data);
          await AsyncStorage.setItem('NOTIFICATION_DATA', JSON.stringify(data));
          setNotificationData(data);
        }
      } catch (err) {
        console.error('Error handling FCM message:', err);
      }
    });

    return unsubscribe;
  }, []);
  const navigation = useNavigation();
  // Clear notification data when closed
  const clearNotification = async () => {
    await AsyncStorage.removeItem('NOTIFICATION_DATA');
    setNotificationData(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS[theme].background }]}>
     
      {location && (
        <MapView
          ref={mapRef}
          style={[styles.map, { opacity: notificationData ? 0.2 : 1 }]}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {/* Current Location Marker */}
          <Marker coordinate={location}>
            <Image
              source={IMAGE_ASSETS?.scooter}
              style={{ width: wp(10), height: wp(10) }}
            />
            <Text
              style={[
                poppins.semi_bold.h9,
                {
                  backgroundColor: 'yellow',
                  color: '#000',
                  padding: wp(0.5),
                  borderWidth: wp(0.3),
                },
              ]}
            >
              {profileDetails?.vehicle_no}
            </Text>
          </Marker>
        </MapView>
      )}
      <TouchableOpacity
        onPress={centerMapToLocation}
        style={[styles.centerButton, { backgroundColor: COLORS[theme].accent, bottom: hp(30) }]}
      >
        <MaterialCommunityIcon name={'target'} size={wp(8)} color={COLORS[theme].white} />
      </TouchableOpacity>
      <View style={{ position: 'absolute', bottom: hp(1), width: '100%' }}>
        <UerProfileCard userstatus={profile?.live_status} />
        {
          acceptedBooking?.bId ?
            <View>
              <TouchableOpacity onPress={() => {
                navigation.navigate('BookingAction', { bid: acceptedBooking?.bId, acceptStatus: null });
              }
              } style={{ flexDirection: "row", justifyContent: "space-between", height: hp(8), backgroundColor: COLORS[theme].background, alignItems: "center", marginHorizontal: wp(2), borderRadius: wp(2) }}>
                <Text style={[poppins.semi_bold.h5, { color: COLORS[theme].accent, marginHorizontal: wp(2) }]}>{'Booking Ongoing'}</Text>
                <MaterialCommunityIcon style={{ marginHorizontal: wp(2) }} name={'chevron-right'} size={wp(8)} color={COLORS[theme].accent} />
              </TouchableOpacity>
            </View>
            :
            <UserToggleStatus userStatus={profile?.live_status} />
        }
      </View>
      <FlashMessage position="top" />
      {notificationData && (
        <InAppNotification onClose={clearNotification} visible={!!notificationData} data={notificationData} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerButton: {
    position: 'absolute',
    right: hp(3),
    borderRadius: wp(8),
    height: hp(5),
    width: hp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: wp(100),
    height: hp(100),
  },
});
export default HomeScreen;
