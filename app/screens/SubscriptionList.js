import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text,
  FlatList, StyleSheet, ActivityIndicator,
  Image, TouchableOpacity, Modal,
  Alert, ToastAndroid,
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
import { useNavigation } from '@react-navigation/native';
import AutoCloseMessageModal from '../components/header/autoCloseModal';

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
  const [activeSubscription, setActiveSubscription] = useState(null);
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [apiMessage, setApiMessage] = useState('');

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
        const activeSub = data.subscriptions.find(item => item.active_status);
        const inactiveSubs = data.subscriptions.filter(item => !item.active_status);
        setActiveSubscription(activeSub || null);
        setSubscriptionData(data.subscriptions);
      } else {
        setSubscriptionData([]);
        setActiveSubscription(null);
      }
    } catch (err) {
      console.error('Subscription fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, profileDetails?.driver_id]);

  useEffect(() => {
    fetchSubscription();
    // fnGetPaymentStatus({});
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
        {/* <Text>{JSON.stringify(item,null,2)}</Text> */}
        <DetailItem label={t('Name')} value={item?.name} theme={theme} />
        <DetailItem label={t('Duration')} value={`${item?.duration} ${item?.durationType}`} theme={theme} />
        <DetailItem label={t('Free Calls')} value={`${item?.orderCount} `} theme={theme} />
        {/* Description with "Show More" toggle */}
        {
          item?.description &&
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
                style={[styles.buyNowButton, { backgroundColor: 'green' }]}
                onPress={() => handleBuyNow(item)}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", width: '90%' }}>
                  <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].white }]}>
                    {`${t('BuyNow')} `}
                  </Text>
                  <Text style={[poppins.semi_bold.h6, { color: 'green', backgroundColor: COLORS[theme].white, paddingHorizontal: wp(2), borderRadius: wp(2) }]}>
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
  const renderActiveItem = ({ item }) => (
    <View style={[{
      backgroundColor:'green',
      borderColor: 'green',
      flexDirection: 'row', padding: wp(3),
      borderRadius: wp(2), elevation: 2,
    }]}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcon name="crown" size={hp(5)} color={'#FFF'} style={{ marginTop: hp(0.5) }} />
      </View>
      <View style={styles.detailsContainer}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginHorizontal: wp(2) }}>
          <View style={{ flexDirection: "column" }}>
            <Text numberOfLines={2} style={[poppins.regular.h7, { color: COLORS[theme].white, textTransform: "capitalize" ,maxWidth:wp(45)}]}>{`${item?.name}`}</Text>
            <Text style={[poppins.regular.h7, { color: COLORS[theme].white, textTransform: "capitalize" }]}>{`Duration : ${item?.duration} ${item?.durationType}`}</Text>
          </View>
          <View>
            <Text style={[poppins.regular.h7, { color: COLORS[theme].white, textTransform: "capitalize" }]}>{`Free Calls : ${item?.orderCount}`}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const DetailItem = ({ label, value, theme }) => (
    <View style={styles.detailRow}>
      <Text style={[poppins.regular.h8, { color: COLORS[theme].textPrimary, textTransform: "capitalize" }]}>
        {label}
      </Text>
      <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary, textTransform: "capitalize" }]}>
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
        fetchSubscription();
      });
  };

  const fnGetPaymentStatus = async (payLoad) => {
    try {
      const data = await fetchData('subscribe/', 'POST', payLoad, {
        Authorization: `${accessToken}`,
        driver_id: profileDetails.driver_id,
      });

      // Alert.alert(JSON.stringify(data, null, 2));
      if (data?.status === true) {
        setProcessing(false);
        fetchSubscription();
        ToastAndroid.show(data?.message || 'Subscription successful', ToastAndroid.LONG);
        setApiMessage(data.description || 'Operation Successful!');
        setModalVisible(true);
      }
      else {
        setProcessing(false);
        ToastAndroid.show(data?.message || 'Subscription failed', ToastAndroid.LONG);
      }
    } catch (error) {
      console.error('profileDetails:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('Subscription List')} showBackArrow />
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
          <>
            {/* 🟢 Active Subscription Header */}
            {(
              <View style={{ marginHorizontal: wp(3), marginVertical: hp(1) }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                 {activeSubscription &&  <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary, marginBottom: hp(1) }]}>
                    {t('Active Subscription')}
                  </Text>}
                  <MaterialCommunityIcon onPress={() => navigation.navigate('SubsciptionHistory')} name="clock" size={wp(6)} color={COLORS[theme].textPrimary} />
                </View>
                {activeSubscription &&  renderActiveItem({ item: activeSubscription })}
              </View>
            )}
            {/* 🔽 Inactive Subscriptions List */}
            <FlatList
              data={subscriptionData}
              keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.scrollContent}
              ListHeaderComponent={<View style={{ alignItems: 'vcf' }}>
                <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary }]}>
                  {t('Available Subscriptions')}
                </Text>
              </View>}
              ListEmptyComponent={
                <View style={{ padding: wp(5), alignItems: 'center' }}>
                  <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary }]}>
                    {t('No Subscription found.')}
                  </Text>
                </View>
              }
              onRefresh={fetchSubscription}
              refreshing={refreshing}
            />
          </>
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
                <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].black }]}>Cancel</Text>
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
      <AutoCloseMessageModal
        visible={modalVisible}
        message={apiMessage}
        duration={2000} // closes automatically in 2 seconds
        onClose={() => setModalVisible(false)}
        backgroundColor="#28a745" // success color
        textColor="#fff"
      />
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
