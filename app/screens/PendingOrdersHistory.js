import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator,
  TouchableOpacity, Image,
  ToastAndroid,
  RefreshControl,
  Alert,
} from 'react-native';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { COLORS } from '../resources/colors';
import { useTheme } from '../context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import HeaderBar from '../components/header';
import { fetchData } from '../api/api';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import ConfirmModal from '../components/header/ConfirmModal';
import messaging from '@react-native-firebase/messaging';
import { IMAGE_ASSETS } from '../resources/images';
import BlastedImage from 'react-native-blasted-image';

const PendingOrdersHistory = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const profile = useSelector(state => state.Auth.profile);
  const accessToken = useSelector(state => state.Auth.accessToken);
  const siteDetails = useSelector(state => state.Auth.siteDetails);
  const [pendingList, setPendingList] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Fetch pending orders
  const fetchPendingOrders = useCallback(async () => {
    if (!accessToken || !profile?.driver_id) return;
    if (!refreshing) setListLoading(true);
    const headers = { Authorization: accessToken, driver_id: profile.driver_id };
    const payload = { driverId: profile.driver_id };
    try {
      const data = await fetchData('pendingorders', 'POST', payload, headers);
      if (!data?.ok && data?.status === 'false') {
        await AsyncStorage.clear();
        navigation.reset({ index: 0, routes: [{ name: 'login-screen' }] });
        return;
      }
      // console.log(data.nearbyOrders,'data.nearbyOrders')
      setPendingList(Array.isArray(data.nearbyOrders) ? data.nearbyOrders : []);
    } catch (err) {
      console.error('Fetch pending orders error:', err);
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, profile, navigation, refreshing]);

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingOrders();
  };

  // FCM listener
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async () => fetchPendingOrders());
    return unsubscribe;
  }, [fetchPendingOrders]);

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  // Accept order
  const acceptOrder = async () => {
    if (!selectedOrder) return;
    setAcceptLoading(true);
    try {
      const payload = {
        status: 'accept',
        orderId: selectedOrder?.order_id,
        driverId: profile?.driver_id,
      };
      // driverId, orderId, status
      console.log(payload, "payload")
      const res = await fetchData('update/order', 'POST', payload, null);
      console.log(res)
      if (res?.status === true) {
        ToastAndroid.show(res.message, ToastAndroid.SHORT);
        setPendingList(prev => prev.filter(o => o.order_id !== selectedOrder.order_id));
      } else {
        ToastAndroid.show(res?.message || 'Failed to accept order', ToastAndroid.SHORT);
      }
    } catch (err) {
      console.error('Accept order error:', err);
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
    } finally {
      setAcceptLoading(false);
      setConfirmVisible(false);
      setSelectedOrder({});

    }
  };
  // Render each order
  const renderItem = ({ item }) => {
    return (
      <View style={[styles.card, { backgroundColor: COLORS[theme].viewBackground }]}>
        <BlastedImage
          source={{ uri: item?.store_image }}
          style={{ width: wp(15), height: wp(15), borderRadius: wp(2), borderWidth: wp(0.5), marginRight: wp(2) }}
        />
        <View style={styles.infoContainer}>
          <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].textPrimary }]}>
            {item.store_name}
          </Text>
          <Text style={[poppins.regular.h8, { color: COLORS[theme].textSecondary, marginTop: 2 }]}>
            {item.store_location}
          </Text>
          <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: 4 }]}>
            Delivery: {item?.deliveryAddress?.address?.location || 'N/A'}
          </Text>
          <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary }]}>
            Distance: {item.driverDistance} km
          </Text>
          <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary, marginTop: wp(1), textTransform: "capitalize" }]}>
            Status: {item.order_status}
          </Text>
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: 'green' }]}
            onPress={() => {
              setSelectedOrder(item);
              setConfirmVisible(true);
              // Alert.alert('ORDER ACCEPETED')
            }}
          >
            <Text style={[poppins.semi_bold.h7, { color: '#fff' }]}>Accept Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('Pending Orders')} showBackArrow />
      <FlatList
        data={pendingList}
        keyExtractor={item => item.order_id}
        renderItem={renderItem}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS[theme].accent]}
            tintColor={COLORS[theme].accent}
          />
        }
        ListEmptyComponent={
          !listLoading && (
            <View style={{ padding: wp(5), alignItems: 'center' }}>
              <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>
                No pending orders found.
              </Text>
            </View>
          )
        }

        // 🔥 Loader moved to footer
        ListFooterComponent={
          listLoading ? (
            <ActivityIndicator
              size="large"
              color={COLORS[theme].accent}
              style={{ marginVertical: hp(2) }}
            />
          ) : null
        }
      />

      <ConfirmModal
        visible={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={acceptOrder}
        loading={acceptLoading}
        title="Confirm Accept"
        message={`Are you sure you want to accept the order from ${selectedOrder?.store_name}?`}
      />
    </GestureHandlerRootView>
  );

};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: hp(1),
    paddingBottom: hp(5),
    gap: wp(3),
    marginHorizontal: wp(3),
  },
  card: {
    flexDirection: 'row',
    padding: wp(3),
    borderRadius: wp(2),
    elevation: 2,
    borderWidth: wp(0.4),
    borderColor: '#ddd',
    marginBottom: hp(1.5),
  },
  storeImage: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(2),
    marginRight: wp(3),
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  acceptBtn: {
    marginTop: wp(3),
    paddingVertical: wp(2.5),
    alignItems: 'center',
    borderRadius: wp(2),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PendingOrdersHistory;
