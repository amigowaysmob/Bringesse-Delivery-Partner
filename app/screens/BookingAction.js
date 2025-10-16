import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { COLORS } from '../resources/colors';
import { useTheme } from '../context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import HeaderBar from '../components/header';
import { useSelector } from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import { fetchData } from '../api/api';

const BookingAction = ({ route }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const profile = useSelector(state => state.Auth.profile);
  const accessToken = useSelector(state => state.Auth.accessToken);
  const [selectedTab, setSelectedTab] = useState('weekly');
  const {bid} = route.params;
  const [loading, setLoading] = useState(false);
  const [revenueData, setRevenueData] = useState(null);
  const revenueAmount = revenueData?.wallet_amount !== undefined
    ? `${revenueData.currency_symbol || '₹'}${revenueData.wallet_amount}`
    : '₹12,500';
// console.log(JSON.stringify(route.params))
  return (
    <GestureHandlerRootView style={{ flex: 1, padding: wp(1) }}>
      <HeaderBar title={t('BookingAction') || 'BookingAction'} showBackArrow={true} />
      <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
        {/* Total Revenue Card */}
        <View style={[styles.card, { backgroundColor: COLORS[theme].viewBackground }]}>
          <Text
            style={[poppins.regular.h6, { color: COLORS[theme].textPrimary, alignSelf: 'flex-start', marginHorizontal: wp(4) }]}
          >
            {JSON.stringify(bid)}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: wp(80) }}>
            <Text style={[poppins.regular.h5, { color: COLORS[theme].textPrimary }]}>
              {t('revenue') || 'Total Revenue'}
            </Text>
            
          </View>
        </View>

      


      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: wp(4),
    marginTop: hp(2),
    padding: wp(3),
    borderRadius: wp(2),
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    alignItems: 'center',
  },
  chartContainer: {
    marginTop: hp(3),
    height: hp(35),
    marginHorizontal: wp(4),
    borderRadius: wp(2),
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: wp(2),
  },
  tabButton: {
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(1),
    borderWidth: 1,
  },
});

export default BookingAction;
