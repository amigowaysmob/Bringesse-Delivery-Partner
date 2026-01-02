import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
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

const Notification = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const profile = useSelector(state => state.Auth.profile);
  const accessToken = useSelector(state => state.Auth.accessToken);
  const [expandedIds, setExpandedIds] = useState([]);
  const toggleExpand = (id) => {
    setExpandedIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const [notificationData, setNotificationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const navigation = useNavigation();
  const limit = 10;

  const fetchNotifications = useCallback(async (pageNumber = 1) => {
    if (!accessToken || !profile?.driver_id) return;

    const deviceId = await DeviceInfo.getUniqueId();
    const payload = {
      driver_id: profile.driver_id,
      page: pageNumber,
      limit: limit,
    };
    const headers = {
      Authorization: `${accessToken}`,
      driver_id: profile.driver_id,
      device_id: deviceId,
    };
    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setFetchingMore(true);
      }
      const data = await fetchData('notification', 'POST', payload, headers);
      if (!data?.ok && data?.status == 'false') {
        // Alert.alert('Session Expired', 'Please log in again.', )
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'login-screen' }],
        });
      }
      if (data?.status === 'true' && Array.isArray(data.result)) {
        if (pageNumber === 1) {
          setNotificationData(data.result);
          console.log(data.result[0], "data.result")
        } else {
          setNotificationData(prev => [...prev, ...data.result]);
        }
        setHasMore(data.result.length >= limit);
      } else {
        if (pageNumber === 1) setNotificationData([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Notification fetch error:', err);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [accessToken, profile?.driver_id]);

  useEffect(() => {
    setPage(1);
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleLoadMore = () => {
    if (!fetchingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  const renderFooter = () =>
    fetchingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={COLORS[theme].accent} />
      </View>
    ) : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return moment(dateStr).fromNow(); // e.g., "2 hours ago"
  };
  const renderItem = ({ item }) => {
    const isExpanded = expandedIds.includes(item.notification_id);
    return (
      <View style={[styles.card, { backgroundColor: COLORS[theme].viewBackground }]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcon
            name="bell-ring"
            size={wp(7)}
            color={COLORS[theme].accent}
          />
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[
              poppins.semi_bold.h7,
              { color: COLORS[theme].textPrimary, textTransform: 'capitalize' },
            ]}
          >
            {item?.notification_type}
          </Text>

          {/* MESSAGE */}
          <Text
            style={[
              poppins.regular.h8,
              { color: COLORS[theme].textPrimary, marginTop: wp(1) },
            ]}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {item.message || 'You have a new notification.'}
          </Text>
          {/* TOGGLE */}
          {item?.message?.length > 80 && (
            <Text
              onPress={() => toggleExpand(item.notification_id)}
              style={{
                color: COLORS[theme].accent,
                marginTop: wp(1),
                fontSize: wp(3.5),
              }}
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </Text>
          )}

          {/* DATE */}
          <Text
            style={[
              poppins.regular.h8,
              { color: COLORS[theme].textPrimary, marginTop: wp(1.5) },
            ]}
          >
            {formatDate(item.date)}
          </Text>
        </View>
      </View>
    );
  };


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeaderBar title={t('notifications') || 'Notifications'} showBackButton={false} />
      <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={COLORS[theme].accent} />
          </View>
        ) : (
          <FlatList

            data={notificationData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => renderItem({ item, navigation })}
            contentContainerStyle={styles.scrollContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={{ padding: wp(5), alignItems: 'center' }}>
                <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>
                  {t('No notifications found') || 'No notifications found.'}
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
  scrollContent: {
    paddingVertical: hp(2),
    paddingBottom: hp(5), gap: wp(3), marginHorizontal: wp(3),
  }, card: {
    flexDirection: 'row', padding: wp(4), borderRadius: wp(2), elevation: 2, shadowColor: '#000',
    shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  }, iconContainer: {
    marginRight: wp(4), justifyContent: 'center',
  },
  textContainer: { flex: 1, }, loader: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: hp(2), alignItems: 'center',
  },
});
export default Notification;