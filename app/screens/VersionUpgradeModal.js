import React, { useState, useEffect } from 'react';
import {
    Modal, View, Text, StyleSheet, TouchableOpacity,
    Linking, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { wp, hp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import DeviceInfo from 'react-native-device-info';
import VersionCheck from 'react-native-version-check';

const VersionUpgradeModal = () => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [currentVersion, setCurrentVersion] = useState('');
    const [latestVersion, setLatestVersion] = useState('');

    // Compare version strings (returns negative if v1 < v2)
    const compareVersions = (v1, v2) => {
        const a = v1.split('.').map(Number);
        const b = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            const diff = (a[i] || 0) - (b[i] || 0);
            if (diff !== 0) return diff;
        }
        return 0;
    };

    // Fetch current app version and store version
    useEffect(() => {
        const checkVersion = async () => {
            const appVersion = DeviceInfo.getVersion();
            setCurrentVersion(appVersion);

            try {
                const storeVersion = await VersionCheck.getLatestVersion({
                    forceUpdate: false, // optional
                });
                setLatestVersion(storeVersion);
                console.log('App Version:', appVersion, 'Store Version:', storeVersion);
                if (compareVersions(appVersion, storeVersion) < 0) {
                    setVisible(true);
                }
            } catch (err) {
                console.warn('Version check error:', err);
            }
        };

        checkVersion();
    }, []);

    const handleUpdate = async () => {
        const url = await VersionCheck.getStoreUrl({ appID: null });
        Linking.openURL(url);
    };

    const handleLater = () => {
        setVisible(false); // Close the modal when "Later" is clicked
    };

    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.modalContainer,
                        { backgroundColor: COLORS[theme].background },
                    ]}
                >
                    <MaterialCommunityIcon
                        name="update"
                        size={wp(16)}
                        color={COLORS[theme].primary}
                        style={{ marginBottom: hp(2) }}
                    />
                    <Text
                        style={[
                            poppins.medium.h6,
                            { color: COLORS[theme].textPrimary, marginBottom: hp(1) },
                        ]}
                    >
                        {t('App Update Available')}
                    </Text>
                    <Text
                        style={[
                            poppins.regular.h8,
                            { color: COLORS[theme].textPrimary, textAlign: 'center' },
                        ]}
                    >
                        {t(
                            `A new version (${latestVersion}) of the app is available. You are currently using version ${currentVersion}.`
                        )}
                    </Text>

                    <View style={styles.infoContainer}>
                        <View
                            style={[styles.versionBox, { backgroundColor: COLORS[theme].card }]}
                        >
                            <Text style={[poppins.medium.h8, { color: COLORS[theme].primary }]}>
                                {t('Current')}:
                            </Text>
                            <Text style={[poppins.medium.h8, { color: COLORS[theme].textPrimary }]}>
                                {currentVersion || 'N/A'}
                            </Text>
                        </View>
                        <MaterialCommunityIcon
                            name="arrow-right-bold"
                            color={COLORS[theme].textPrimary}
                            size={wp(6)}
                            style={{ marginHorizontal: wp(2) }}
                        />
                        <View
                            style={[styles.versionBox, { backgroundColor: COLORS[theme].card }]}
                        >
                            <Text style={[poppins.medium.h8, { color: COLORS[theme].primary }]}>
                                {t('Latest')}:
                            </Text>
                            <Text style={[poppins.medium.h8, { color: COLORS[theme].textPrimary }]}>
                                {latestVersion || 'N/A'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: COLORS[theme].textPrimary }]}
                            onPress={handleUpdate}
                        >
                            <Text style={[poppins.bold.h6, { color: COLORS[theme].background }]}>
                                {t('Update Now')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: COLORS[theme].textPrimary }]}
                            onPress={handleLater}
                        >
                            <Text style={[poppins.bold.h6, { color: COLORS[theme].background }]}>
                                {t('Later')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default VersionUpgradeModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: wp(90),
        borderRadius: wp(3),
        padding: wp(5),
        alignItems: 'center',
        borderWidth: wp(0.3),
        borderColor: '#ccc',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: hp(2),
    },
    versionBox: {
        paddingVertical: hp(1),
        paddingHorizontal: wp(4),
        borderRadius: wp(2),
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        marginTop: hp(2),
    },
    button: {
        flex: 1,
        paddingVertical: hp(1.8),
        marginHorizontal: wp(2),
        borderRadius: wp(2),
        alignItems: 'center',
    },
});
