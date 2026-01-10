import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Switch, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { useDispatch, useSelector } from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import { fetchData } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import useCurrentLocation from '../hooks/useCurrentLocation';
const UserToggleStatus = ({ profileStatus, addressCurrent, location }) => {
    const [isOnline, setIsOnline] = useState(null);
    const [loading, setLoading] = useState(false);
    const { theme } = useTheme();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const profile = useSelector(state => state.Auth.profile);
    const accessToken = useSelector(state => state.Auth.accessToken);
    const profileDetails = useSelector(state => state.Auth.profileDetails);
    const { currLocation, locationLoading, address } = useCurrentLocation();
    const locationIntervalRef = useRef(null);
    // Initial fetch
    useEffect(() => {
        fetchProfileData();
    }, [isOnline]);
    // Auto-update driver location every 10 seconds if online
    useEffect(() => {
        if (!isOnline) return; // Don't update when offline
        if (locationIntervalRef.current)
            clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = setInterval(() => {
            sendLocation(currLocation, address);
        }, 5000);
        return () => {
            clearInterval(locationIntervalRef.current);
        };
    }, [isOnline, currLocation, address]);
    // ---------------------------------------------
    // SEND DRIVER LOCATION
    // ---------------------------------------------
    const sendLocation = async (loc, addr) => {
        if (!accessToken || !profile?.driver_id) return;
        if (!loc) return;
        const deviceId = await DeviceInfo.getUniqueId();
        const payload = {
            driver_id: profile.driver_id,
            location: addr || '',
            lat: loc.latitude,
            lon: loc.longitude,
        };
        try {
            const data = await fetchData('updateprofile', 'PATCH', payload, {
                Authorization: `${accessToken}`,
                driver_id: profile.driver_id,
                device_id: deviceId,
            });
            // dispatch({ type: 'PROFILE_DETAILS', payload: data });
        } catch (error) {
            console.error('Error sending location:', error);
        }
        finally {
            fetchProfileData()
        }
    };

    // ---------------------------------------------
    // FETCH DRIVER PROFILE DATA
    // ---------------------------------------------
    const fetchProfileData = async () => {
        if (!accessToken || !profile?.driver_id) return;
        try {
            setLoading(true);
            const data = await fetchData('profile/' + profile?.driver_id, 'GET', null, {
                Authorization: `${accessToken}`,
                driver_id: profile.driver_id,
                device_id: await DeviceInfo.getUniqueId(),
            });
            if (!data?.ok && data?.status == 'false') {
                await AsyncStorage.clear();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'login-screen' }],
                });
                return;
            }
            setIsOnline(data?.live_status ? true : false);
            dispatch({
                type: 'PROFILE_DETAILS',
                payload: data,
            });
        } catch (error) {
            console.error('Profile API Error:', error);
        } finally {
            setLoading(false);
        }
    };
    // ---------------------------------------------
    // TOGGLE DRIVER ONLINE / OFFLINE
    // ---------------------------------------------
    const toggleSwitch = async () => {
        if (!accessToken || !profile?.driver_id) return;
        setLoading(true);
        const deviceId = await DeviceInfo.getUniqueId();
        const newStatus = isOnline ? '0' : '1';
        const payload = {
            driver_id: profile.driver_id,
            live_status: newStatus,
            location: addressCurrent || '',
            lat: location?.latitude,
            lon: location?.longitude,
        };
        try {
            const data = await fetchData('updateprofile', 'PATCH', payload, {
                Authorization: `${accessToken}`,
                driver_id: profile.driver_id,
                device_id: deviceId,
            });
            // console.log(data,"UPDATE_PROFILE")
            // Alert.alert(JSON.stringify(data))
            // Alert.alert(JSON.stringify(data))
            if (!data?.ok && data?.status == 'false') {
                await AsyncStorage.clear();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'login-screen' }],
                });
                return;
            }
            // dispatch({
            //     type: 'UPDATE_PROFILE',
            //     payload: data.result,
            // });
            setIsOnline(newStatus === '1');
        } catch (error) {
            console.error('Error updating profile status:', error);
        } finally {
            setLoading(false);
            fetchProfileData()
        }
    };
    if (!profileStatus) return null;
    const onlineText = 'You are Online';
    const offlineText = 'You’ll miss new orders when offline.';
    // Alert.alert(profileDetails?.subscription_status)
    return (
        <View style={[styles.card, { backgroundColor: COLORS[theme].background }]}>
            {(
                profileDetails?.partner_type?.includes('Transport') &&
                profileDetails?.subscription_status == 0) ? (
                <>
                    <Text style={[poppins.semi_bold.h6, styles.statusText, { color: COLORS[theme].primary }]}>
                        Subscription
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('SubscriptionList')}
                        style={{
                            backgroundColor: COLORS[theme].accent,
                            padding: wp(1.5),
                            borderRadius: wp(1),
                        }}>
                        <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].white }]}>
                            Subscribe Now
                        </Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Text style={[
                        poppins.semi_bold.h7,
                        styles.statusText,
                        { color: COLORS[theme].primary, maxWidth: wp(70) }
                    ]}>
                        {isOnline ? onlineText : offlineText}
                    </Text>

                    <View style={styles.switchContainer}>
                        {loading ? (
                            <ActivityIndicator size={wp(4)} color={COLORS[theme].accent} />
                        ) : (
                            <Switch
                                trackColor={{ false: "#999", true: COLORS[theme].accent + '50' }}
                                thumbColor={isOnline ? COLORS[theme].accent : COLORS[theme].white}
                                onValueChange={toggleSwitch}
                                value={isOnline}
                                disabled={loading}
                            />
                        )}
                    </View>
                </>
            )}
        </View>
    );
};
const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: wp(4),
        paddingHorizontal: wp(4),
        borderRadius: wp(2),
        borderWidth: wp(0.3),
        borderColor: '#ccc',
        position: 'relative',
        width: wp(95),
        alignSelf: 'center',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: wp(4),
    },
});

export default UserToggleStatus;
