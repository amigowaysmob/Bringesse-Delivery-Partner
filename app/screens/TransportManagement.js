import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, PanResponder,
  Alert, RefreshControl
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
const tabs = ['ongoing', 'completed'];

const TransportManagement = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('ongoing'); // lowercase for API compatibility
  const profile = useSelector(state => state.Auth.profile);
  const accessToken = useSelector(state => state.Auth.accessToken);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Refresh state for pull-to-refresh
  const navigation = useNavigation();
  const limit = 10;

  // Icon based on status (your API sends 'accepted', 'completed', etc.)
  const getIconName = (status) => {
    switch (status) {
      case 'accepted':
      case 'on_the_way':
        return 'bike-fast';
      case 'completed':
        return 'check-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'clipboard-text';
    }
  };

  // Status display text, adjust as needed
  const getStatusText = (status) => {
    switch (status) {
      case 'accepted':
        return t('Accepted') || 'Accepted';
      case 'completed':
        return t('Completed') || 'Completed';
      case 'cancelled':
        return t('Cancelled') || 'Cancelled';
      default:
        return status || '';
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
  const fetchOrders = useCallback(
    async (pageNumber = 1, tab = activeTab) => {
      if (!accessToken || !profile?.driver_id) return;
      const deviceId = await DeviceInfo.getUniqueId();
      const payload = {
        driver_id: profile.driver_id,
        booking_status: tab, // API expects lowercase tab (e.g., 'ongoing' or 'completed')
        offset: (pageNumber - 1) * limit,
        limit,
      };
      const headers = {
        Authorization: `${accessToken}`,
        driver_id: profile.driver_id,
        device_id: deviceId,
      };
      try {
        if (pageNumber === 1) setLoading(true);
        else setFetchingMore(true);
        const data = await fetchData('transport/bookinghistory', 'POST', payload, headers);
        if (data?.status) {
          if (pageNumber === 1) {
            setOrders(data.data);
          } else {
            setOrders((prev) => [...prev, ...data.data]);
          }
          setHasMore(data.data.length >= limit);
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

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setHasMore(true);
      fetchOrders(1, activeTab);
    }, [activeTab, fetchOrders])
  );

  const handleLoadMore = () => {
    if (!fetchingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOrders(nextPage);
    }
  };


  // Open dialer with phone number
  const handleCall = (phone) => {
    if (phone) {
      let phoneNumber = `tel:${phone}`;
      Linking.openURL(phoneNumber).catch(err => {
        console.warn('Failed to open dialer:', err);
      });
    }
  };

  // PanResponder for swipe gestures to change tabs
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          setActiveTab('ongoing')
        } else if (gestureState.dx < -50) {
          setActiveTab('completed')
        }
      },
    })
  ).current;

  const renderFooter = () =>
    fetchingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={COLORS[theme].accent} />
      </View>
    ) : null;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        // item?.status !== 'cancelled' &&
        item?.status === 'completed' && item?.status === 'cancelled' ?
          navigation.navigate('BookingCompleted', { bid: item?._id })
          : navigation.navigate('BookingAction', { bid: item?._id })
      }}
      style={[styles.card, { backgroundColor: COLORS[theme].viewBackground }]} >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcon
          name={getIconName(item.status)}
          size={wp(7)}
          color={COLORS[theme].accent}
        />
      </View>
      <View style={styles.textContainer}>
        <View style={{flexDirection:"row",justifyContent:"space-between"}}>
          <Text style={[poppins.semi_bold.h8, { color: COLORS[theme].textPrimary }]}>
            {item.categoryName || 'Category'}
          </Text>
          {
            item?.cutomerReview?.ratings &&
            <Text style={[poppins.semi_bold.h8, { color: COLORS[theme].textPrimary }]}>
              {item?.cutomerReview?.ratings} ★
            </Text>
          }
        </View>
        <Text style={[poppins.bold.h7, { color: COLORS[theme].textPrimary, marginTop: wp(1) }]}>
          Booking ID: {item.uniqueId}
        </Text>
        <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: wp(1) }]}>
          Status: {getStatusText(item.status)}
        </Text>

        <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: wp(1.5) }]}>
          Created: {formatDateTime(item.createdAt)}
        </Text>
      </View>

      {/* Call icon button */}
      {
        item?.status !== 'completed' && item?.status !== 'cancelled' &&
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => handleCall(item.customer?.phone)}
        >
          <MaterialCommunityIcon name="phone" size={wp(7)} color={COLORS[theme].accent} />
        </TouchableOpacity>
      }

    </TouchableOpacity >
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(1, activeTab); // Trigger the fetch when refreshing
    setRefreshing(false);
  }, [activeTab, fetchOrders]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('Transport') || 'TransportManagement'} showBackArrow={false} />
      <View  {...panResponder.panHandlers}
        style={{ flex: 1, backgroundColor: COLORS[theme].background }}
      >
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
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
                {t(tab.charAt(0).toUpperCase() + tab.slice(1)) || tab}
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
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.scrollContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={{ padding: wp(5), alignItems: 'center' }}>
                <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>
                  {'No Data found.'}
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                // refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS[theme].accent}
              />
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
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: wp(4),
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  callButton: {
    padding: wp(2),
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

export default TransportManagement;
