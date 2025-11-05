import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text,
  FlatList, StyleSheet, ActivityIndicator,
  Image, TouchableOpacity, Modal,
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
import { IMAGE_ASSETS } from '../resources/images';
import RazorpayCheckout from 'react-native-razorpay';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const SubscriptionList = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const accessToken = useSelector(state => state.Auth.accessToken);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const siteDetails = useSelector(state => state.Auth.siteDetails);

  const [expandedDescription, setExpandedDescription] = useState({});
  const [refreshing, setRefreshing] = useState(false); // New state for refresh

  const fetchSubscription = useCallback(async () => {
    if (!accessToken || !profileDetails?.driver_id) return;
    try {
      setLoading(true);
      const data = await fetchData('subscriptionlists', 'POST', {
        driver_id: profileDetails?.driver_id
      }, null);
      if (data?.status === true && Array.isArray(data.subscriptions)) {
        setSubscriptionData(data.subscriptions);
      } else {
        setSubscriptionData([]);
      }
    } catch (err) {
      console.error('Subscription fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);  // Stop refreshing after the data is loaded
    }
  }, [accessToken, profileDetails?.driver_id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleBuyNow = (item) => {
    setSelectedSubscription(item);
    setConfirmVisible(true);
  };

  const confirmPurchase = () => {
    setConfirmVisible(false);
    setProcessing(true);
    fnGetRazorPay();
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, {
      backgroundColor: COLORS[theme].viewBackground,
      borderColor: item?.active_status ? 'green' : "#ccc"
    }]}>
      <View style={styles.iconContainer}>
        <Image
          source={IMAGE_ASSETS?.subscription}
          tintColor={COLORS[theme].textPrimary}
          style={styles.imageStyle}
        />
      </View>
      <View style={styles.detailsContainer}>
        <DetailItem label={t('Name')} value={item?.name} theme={theme} />
        <DetailItem label={t('Duration')} value={`${item?.duration} ${item?.durationType}`} theme={theme} />
        <DetailItem label={t('Free Calls')} value={`${item?.orderCount} `} theme={theme} />

        {/* Description with "Show More" toggle */}
        {
          item?.description  &&
          <View>
            <Text style={{ color: COLORS[theme].textPrimary }}>
              {expandedDescription[item?._id] ? item?.description : item?.description?.slice(0, 100) + '...'}
            </Text>
            <TouchableOpacity onPress={() => toggleDescription(item?._id)} style={{ marginTop: hp(1) }}>
              <Text style={{ color: COLORS[theme].accent }}>
                {expandedDescription[item?._id] ? t('Show Less') : t('Show More')}
              </Text>
            </TouchableOpacity>
          </View>
        }

        <View style={styles.buttonContainer}>
          {
            !item?.active_status ?
              <TouchableOpacity
                style={[styles.buyNowButton, { backgroundColor: COLORS[theme].accent }]}
                onPress={() => handleBuyNow(item)}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", width: '90%' }}>
                  <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].white }]}>
                    {`${t('BuyNow')} `}
                  </Text>
                  <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].accent, backgroundColor: COLORS[theme].white, paddingHorizontal: wp(2), borderRadius: wp(2) }]}>
                    {` ${profileDetails?.currency_symbol} ${item?.price}`}
                  </Text>
                </View>
              </TouchableOpacity>
              :
              <TouchableOpacity
                style={[styles.buyNowButton, { borderColor: 'green', borderWidth: wp(0.5) }]}
              >
                <View style={{ flexDirection: "row" }}>
                  <MaterialCommunityIcon
                    style={{ marginHorizontal: wp(2) }}
                    name="crown"
                    size={wp(6)}
                    color={COLORS[theme].textPrimary}
                  />
                  <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].textPrimary }]}>
                    {`${t('Active')} `}
                  </Text>
                </View>
              </TouchableOpacity>
          }
        </View>
      </View>
    </View>
  );

  const DetailItem = ({ label, value, theme }) => (
    <View style={styles.detailRow}>
      <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary }]}>
        {label}
      </Text>
      <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary }]}>
        {label === t('Price') ? `${profileDetails?.currency_symbol} ${value}` : value}
      </Text>
    </View>
  );

  const toggleDescription = (id) => {
    setExpandedDescription(prevState => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  };

  const fnGetRazorPay = async () => {
    try {
      const data = await fetchData('createPaymentIntent/', 'POST', {
        driver_id: profileDetails.driver_id,
        amount: selectedSubscription.price
      }, {
        Authorization: `${accessToken}`,
        driver_id: profileDetails.driver_id,
      });
      setProcessing(false);
      initRazorPay(data?.data);
    } catch (error) {
      console.error('profileDetails:', error);
    }
  };

  const initRazorPay = (payLoad) => {
    const options = {
      description: 'Payment for your order',
      image: 'https://your-logo-url.png',
      currency: siteDetails?.currency_code,
      key: siteDetails?.razorKey,
      amount: payLoad?.amount,
      name: selectedSubscription?.name,
      order_id: payLoad?.orderId,
      prefill: {
        email: profileDetails?.email,
        contact: profileDetails?.phone_no
      },
      theme: { color: '#F37254' }
    };
    RazorpayCheckout.open(options)
      .then((data) => {
        if (data?.razorpay_payment_id) {
          let payLoad = {
            driverId: profileDetails?.driver_id,
            transactionId: data?.razorpay_payment_id,
            duration: selectedSubscription.duration,
            durationType: selectedSubscription.durationType,
            orderCount: selectedSubscription.orderCount,
            totalAmount: selectedSubscription.price,
            paidAmount: selectedSubscription.price,
            walletUsed: 0,
            orderId: data?.razorpay_order_id,
            subscriptionId: selectedSubscription?._id,
            currency: profileDetails?.currency_code
          };
          fnGetPaymentStatus(payLoad);
        }
      })
      .catch((error) => {
        console.log(error, "error");
      });
  };

  const fnGetPaymentStatus = async (payLoad) => {
    try {
      const data = await fetchData('subscribe/', 'POST', payLoad, {
        Authorization: `${accessToken}`,
        driver_id: profileDetails.driver_id,
      });
      setProcessing(false);
    } catch (error) {
      console.error('profileDetails:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('SubscriptionList')} showBackArrow />
      <View style={{ flex: 1 }}>
        {loading || processing ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={COLORS[theme].accent} />
            {processing && (
              <Text style={[poppins.regular.h7, { marginTop: hp(1), color: COLORS[theme].textPrimary }]}>
                Processing your purchase...
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            data={subscriptionData}
            keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.scrollContent}
            ListEmptyComponent={
              <View style={{ padding: wp(5), alignItems: 'center' }}>
                <Text style={[poppins.regular.h7, { color: COLORS[theme].textPrimary }]}>
                  {t('no_Subscription') || 'No Subscription found.'}
                </Text>
              </View>
            }
            onRefresh={fetchSubscription} 
            refreshing={refreshing}  
          />
        )}
      </View>
      <Modal
        animationType="fade"
        transparent
        visible={confirmVisible}
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: COLORS[theme].viewBackground }]}>
            <Text style={[poppins.semi_bold.h5, { color: COLORS[theme].textPrimary, marginBottom: hp(1) }]}>
              Confirm Purchase
            </Text>
            {selectedSubscription && (
              <>
                <DetailItem label={t('Name')} value={selectedSubscription.name} theme={theme} />
                <DetailItem
                  label={t('Duration')}
                  value={`${selectedSubscription.duration} ${selectedSubscription.durationType}`}
                  theme={theme}
                />
                <DetailItem
                  label={t('Price')}
                  value={selectedSubscription.price}
                  theme={theme}
                />
              </>
            )}

            <Text style={[poppins.regular.h6, { marginTop: hp(2), color: COLORS[theme].textPrimary }]}>
              Are you sure you want to buy this subscription?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setConfirmVisible(false)}
                style={[styles.modalButton, { backgroundColor: COLORS[theme].cardBackground, borderColor: "#CCC", borderWidth: wp(0.3) }]}
              >
                <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].white }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmPurchase}
                style={[styles.modalButton, { backgroundColor: COLORS[theme].accent }]}
              >
                <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].white }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: hp(2),
    paddingBottom: hp(5),
    gap: wp(3), marginHorizontal: wp(3),
  },
  card: {
    flexDirection: 'row', padding: wp(4),
    borderRadius: wp(2), elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    borderWidth: wp(0.5),
  },
  iconContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center', marginRight: wp(3),
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  buttonContainer: {
    marginTop: hp(2),
    width: '100%',
  },
  buyNowButton: {
    paddingVertical: hp(1),
    borderRadius: wp(1.5),
    alignItems: 'center', width: '100%',
    height: hp(5),
  },
  loader: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center',
  },
  imageStyle: {
    width: wp(13), height: wp(13),
    resizeMode: 'contain',
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: wp(90), padding: wp(5), borderRadius: wp(2),
    elevation: 5, borderWidth: wp(0.5), borderColor: "#ccc", position: "absolute", bottom: hp(4)
  },
  modalActions: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: hp(3),
  },
  modalButton: {
    flex: 1, paddingVertical: hp(1.2), marginHorizontal: wp(1.5),
    borderRadius: wp(2), alignItems: 'center',
  },
});

export default SubscriptionList;
