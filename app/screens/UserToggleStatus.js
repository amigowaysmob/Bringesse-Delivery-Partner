import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Switch, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { useDispatch, useSelector } from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import { fetchData } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const UserToggleStatus = ({profileStatus}) => {
    const [isOnline, setIsOnline] = useState(null);
    const [loading, setLoading] = useState(false); // Loader state
    const { theme } = useTheme();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const profile = useSelector(state => state.Auth.profile);
    const accessToken = useSelector(state => state.Auth.accessToken);
    const navigation = useNavigation();

    useEffect(() => {
        // Fetch the profile data only on initial load
        fetchProfileData();
    }, []);

    // Fetch the profile data when the component loads
    const fetchProfileData = async () => {
        // if (!accessToken || !profile?.driver_id) return;
        const id = await DeviceInfo.getUniqueId();
        try {
            setLoading(true); // Start loading when fetching
            const data = await fetchData('profile/' + profile?.driver_id, 'GET', null, {
                Authorization: `${accessToken}`,
                driver_id: profile.driver_id,
                device_id: await DeviceInfo.getUniqueId(),
            });
            console.log(data, 'Profile Data Fetched');
            if (!data?.ok && data?.status == 'false') {
                // Alert.alert('Session Expired', 'Please log in again.', )
                await AsyncStorage.clear();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'login-screen' }],
                });
            }

            setIsOnline(data?.live_status ? true : false); // Set the live status
            dispatch({
                type: 'PROFILE_DETAILS',
                payload: data,
            });
        } catch (error) {
            console.error('profile API Error:', error);
        } finally {
            setLoading(false);  // End loading
        }
    };

    // Function to toggle online/offline status
    const toggleSwitch = async () => {
        if (!accessToken || !profile?.driver_id) return;
        // Avoid unnecessary toggle if the value is already the same
        // if (isOnline == null) {
        // Alert.alert('test')
        setLoading(true);  // Show loader
        const deviceId = await DeviceInfo.getUniqueId();
        const newStatus = isOnline ? '0' : '1'; // Toggle live status
        const payLoad = {
            driver_id: profile.driver_id,
            live_status: newStatus,
        };
        try {
            // Perform the API call only when the state is being updated
            const data = await fetchData('updateprofile', 'PATCH', payLoad, {
                Authorization: `${accessToken}`,
                driver_id: profile.driver_id,
                device_id: deviceId,
            });
            console.log('Update Profile Response:', data);
            // Fetch updated profile data after the update
            if (!data?.ok && data?.status == 'false') {
                // Alert.alert('Session Expired', 'Please log in again.', )
                await AsyncStorage.clear();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'login-screen' }],
                });
            }
            fetchProfileData();
            dispatch({
                type: 'UPDATE_PROFILE',
                payload: data,
            });
        } catch (error) {
            console.error('Error updating profile status:', error);
        } finally {
            setLoading(false);  // Hide loader
        }
        // }
    };

    const onlineText = t('Online') || 'Online';
    const offlineText = t('Offline') || 'Offline';

    if (!profileStatus) return null; // Hide component if profileStatus is true

    return (
        <View style={[styles.card, { backgroundColor: COLORS[theme].background }]}>
            <Text style={[poppins.semi_bold.h7, styles.statusText, { color: COLORS[theme].primary }]}>
                {isOnline ? onlineText : offlineText}
            </Text>

            <View style={styles.switchContainer}>
                {loading ? (
                    <ActivityIndicator size="small" color={COLORS[theme].accent} />
                ) : (
                    <Switch
                        trackColor={{ false: "#999", true: COLORS[theme].accent + '50' }}
                        thumbColor={isOnline ? COLORS[theme].accent : COLORS[theme].white}
                        onValueChange={toggleSwitch}
                        value={isOnline}
                        disabled={loading}  // Disable switch while loading
                    />
                )}
            </View>
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
        margin: wp(1),
    },
    statusText: {
        fontSize: wp(5),
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default UserToggleStatus;
