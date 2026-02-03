import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  Platform,
} from 'react-native';
import { hp, wp } from '../../../resources/dimensions';
import { Icon } from 'react-native-paper';
import { poppins } from '../../../resources/fonts';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '../../../resources/colors';
import { useTheme } from '../../../context/ThemeContext';
import ToggleTheme from '../../../components/ToggleTheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ToggleLang from '../../../components/ToggleLang';
import { useTranslation } from 'react-i18next';
import UserProfileCard from '../../UserProfileCard';
import { useDispatch, useSelector } from 'react-redux';
import { fetchData } from '../../../api/api';
import DeviceInfo from 'react-native-device-info';
import VersionCheck from 'react-native-version-check';
import usePendingCount from '../../../hooks/userpendingCount';
import useCurrentLocation from '../../../hooks/useCurrentLocation';

// --- Logout Section ---
const LogoutSection = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const profile = useSelector(state => state.Auth.profileDetails);
  const accessToken = useSelector(state => state.Auth.accessToken);


  const handleLogout = async () => {
    Alert.alert(
      t('Confirm Logout'),
      t('Are you sure you want to logout?'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('yes'),
          // Make this callback async
          onPress: async () => {
            const deviceId = await DeviceInfo.getUniqueId();
            try {
              const data = await fetchData('logout/', 'POST', {
                driver_id: profile?.driver_id,
                device_id: deviceId,
              }, {
                Authorization: `${accessToken}`,
                driver_id: profile?.driver_id,
                device_id: deviceId,
              });
              console?.log(data, 'logout response', deviceId, profile?.driver_id);
              if (data.status == 'true') {
                await AsyncStorage.clear();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'login-screen' }],
                });
              }
            } catch (error) {
              console.error('profile API Error:', error);
            } finally {
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'login-screen' }],
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  return (
    <View style={{ backgroundColor: COLORS[theme].viewBackground }}>
      <TouchableOpacity onPress={handleLogout} style={sectionRow}>
        <View style={leftRow}>
          <MaterialIcon name="logout" size={wp(5)} color={COLORS[theme].textPrimary} />
          <Text style={[poppins.medium.h7, { color: COLORS[theme].textPrimary }]}>
            {t('Logout')}
          </Text>
        </View>
        <Icon
          source={'menu-right'}
          size={wp(8)}
          style={{ margin: wp(10) }}
          color={COLORS[theme].textPrimary}
        />
      </TouchableOpacity>
    </View>
  );
};
// --- Theme Toggle Section ---
const ThemeSection = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ backgroundColor: COLORS[theme].viewBackground }}>
      <View style={sectionRow}>
        <View style={leftRow}>
          <MaterialCommunityIcon
            name="theme-light-dark"
            size={wp(5)}
            color={COLORS[theme].textPrimary}
          />
          <Text style={[poppins.medium.h7, { color: COLORS[theme].textPrimary }]}>
            {t('Dark mode')}
          </Text>
        </View>
        <ToggleTheme />
      </View>
    </View>
  );
};
// --- Language Toggle Section ---
const LangSection = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ backgroundColor: COLORS[theme].viewBackground }}>
      <View style={sectionRow}>
        <View style={leftRow}>
          <MaterialCommunityIcon
            name="google-translate"
            size={wp(6)}
            color={COLORS[theme].textPrimary}
          />
          <Text style={[poppins.medium.h7, { color: COLORS[theme].textPrimary }]}>
            {t('language')}
          </Text>
        </View>
        <ToggleLang Icon1="format-letter-case" Icon2="abjad-arabic" lang />
      </View>
    </View>
  );
};
// --- MoreScreen Main Component ---
const MoreScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [availVersion] = useState('1.0.0'); // or fetch from config or constants
  // const profile = useSelector(state => state.Auth.profile);
  const profile = useSelector(state => state.Auth.profile);
  const { location, locationLoading, refreshLocation } = useCurrentLocation();
  // Get pending count using the custom hook
  const { pendingCount, loading } = usePendingCount(location);
  const navigation = useNavigation();
  const accessToken = useSelector(state => state.Auth.accessToken);
  const dispatch = useDispatch();
  const siteDetails = useSelector(state => state.Auth.siteDetails);
  const [showSubcriotion, setShowSubcriotion] = useState(false);
  useFocusEffect(
    useCallback(() => {
      const getShowSuSCribMenu = async () => {
        if (!profile?.driver_id) return;
        try {
          const data = await fetchData('configureSubscriptionMenu', 'POST', {
            platform: Platform?.OS,
            driver_id: profile?.driver_id,
            // device_id: await DeviceInfo.getUniqueId(),
          }, null);
          if (data?.status !== 'false') {
            setShowSubcriotion(data?.show);
          }
        } catch (error) {
          console.error('profile API Error:', error);
        } finally {
        }
      };
      const fetchProfileData = async () => {
        if (!accessToken || !profile?.driver_id) return;
        console.log('profile', '2');
        try {

          const data = await fetchData('profile/' + profile?.driver_id, 'GET', null, {
            Authorization: `${accessToken}`,
            driver_id: profile.driver_id,
            // device_id: deviceId,
            device_id: await DeviceInfo.getUniqueId(),
          });
          if (!data?.ok && data?.status == 'false') {
            // Alert.alert('Session Expired', 'Please log in again.', )
            await AsyncStorage.clear();
            navigation.reset({
              index: 0,
              routes: [{ name: 'login-screen' }],
            });
          }
          dispatch({
            type: 'PROFILE_DETAILS',
            payload: data,
          });
        } catch (error) {
          console.error('profile API Error:', error);
        } finally {
        }
      };
      fetchProfileData();
      getShowSuSCribMenu();
    }, [])
  );
  const SectionItem = ({ icon, label, navigationPath }) => (
    <TouchableOpacity onPress={
      () => {
        navigation?.navigate(navigationPath)
      }
    } style={{ backgroundColor: COLORS[theme].viewBackground }}>
      <View style={sectionRow}>
        <View style={leftRow}>
          <MaterialCommunityIcon
            name={icon}
            size={wp(6)}
            color={COLORS[theme].textPrimary}
          />
          <Text style={[poppins.medium.h7, { color: COLORS[theme].textPrimary, textTransform: "capitalize" }]}>
            {t(label)}
          </Text>
        </View>
        <Icon

          source={'menu-right'}
          size={wp(8)}
          style={{ margin: wp(10) }}
          color={COLORS[theme].textPrimary}
        />
      </View>
    </TouchableOpacity>
  );
  return (
    <GestureHandlerRootView style={{ flex: 1, }}
    >
      <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}
      // pointerEvents={profile?.live_status ? 'auto' : 'none'}
      >
        <UserProfileCard profile={profile} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingVertical: hp(2),
            paddingBottom: hp(5),
            gap: wp(2),
            marginHorizontal: wp(2),
          }}>
          <SectionItem icon="clock" label={`Peding Request ${pendingCount > 0 ? ` - ${pendingCount}` : ''}`} navigationPath='PendingHistory' navigation={navigation} />
          <SectionItem icon="store" label={`Pending Order`} navigationPath='PendingOrdersHistory' navigation={navigation} />
          <SectionItem icon="face-man-profile" label="Personal Information" navigationPath='PersonalInfoScreen' navigation={navigation} />
          {
            showSubcriotion &&
            profile?.partner_type?.includes('Transport') &&
            <SectionItem icon="crown" navigation={navigation} label="subscription" navigationPath='SubscriptionList' />
          }
          {/* <SectionItem icon="crown" navigation={navigation} label="HyperJusPay" navigationPath='HyperJusPay' /> */}
          <SectionItem icon="wallet" label="Wallet History" navigationPath='WalletHistory' navigation={navigation} />
          <SectionItem icon="shield-check" navigation={navigation} label="Terms and Conditions" navigationPath='TermsAndCondtions' />
          <SectionItem icon="share-all" navigation={navigation} label="Quick Share" navigationPath='QuickShare' />
          {/* <SectionItem icon="ticket" navigation={navigation} label="Refer Friend" navigationPath='ReferFriend' /> */}
          <SectionItem icon="currency-rupee" navigation={navigation} label="RevenueScreen" navigationPath='RevenueScreen' />
          {/* <SectionItem icon="face-agent" navigation={navigation} label="Customer Support" navigationPath='CustomerSupport' /> */}
          <SectionItem icon="delete" label="Delete Account" navigationPath='AccountManagement' navigation={navigation} />
          <ThemeSection />
          {/* <LangSection /> */}
          <LogoutSection />
          {/* App Version Info */}
          <View style={{ backgroundColor: COLORS[theme].viewBackground }}>
            <View style={sectionRow}>
              <View style={[leftRow, { justifyContent: 'space-between', width: wp(80) }]}>
                <View style={{ flexDirection: 'row', gap: wp(3) }}>
                  <MaterialCommunityIcon
                    name="information"
                    size={wp(6)}
                    color={COLORS[theme].textPrimary}
                  />
                  <Text style={[poppins.medium.h7, { color: COLORS[theme].textPrimary }]}>
                    {t('version')}
                  </Text>
                </View>
                <Text style={[poppins.medium.h7, { color: COLORS[theme].textPrimary }]}>
                  {`(v.${DeviceInfo?.getVersion()})`}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
};
const sectionRow = {
  flexDirection: 'row',
  paddingVertical: wp(4), paddingEnd: wp(4),
  alignItems: 'center', justifyContent: 'space-between',
  gap: wp(3.5),
};
const leftRow = {
  flexDirection: 'row',
  alignItems: 'center', marginStart: wp(8),
  gap: wp(4),
};
export default MoreScreen;