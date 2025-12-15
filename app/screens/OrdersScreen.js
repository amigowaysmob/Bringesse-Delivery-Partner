import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
  Alert
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { COLORS } from '../resources/colors';
import { useTheme } from '../context/ThemeContext';
import HeaderBar from '../components/header';
import { fetchData } from '../api/api';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';

const OrdersScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Ongoing');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const profile = useSelector(state => state.Auth.profile);
  // FCM listener
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async () => fetchOrders());
    return unsubscribe;
  }, [fetchOrders]);
  // ============= Helper Functions =============
  const getIconName = (status) => {
    switch (status) {
      case 'delivered':
      case 'complete':
        return 'check-circle-outline';
      case 'pending':
      case 'accept':
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
  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
      case 'complete':
        return 'Order Delivered';
      case 'pending':
      case 'accept':
        return 'Order Accepted';
      case 'on_the_way':
      case 'dispatched':
        return 'On the Way';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Order Status';
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
  
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );
  // ================= Fetch Orders ====================
  const fetchOrders = useCallback(async () => {
    if (!profile?.driver_id) return;
    try {
      setLoading(true);
      const endpoint = `assigned/orders/${profile.driver_id}`;
      const data = await fetchData(endpoint, 'GET');
      if (!data?.ok && data?.status == 'false') {
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'login-screen' }],
        });
        return;
      }

      if (!data?.orders?.length) {
        await AsyncStorage.removeItem('ACCEPTEDBOOKING');
      }
      setOrders(data.orders);
      // console.log(data.orders[0].userOtp,"data.ordersdata.orders")/
    } catch (err) {
      console.error('Orders fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.driver_id]);
  useEffect(() => {
    fetchOrders();
  }, []);
  // ========== Pull to Refresh ============
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  // ========== Swipe to Change Tabs ============
  const onSwipe = ({ nativeEvent }) => {
    if (nativeEvent.translationX > 80) {
      // Swipe Right → Go to "Ongoing"
      setActiveTab('Ongoing');
    } else if (nativeEvent.translationX < -80) {
      // Swipe Left → Go to "Completed"
      setActiveTab('Completed');
    }
  };
  // ========== Filter Orders by Tab ============
  const filteredOrders = orders.filter(order =>
    activeTab === "Ongoing"
      ? order.status !== "delivered" && order.status !== "complete"
      : order.status === "delivered" || order.status === "complete"
  );
  // =====================================================
  const renderItem = ({ item }) => {
    const order = item.orderId;
    const store = order?.storeId;
    // console?.log(order,"testOrder")
    return (
      <TouchableOpacity
        onPress={() => item.status == 'shipped' && navigation.navigate('BookingProductAction', {
          bid: item?._id, acceptStatus: null, data: item, uId: order?.uniqueId
        })}
        style={[styles.card, { backgroundColor: COLORS[theme].viewBackground }]}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcon
            name={getIconName(item.status)}
            size={wp(7)}
            color={COLORS[theme].accent}
          />
        </View>
        <View style={styles.textContainer}>
          {/* <Text>{JSON.stringify(order?.itemCount)}</Text> */}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary, textTransform: "capitalize" }]}>
              {store?.name || 'Store'}
            </Text>
            <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].textPrimary }]}>
              {`#${order?.uniqueId}`}
            </Text>
          </View>
          <Text numberOfLines={1} style={[poppins.regular.h9, { color: COLORS[theme].textPrimary }]}>
            {store?.address || 'No address'}
          </Text>
          <Text style={[poppins.regular.h8, { marginTop: wp(1), color: COLORS[theme].textPrimary }]}>
            {item.status}
          </Text>
          <Text style={[poppins.regular.h8, { marginTop: wp(1), color: COLORS[theme].textPrimary }]}>
            {`Item Count: ${order?.itemCount || 0}`}
          </Text>
          <Text style={[poppins.regular.h8, { marginTop: wp(1.5), color: COLORS[theme].textPrimary }]}>
            {formatDateTime(item.createdAt)}
          </Text>
          {
            order?.status !== "complete" &&
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[poppins.regular.h5, { color: COLORS[theme].textPrimary, marginTop: wp(1) }]}>
                {`OTP : ${order?.otp}`}
              </Text>
              <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: wp(1) }]}>
                {` Rs${order?.total?.toFixed(2) ?? '0.00'} `}
              </Text>
            </View>
          }
          {
            order?.status !== "complete" && item.status == 'shipped' &&
            <View style={{ width: wp(25), height: hp(3.6), alignItems: "center", backgroundColor: COLORS[theme].accent, padding: wp(2), borderRadius: wp(2), alignSelf: "flex-end" }}>
              <Text style={[poppins.semi_bold.h6, {
                color: "#FFF", lineHeight: wp(3.5)
              }]}>
                View
              </Text>
            </View>
          }

        </View>
      </TouchableOpacity>
    );
  };

  // =====================================================

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeaderBar title={t('Orders') || 'Orders'} showBackButton={false} />

      <PanGestureHandler onGestureEvent={onSwipe}>
        <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            {['Ongoing', 'Completed'].map(tab => (
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
                    { color: activeTab === tab ? COLORS[theme].accent : COLORS[theme].primary }
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
              data={filteredOrders}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS[theme].accent]}
                />
              }
              ListEmptyComponent={
                <View style={{ padding: wp(5), alignItems: 'center' }}>
                  <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>
                    No orders found.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </PanGestureHandler>
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
  textContainer: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default OrdersScreen;
