import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ToastAndroid,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { IMAGE_ASSETS } from '../resources/images';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { fetchData } from '../api/api';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '../navigation/RootNavigation';


const InAppNotification = ({ data, onClose, onAccept, onReject }) => {
    const { theme } = useTheme();
    // Only show if valid data
    if (!data || !data.booking_uid || !data?.booking_id) return null;

    const profile = useSelector(state => state.Auth.profile);
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    const handleNavigate = async () => {
        setLoading(true);
        try {
            const dataResponse = await fetchData('/transport/updatebooking', 'POST', {
                booking_status: 'accept',
                booking_id: data?.booking_id,
                driver_id: profile?.driver_id
            }, null);
            if (dataResponse?.status === true) {
                showMessage({ message: dataResponse?.message, type: 'success' });
                ToastAndroid.show(dataResponse?.message, ToastAndroid.SHORT);
                onClose();

                // Save relevant booking data to AsyncStorage, without booking_id
                const bookingData = {
                    message: data?.message,
                    pickupLocation: data?.pickupLocation,
                    dropLocation: data?.dropLocation,
                    bookingUid: data?.booking_uid,
                    bId: data?.booking_id,
                    status: 'accepted',
                };
                await AsyncStorage.setItem('ACCEPTEDBOOKING', JSON.stringify(bookingData));

                setTimeout(() => {
                    navigate('BookingAction', { bid: data?.booking_id, acceptStatus: 'accept' });
                }, 1000);
            } else {
                showMessage({ message: dataResponse?.message, type: 'error' });
            }
        } catch (err) {
            console.error('Notification fetch error:', err);
        } finally {
            setLoading(false);
            onClose();
        }
    };

    return (
        <View style={styles.container}>
            <FlashMessage position="top" />
            <View style={[styles.card, { backgroundColor: COLORS[theme].background }]}>
                {loading ? (
                    <ActivityIndicator color={COLORS[theme].accent} />
                ) : (
                    <>
                        {/* Delivery Image */}
                        <Image source={IMAGE_ASSETS.delivery_boy_image} style={styles.image} />

                        {/* Main Message */}
                        <Text style={[poppins.semi_bold.h6, styles.titleText, { color: COLORS[theme].primary }]}>
                            {data.message || 'New Notification'}
                        </Text>

                        {/* Booking Status */}
                        <Text style={[poppins.bold.h7, styles.statusText, { color: COLORS[theme].primary }]}>
                            Booking Id: {data.booking_uid}
                        </Text>

                        {/* Pickup */}
                        <Text style={[poppins.medium.h8, styles.labelText, { color: COLORS[theme].text }]}>
                            Pickup:
                        </Text>
                        <Text style={[poppins.regular.h7, styles.locationText, { color: COLORS[theme].text }]}>
                            {data.pickupLocation}
                        </Text>

                        {/* Drop */}
                        <Text style={[poppins.medium.h8, styles.labelText, { color: COLORS[theme].text }]}>
                            Drop:
                        </Text>
                        <Text style={[poppins.regular.h7, styles.locationText, { color: COLORS[theme].text }]}>
                            {data?.dropLocation}
                        </Text>

                        {/* Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={onClose}>
                                <Text style={styles.buttonText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleNavigate} style={[styles.button, styles.acceptButton]}>
                                <Text style={styles.buttonText}>Accept</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
};

export default InAppNotification;

const styles = StyleSheet.create({
    container: {
        position: 'absolute', bottom: hp(0.5), left: wp(5), right: wp(5),
        zIndex: 9999, alignItems: 'center', zIndex: 100
    },
    card: {
        padding: wp(5), borderRadius: wp(5),
        borderWidth: 1, borderColor: '#ccc', shadowColor: '#000',
        shadowOpacity: 0.2, shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6, width: wp(99),
        alignItems: 'center', backgroundColor: '#fff',
    },
    image: {
        width: wp(30),
        height: wp(30), resizeMode: 'contain',
        alignSelf: 'center',
    },
    titleText: {
        marginTop: wp(3), textAlign: 'center',
    },
    statusText: { marginTop: wp(1), marginBottom: wp(2), },
    labelText: {
        marginTop: wp(2), fontWeight: '600',
    },
    locationText: {
        textAlign: 'center',
        marginBottom: wp(1),
    },
    buttonRow: {
        flexDirection: 'row', marginTop: wp(5),
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        flex: 1, marginHorizontal: wp(2), paddingVertical: wp(3),
        borderRadius: wp(2), alignItems: 'center',
    },
    rejectButton: {
        backgroundColor: '#FF4D4F',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#fff', fontWeight: '600',
    },
});
