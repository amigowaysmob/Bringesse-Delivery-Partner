import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const onSwipe = ({ nativeEvent }) => {
    if (nativeEvent.translationX > 80) {
      setActiveTab('Ongoing');
    } else if (nativeEvent.translationX < -80) {
      setActiveTab('Completed');
    }
  };
  const filteredOrders = orders.filter(order =>
    activeTab === "Ongoing"
      ? order.status !== "delivered" && order.status !== "complete"
      : order.status === "delivered" || order.status === "complete"
  );
  const renderItem = ({ item }) => {
    const store = item?.store;
    const address = item?.deliveryAddress;
    return (
      <TouchableOpacity
        disabled={item.status !== 'shipped'}
        onPress={() =>
          item.status === 'shipped' &&
          navigation.navigate('BookingProductAction', {
            bid: item?.orderId,
            acceptStatus: null,
            data: item,
            uId: item?.orderId
          })
        }
        style={[styles.card, { backgroundColor: COLORS[theme].viewBackground }]}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcon
            name={getIconName(item.orderStatus)}
            size={wp(7)}
            color={COLORS[theme].accent}
          />
        </View>
        <View style={styles.textContainer}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary }]}>
              {store?.name || 'Store'}
            </Text>
            <Text style={[poppins.semi_bold.h8, { color: COLORS[theme].textPrimary }]}>
              #{item?.uniqueId || '----'}
            </Text>
          </View>

          <Text style={[poppins.regular.h9, { color: COLORS[theme].textPrimary }]}>
            {address?.location || 'No address'}
          </Text>

          <Text style={[poppins.regular.h8, { marginTop: wp(1), color: COLORS[theme].textPrimary, textTransform: "capitalize" }]}>
            {item?.status}
          </Text>

          <Text style={[poppins.regular.h8, { marginTop: wp(1.5), color: COLORS[theme].textPrimary }]}>
            {formatDateTime(item.createdAt)}
          </Text>

          {item.status !== "complete" && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[poppins.regular.h5, { color: COLORS[theme].textPrimary }]}>
                OTP : {item?.otp || "----"}
              </Text>
              <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary }]}>
                Rs {item?.total?.toFixed(2)}
              </Text>
            </View>
          )}
          {item?.status === 'shipped' && (
            <View
              style={{
                width: wp(25),
                height: hp(3.6),
                alignItems: "center",
                backgroundColor: COLORS[theme].accent,
                padding: wp(2),
                borderRadius: wp(2),
                alignSelf: "flex-end"
              }}
            >
              <Text style={[poppins.semi_bold.h6, { color: "#FFF" ,lineHeight:wp(4.5)}]}>
                View
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeaderBar title={t('Orders') || 'Orders'} showBackButton={false} />
      <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
        {/* Tabs with swipe handler */}
        <PanGestureHandler onGestureEvent={onSwipe}>
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
        </PanGestureHandler>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={COLORS[theme].accent} />
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => Math.random().toString()}
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
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: wp(1),
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
    marginHorizontal: wp(3),
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
