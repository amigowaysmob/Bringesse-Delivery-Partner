import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, ToastAndroid,
  RefreshControl,
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
import BlastedImage from 'react-native-blasted-image';

const PendingOrdersHistory = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const profile = useSelector(state => state.Auth.profile);
  const accessToken = useSelector(state => state.Auth.accessToken);

  const [pendingList, setPendingList] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      setPendingList(Array.isArray(data.nearbyOrders) ? data.nearbyOrders : []);
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, profile, navigation, refreshing]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingOrders();
  };

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async () => fetchPendingOrders());
    return unsubscribe;
  }, [fetchPendingOrders]);

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  const acceptOrder = async () => {
    if (!selectedOrder) return;
    setAcceptLoading(true);
    try {
      const payload = {
        status: 'accept',
        orderIds: [selectedOrder.order_id],
        driverId: profile?.driver_id,
      };
      const res = await fetchData('update/order', 'POST', payload, null);
      if (res?.status === true) {
        ToastAndroid.show(res.message, ToastAndroid.SHORT);
        setPendingList(prev =>
          prev.filter(o => o.order_id !== selectedOrder.order_id)
        );
        navigation.navigate('OrdersScreen');
      } else {
        ToastAndroid.show(res?.message || 'Failed', ToastAndroid.SHORT);
      }
    } catch {
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
    } finally {
      setAcceptLoading(false);
      setConfirmVisible(false);
      setSelectedOrder(null);
    }
  };

  const renderItem = ({ item }) => {
    const formatDateTime = date =>
      new Date(date).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    return (
      <View style={[styles.card, { backgroundColor: COLORS[theme].viewBackground }]}>
        <View style={styles.accent} />

        <BlastedImage
          source={{ uri: item?.store_image }}
          style={styles.storeImage}
        />

        <View style={{ flex: 1 }}>
          <View style={styles.headerRow}>
            <Text style={[poppins.semi_bold.h6, styles.storeName, { color: COLORS[theme].textPrimary }]}>
              {item.store_name}
            </Text>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{formatDateTime(item.createdAt)}</Text>
            </View>
          </View>

          <Text style={[poppins.regular.h9, { color: COLORS[theme].textPrimary }]}>
            {item.store_location}
          </Text>

          <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: 4 }]}>
            Delivery: {item?.deliveryAddress?.location}
          </Text>

          <View style={styles.metaRow}>
            <Text style={[styles.metaText,{
              color:COLORS[theme].textPrimary,
            }]}>📍 {item.driverDistance}</Text>
            <Text style={[styles.metaText,{
              color:COLORS[theme].textPrimary,
            }]}>💰 {item.driver_fare}</Text>
          </View>

          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => {
              setSelectedOrder(item);
              setConfirmVisible(true);
            }}
          >
            <Text style={styles.acceptText}>Accept Order</Text>
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
          />
        }
        ListEmptyComponent={
          !listLoading && (
            <View style={styles.empty}>
              <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>
                No pending orders found
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          listLoading && (
            <ActivityIndicator
              size="large"
              color={COLORS[theme].accent}
              style={{ marginVertical: hp(2) }}
            />
          )
        }
      />

      <ConfirmModal
        visible={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={acceptOrder}
        loading={acceptLoading}
        title="Confirm Accept"
        message={`Accept order from ${selectedOrder?.store_name}?`}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: wp(3),
    paddingBottom: hp(6),
  },
  card: {
    flexDirection: 'row',
    borderRadius: wp(3),
    padding: wp(3),
    elevation: 4,
    marginBottom: hp(1.5),
  },
  accent: {
    width: wp(1),
    backgroundColor: 'green',
    borderRadius: wp(2),
    marginRight: wp(2),
  },
  storeImage: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(2),
    marginRight: wp(3),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    flex: 1,
    marginRight: wp(2),
  },
  timeBadge: {
    backgroundColor: '#eee',
    paddingHorizontal: wp(2),
    paddingVertical: wp(0.5),
    borderRadius: wp(2),
  },
  timeText: {
    fontSize: wp(3),
    color: '#555',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: wp(2),
  },
  metaText: {
    fontSize: wp(3.2),
  },
  acceptBtn: {
    backgroundColor: 'green',
    marginTop: wp(3),
    paddingVertical: wp(2),
    borderRadius: wp(2),
    alignItems: 'center',
  },
  acceptText: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    padding: wp(6),
    alignItems: 'center',
  },
});

export default PendingOrdersHistory;
