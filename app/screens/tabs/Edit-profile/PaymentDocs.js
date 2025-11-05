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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { useTheme } from '../../../context/ThemeContext';
import HeaderBar from '../../../components/header';
import { hp, wp } from '../../../resources/dimensions';
import { poppins } from '../../../resources/fonts';
import { COLORS } from '../../../resources/colors';
import { fetchData } from '../../../api/api';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';

// Google Maps Geocoding API Key (replace with your own)
const GOOGLE_MAPS_API_KEY = 'AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc';

const PaymentDocs = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const navigation = useNavigation();

  const [formValues, setFormValues] = useState({
    account_name: '',
    account_number: '',
    ifsc: '',
    pancard: '',
    street1: '',
    street2: '',
    city: '',
    district: '',
    state_with_code: '', // Combined field: State, Country Code
    postal_code: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  useEffect(() => {
    fetchProfileData();
    getCurrentLocationAndSetStateCountry();
  }, []);

  const fetchProfileData = async () => {
    if (!profileDetails?.driver_id) return;
    setLoading(true);
    try {
      const data = await fetchData(
        'showrazorpayaccountdetail',
        'POST',
        { driver_id: profileDetails.driver_id },
        { driver_id: profileDetails.driver_id }
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
          state_with_code: `${details.state || ''}, ${details.country_code || 'IN'}`,
          postal_code: details.postal_code?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Profile API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Request permission and get current location
  const getCurrentLocationAndSetStateCountry = async () => {
    try {
      setLoadingLocation(true);

      // For Android, request permission for location
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to autofill state and country.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        // If permission is denied, return early and do not fetch location
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission denied');
          setLoadingLocation(false);
          return;
        }
      }
      // Get the current position using Geolocation API
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          console.log('Location coordinates:', latitude, longitude);
          // fetchStateCountryFromCoords(latitude, longitude);
        },
        error => {
          console.error('Geolocation error:', error);
          setLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      console.error('Location permission error:', err);
      setLoadingLocation(false);
    }
  };

  // Use Google Maps Geocoding API to get state and country code from lat/lon
  const fetchStateCountryFromCoords = async (lat, lon) => {
    try {
      // Using Google Maps Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const result = data.results[0];
        const addressComponents = result.address_components;
        let state = '';
        let countryCode = '';

        // Parse the address components to extract state and country code
        addressComponents.forEach(component => {
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
          if (component.types.includes('country')) {
            countryCode = component.short_name;
          }
        });

        if (state && countryCode) {
          setFormValues(prev => ({
            ...prev,
            state_with_code: `${state}, ${countryCode}`,
          }));
        }
      }
    } catch (error) {
      console.error('Google Maps Geocoding Error:', error);
    } finally {
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
      // state_with_code: { label: 'State, Country Code', max: 80 },
      postal_code: { label: 'Postal Code', max: 8 },
    };

    for (const field in requiredFields) {
      const value = formValues[field]?.trim() || '';
      const { label, max, min } = requiredFields[field];
      if (!value) {
        newErrors[field] = `${label} is required.`;
      } else if (value.length > max) {
        newErrors[field] = `Max ${max} characters allowed.`;
      } else if (min && value.length < min) {
        newErrors[field] = `Min ${min} characters required.`;
      }
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

      const respdata = await fetchData(
        'razorurl',
        'POST',
        payload,
        { driverId: profileDetails.driver_id }
      );
      if (respdata?.status === 'true') {
        await handleUpdatePaymentStatus();
      } else {
        showMessage({ message: respdata?.message || 'Submission failed.', type: 'danger' });
      }
    } catch (error) {
      console.error('Submit API Error:', error);
      showMessage({ message: 'Something went wrong while submitting.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async () => {
    try {
      if (!profileDetails?.driver_id) {
        console.warn('No driver ID available');
        return;
      }
      const respdata = await fetchData(
        'getrazorpayaccountdetail',
        'POST',
        { driver_id: profileDetails.driver_id }
      );
      const message = respdata?.message || 'Update completed.';
      if (respdata?.status === 'true') {
        showMessage({ message, type: 'success' });
        ToastAndroid.show(message, ToastAndroid.SHORT);
        if (navigation?.goBack) {
          navigation.goBack();
        }
      } else {
        showMessage({ message: message || 'Update failed.', type: 'danger' });
      }
    } catch (error) {
      console.error('Status update error:', error);
      showMessage({
        message: 'Error updating status.',
        type: 'danger',
      });
    }
  };

  const renderTextField = (label, field, maxLength, editable = true) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>
        {label} <Text style={{ color: 'red' }}>*</Text>
      </Text>
      <TextInput
        placeholder={label}
        value={formValues[field]}
        maxLength={maxLength}
        editable={editable}
        style={[
          styles.input,
          { borderColor: errors[field] ? 'red' : '#ccc' },
        ]}
        onChangeText={text => handleChange(field, text)}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: COLORS[theme].background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <HeaderBar showBackArrow={true} title={t('Bank Details')} />
      <FlashMessage position="top" />
      <ScrollView
        style={{ paddingHorizontal: wp(5), marginTop: wp(3) }}
        showsVerticalScrollIndicator={false}
      >
        {renderTextField('Account Name', 'account_name', 50)}
        {renderTextField('Account Number', 'account_number', 20)}
        {renderTextField('IFSC Code', 'ifsc', 11)}
        {renderTextField('PAN Card', 'pancard', 10)}
        {renderTextField('Street 1', 'street1', 100)}
        {renderTextField('Street 2', 'street2', 100)}
        {renderTextField('City', 'city', 50)}
        {/* Show loading spinner if location fetching */}
        {/* <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>
            State, Country Code<Text style={{ color: 'red' }}>*</Text>
          </Text>
          {loadingLocation ? (
            <ActivityIndicator size="small" color={COLORS[theme].accent} />
          ) : (
            <TextInput
              disabled={true}
              placeholder="State, Country Code"
              value={formValues.state_with_code}
              maxLength={80}
              style={[
                styles.input,
                { borderColor: errors.state_with_code ? 'red' : '#ccc' },
              ]}
              // onChangeText={text => handleChange('state_with_code', text)}
            />
          )}
          {errors.state_with_code && (
            <Text style={styles.errorText}>{errors.state_with_code}</Text>
          )}
        </View> */}
        {renderTextField('Postal Code', 'postal_code', 8)}

        <View style={{ marginTop: hp(2), marginBottom: hp(3) }}>
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={loading}
            style={{
              backgroundColor: COLORS[theme].accent,
              paddingVertical: hp(1.2),
              borderRadius: 5,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {loading && (
              <ActivityIndicator color={COLORS[theme].white} style={{ marginRight: 10 }} />
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: hp(2),
  },
  label: {
    marginBottom: hp(0.8),
    fontSize: wp(3.8),
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'transparent',
    height: hp(5.5),
    borderWidth: wp(0.3),
    borderRadius: wp(1),
    paddingHorizontal: wp(3),
  },
  errorText: {
    color: 'red',
    marginTop: hp(0.5),
    fontSize: wp(3.5),
  },
});
export default PaymentDocs;
