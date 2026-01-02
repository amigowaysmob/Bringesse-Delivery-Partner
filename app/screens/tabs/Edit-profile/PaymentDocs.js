import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  ToastAndroid,
  PermissionsAndroid,
  Keyboard,
  Alert,
  BackHandler,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { useTheme } from '../../../context/ThemeContext';
import HeaderBar from '../../../components/header';
import { hp, wp } from '../../../resources/dimensions';
import { poppins } from '../../../resources/fonts';
import { COLORS } from '../../../resources/colors';
import { fetchData } from '../../../api/api';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import DeviceInfo from 'react-native-device-info';
const GOOGLE_MAPS_API_KEY = 'AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc';

const PaymentDocs = ({ route }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const profileDetails = useSelector(state => state.Auth?.profileDetails);
  const navigation = useNavigation();
  const { showBackArrow } = route.params;
  const accessToken = useSelector(state => state.Auth.accessToken);
  const [formValues, setFormValues] = useState({
    account_name: __DEV__ ? "Ramm" : '',
    account_number: __DEV__ ? "5663101000700" : '',
    ifsc: __DEV__ ? "cnrb0005663" : '',
    pancard: __DEV__ ? "EAKPR3254M" : "",
    street1: __DEV__ ? "ETEST STERREERT DF" : '',
    street2: __DEV__ ? "ETEST  TES  STERREERT DF" : '',
    city: __DEV__ ? "MADRUOC" : '',
    district: __DEV__ ? "DISTRICKT" : '',
    state_with_code: '',
    postal_code: __DEV__ ? "625020" : '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const showToast = (msg) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert(msg);
  };
  useFocusEffect(
    React.useCallback(() => {
      if (showBackArrow) return;
      const onBackPress = () => {
        showToast("Back button disabled on this screen");
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [showBackArrow])
  );
  useEffect(() => {
    fetchProfileData();
    getCurrentLocationAndSetStateCountry();
    // Keyboard event listeners for ScrollView padding
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const dispatch = useDispatch();
  const handleChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };
  const fetchProfileData = async () => {
    if (!profileDetails?.driver_id) return;
    setLoading(true);
    try {
      const data = await fetchData(
        'showrazorpayaccountdetail',
        'POST',
        { driver_id: profileDetails?.driver_id },
        { driver_id: profileDetails?.driver_id }
      );
      const details = data?.driverDetails;
      if (details) {
        setFormValues({
          account_name: details.account_name || '',
          account_number: details.account_number?.toString() || '',
          ifsc: details.ifsc || '',
          pancard: details.pancard || '',
          street1: details.street1 || '',
          street2: details.street2 || '',
          city: details.city || '',
          district: details.district || '',
          state_with_code: `${details?.state || ''}, ${details?.country_code || 'IN'}`,
          postal_code: details.postal_code?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Profile API Error:', error);
    } finally {
      setLoading(false);
    }
  };
  const getCurrentLocationAndSetStateCountry = async () => {
    try {
      setLoadingLocation(true);
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          // Alert.alert('Location coordinates:',JSON.stringify({ latitude, longitude }));
          // Optionally call reverse geocoding here
          setLoadingLocation(false);
        },
        error => {
          console.error('Geolocation error:', error);
          setLoadingLocation(false);
        },
        { enableHighAccuracy: false, timeout: 35000, maximumAge: 30000 }
      );
    } catch (err) {
      console.error('Location permission error:', err);
      setLoadingLocation(false);
    }
  };

  const validateFields = () => {
    const newErrors = {};
    const requiredFields = {
      account_name: { label: 'Account Name', max: 50 },
      account_number: { label: 'Account Number', max: 20 },
      ifsc: { label: 'IFSC Code', max: 11 },
      pancard: { label: 'PAN Card', max: 10 },
      street1: { label: 'Street 1', max: 100, min: 10 },
      street2: { label: 'Street 2', max: 100, min: 10 },
      city: { label: 'City', max: 50 },
      postal_code: { label: 'Postal Code', max: 8 },
    };
    for (const field in requiredFields) {
      const value = formValues[field]?.trim() || '';
      const { label, max, min } = requiredFields[field];
      if (!value) newErrors[field] = `${label} is required.`;
      else if (value.length > max) newErrors[field] = `Max ${max} characters allowed.`;
      else if (min && value.length < min) newErrors[field] = `Min ${min} characters required.`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;
    setLoading(true);
    try {
      const [state, countryCode] = (formValues.state_with_code || '')
        .split(',')
        .map(str => str.trim());

      const payload = {
        driverId: profileDetails.driver_id,
        account_name: formValues.account_name,
        account_number: formValues.account_number,
        ifsc: formValues.ifsc,
        pancard: formValues.pancard,
        street1: formValues.street1,
        street2: formValues.street2,
        city: formValues.city,
        district: formValues.district,
        state,
        country_code: countryCode || 'IN',
        postal_code: formValues.postal_code,
      };

      const respdata = await fetchData('razorurl', 'POST', payload, {
        driverId: profileDetails.driver_id,
      });
      console.log(respdata, "respdata")
      if (respdata?.status === 'true') {
        await handleUpdatePaymentStatus();
      } else {
        // showMessage({ message: respdata?.error?.description || '', type: 'danger' });
        showMessage({ message: respdata?.message || 'Submission failed.', type: 'danger' });
      }
    } catch (error) {
      console.error('Submit API Error:', error);
      showMessage({ message: error?.description || '', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };
  const fetchProfileAccData = async () => {
    if (!accessToken || !profileDetails?.driver_id) return;
    try {
      const data = await fetchData('profile/' + profileDetails?.driver_id, 'GET', null, {
        Authorization: `${accessToken}`,
        driver_id: profileDetails.driver_id,
        device_id: await DeviceInfo.getUniqueId(),
      });
      if (!data?.ok && data?.status == 'false') {
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'login-screen' }],
        });
      }
      else {
        dispatch({
          type: 'UPDATE_PROFILE',
          payload: data,
        });
        dispatch({ type: 'PROFILE_DETAILS', payload: data });
      }
    } catch (error) {
      console.error('profile API Error:', error);
    }
  };

  const handleUpdatePaymentStatus = async () => {
    try {
      if (!profileDetails?.driver_id) return;
      const respdata = await fetchData('getrazorpayaccountdetail', 'POST', {
        driver_id: profileDetails.driver_id,
      });
      const message = respdata?.message || 'Update completed.';
      if (respdata?.status === 'true') {
        showMessage({ message, type: 'success' });
        ToastAndroid.show(message, ToastAndroid.SHORT);
        fetchProfileAccData();
        navigation.goBack?.();
      } else {
        showMessage({ message: message || 'Update failed.', type: 'danger' });
      }
    } catch (error) {
      console.error('Status update error:', error);
      showMessage({ message: 'Error updating status.', type: 'danger' });
    }
  };
  const renderTextField = (label, field, maxLength, editable = true) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>
        {label} <Text style={{ color: 'red' }}>*</Text>
      </Text>
      <TextInput
        keyboardType={field == 'account_number' ||field == 'postal_code' ? "number-pad" : ""}
        placeholder={label}
        value={formValues[field]}
        maxLength={maxLength}
        editable={editable}
        style={[
          styles.input,
          { borderColor: errors[field] ? 'red' : '#ccc', color: COLORS[theme].textPrimary },
        ]}
        onChangeText={text => handleChange(field, text)}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: COLORS[theme].background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <HeaderBar showBackArrow={showBackArrow} title={t('Bank Details')} />
      <FlashMessage position="top" />
      <View
        pointerEvents={!profileDetails?.payment_id ? 'auto' : 'none'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingBottom: keyboardVisible ? hp(40) : hp(8),
          }}
          showsVerticalScrollIndicator={false}
        >
          {renderTextField('Account Name', 'account_name', 50)}
          {renderTextField('Account Number', 'account_number', 20)}
          {renderTextField('IFSC Code', 'ifsc', 11)}
          {renderTextField('PAN Card', 'pancard', 10)}
          {renderTextField('Street 1', 'street1', 50)}
          {renderTextField('Street 2', 'street2', 50)}
          {renderTextField('City', 'city', 50)}
          {renderTextField('Postal Code', 'postal_code', 8)}

          {
            !profileDetails?.payment_id &&
            (
              <View style={styles.submitButtonContainer}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                  disabled={loading}
                  style={[styles.submitButton, { backgroundColor: COLORS[theme].accent }]}
                >
                  {loading && (
                    <ActivityIndicator
                      color={COLORS[theme].white}
                      style={{ marginRight: 10 }}
                    />
                  )}
                  <Text
                    style={[
                      poppins.regular.h4,
                      { color: COLORS[theme].white, textTransform: 'capitalize' },
                    ]}
                  >
                    {t('Save')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { paddingHorizontal: wp(4), marginTop: wp(1) },
  fieldContainer: { marginBottom: hp(2) },
  label: { marginBottom: hp(0.8), fontSize: wp(3.8), fontWeight: '500' },
  input: {
    backgroundColor: 'transparent',
    height: hp(5.5),
    borderWidth: wp(0.3),
    borderRadius: wp(1),
    paddingHorizontal: wp(3),
  },
  errorText: { color: 'red', marginTop: hp(0.5), fontSize: wp(3.5) },
  submitButtonContainer: { marginTop: hp(2), marginBottom: hp(3) },
  submitButton: {
    paddingVertical: hp(1.2),
    borderRadius: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default PaymentDocs;
