import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
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

const OrdersScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('Ongoing');

  const profile = useSelector(state => state.Auth.profile);
  const accessToken = useSelector(state => state.Auth.accessToken);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const limit = 10;

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
        if (pageNumber === 1) setLoading(true);
        else setFetchingMore(true);

        const data = await fetchData('orderhistory', 'POST', payload, headers);
        if (!data?.ok && data?.status == 'false') {
          // Alert.alert('Session Expired', 'Please log in again.', )
          await AsyncStorage.clear();
          navigation.reset({
            index: 0,
            routes: [{ name: 'login-screen' }],
          });
        }
        console?.log(data, 'dataOrders');
        if (!data?.orders.length) {
          AsyncStorage.removeItem('ACCEPTEDBOOKING');
        }
        if (data?.status && Array.isArray(data.orders)) {
          if (pageNumber === 1) {
            setOrders(data.orders);
          } else {
            setOrders((prev) => [...prev, ...data.orders]);
          }
          setHasMore(data.orders.length >= limit);
        } else {
          if (pageNumber === 1) setOrders([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error('Orders fetch error:', err);
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [accessToken, profile?.driver_id, activeTab]
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
        <MaterialCommunityIcon
          name={getIconName(item.order_status)}
          size={wp(7)}
          color={COLORS[theme].accent}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary }]}>
          {item?.store_name || t('store_name')}
        </Text>

        <Text numberOfLines={1} style={[poppins.regular.h9, { color: COLORS[theme].textPrimary }]}>
          {item?.store_location}
        </Text>

        <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: wp(1) }]}>
          {getStatusText(item.order_status)}
        </Text>

        <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: wp(1.5) }]}>
          {formatDateTime(item?.ordered_time)}
        </Text>

        <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: wp(1) }]}>
          {`${item.currency_symbol || ''}${item.delivery_charge?.toFixed(2) || ''}`}
        </Text>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeaderBar title={t('Orders') || 'Orders'} showBackButton={false} />
      <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {['Ongoing', 'Completed'].map((tab) => (
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
            data={orders}
            keyExtractor={(item) => item.order_id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.scrollContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={{ padding: wp(5), alignItems: 'center' }}>
                <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>
                  {'No orders found.'}
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

export default OrdersScreen;
