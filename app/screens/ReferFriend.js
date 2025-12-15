import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, FlatList, ToastAndroid, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HeaderBar from '../components/header';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../resources/colors';
import { useSelector } from 'react-redux';

const ReferFriend = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const dummyUsers = Array.from({ length: 25 }).map((_, i) => ({
    id: (i + 1).toString(),
    name: `User ${i + 1}`,
  }));
  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      console.log('Toast: ', message);
    }
  };
  const shareLink = async () => {
    try {
      await Share.share({
        message: `Join this app using my referral link: ${profileDetails?.android_download_link}`,
        url: profileDetails?.android_download_link,
        title: 'Refer a Friend',
      });
    } catch (error) {
      showToast(t('Unable to share the link.'));
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('Refer a Friend')} showBackArrow />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Text style={[styles.title, {
            color: COLORS[theme].primary
          }]}>{t('Invite your friends!')}</Text>
          <Text style={[styles.subtitle, {
            color: COLORS[theme].primary
          }]}>
            {t('Share your referral link and earn rewards when your friends join.')}
          </Text>
        </View>
        {/* Referral Card with Gradient */}
        <LinearGradient
          colors={['#FF0000', '#FF5722']}
          style={styles.referralContainer}
        >
          <Text style={styles.referralLink}>{profileDetails?.android_download_link}</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.shareButton} onPress={shareLink}>
              <Icon name="share" size={24} color="#fff" />
              <Text style={[styles.buttonText, {
                color: "white"
              }]}>{t('Share')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        {/* <View style={styles.usersListContainer}>
          <Text style={[styles.listTitle,{
            color:COLORS[theme].primary
          }]}>{t('Users who joined using your referral')}</Text>
          {dummyUsers.map((user) => (
            <View key={user.id} style={[styles.userItem,{
              backgroundColor:COLORS[theme].viewBackground
            }]}>
              <Text style={[styles.userName,{
                color:COLORS[theme].primary
              }]}>{user.id}.  {user.name}</Text>
            </View>
          ))}
        </View> */}
      </ScrollView>
    </GestureHandlerRootView>
  );
};
const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: wp(4), paddingBottom: hp(5), }, infoContainer: { marginBottom: hp(1), },
  title: {
    ...poppins.semi_bold.h5, color: '#333', marginBottom: hp(0.5),
  }, subtitle: { ...poppins.regular.h6, color: '#555', }, referralContainer: {
    padding: wp(4), borderRadius: wp(4), marginBottom: hp(1),
  }, referralLink: {
    ...poppins.regular.h7, color: '#fff', marginBottom: hp(2),
  },
  buttonGroup: {
    flexDirection: 'row', justifyContent: 'flex-start',
    gap: wp(4),
  }, shareButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: hp(1.2),
    paddingHorizontal: wp(4), borderRadius: 8,
  }, buttonText: {
    marginLeft: wp(1), color: '#fff', ...poppins.semi_bold.h7,
  },
  usersListContainer: { marginTop: hp(1), }, listTitle: {
    ...poppins.semi_bold.h6,
    color: '#333', marginBottom: hp(2),
  }, userItem: {
    padding: hp(1.5), borderBottomWidth: 1, borderBottomColor: '#ccc',
  }, userName: { ...poppins.regular.h7, color: '#555', },
}); export default ReferFriend;
