/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, StyleSheet, ScrollView, Platform,
  KeyboardAvoidingView, TouchableOpacity, Text,
  Alert, TextInput
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { hp, wp } from '../../../resources/dimensions';
import { poppins } from '../../../resources/fonts';
import { COLORS } from '../../../resources/colors';
import { useTheme } from '../../../context/ThemeContext';
import HeaderBar from '../../../components/header';
import SelectionModal from '../../../components/header/SelectModal';
import { useDispatch, useSelector } from 'react-redux';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { fetchData } from '../../../api/api';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PersonalInfoScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const siteDetails = useSelector(state => state.Auth.siteDetails);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const accessToken = useSelector(state => state.Auth.accessToken);
  const [formValues, setFormValues] = useState({
    vehicleCategory: '',
    vehicleType: '',
    vehicleNumber: '',
    serviceType: [],
    paymentId: '',
    documentType: '',
    transportOptions: [],  // changed from acceptedTerms boolean to array of selected transport options
  });

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [])
  );
  const fetchProfileData = async () => {
    if (!accessToken || !profileDetails?.driver_id) return;
    try {
      setLoading(true); // Start loading when fetching
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
      dispatch({
        type: 'PROFILE_DETAILS',
        payload: data,
      });
    } catch (error) {
      console.error('profile API Error:', error);
    } finally {
      setLoading(false);  // End loading
    }
  };

  useEffect(() => {
    console?.log(profileDetails?.driver_documents.length, "profileDetails")
    const allServices = siteDetails?.service_type || [];
    if (!formValues?.transportOptions?.length) {
      setServiceTypes([]);
      setFormValues(prev => ({ ...prev, serviceType: [] })); // clear selected service types
      return;
    }
    let filteredServices = allServices;
    if (formValues.transportOptions.length === 1) {
      if (formValues.transportOptions.includes('Transport')) {
        filteredServices = allServices.filter(s => s.type === 'transport');
      } else if (formValues.transportOptions.includes('Delivery')) {
        filteredServices = allServices.filter(s => s.type === 'shop');
      }
    }
    const mappedServices = filteredServices.map(service => ({
      label: service.name,
      value: service._id,
    }));
    setServiceTypes(mappedServices);
    const validServiceTypeValues = mappedServices.map(s => s.value);
    const updatedSelected = formValues.serviceType.filter(val =>
      validServiceTypeValues.includes(val)
    );
    if (updatedSelected.length !== formValues.serviceType.length) {
      setFormValues(prev => ({ ...prev, serviceType: updatedSelected }));
    }
  }, [siteDetails, formValues.transportOptions]);


  const [errors, setErrors] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const handleChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null })); // Clear error on change
  };
  const dispatch = useDispatch();
  useEffect(() => {
  }, [formValues?.vehicleCategory])

  const validateFields = () => {
    const newErrors = {};

    if (!formValues.vehicleCategory) newErrors.vehicleCategory = 'Vehicle Category is required.';
    if (!formValues.vehicleType) newErrors.vehicleType = 'Vehicle Type is required.';
    if (!formValues.vehicleNumber.trim()) newErrors.vehicleNumber = 'Vehicle Number is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {

    if (validateFields()) {

      if (!accessToken || !profileDetails?.driver_id) return;

      setLoading(true)
      let payLoad = {
        driver_id: profileDetails?.driver_id,
        service_type: JSON.stringify(formValues?.serviceType),
        vehicle_type: formValues?.vehicleType,
        vehicle_category: formValues?.vehicleCategory,
        vehicle_number: formValues?.vehicleNumber,
        partner_type: formValues?.transportOptions,
      };
      try {
        const data = await fetchData('updateprofile', 'PATCH', payLoad, {
          Authorization: `${accessToken}`,
          driver_id: profileDetails?.driver_id,
          device_id: await DeviceInfo.getUniqueId(),
        });
        // Alert.alert("Profile Update", data?.message || "Profile updated successfully");
        if (!data?.ok && data?.status == 'false') {
          await AsyncStorage.clear();
          navigation.reset({
            index: 0,
            routes: [{ name: 'login-screen' }],
          });
        }
        // console.log(data, "data")
        if (data?.status == "true") {
          showMessage({
            message: data?.message,
            type: 'success',
          });
          dispatch({
            type: 'UPDATE_PROFILE',
            payload: data,
          });
        }
        else {
          showMessage({
            message: data?.message,
            type: 'danger',
          });
        }
        setTimeout(() => {
          setLoading(false)
          navigation.reset({
            index: 0,
            routes: [{ name: 'home-screen' }],
          });
        }, 1000)
      } catch (error) {
        setLoading(false)
        console.error('UPDATE_PROFILE API Error:', error);
        showMessage({
          message: data.data?.message,
          // description: data.data?.message,
          type: 'danger',
        });
      } finally {
        // setLoading(false);
      }
      console.log('Submitted Profile Data:', formValues);
      // Submit logic here
    }
  };


  const getLabelByValue = (data, value) => {
    if (Array.isArray(value)) {
      return data
        .filter(item => value.includes(item.value))
        .map(item => item.label)
        .join(', ');
    }
    return data.find(item => item.value === value)?.label || '';
  };

  const openModal = (type, title, data) => {
    if (!Array.isArray(data)) {
      console.warn('Modal data is not an array:', data);
      data = [];
    }
    setModalType(type);
    setModalTitle(title);
    setModalData(data);
    setModalVisible(true);
  };

  const handleModalSelect = (item) => {
    if (modalType === 'serviceType') {
      const selectedValues = item.map(i => i.value);
      handleChange('serviceType', selectedValues);
    } else if (item?.value !== undefined) {
      if (modalType === 'vehicleCategory') {
        fetchVehicleType(item);
      }
      handleChange(modalType, item.value);
    }
    setModalVisible(false);
  };

  const fetchVehicleType = async (item) => {
    setVehicleTypes(
      item?.vehicles?.map(service => ({
        label: service.name,
        value: service._id,
      })) || []
    );
  };

  useEffect(() => {
    if (profileDetails) {
      setFormValues(prev => ({
        ...prev,
        vehicleCategory: profileDetails?.vehicle_category || '', // adjust if needed
        vehicleType: profileDetails?.vehicle_type || '',
        vehicleNumber: profileDetails?.vehicle_no || '',
        serviceType: (profileDetails?.service_type || []).map(service => service._id),
        paymentId: profileDetails?.payment_id || '',
        documentType: profileDetails?.driver_documents?.length ? 'Uploaded' : '',
        transportOptions: profileDetails?.partner_type
      }));
    }
  }, [profileDetails]);

  useEffect(() => {
    // profileDetails?.vehicle_category
    // Assuming profileDetails?.vehicle_category is defined
    const filteredVehicles = siteDetails?.vehicle_type?.filter(vehicle =>
      vehicle.category === profileDetails?.vehicle_category
    ) || [];  // Fallback to empty array if vehicle_type is undefined
    // Set the vehicle types after mapping the filtered array
    setVehicleTypes(
      filteredVehicles.map(vehicle => ({
        label: vehicle.name,
        value: vehicle._id
      })) || []  // Fallback in case the map operation produces undefined
    );
    // console?.log(vehicleTypes, "siteDetails?.vehicle_type")
    setVehicleCategories(
      siteDetails?.vehicle_category?.map(category => ({
        label: category.name,
        value: category._id,
        vehicles: category?.vehicles,

      })) || []
    );
    setServiceTypes(
      siteDetails?.service_type?.map(service => ({
        label: service.name,
        value: service._id,
      })) || []
    );
  }, [siteDetails]);


  const renderDropdownField = (label, value, onPress, error) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>{label}</Text>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={[
          styles.dropdown,
          {
            borderColor: error ? 'red' : COLORS[theme].textPrimary,
            flexDirection: "row", justifyContent: "space-between", alignItems: "center"
          },
        ]}>
          <Text numberOfLines={1} style={[
            styles.dropdownText,
            {
              color: value ? COLORS[theme].textPrimary : COLORS[theme].textPrimary,
            },
          ]}>
            {value || `Select ${label}`}
          </Text>
          <MaterialCommunityIcon
            name={"chevron-right"}
            size={wp(7)}
            color={COLORS[theme].textPrimary}
          />
        </View>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
  const renderTextField = (label, value, onChangeText, error) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>{label}</Text>
      <TextInput
        maxLength={label == 'Vehicle Number' ? 10 : 35}
        mode="outlined"
        placeholder={label}
        value={value}
        style={[styles.input, { borderColor: "#ccc", borderWidth: wp(0.3), borderRadius: wp(1), justifyContent: "center", color: COLORS[theme].textPrimary }]}
        onChangeText={onChangeText}
        outlineColor={error ? 'red' : COLORS[theme].textPrimary}
        activeOutlineColor={COLORS[theme].textPrimary}
        textColor={COLORS[theme].textPrimary}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
  const toggleTransportOption = (option) => {
    if (option == 'Transport' && !profileDetails?.subscription_status) {
      // Alert.alert("Subscription Required", "Please subscribe to enable Transport option.");

      showMessage({
        message: `You are in Subscription Period`,
        // description: data.data?.message,
        type: 'danger',
      });
      return;
    }
    let newOptions = [...formValues.transportOptions];
    if (newOptions.includes(option)) {
      newOptions = newOptions.filter(opt => opt !== option);
    } else {
      newOptions.push(option);
    }
    handleChange('transportOptions', newOptions);
  };

  const renderLabel = (label, isRequired = false) => (
    <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}> *</Text>}
    </Text>
  );

  const renderTransportCheckbox = (label) => {
    const selected = formValues?.transportOptions?.includes(label);
    return (
      <TouchableOpacity
        key={label}
        style={styles.checkboxContainer}
        onPress={() => toggleTransportOption(label)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcon
          name={selected ? "checkbox-marked" : "checkbox-blank-outline"}
          size={wp(6)}
          color={COLORS[theme].textPrimary}
        />
        <Text style={[styles.checkboxLabel, { color: COLORS[theme].textPrimary }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };
  // Add new handlers for the paymentId and documentType touchable opacity alerts
  const handlePaymentIdPress = () => {
    navigation.navigate('PaymentDocs')
    // Alert.alert("Payment ID", "You clicked on Payment ID field.");
  };
  const handleDocumentTypePress = () => {
    navigation.navigate('UploadDriverDocs', {
      showBackArrow: true
    })
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: COLORS[theme].background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <HeaderBar showBackArrow={true} title={t('Personal Information')} />
      <FlashMessage position="top" />
      <View
        pointerEvents={profileDetails?.live_status == 1 ? 'none' : 'auto'}
      >
        {profileDetails?.live_status == 1 && <Text style={[poppins.regular.h7, { alignSelf: "center", color: "#FF0000" }]}>{'You are online,cant make any changes'}</Text>}
        {
          isLoading ?
            <ActivityIndicator style={{ alignSelf: "center", justifyContent: "center" }} color={COLORS[theme].accent} size={wp(10)} />
            :
            <ScrollView
              style={{ paddingHorizontal: wp(3), marginVertical: wp(3) }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: hp(6) }}
              keyboardShouldPersistTaps="handled"
            >
              {renderDropdownField(
                'Vehicle Category',
                getLabelByValue(vehicleCategories, formValues.vehicleCategory),
                () => openModal('vehicleCategory', 'Select Vehicle Category', vehicleCategories),
                errors.vehicleCategory
              )}
              {renderDropdownField(
                'Vehicle Type',
                getLabelByValue(vehicleTypes, formValues.vehicleType),
                () => openModal('vehicleType', 'Select Vehicle Type', vehicleTypes),
                errors.vehicleType
              )}
              {renderTextField(
                'Vehicle Number',
                formValues.vehicleNumber,
                text => handleChange('vehicleNumber', text),
                errors.vehicleNumber
              )}
              <View style={{ marginBottom: hp(2), }}>
                {renderLabel('Select Transport Option', true)}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: wp(10) }}>
                  {['Transport', 'Delivery'].map(option => renderTransportCheckbox(option))}
                </View>
                {errors.transportOptions && <Text style={styles.errorText}>{errors.transportOptions}</Text>}
              </View>
              {/* Show Service Type only if 'Delivery' is selected */}
              {formValues.transportOptions.includes('Delivery') && (
                renderDropdownField(
                  'Service Type',
                  getLabelByValue(serviceTypes, formValues.serviceType),
                  () => openModal('serviceType', 'Select Service Type', serviceTypes),
                  errors.serviceType
                )
              )}
              {/* Replaced paymentId and documentType text fields with TouchableOpacity */}
              <TouchableOpacity onPress={handlePaymentIdPress} style={styles.fieldContainer}>
                <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>
                  Payment ID
                </Text>
                <View
                  style={[styles.input, { borderColor: "#ccc", borderWidth: wp(0.3), borderRadius: wp(1), justifyContent: "space-between", alignItems: "center" }]}
                >
                  <Text style={[styles.label, { color: COLORS[theme].textPrimary, lineHeight: wp(10), marginHorizontal: wp(2) }]}>
                    {profileDetails?.payment_id ? '*** Payment ID' : 'Not Set'}
                  </Text>
                  <MaterialCommunityIcon
                    name={profileDetails?.payment_id ? "check" : "chevron-right"}
                    size={wp(7)}
                    color={profileDetails?.payment_id ? 'green' : COLORS[theme].textPrimary}
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDocumentTypePress} style={styles.fieldContainer}>
                <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>
                  Document Type
                </Text>
                <View
                  style={[styles.input, { borderColor: "#ccc", borderWidth: wp(0.3), borderRadius: wp(1), alignItems: "ccenter", justifyContent: "space-between" }]}
                >
                  <Text style={[styles.label, { color: COLORS[theme].textPrimary, lineHeight: hp(6), }]}>
                    {profileDetails?.aadhar_front ?  ' Document(s) Uploaded' : 'Not Uploaded'}
                  </Text>
                  <MaterialCommunityIcon name={"chevron-right"} size={wp(7)} color={COLORS[theme].textPrimary} style={{
                    lineHeight: hp(6)
                  }} />
                </View>
              </TouchableOpacity>
              {
                !profileDetails?.live_status &&
                <View style={{ marginTop: hp(2), marginBottom: hp(3) }}>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: COLORS[theme].accent,
                      paddingVertical: hp(1),
                      borderRadius: 5,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={[
                        poppins.regular.h4,
                        { color: COLORS[theme].white },
                      ]}
                    >
                      {profileDetails?.live_status == 1 ? 'Profile Locked' : 'Save Changes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              }

            </ScrollView>
        }
      </View>
      <SelectionModal
        visible={modalVisible}
        data={modalData}
        title={modalTitle}
        onSelect={handleModalSelect}
        onDismiss={() => setModalVisible(false)}
        multiSelect={modalType === 'serviceType'}
        selectedValues={modalType === 'serviceType' ? formValues.serviceType : []}
      />
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
    paddingHorizontal: wp(3),
    height: hp(6), flexDirection: "row",
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
  },
  dropdownText: {
    fontSize: wp(3.5),
    maxWidth: wp(70)
  },
  errorText: {
    color: 'red',
    marginTop: hp(0.5),
    fontSize: wp(3.5),
  },
});

export default PersonalInfoScreen;
