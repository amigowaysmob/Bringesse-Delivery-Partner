import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { useDispatch, useSelector } from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import { fetchData } from '../api/api';
import { useFocusEffect } from '@react-navigation/native';

const UserToggleStatus = () => {

    const [isOnline, setIsOnline] = useState(null);
    const { theme } = useTheme();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const profileDetails = useSelector(state => state.Auth.profileDetails);
  const mapRef = useRef(null);
    
    useEffect(() => {
        fetchProfileData();
    }, [])
    const fetchProfileData = async () => {
        if (!accessToken || !profile?.driver_id) return;
        try {
            const data = await fetchData('profile/' + profile?.driver_id, 'GET', null, {
                Authorization: `${accessToken}`,
                driver_id: profile.driver_id,
            });
            // console.log('UpdatedProfile', JSON.stringify(data?.live_status ? "online" :"off"));
            setIsOnline(data?.live_status ? true : false)
            dispatch({
                type: 'PROFILE_DETAILS',
                payload: data,
            });
        } catch (error) {
            console.error('profile API Error:', error);
        } finally {
            // setLoading(false);
        }
    };
    const toggleSwitch = async () => {
        if (!accessToken || !profile?.driver_id) return;
        setIsOnline(prev => !prev)
        const deviceId = await DeviceInfo.getUniqueId();
        const payLoad = {
            driver_id: profile.driver_id,
            live_status: isOnline ? '0' : '1'
        };
        try {
            const data = await fetchData('updateprofile', 'PATCH', payLoad, {
                Authorization: `${accessToken}`,
                driver_id: profile.driver_id,
                device_id: deviceId,
            });
            // console.log('getrevenue Data', JSON.stringify(data));
            //   setRevenueData(data);
            fetchProfileData();
            dispatch({
                type: 'UPDATE_PROFILE',
                payload: data,
            });
        } catch (error) {
            console.error('getrevenue API Error:', error);
        } finally {
            //   setLoading(false);
        }
    };
    const onlineText = t('userStatus.online') || 'Online';
    const offlineText = t('userStatus.offline') || 'Offline';
    const profile = useSelector(state => state.Auth.profile);
    const accessToken = useSelector(state => state.Auth.accessToken);

    return (
        <View style={[styles.card, {
            backgroundColor: COLORS[theme].background,
            // borderColor: 'grey',
        }]}>
            <Text style={[poppins.semi_bold.h7, styles.statusText, { color: COLORS[theme].primary }]}>
                {isOnline ? onlineText : offlineText}
            </Text>
            <Switch
                trackColor={{ false: "#999", true: COLORS[theme].accent + '50' }}
                thumbColor={isOnline ? COLORS[theme].accent : COLORS[theme].white}
                onValueChange={toggleSwitch}
                value={isOnline}
            />
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
        borderWidth: wp(0.3), borderColor: '#ccc',
        margin: wp(1),
    },

});

export default UserToggleStatus;
