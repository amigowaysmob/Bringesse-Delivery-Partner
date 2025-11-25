import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
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

  const [subscriptionData, setSubscriptionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigation = useNavigation();
  const limit = 10;
  // ---------------------- Fetch Subscription History ----------------------
  const fetchSubscription = useCallback(async (pageNumber = 1) => {
    if (!accessToken || !profile?.driver_id) return;

    const deviceId = await DeviceInfo.getUniqueId();
    const headers = {
      Authorization: `${accessToken}`,
      driver_id: profile.driver_id,
      device_id: deviceId,
    };

    try {
      if (pageNumber === 1) setLoading(true);
      else setFetchingMore(true);
      const data = await fetchData(
        `subscription/history/${profile.driver_id}`,
        'GET',
        null,
        headers
      );

      console.log('Subscription API response:', data);

      if (!data?.ok && data?.status === 'false') {
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'login-screen' }],
        });
      }

      if (data?.status === true && Array.isArray(data.data)) {
        if (pageNumber === 1) {
          setSubscriptionData(data.data);
        } else {
          setSubscriptionData(prev => [...prev, ...data.data]);
        }

        if (data.data.length < limit) setHasMore(false);
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
    fetchSubscription(1);
  }, [fetchSubscription]);

  const handleLoadMore = () => {
    if (!fetchingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSubscription(nextPage);
    }
  };

  const renderFooter = () =>
    fetchingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={COLORS[theme].accent} />
      </View>
    ) : null;

  // ---------------------- Render Each Subscription Card ----------------------
  const renderItem = ({ item }) => {
    const startDate = moment(item.start_date).format('DD MMM YYYY, hh:mm A');
    const endDate = moment(item.end_date).format('DD MMM YYYY, hh:mm A');

    return (
      <View style={[styles.card, {
        backgroundColor: COLORS[theme].viewBackground,
        borderColor: item?.status == 'active' ? COLORS[theme].accent : '#CCC'
      }]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcon
            name="credit-card-check-outline"
            size={wp(8)}
            color={COLORS[theme].accent}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary }]}>
            {item.subscriptionName || 'N/A'}
          </Text>

          <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: wp(1) }]}>
            Duration: {item.duration} {item.durationType}
          </Text>

          {
            item.start_date &&
            <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: wp(1) }]}>
              Start: {startDate}
            </Text>
          }
          {
            item.end_date &&
            <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, marginTop: wp(1) }]}>
              End: {endDate}
            </Text>
          }
          <Text style={[poppins.semi_bold.h8, { color: COLORS[theme].accent, marginTop: wp(1.5) }]}>
            ₹{item.paidAmount} / {item.currency}
          </Text>
          {
            item?.remainingDays > 0 || item?.remainingDays != null &&
            <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].accent, marginTop: wp(1.5), textTransform: "capitalize" }]}>
              {item?.status == 'active' ? item?.remainingDays + ' day remaining' : item?.status}
            </Text>
          }

        </View>
      </View >
    );
  };

  // ---------------------- UI Render ----------------------
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('Your Subscription')} showBackArrow={true} />
      <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={COLORS[theme].accent} />
          </View>
        ) : (
          <FlatList
            showsVerticalScrollIndicator={false}
            data={subscriptionData}
            keyExtractor={(item, index) => item._id?.toString() || index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.scrollContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={{ padding: wp(5), alignItems: 'center' }}>
                <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>
                  {t('no_subscription') || 'No subscription found.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
};

// ---------------------- Styles ----------------------
const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: hp(1),
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
    marginBottom: wp(0), borderWidth: wp(0.6),
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

export default SubscriptionHistory;
