import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { COLORS } from '../resources/colors';
import { useTheme } from '../context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import HeaderBar from '../components/header';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import { fetchData } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const RevenueScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const profile = useSelector(state => state.Auth.profile);
  const accessToken = useSelector(state => state.Auth.accessToken);
  const [selectedTab, setSelectedTab] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const [revenueData, setRevenueData] = useState(null);
  const navigation = useNavigation();
  // Weekly data from API: amounts for Sun-Sat
  const weeklyData = revenueData?.week?.map(day => day.amount) || [0, 0, 0, 0, 0, 0, 0];

  // Monthly data: last 7 days amounts from month array (31 days)
  // You can change this logic to show full 31 days chart if needed
  const monthlyData =
    revenueData?.month
      ? revenueData.month.slice(-7).map(day => day.amount)
      : [0, 0, 0, 0, 0, 0, 0];

  const chartData = selectedTab === 'weekly' ? weeklyData : monthlyData;

  // Label for monthly: last 7 days of the month (day numbers)
  const monthlyLabels =
    revenueData?.month
      ? revenueData.month.slice(-7).map(day => day.name)
      : ['25', '26', '27', '28', '29', '30', '31'];

  // Weekly labels (Sun-Sat)
  const weeklyLabels = revenueData?.week?.map(day => day.name) || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const revenueAmount = revenueData?.wallet_amount !== undefined
    ? `${revenueData.currency_symbol || '₹'}${revenueData.wallet_amount}`
    : '₹12,500';

  useEffect(() => {
    const fetchRevenue = async () => {
      if (!accessToken || !profile?.driver_id) return;

      setLoading(true);
      const deviceId = await DeviceInfo.getUniqueId();
      const payLoad = {
        driver_id: profile.driver_id,
      };

      try {
        const data = await fetchData('getrevenue', 'POST', payLoad, {
          Authorization: `${accessToken}`,
          driver_id: profile.driver_id,
          device_id: deviceId,
        });
        // Alert.alert('Session', JSON.stringify(data, null, 2))
        if (!data?.ok && data?.status == 'false') {
          await AsyncStorage.clear();
          navigation.reset({
            index: 0,
            routes: [{ name: 'login-screen' }],
          });
        }
        // console.log('Revenue Data', JSON.stringify(data));
        setRevenueData(data);
      } catch (error) {
        console.error('Revenue API Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [selectedTab, accessToken, profile?.driver_id]);

  // Choose labels dynamically based on selected tab
  const chartLabels = selectedTab === 'weekly' ? weeklyLabels : monthlyLabels;

  // Chart HTML for WebView
  const barChartHtml = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body style="margin:0;padding:0;">
        <canvas id="barChart" width="100%" height="100%"></canvas>
        <script>
          const ctx = document.getElementById('barChart').getContext('2d');
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: [${chartLabels.map(label => `'${label}'`).join(',')}],
              datasets: [{
                label: 'Revenue',
                data: [${chartData.join(',')}],
                backgroundColor: '#4CAF50',
                borderRadius: 5,
                barThickness: 25
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    stepSize: 20,
                    color: '${COLORS[theme].accent}',
                    font: {
                      size: 8
                    }
                  }
                },
                x: {
                  ticks: {
                    color: '${COLORS[theme].accent}',
                    font: {
                      size: 8
                    }
                  }
                }
              },
              plugins: {
                legend: {
                  display: false
                }
              }
            }
          });
        </script>
      </body>
    </html>
  `;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('revenue') || 'Revenue'} showBackArrow={true} />
      <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
        {/* Total Revenue Card */}
        <View style={[styles.card, { backgroundColor: COLORS[theme].viewBackground }]}>
          <Text
            style={[poppins.regular.h6, { color: COLORS[theme].textPrimary, alignSelf: 'flex-start', marginHorizontal: wp(4) }]}
          >
            {'Total'}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: wp(80) }}>
            <Text style={[poppins.regular.h5, { color: COLORS[theme].textPrimary }]}>
              {t('Total Revenue')}
            </Text>
            <Text style={[poppins.bold.h3, { color: COLORS[theme].accent }]}>
              {loading ? <ActivityIndicator color={COLORS[theme].accent} /> : revenueAmount}
            </Text>
          </View>
        </View>

        {/* Weekly/Monthly Tab & Revenue Amount */}
        <View style={[styles.card, { backgroundColor: COLORS[theme].background }]}>
          <Text
            style={[poppins.regular.h7, { color: COLORS[theme].accent, alignSelf: 'flex-start', marginHorizontal: wp(4) }]}
          >
            {revenueAmount}
          </Text>

          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', width: wp(80), alignItems: 'center' }}
          >
            <Text style={[poppins.regular.h9, { color: COLORS[theme].textPrimary }]}>
              {selectedTab === 'weekly'
                ? ('Total Weekly Revenue')
                : ('Total Monthly Revenue')}
            </Text>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                onPress={() => setSelectedTab('weekly')}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: selectedTab === 'weekly' ? COLORS[theme].accent : COLORS[theme].background,
                    borderColor: COLORS[theme].accent,
                  },
                ]}
              >
                <Text
                  style={[
                    poppins.regular.h7,
                    { color: selectedTab === 'weekly' ? COLORS.light.white : COLORS[theme].accent },
                  ]}
                >
                  {'Weekly'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedTab('monthly')}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: selectedTab === 'monthly' ? COLORS[theme].accent : COLORS[theme].background,
                    borderColor: COLORS[theme].accent,
                  },
                ]}
              >
                <Text
                  style={[
                    poppins.regular.h7,
                    { color: selectedTab === 'monthly' ? COLORS.light.textOnPrimary : COLORS[theme].accent },
                  ]}
                >
                  {'Monthly'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS[theme].accent} style={{ marginTop: hp(10) }} />
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html: barChartHtml }}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={true}
            />
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: wp(4),
    marginTop: hp(2),
    borderRadius: wp(2),
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    alignItems: 'center',
  },
  chartContainer: {
    marginTop: hp(3),
    height: hp(35),
    marginHorizontal: wp(4),
    borderRadius: wp(2),
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: wp(2),
  },
  tabButton: {
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(1),
    borderWidth: 1,
  },
});

export default RevenueScreen;
