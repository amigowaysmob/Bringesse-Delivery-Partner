import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
  const [activeTab, setActiveTab] = useState('history');
  const profile = useSelector(state => state.Auth.profile);
  const accessToken = useSelector(state => state.Auth.accessToken);
  const [walletData, setWalletDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const siteDetails = useSelector(state => state.Auth.siteDetails);
  const navigation = useNavigation();

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatDateTime = (input) => {
    try {
      const date = new Date(input);
      return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    } catch {
      return '';
    }
  };

  const fetchOrders = useCallback(
    async (pageNumber = 1, tab = activeTab) => {
      if (!accessToken || !profile?.driver_id) return;
      setLoading(true);
      const deviceId = await DeviceInfo.getUniqueId();
      const payload = {
        driverId: profile.driver_id,
        offset: (pageNumber - 1) * limit,
        type: tab.toLowerCase(),
      };
      const headers = { Authorization: `${accessToken}`, driverId: profile.driver_id, device_id: deviceId };

      try {
        const data = await fetchData('walletinfo', 'POST', payload, headers);
        if (!data?.ok && data?.status === 'false') {
          await AsyncStorage.clear();
          navigation.reset({ index: 0, routes: [{ name: 'login-screen' }] });
          return;
        }

        setWalletDetail(prev => {
          if (pageNumber > 1 && prev?.wallet_history) {
            return {
              ...data,
              wallet_history: [...prev.wallet_history, ...(data?.data || [])],
            };
          }
          return {
            wallet_amount: data.total_delivery_charge || 0,
            currency_symbol: data.currency_symbol || '₹',
            wallet_history: data?.data || [],
          };
        });
        setHasMore(data?.data?.length === limit);
      } catch (err) {
        console.error('Orders fetch error:', err);
        Alert.alert('Error', 'Failed to fetch wallet history.');
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
      setFetchingMore(true);
      fetchOrders(nextPage, activeTab);
    }
  };

  // Handle wallet request
  const handleRequestAmount = async () => {
    const amount = parseFloat(requestAmount);
    if (!amount || amount <= 0) {
      // Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      ToastAndroid.show('Invalid Amount', ToastAndroid.SHORT);
      return;
    }
    // if (amount > walletData.wallet_amount) {
    //   Alert.alert('Insufficient Balance', 'Requested amount exceeds wallet balance.');
    //   return;
    // }
    setSubmitting(true);
    try {
      const deviceId = await DeviceInfo.getUniqueId();
      const payload = {
        driver_id: profile.driver_id,
        amount,
      };
      const headers = { Authorization: `${accessToken}`, driver_id: profile.driver_id, device_id: deviceId };
      const response = await fetchData('withdraw', 'POST', payload, headers);
      if (response?.status == 'true') {
        // Alert.alert('Success', 'Amount requested successfully.');
        // ToastAndroid.show(response.message)
        ToastAndroid.show(response?.message, ToastAndroid.SHORT);
        setModalVisible(false);
        setRequestAmount('');
        fetchOrders(1, 'history');
      } else {
        ToastAndroid.show(response?.message, ToastAndroid.SHORT);
        // Alert.alert('Error', response?.message || 'Failed to request amount.');
      }
    } catch (err) {
      console.error('Request amount error:', err);
      Alert.alert('Error', 'Failed to request amount.');
    } finally {
      setSubmitting(false);
      setModalVisible(false);
    }
  };

  const renderFooter = () =>
    fetchingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={COLORS[theme].accent} />
      </View>
    ) : null;
  // Original card UI preserved
  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: COLORS[theme].viewBackground }]}>
      <View style={styles.iconContainer}>
        {/* Optionally add source image if needed */}
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[
            poppins.regular.h7,
            { color: COLORS[theme].white, backgroundColor: COLORS[theme].accent, padding: wp(1), borderRadius: wp(1), alignSelf: 'flex-start' },
          ]}
        >
          {item?.unique_order_id || item?.order_id}
        </Text>
        <View style={{ marginVertical: wp(2) }}>
          <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary }]}>
            {item?.sourceName}
          </Text>
          <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: wp(1.5) }]}>
            {formatDateTime(item?.completedAt || item?.createdAt)}
          </Text>
        </View>
      </View>
      <View>
        <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: wp(1) }]}>
          {`Total: ${item?.total_amount?.toFixed(2) || 0}`}
        </Text>
        <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary, marginTop: wp(1) }]}>
          {`Amount Earned: ${item?.delivery_charge?.toFixed(2) || 0}`}
        </Text>
      </View>
    </View>
  );
  const listData =
    activeTab === 'history' && Array.isArray(walletData?.wallet_history)
      ? walletData.wallet_history
      : [];
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('Wallet History') || 'WalletHistory'} showBackArrow={true} />
      <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
        {/* Original Wallet Info */}
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: wp(3) }}>
          <View
            style={{
              height: wp(14),
              width: wp(48),
              alignSelf: 'center',
              borderWidth: wp(0.3),
              borderColor: COLORS[theme].textPrimary,
              borderTopStartRadius: wp(4), borderBottomStartRadius: wp(4),
              justifyContent: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp(5), justifyContent: 'space-between' }}>
              <Text style={[poppins.regular.h9, { color: COLORS[theme].textPrimary }]}>Total Balance</Text>
              <Text style={[poppins.semi_bold.h8, { color: COLORS[theme].textPrimary }]}>
                {`${walletData?.currency_symbol || '₹'} ${walletData?.wallet_amount || 0}`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={{
              height: wp(17),
              width: wp(48),
              alignSelf: 'center',
              borderWidth: wp(0.3),
              backgroundColor: COLORS[theme].textPrimary,
              justifyContent: 'center',
              borderTopEndRadius: wp(4), borderBottomEndRadius: wp(4)
            }}
            onPress={() => setModalVisible(true)}
          >
            <View style={{ alignItems: 'center', paddingHorizontal: wp(5) }}>
              <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].background }]}> Request Amount →</Text>
            </View>
          </TouchableOpacity>
        </View>
        {/* Original Tabs */}
        <View style={styles.tabContainer}>
          {['history', 'withdraw'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && { borderBottomColor: COLORS[theme].accent, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? COLORS[theme].accent : COLORS[theme].primary }]}>{t(tab) || tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wallet History List */}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={COLORS[theme].accent} />
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={item => item.order_id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.scrollContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={{ padding: wp(5), alignItems: 'center' }}>
                <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>{t('No Data') || 'no_data'}</Text>
              </View>
            }
          />
        )}

        {/* Request Amount Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="none"
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}
          >
            <View style={{ width: wp(90), height: wp(50), backgroundColor: COLORS[theme].background, padding: wp(5), borderRadius: wp(3), borderWidth: wp(0.9), borderColor: "#ccc" }}>
              <Text style={[poppins.semi_bold.h7, { marginBottom: wp(3), color: COLORS[theme].textPrimary }]}>
                Request Wallet Amount
              </Text>
              <TextInput
                maxLength={5}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={requestAmount}
                onChangeText={(text) => {
                  // Remove non-numeric characters
                  let numericValue = text.replace(/[^0-9.]/g, '');

                  // Handle multiple dots
                  const dotCount = (numericValue.match(/\./g) || []).length;
                  if (dotCount > 1) {
                    numericValue = numericValue.slice(0, -1);
                  }
                  setRequestAmount(numericValue);
                }}
                style={{
                  borderWidth: wp(0.9),
                  borderColor: COLORS[theme].accent,
                  borderRadius: wp(2),
                  padding: wp(3),
                  marginBottom: wp(4),
                  color: COLORS[theme].textPrimary,
                  backgroundColor: COLORS[theme].viewBackground,
                }}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: wp(3) }}>
                <TouchableOpacity
                  style={{
                    padding: wp(2),
                    borderWidth: wp(0.4), borderColor: COLORS[theme].accent, borderRadius: wp(2)
                  }}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: COLORS[theme].accent }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    padding: wp(2),
                    borderWidth: wp(0.4), borderColor: COLORS[theme].accent, borderRadius: wp(2)
                  }}
                  onPress={handleRequestAmount}
                  disabled={submitting}
                >
                  <Text style={{ color: COLORS[theme].accent }}>{submitting ? 'Requesting...' : 'Submit'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  tabContainer: { flexDirection: 'row', marginHorizontal: wp(5), marginTop: hp(2), marginBottom: hp(1), borderBottomColor: '#ddd' },
  tabButton: { flex: 1, alignItems: 'center', paddingBottom: hp(1) },
  tabText: { fontSize: wp(4), fontFamily: poppins.semi_bold.h7.fontFamily, textTransform: 'capitalize' },
  scrollContent: { paddingVertical: hp(2), paddingBottom: hp(5), gap: wp(3), marginHorizontal: wp(3) },
  card: { flexDirection: 'row', padding: wp(2), borderRadius: wp(2), elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, borderWidth: wp(0.3), borderColor: '#CCC' },
  textContainer: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footerLoader: { paddingVertical: hp(2), alignItems: 'center' },
  iconContainer: { marginRight: wp(4), justifyContent: 'center' },
});

export default WalletHistory;
