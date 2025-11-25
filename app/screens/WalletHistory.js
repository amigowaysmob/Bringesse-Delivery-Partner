import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
  Image,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { COLORS } from '../resources/colors';
import { useTheme } from '../context/ThemeContext';
import HeaderBar from '../components/header';
import { fetchData } from '../api/api';
import { useSelector } from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const WalletHistory = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('withdraw');
  const profile = useSelector(state => state.Auth.profile);
  const accessToken = useSelector(state => state.Auth.accessToken);
  const [walletData, setWalletDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const siteDetails = useSelector(state => state.Auth.siteDetails);

  // Icon by order status
  const getIconName = (status) => {
    switch (status) {
      case 'delivered':
        return 'check-circle-outline';
      case 'pending':
        return 'clock-outline';
      case 'on_the_way':
      case 'dispatched':
        return 'bike-fast';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'clipboard-text';
    }
  };

  // Translated status
  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
        return t('order_delivered') || 'Order Delivered';
      case 'pending':
        return t('order_pending') || 'Order Pending';
      case 'on_the_way':
      case 'dispatched':
        return t('order_on_the_way') || 'Order on the Way';
      case 'cancelled':
        return t('order_cancelled') || 'Order Cancelled';
      default:
        return t('order_status') || 'Order Status';
    }
  };

  const formatDateTime = (input) => {
    try {
      const date = new Date(input);
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return '';
    }
  };
  const navigation = useNavigation();

  const fetchOrders = useCallback(
    async (pageNumber = 1, tab = activeTab) => {
      if (!accessToken || !profile?.driver_id) return;
      const deviceId = await DeviceInfo.getUniqueId();
      const payload = {
        driver_id: profile.driver_id,
        offset: '0',
        type: tab.toLowerCase(),
      };
      const headers = {
        Authorization: `${accessToken}`,
        driver_id: profile.driver_id,
        device_id: deviceId,
      };
      try {
        // if (pageNumber === 1) setLoading(true);
        // else setFetchingMore(true);
        const data = await fetchData('walletinfo', 'POST', payload, headers);
        console?.log(data, 'data');
        if (!data?.ok && data?.status == 'false') {
          // Alert.alert('Session Expired', 'Please log in again.', )
          await AsyncStorage.clear();
          navigation.reset({
            index: 0,
            routes: [{ name: 'login-screen' }],
          });
        }
        setWalletDetail(data)
      } catch (err) {
        console.error('Orders fetch error:', err);
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [accessToken, profile?.driver_id,]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchOrders(1, activeTab);
  }, [activeTab, fetchOrders]);

  const handleLoadMore = () => {
    if (!fetchingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOrders(nextPage);
    }
  };
  const renderFooter = () =>
    fetchingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={COLORS[theme].accent} />
      </View>
    ) : null;
  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: COLORS[theme].viewBackground }]}>
      <View style={styles.iconContainer}>
      <Image
        source={{ uri: siteDetails?.media_url + item?.source_image}}
        style={{ width: wp(15), height: wp(15), borderRadius: wp(7.5), borderWidth: wp(0.5), borderColor: COLORS[theme].primary, borderColor: COLORS[theme].accent }}
            />
      </View>
      <View style={styles.textContainer}>
        <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary }]}>
          {item?.source_name || t('store_name')}
        </Text>

        <Text style={[poppins.regular.h7, {
          color: COLORS[theme].textPrimary, backgroundColor: COLORS[theme].accent, padding: wp(1), borderRadius: wp(1), alignSelf: 'flex-start'  // 👈 Add this
        }]}>
          {item?.order_id}
        </Text>
        <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: wp(1.5) }]}>
          {formatDateTime(item?.time)}
        </Text>
      </View>
      <Text style={[poppins.regular.h4, { color: COLORS[theme].textPrimary, marginTop: wp(1) }]}>
        {`${item.currency_symbol || ''} ${item.price?.toFixed(2) || ''}`}
      </Text>
    </View>
  );
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('WalletHistory') || 'WalletHistory'} showBackArrow={true} />
      <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
        {/* Tabs */}

        <View style={{ height: wp(14), width: wp(90), alignSelf: "center", borderWidth: wp(0.3), borderColor: COLORS[theme].textPrimary, borderRadius: wp(2), justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: wp(5), justifyContent: "space-between" }}>
            <Text style={[poppins.semi_bold.h7, {
              color: COLORS[theme].textPrimary,
            }]}>Total Balance</Text>
            <Text style={[poppins.semi_bold.h7, {
              color: COLORS[theme].textPrimary,
            }]}>
              {`${walletData?.currency_symbol} ${walletData?.wallet_amount}`}
              {/* {JSON.stringify(walletData)} */}
            </Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          {['withdraw', 'history'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && {
                  borderBottomColor: COLORS[theme].accent,
                  borderBottomWidth: 2,
                },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab
                        ? COLORS[theme].accent
                        : COLORS[theme].primary,
                  },
                ]}
              >
                {t(tab) || tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={COLORS[theme].accent} />
          </View>
        ) : (
          <FlatList
            data={activeTab == 'history' ? walletData?.wallet_history : []}
            keyExtractor={(item) => item.order_id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.scrollContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={{ padding: wp(5), alignItems: 'center' }}>
                <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>
                  {t('No Data') || 'no_data'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: wp(5),
    marginTop: hp(2),
    marginBottom: hp(1),
    borderBottomColor: '#ddd',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: hp(1),
  },
  tabText: {
    fontSize: wp(4),
    fontFamily: poppins.semi_bold.h7.fontFamily,
  },
  scrollContent: {
    paddingVertical: hp(2),
    paddingBottom: hp(5),
    gap: wp(3),
    marginHorizontal: wp(3),
  },
  card: {
    flexDirection: 'row',
    padding: wp(4),
    borderRadius: wp(2),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    marginBottom: wp(3),
  },
  iconContainer: {
    marginRight: wp(4),
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: hp(2),
    alignItems: 'center',
  },
});

export default WalletHistory;
