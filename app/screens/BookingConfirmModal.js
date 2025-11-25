// BookingConfirmModal.js
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
} from 'react-native';
import { wp, hp } from '../resources/dimensions';
import { COLORS } from '../resources/colors';
import { poppins } from '../resources/fonts';

const BookingConfirmModal = ({ status, onClose, onConfirm, theme,visible }) => {
    const [otp, setOtp] = useState('');
    const handleConfirm = () => {
        if (status === 'accepted' && otp.trim().length === 0) {
            alert('Please enter OTP to start pickup');
            return;
        }
        const nextStatus = status === 'accepted' ? 'picked' : 'completed';
        onConfirm(nextStatus, otp);
    };

    return (
        <Modal transparent animationType="none" visible={visible}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={[poppins.semi_bold.h6, { marginBottom: hp(2) }]}>
                        {status === 'accepted' ? 'Enter OTP to Start Pickup' : 'Enter OTP to Complete Booking'}
                    </Text>
                        <TextInput
                            placeholder="Enter OTP"
                            keyboardType="numeric"
                            value={otp}
                            onChangeText={setOtp}
                            style={[poppins.bold.h4, styles.input, {
                                color: COLORS[theme].black
                            }]}
                            maxLength={4}
                            placeholderTextColor={COLORS[theme].black}
                        />
                    <View style={styles.btnRow}>
                        <TouchableOpacity style={[styles.btnCancel, {
                            borderWidth: wp(0.3), borderColor: COLORS[theme].accent
                        }]} onPress={onClose}>
                            <Text style={[styles.btnText, {
                                color: COLORS[theme].accent
                            }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btnConfirm, {
                            backgroundColor: COLORS[theme].accent
                        }]} onPress={handleConfirm}>
                            <Text style={[styles.btnText, { color: '#fff' }]}>
                                {status === 'accepted' ? 'Start Pickup' : 'Complete Booking'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
const styles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center', alignItems: 'center',
    },
    container: {
        width: wp(90), padding: wp(5),
        backgroundColor: 'white', borderRadius: wp(2),
        elevation: 10,
    },
    input: {
        borderWidth: 1, borderColor: '#ccc', borderRadius: wp(1),
        paddingHorizontal: wp(3), paddingVertical: hp(1),
        marginBottom: hp(2),
    },
    btnRow: {
        flexDirection: 'row', justifyContent: 'space-around',
    },
    btnCancel: {
         borderRadius: wp(1), alignItems: "center", flex: 1,margin:wp(2),paddingVertical:wp(3)
    },
    btnConfirm: {
        borderRadius: wp(1), alignItems: "center",flex: 1,margin:wp(2),paddingVertical:wp(3)
    },
    btnText: {
        fontSize: wp(4), fontWeight: '600',
    },
});
export default BookingConfirmModal;
