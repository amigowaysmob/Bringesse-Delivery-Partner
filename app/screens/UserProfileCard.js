import React, { useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const UserProfileCard = () => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const profile = useSelector(state => state.Auth.profileDetails);
    const siteDetails = useSelector(state => state.Auth.siteDetails);
    const navigation = useNavigation();
    const userName = `${profile?.first_name || ''} ${profile?.last_name || ''}`;
    // -------------------------------
    // Navigation handlers with useCallback
    // -------------------------------
    const handleEditProfilePic = useCallback(() => {
        navigation.navigate('UpdateProfilePic');
    }, [navigation]);
    const handleEditProfile = useCallback(() => {
        navigation.navigate('EditProfile');
    }, [navigation]);
    // -------------------------------
    // Animation setup
    // -------------------------------
    const slideAnim = useRef(new Animated.Value(30)).current; // initial vertical offset
    const fadeAnim = useRef(new Animated.Value(0)).current; // initial opacity

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <>
            <Pressable
                onPress={handleEditProfile}
            >

                <Animated.View
                    onPress={handleEditProfile}
                    style={[
                        styles.card,
                        {
                            backgroundColor: COLORS[theme].background,
                            borderColor: "#ccc",
                            transform: [{ translateY: slideAnim }],
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <>
                        {/* Profile Image */}
                        <TouchableOpacity onPress={handleEditProfilePic} style={styles.imageContainer}>
                            <Image
                                source={{ uri: siteDetails?.media_url + 'drivers/images/' + profile?.driver_image }}
                                style={styles.profileImage}
                            />
                            <MaterialCommunityIcon
                                name="pencil-circle"
                                size={wp(7)}
                                style={styles.editIcon}
                                color={COLORS[theme].accent}
                            />
                        </TouchableOpacity>

                        {/* User info */}
                        <View style={styles.infoContainer}>
                            <Text
                                numberOfLines={1}
                                style={[poppins.semi_bold.h7, styles.userName, { color: COLORS[theme].primary }]}
                            >
                                {userName}
                            </Text>

                            <TouchableOpacity
                                onPress={handleEditProfile}
                                style={[styles.editButton, { borderColor: COLORS[theme].buttonBg }]}
                            >
                                <Text style={[poppins.regular.h8, { color: COLORS[theme].buttonBg }]}>
                                    {t('Edit Profile')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <MaterialCommunityIcon
                            name="chevron-right"
                            size={wp(8)}
                            style={{ alignSelf: 'center' }}
                            color={COLORS[theme].textPrimary}
                        />
                    </>
                </Animated.View>
            </Pressable>
        </>
    );
};
const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: wp(4), paddingHorizontal: wp(4),
        borderRadius: wp(3), borderWidth: 0.5, marginHorizontal: wp(4),
        marginVertical: wp(1),
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 5,
    },
    imageContainer: {
        position: 'relative',
        marginRight: hp(3),
    },
    profileImage: {
        width: wp(16),
        height: wp(16),
        borderRadius: wp(8),
        borderWidth: 2,
        borderColor: '#ccc',
    },
    editIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        marginBottom: wp(2),
        textTransform: 'capitalize',
    },
    editButton: {
        paddingVertical: wp(1),
        paddingHorizontal: wp(3),
        borderRadius: wp(2),
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
});
export default UserProfileCard;
