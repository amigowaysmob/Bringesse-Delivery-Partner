import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, StyleSheet, PermissionsAndroid, Platform, Alert, Image,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../resources/colors';
import { hp, wp } from '../../../resources/dimensions';
import FlashMessage from 'react-native-flash-message';
import { IMAGE_ASSETS } from '../../../resources/images';
import UserToggleStatus from '../../UserToggleStatus';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import UerProfileCard from '../../UerProfileCard';
import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import { Text } from 'react-native-paper';
import { poppins } from '../../../resources/fonts';

const HomeScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [location, setLocation] = useState(null);
  const mapRef = useRef(null);
  const profile = useSelector(state => state?.Auth?.profile);
  const profileDetails = useSelector(state => state.Auth.profileDetails);


  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      return true; // iOS permissions handled via Info.plist
    }
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

  // Get FCM token and device ID on mount
  useEffect(() => {
    const init = async () => {
      try {
        const token = await messaging().getToken();
        const id = await DeviceInfo.getUniqueId();
        // Alert.alert(JSON.stringify(token));
        console.log("FCM TOKEN", JSON.stringify(token));
        // setFcmToken(token);
        // setDeviceId(id);
      } catch (error) {
        // console.error('Error fetching device info:', error);
        Alert.alert(JSON.stringify(error));
      }
    };
    init();
  }, []);
  const centerMapToLocation = () => {
    // alert('Centering to current location');
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000); // 1000ms duration
    }
  };

  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Location:', latitude, longitude);
        setLocation({ latitude, longitude });
      },
      (error) => {
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

  // Focus effect will run every time screen is focused
  useFocusEffect(
    useCallback(() => {
      getLocation();
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS[theme].background }]}>
      {location && (
        <MapView
          ref={mapRef} // ✅ Add this line
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false} // We'll use our custom one
        >
          <Marker coordinate={location}>
            <Image
              source={IMAGE_ASSETS?.scooter}
              style={{ width: wp(10), height: wp(10) }}
            />
            <Text style={[poppins.semi_bold.h9, {
              backgroundColor: "yellow",color:"#000",padding:wp(0.5),borderWidth:wp(0.3)
            }]}>{profileDetails?.vehicle_no}</Text>
          </Marker>
        </MapView>
      )}
      <TouchableOpacity
        onPress={centerMapToLocation}
        style={[styles.centerButton, {
          backgroundColor: COLORS[theme].accent,
          bottom:
            hp(30)
        }]}
      >
        <MaterialCommunityIcon
          name={'target'}
          size={wp(8)}
          // style={{ margin: wp(10) }}
          color={COLORS[theme].white}
        />
      </TouchableOpacity>
      <View style={{ position: 'absolute', bottom: hp(1), width: '100%' }}>
        {/* {profile?.live_status == 1 &&  */}
        <UerProfileCard userstatus={profile?.live_status} />
        {/* } */}
        <UserToggleStatus userStatus={profile?.live_status} />
      </View>
      <FlashMessage position="top" />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    right: hp(3),
    borderRadius: wp(8),
    height: hp(5), width: hp(5),
    alignItems: "center", justifyContent: "center",
  },
  centerIcon: {
    width: wp(6),
    height: wp(6),
  },
  map: {
    width: wp(100),
    height: hp(100),
  },
});

export default HomeScreen;
