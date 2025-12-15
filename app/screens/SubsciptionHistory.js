import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { COLORS } from '../resources/colors';
import { useTheme } from '../context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import HeaderBar from '../components/header';
import { fetchData } from '../api/api';
import { useSelector } from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SubscriptionHistory = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const profile = useSelector(state => state.Auth.profile);
  const accessToken = useSelector(state => state.Auth.accessToken);
  const navigation = useNavigation();

  const [subscriptionData, setSubscriptionData] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const limit = 10;

  // ---------- STATUS NORMALIZER ----------
  const isActiveStatus = status => {
    if (typeof status === 'string') {
      return status.toLowerCase() === 'active';
    }
    return status === 1 || status === true;
  };

  // ---------- FETCH SUBSCRIPTIONS ----------
  const fetchSubscription = useCallback(async (pageNumber = 1) => {
    if (!accessToken || !profile?.driver_id) return;

    const deviceId = await DeviceInfo.getUniqueId();
    const headers = {
      Authorization: accessToken,
      driver_id: profile.driver_id,
      device_id: deviceId,
    };

    try {
      pageNumber === 1 ? setLoading(true) : setFetchingMore(true);

      const data = await fetchData(
        `subscription/history/${profile.driver_id}`,
        'GET',
        null,
        headers
      );

      if (!data?.ok && data?.status === 'false') {
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'login-screen' }],
        });
        return;
      }

      if (data?.status === true && Array.isArray(data?.data)) {
        const active = data.data.find(item => isActiveStatus(item?.status));
        const history = data.data.filter(item => !isActiveStatus(item?.status));

        setActiveSubscription(active ?? null);

        if (pageNumber === 1) {
          setSubscriptionData(history);
        } else {
          setSubscriptionData(prev => [...prev, ...history]);
        }

        if (history.length < limit) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Subscription fetch error:', err);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [accessToken, profile?.driver_id]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchSubscription(1);
  }, [fetchSubscription]);

  const handleLoadMore = () => {
    if (!fetchingMore && hasMore) {
      const next = page + 1;
      setPage(next);
      fetchSubscription(next);
    }
  };

  // ---------- HISTORY ITEM ----------
  const renderItem = ({ item }) => {
    const startDate = moment(item.start_date).format('DD MMM YYYY, hh:mm A');
    const endDate = moment(item.end_date).format('DD MMM YYYY, hh:mm A');

    return (
      <View style={[
        styles.card,
        { backgroundColor: COLORS[theme].viewBackground }
      ]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcon
            name="history"
            size={wp(7)}
            color={COLORS[theme].textPrimary}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary }]}>
            {item?.subscriptionName?.trim() || 'N/A'}
          </Text>

          <Text style={[poppins.regular.h8, styles.mt]}>
            Duration: {item.duration} {item.durationType}
          </Text>

          {item.start_date && (
            <Text style={[poppins.regular.h8, styles.mt]}>
              Start: {startDate}
            </Text>
          )}

          {item.end_date && (
            <Text style={[poppins.regular.h8, styles.mt]}>
              End: {endDate}
            </Text>
          )}

          <Text style={[poppins.semi_bold.h8, styles.price]}>
            ₹{item.paidAmount} / {item.currency}
          </Text>

          {item.remainingDays !== null && item.remainingDays !== undefined && (
            <Text style={[poppins.semi_bold.h7, styles.status]}>
              {isActiveStatus(item.status)
                ? `${item.remainingDays} day(s) remaining`
                : String(item.status)}
            </Text>
          )}
        </View>
      </View>
    );
  };
  // ---------- ACTIVE SUBSCRIPTION ----------
  const renderActiveSection = () => {
    if (!activeSubscription) return null;
    return (
      <View style={styles.activeCard}>
        <MaterialCommunityIcon name="crown" size={wp(10)} color="#FFF" />
        <View style={{ marginLeft: wp(3) }}>
          <Text style={[poppins.semi_bold.h6, { color: '#FFF' }]}>
            {activeSubscription.subscriptionName || 'N/A'}
          </Text>

          <Text style={[poppins.regular.h8, { color: '#FFF' }]}>
            {activeSubscription.duration} {activeSubscription.durationType}
          </Text>

          <Text style={[poppins.regular.h8, { color: '#FFF' }]}>
            {moment(activeSubscription.start_date).format('DD MMM YYYY')} →{' '}
            {moment(activeSubscription.end_date).format('DD MMM YYYY')}
          </Text>

          {activeSubscription.remainingDays !== null && (
            <Text style={[poppins.semi_bold.h7, { color: '#FFF', marginTop: wp(1) }]}>
              {activeSubscription.remainingDays} day(s) remaining
            </Text>
          )}
        </View>
      </View>
    );
  };

  // ---------- UI ----------
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('Your Subscription')} showBackArrow />

      {renderActiveSection()}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS[theme].accent} />
        </View>
      ) : (
        <FlatList
          data={subscriptionData}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?._id || index.toString()}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            fetchingMore ? (
              <ActivityIndicator color={COLORS[theme].accent} />
            ) : null
          }
          ListEmptyComponent={
            <Text style={[poppins.regular.h7, styles.empty]}>
              {t('No subscription found.')}
            </Text>
          }
        />
      )}
    </GestureHandlerRootView>
  );
};
// ---------- STYLES ----------
const styles = StyleSheet.create({
  scrollContent: {
    padding: wp(3),
    paddingBottom: hp(5),
  },
  activeCard: {
    flexDirection: 'row',
    backgroundColor: 'green',
    margin: wp(3),
    padding: wp(4),
    borderRadius: wp(2),
    alignItems: 'center',
    elevation: 3,
  },
  card: {
    flexDirection: 'row',
    padding: wp(4),
    borderRadius: wp(2),
    marginBottom: wp(3),
    borderWidth: wp(0.4),
    borderColor: '#CCC',
    elevation: 2,
  },
  iconContainer: {
    marginRight: wp(4),
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  mt: {
    marginTop: wp(1),
    color: '#777',
  },
  price: {
    marginTop: wp(1.5),
    color: '#2e7d32',
  },
  status: {
    marginTop: wp(1.5),
    color: '#2e7d32',
    textTransform: 'capitalize',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: hp(10),
  },
});

export default SubscriptionHistory;
