import { useEffect, useState, useCallback } from 'react';
import { fetchData } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

export default function usePendingCount(location, notificationData) {
    
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const profile = useSelector(state => state.Auth.profile);
    const profileDetails = useSelector(state => state.Auth.profileDetails);
    const accessToken = useSelector(state => state.Auth.accessToken);
    const fetchPendingCount = useCallback(async () => {
        if (!accessToken || !profile?.driver_id || !location) return;
        setLoading(true);
        const payLoad = {
            driverId: profile.driver_id,
            lat: location?.latitude,
            lon: location?.longitude,
            vehicleId: profileDetails?.vehicle_type,
        };
        try {
            const data = await fetchData(
                'transport/pendingrequest',
                'POST',
                payLoad,
                {
                    Authorization: `${accessToken}`,
                    driver_id: profile.driver_id
                }
            );

            if (!data?.ok && data?.status === 'false') {
                await AsyncStorage.clear();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'login-screen' }],
                });
            }

            setCount(data?.pendingBookings?.length || 0);
        } catch (error) {
            console.error('Pending count error:', error);
        } finally {
            setLoading(false);
        }
    }, [accessToken, profile, profileDetails, location]);

    // Auto refresh every 3 seconds
    useEffect(() => {
        const interval = setInterval(fetchPendingCount, 3000);
        return () => clearInterval(interval);
    }, [fetchPendingCount, notificationData]);

    useEffect(() => {
        fetchPendingCount();
    }, [location]);

    return { pendingCount:count, loading, refresh: fetchPendingCount };
}
