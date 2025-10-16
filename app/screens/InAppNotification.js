// InAppNotification.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { IMAGE_ASSETS } from '../resources/images';

const InAppNotification = ({ title, body, onClose, data }) => {
    const { theme } = useTheme();
    if (title !== 'new_booking') {
        return
    }
    return (
        <View style={[styles.container]}>
            <View style={[styles.card, { backgroundColor: COLORS[theme].background }]}>
                <Image source={IMAGE_ASSETS.delivery_boy_image} style={{ width: wp(80), height: wp(80), resizeMode: "contain", alignSelf: "center" }} />
                <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].text }]}>
                    {title}
                </Text>
                <Text style={[poppins.regular.h7, { color: COLORS[theme].text, marginTop: wp(2) }]}>
                    {body}
                </Text>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <Text style={[poppins.medium.h7, { color: 'white' }]}>Close</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default InAppNotification;
const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: hp(0),
        left: wp(5),
        right: wp(5),
        zIndex: 9999,
        alignItems: 'center',
        borderRadius: wp(10),
    },
    card: {
        padding: wp(4),
        borderRadius: wp(5),
        borderWidth: 1,
        borderColor: '#ccc',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 5,
        width: wp(98), height: hp(70), alignItems: "center", justifyContent: "center"
    },
    closeBtn: {
        marginTop: wp(4),
        alignSelf: 'flex-end',
        backgroundColor: '#FF4D4F',
        paddingHorizontal: wp(4),
        paddingVertical: wp(2),
        borderRadius: wp(1.5),
    },
});
