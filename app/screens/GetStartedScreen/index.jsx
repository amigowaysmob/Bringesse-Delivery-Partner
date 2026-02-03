import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
  NativeModules,
} from 'react-native';
import { IMAGE_ASSETS } from '../../resources/images';
import { hp, wp } from '../../resources/dimensions';
import { useNavigation } from '@react-navigation/native';
import { getUserData } from '../../utils/utils';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../resources/colors';
import { useTheme } from '../../context/ThemeContext';
import { poppins } from '../../resources/fonts';
import Geolocation from 'react-native-geolocation-service';
import { Platform as RNPlatform } from 'react-native';
import {
  getTrackingStatus,
  requestTrackingPermission,
} from 'react-native-tracking-transparency';

// iOS ATT import
// import { requestTrackingAuthorization } from 'react-native-tracking-transparency';

var _ = require('lodash');

export default function GetStartedScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const [network, setNetwork] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false); // loader state
  const siteDetails = useSelector(state => state.Auth.siteDetails);

  // Animation value for bottom sheet
  const sheetAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchUserData();

    // Request ATT on first launch
    handleATT();

    if (showLocationSheet) {
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [network, showLocationSheet]);

  const fetchUserData = async () => {
    const userData = await getUserData();
    if (userData && !_.isEmpty(userData)) {
      const obj = JSON.parse(userData);
      dispatch({
        type: 'UPDATE_PROFILE',
        payload: obj.data.user_data,
      });
    }
  };

  const handleATT = async () => {
    if (Platform.OS !== 'ios') return;
    // 1️⃣ Try native module first
    const NativeTT = NativeModules?.TrackingTransparency;
    if (NativeTT && typeof NativeTT.requestTrackingAuthorization === 'function') {
      console.log('Using native TrackingTransparency module');
      const status = await NativeTT.requestTrackingAuthorization();
      console.log('ATT Status (native):', status);
      return;
    }
    // 2️⃣ Fallback to library
    console.log('Using react-native-tracking-transparency fallback');
    const status = await getTrackingStatus();
    if (status === 'not-determined') {
      const newStatus = await requestTrackingPermission();
      console.log('ATT Status (library):', newStatus);
    } else {
      console.log('ATT already decided:', status);
    }
  };

  const requestLocation = () => {
    closeSheet();
    setLoadingLocation(true);
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization('whenInUse');
    }
    Geolocation.getCurrentPosition(
      (position) => {
        console.log('User location:', position);
        setLoadingLocation(false);
        closeSheet();
      },
      (error) => {
        console.log('Location error:', error.code, error.message);
        setLoadingLocation(false);
        closeSheet();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowLocationSheet(false));
  };

  const redirectScreen = () => {
    navigation?.navigate('login-screen');
  };

  // Sheet translation
  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [hp(50), 0],
  });

  return (
    <View style={[styles.container, { backgroundColor: COLORS[theme].background }]}>
      {/* Main content */}
      <View>
        <Image
          style={styles.splashLogo}
          resizeMode="contain"
          source={IMAGE_ASSETS.delivery_boy_image}
        />
        <View>
          <Text
            style={[
              poppins.regular.h5,
              styles.buttonText,
              { color: COLORS[theme].primary },
            ]}
          >
            Super Fast On-Time Delivery
          </Text>
          <Text
            style={[
              poppins.regular.h8,
              styles.buttonText,
              {
                color: COLORS[theme].primary,
                maxWidth: wp(70),
                textAlign: 'center',
                marginTop: hp(1.5),
              },
            ]}
          >
            Get your Favourite delivered at your doorstep within minutes
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.getStartedButton, { backgroundColor: COLORS[theme].accent }]}
        onPress={redirectScreen}
      >
        <Text
          style={[poppins.semi_bold.h6, styles.buttonText, { color: COLORS[theme].white }]}
        >
          Get Started
        </Text>
      </TouchableOpacity>

      {/* Bottom Sheet for Location Permission */}
      {showLocationSheet && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              backgroundColor: COLORS[theme].white,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <Text style={[poppins.semi_bold.h6, { marginBottom: 10 }]}>
            Allow Location Access
          </Text>
          <Text style={[poppins.regular.h8, { textAlign: 'center', marginBottom: 20 }]}>
            {siteDetails?.location_acknowledgement ||
              'We need your location to provide better services and timely deliveries.'}
          </Text>

          {loadingLocation ? (
            <ActivityIndicator size="large" color={COLORS[theme].accent} />
          ) : (
            <TouchableOpacity
              onPress={requestLocation}
              style={{
                backgroundColor: COLORS[theme].accent,
                width: wp(80),
                alignSelf: 'center',
                paddingVertical: hp(1.5),
                borderRadius: 5,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].white }]}>
                Allow
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashLogo: { height: hp(30), width: wp(50), alignSelf: 'center' },
  getStartedButton: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(10),
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(4),
    width: wp(80),
    position: 'absolute',
    bottom: hp(3),
  },
  buttonText: {},
  bottomSheet: {
    position: 'absolute',
    bottom: hp(0),
    width: wp(100),
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
});
