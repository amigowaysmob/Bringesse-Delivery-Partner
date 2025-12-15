import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, Image,
  BackHandler, Alert,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { IMAGE_ASSETS } from '../../resources/images';
import { hp, wp } from '../../resources/dimensions';
import { useTheme } from '../../context/ThemeContext';
import { getAccesstoken, getrefreshtoken, getUserData } from '../../utils/utils';
import { useAuthHoc } from '../../config/config';

const _ = require('lodash');
export default function SplashScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const {
    actions: {
      APP_SITE_SETTING_API_CALL,
    },
  } = useAuthHoc();
  
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // navigation.reset({
    //   index: 0,
    //   routes: [{ name: 'GetStartedScreen' }],
    // });
    APP_SITE_SETTING_API_CALL({
      request: {},
      callback: {
        successCallback: async (response) => {
          if (response) {
            console.log('Site Setting API response:', response);
            dispatch({
              type: 'SET_SITE_DETAILS',
              payload: response?.data?.data,
            });
          }
        },
        errorCallback: (err) => {
          console.log('Site Setting API error:', err);
          Alert.alert(
            'Error',
            'Unable to load app settings. Please try again later.',
            [{ text: 'OK', onPress: () => BackHandler.exitApp() }]
          );
        },
      },
    });

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const userData = await getUserData();
      const aToken = await getAccesstoken();
      const refreshToken = await getrefreshtoken();
      const parsedData = JSON.parse(userData)
      // console.log(JSON.stringify(parsedData?.aadhar_front));
      if (parsedData && !_.isEmpty(parsedData) && !parsedData?.aadhar_front && !aToken) {
        navigation.navigate('uploadRegisterDocs', { showBackArrow: false, userDatas: parsedData });
        return;
      }
      if (!isConnected) {
        Alert.alert(
          'No Internet Connection',
          'Please check your network settings and try again.',
          [{ text: 'OK', onPress: () => BackHandler.exitApp() }]
        );
        return;
      }
      // ✅ Call siteSetting API
      APP_SITE_SETTING_API_CALL({
        request: {},
        callback: {
          successCallback: async (response) => {
            if (response) {
              console.log('Site Setting API response:', response);
              dispatch({
                type: 'SET_SITE_DETAILS',
                payload: response?.data?.data,
              });
              // Only navigate after API success
              if (userData && !_.isEmpty(userData) && aToken) {
                const parsedData = JSON.parse(userData);
                dispatch({
                  type: 'SET_TOKENS',
                  payload: {
                    access_token: aToken,
                    refresh_token: refreshToken,
                  },
                });
                dispatch({
                  type: 'UPDATE_PROFILE',
                  payload: parsedData,
                });
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'home-screen' }],
                });
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'GetStartedScreen' }],
                });
              }
            }
          },
          errorCallback: (err) => {
            console.log('Site Setting API error:', err);
            Alert.alert(
              'Error',
              'Unable to load app settings. Please try again later.',
              [{ text: 'OK', onPress: () => BackHandler.exitApp() }]
            );
          },
        },
      });
    };

    initialize();
  }, [isConnected]);


  return (
    <View style={[styles.container, { backgroundColor: '#fff' }]}>
      <Image
        style={styles.splashLogo}
        resizeMode="contain"
        source={IMAGE_ASSETS.splash_screen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    height: hp(100),
    width: wp(100),
  },
});
