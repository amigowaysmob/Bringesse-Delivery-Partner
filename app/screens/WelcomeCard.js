import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { wp, hp } from '../resources/dimensions';
import { useDispatch, useSelector } from 'react-redux';
import { IMAGE_ASSETS } from '../resources/images';
import { poppins } from '../resources/fonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { fetchData } from '../api/api';
import { useNavigation } from '@react-navigation/native';

const WelcomeCard = () => {
  const accessToken = useSelector(state => state.Auth?.accessToken);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const dispatch = useDispatch();
  const progress = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(2)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Bounce text after delay
    Animated.sequence([
      Animated.delay(800),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
    // Animate progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start(() => updateWelcome());
  }, []);

  const updateWelcome = async () => {
    if (!accessToken || !profileDetails?.driver_id) return;
    const deviceId = await DeviceInfo.getUniqueId();
    const payload = {
      driver_id: profileDetails.driver_id,
      welcomeStatus: '1',
    };

    try {
      const data = await fetchData('updateprofile', 'PATCH', payload, {
        Authorization: `${accessToken}`,
        driver_id: profileDetails.driver_id,
        device_id: deviceId,
      });
      if (!data?.ok && data?.status == 'false') {
        await AsyncStorage.clear();
        navigation.reset({ index: 0, routes: [{ name: 'login-screen' }] });
        return;
      }
      dispatch({ type: 'UPDATE_PROFILE', payload: data });
      dispatch({ type: 'PROFILE_DETAILS', payload: data });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };
  // if (userstatus) return null;
  const animatedWidth = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0%', '30%', '60%', '90%', '100%'],
  });

  // Rotate animation interpolation
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '0deg'], // slight rotation to 0
  });

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }, { rotate: rotateInterpolate }],
      }}
    >
      <LinearGradient
        colors={['blue', '#FF0000', '#FFD700']}
        start={{ x: 1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Image
            source={profileDetails?.welcomeimage ? { uri: profileDetails?.welcomeimage } : IMAGE_ASSETS.bringDeliveryPartner}
            style={styles.image}
          />
        </Animated.View>
        <Animated.Text
          style={[
            poppins.semi_bold.h7,
            styles.waitText,
            {
              transform: [
                {
                  translateY: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
              opacity: bounceAnim,
              color: '#FFF',
            },
          ]}
        >
          {/* Welcome to the App 🎉 */}
          {profileDetails?.welcomeNote || 'Hi 🎉'}
          {/* {JSON.stringify(profileDetails?.images, null, 2)} */}
        </Animated.Text>

        <View style={styles.progressContainer}>
          <Animated.View
            style={{
              width: animatedWidth,
              height: '100%',
              borderRadius: wp(10),
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={['#FFF', 'blue']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default WelcomeCard;
const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: wp(95),
    borderRadius: wp(4),
    height: hp(50),
    paddingVertical: hp(2),
  },
  image: {
    width: wp(70),
    height: wp(70),
    resizeMode: 'contain',
    // borderWidth:1,
  },
  waitText: {
    marginTop: hp(1.5),
  },
  progressContainer: {
    width: wp(80),
    height: hp(1.5),
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginTop: hp(2),
    overflow: 'hidden',
  },
});
