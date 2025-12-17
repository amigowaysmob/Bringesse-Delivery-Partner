import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, StyleSheet, PermissionsAndroid, Platform,
  Alert, Image, Text, TouchableOpacity,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../resources/colors';
import { hp, wp } from '../../../resources/dimensions';
import FlashMessage from 'react-native-flash-message';
import UserToggleStatus from '../../UserToggleStatus';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import UerProfileCard from '../../UerProfileCard';
import messaging from '@react-native-firebase/messaging';
import { poppins } from '../../../resources/fonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserawaitStatus from '../../UserawaitStatus';
import DeviceInfo from 'react-native-device-info';
import { fetchData } from '../../../api/api';
import VersionUpgradeModal from '../../VersionUpgradeModal';
import CheckDocs from '../../CheckDocs';
import UserPendingCount from '../../UserPendingCount';
import UserDeliveryOrdersCount from '../../UserDeliveryOrdersCount copy';
import WelcomeCard from '../../WelcomeCard';
const GOOGLE_MAPS_APIKEY = 'AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc';
const HomeScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [location, setLocation] = useState(null);
  const [addressCurrent, setAddress] = useState('');
  const mapRef = useRef(null);
  const profile = useSelector(state => state?.Auth?.profile);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const [notificationData, setNotificationData] = useState(null);
  const [acceptedBooking, setAcceptedBooking] = useState(null);
  const [fetchProfile, setfetchProfile] = useState(false);
  const accessToken = useSelector(state => state.Auth?.accessToken);
  const dispatch = useDispatch();
  const siteDetails = useSelector(state => state.Auth?.siteDetails);
  const navigation = useNavigation();
  // Ask for location permission
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
  // Get user’s current location
  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }
    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });

        // Get address from coordinates
        await getAddressFromCoordinates(latitude, longitude);
      },
      error => {
        console.error('Geolocation error:', error);
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
  // Get address from lat/lng using Google Geocoding API
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const json = await response.json();
      if (json.results && json.results.length > 0) {
        const formattedAddress = json.results[0].formatted_address;
        setAddress(formattedAddress);
        // Alert.alert('Current Location', formattedAddress);
      } else {
        // Alert.alert('No address found for this location');
      }
    } catch (error) {
      console.error('Error getting address:', error);
      // Alert.alert('Error', 'Failed to get address');
    }
  };

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
  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
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
        } else {
          setAcceptedBooking(null);
        }
      });
    }, [fetchProfile])
  );

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      try {
        const data = remoteMessage?.data;
        setfetchProfile(true);
        fetchProfileData();
        if (data?.scope == 'admin_changes') {
          fetchProfileData();
        }
        if (data?.scope == 'booking_completed') {
          await AsyncStorage.removeItem('ACCEPTEDBOOKING');
          setAcceptedBooking(null);
        }
        if (data?.booking_uid) {
          await AsyncStorage.setItem('NOTIFICATION_DATA', JSON.stringify(data));
          setNotificationData(data);
        }
      } catch (err) {
        console.error('Error handling FCM message:', err);
      }
    });
    return unsubscribe;
  }, []);
  const fetchProfileData = async () => {
    if (!accessToken || !profile?.driver_id) return;
    try {
      const data = await fetchData('profile/' + profile?.driver_id, 'GET', null, {
        Authorization: `${accessToken}`,
        driver_id: profile.driver_id,
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
  return (
    <View style={[styles.container, { backgroundColor: COLORS[theme].background ,
    }]}>
      <UserPendingCount
        notificationData={notificationData}
        addressCurrent={addressCurrent}
        location={location}
        userStatus={profile?.live_status}
        profileStatus={profileDetails?.profile_status}
      />
      <UserDeliveryOrdersCount
        notificationData={notificationData}
        addressCurrent={addressCurrent}
        location={location}
        userStatus={profile?.live_status}
        profileStatus={profileDetails?.profile_status}
      />
      {location && (
        <MapView
          ref={mapRef}
          style={[styles.map]}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          <Marker coordinate={location}>
            <Image
              source={{ uri: siteDetails?.media_url + 'vehicles/' + profile?.vechile_image?.image }}
              style={{ width: wp(12), height: wp(12), borderRadius: wp(1), resizeMode: 'stretch', }}
            />
            <Text
              style={[
                poppins.semi_bold.h9,
                {
                  backgroundColor: 'yellow',
                  color: '#000',
                  padding: wp(0.5),
                  borderWidth: wp(0.3),borderRadius:wp(1)
                },
              ]}
            >
              {profileDetails?.vehicle_no}
            </Text>
          </Marker>
        </MapView>
      )}

      {/* Center map button */}
      <TouchableOpacity
        onPress={centerMapToLocation}
        style={[styles.centerButton, { backgroundColor: COLORS[theme].accent, bottom: hp(32) }]}
      >
        <MaterialCommunityIcon name={'target'} size={wp(8)} color={COLORS[theme].white} />
      </TouchableOpacity>
      <View style={{ position: 'absolute', bottom: hp(1), width: '100%' }}>
        <UerProfileCard userstatus={profileDetails?.live_status} />
        <Text style={{color:"red"}} >{profileDetails?.welcomeStatus}</Text>
        {
          profileDetails?.welcomeStatus == '0' &&
          <WelcomeCard userstatus={profileDetails?.live_status} />
        }
        <VersionUpgradeModal />
        <CheckDocs />
        <UserawaitStatus userstatus={profileDetails?.profile_status} />
        {profileDetails?.order_assigned == 1 && acceptedBooking?.bId ? (
          <View>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('BookingAction', {
                  bid: acceptedBooking?.bId,
                  acceptStatus: null,
                });
              }}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                height: hp(8),
                backgroundColor: COLORS[theme].background,
                alignItems: 'center',
                marginHorizontal: wp(2),
                borderRadius: wp(2),
                borderColor: '#ccc',
                borderWidth: wp(0.5),
              }}
            >
              <Text
                style={[
                  poppins.semi_bold.h5,
                  { color: COLORS[theme].accent, marginHorizontal: wp(2) },
                ]}
              >
                {'Booking Ongoing'}
              </Text>
              <MaterialCommunityIcon
                style={{ marginHorizontal: wp(2) }}
                name={'chevron-right'}
                size={wp(8)}
                color={COLORS[theme].accent}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <UserToggleStatus
            addressCurrent={addressCurrent}
            location={location}
            userStatus={profile?.live_status}
            profileStatus={profileDetails?.profile_status}
          />
        )}
      </View>
      <FlashMessage position="top" />
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
