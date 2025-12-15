import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { useSelector } from 'react-redux';
import { fetchData } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const UserPendingCount = ({ profileStatus, addressCurrent, location, notificationData }) => {
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [prevCount, setPrevCount] = useState(0);
    const { theme } = useTheme();
    const { t } = useTranslation();
    const profile = useSelector(state => state.Auth.profile);
    const profileDetails = useSelector(state => state.Auth.profileDetails);
    const accessToken = useSelector(state => state.Auth.accessToken);
    const navigation = useNavigation();

    // Badge pop animation
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Heartbeat animation for loader
    const heartbeatAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (loading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(heartbeatAnim, {
                        toValue: 1.5,
                        duration: 300,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(heartbeatAnim, {
                        toValue: 1,
                        duration: 300,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            heartbeatAnim.setValue(1);
        }
    }, [loading]);

    const toggleSwitch = async () => {
        if (!accessToken || !profile?.driver_id || !location) return;
        setLoading(true);
        const payLoad = {
            driverId: profile.driver_id,
            lat: location?.latitude,
            lon: location?.longitude,
            vehicleId: profileDetails?.vehicle_type,
        };
        try {
            const data = await fetchData('transport/pendingrequest', 'POST', payLoad, {
                Authorization: `${accessToken}`,
                driver_id: profile.driver_id,
            });
            if (!data?.ok && data?.status === 'false') {
                await AsyncStorage.clear();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'login-screen' }],
                });
                return;
            }
            const newCount = data?.pendingBookings?.length || 0;

            // Animate badge if count increased
            if (newCount > count) {
                Animated.sequence([
                    Animated.timing(scaleAnim, { toValue: 1.5, duration: 200, useNativeDriver: true }),
                    Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                ]).start();
            }

            setPrevCount(count);
            setCount(newCount);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        } finally {
            setLoading(false);
        }
    };
    // Trigger API every 3 seconds
    useEffect(() => {
        const interval = setInterval(toggleSwitch, 3000);
        return () => clearInterval(interval);
    }, [notificationData]);
    // Trigger on location/address change
    useEffect(() => {
        toggleSwitch();
    }, [addressCurrent, location]);

    if (!profileStatus || count === 0) return null;

    return (
        <TouchableOpacity
            onPress={() => navigation?.navigate('PendingHistory')}
            activeOpacity={0.8}
            style={[styles.card, { backgroundColor: COLORS[theme].accent }]}
        >
            <View style={styles.pendingContainer}>
                <MaterialCommunityIcons
                    name="car"
                    size={wp(7)}
                    color={COLORS[theme].white}
                    style={{ marginHorizontal: wp(2) }}
                />
                <Text style={[poppins.semi_bold.h7, styles.statusText, { color: COLORS[theme].white }]}>
                    {t('You have pending requests')}
                </Text>

                <Animated.View style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}>
                    {loading ? (
                        <Animated.View
                            style={{
                                width: wp(5),
                                height: wp(5),
                                borderRadius: wp(2.5),
                                backgroundColor: '#FF0000',
                                transform: [{ scale: heartbeatAnim }],
                            }}
                        />
                    ) : (
                        <Text style={[poppins.semi_bold.h7, styles.badgeText]}>{count}</Text>
                    )}
                </Animated.View>
                <MaterialCommunityIcons
                    name="chevron-right"
                    size={wp(7)}
                    color={COLORS[theme].white}
                    style={{ marginLeft: wp(2) }}
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: hp(1),
        paddingHorizontal: wp(4),
        borderRadius: wp(10),
        position: 'absolute',
        top: hp(8),
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    pendingContainer: { flexDirection: 'row', alignItems: 'center' },
    statusText: { fontSize: wp(3.8) },
    badge: {
        backgroundColor: '#FFF',
        marginLeft: wp(3),
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF0000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation: 3,
    },
    badgeText: {
        color: '#FF0000',
        fontSize: wp(3.5),
    },
});
export default UserPendingCount;