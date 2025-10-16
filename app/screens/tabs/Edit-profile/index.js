/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, ScrollView, Platform,
  KeyboardAvoidingView, TouchableOpacity, Text,
  Alert,
} from 'react-native';
import { ActivityIndicator, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
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
    weight: '',
    transportOptions: [],  // changed from acceptedTerms boolean to array of selected transport options
  });

  useEffect(() => {
    console?.log(profileDetails, "profileDetails")
    const allServices = siteDetails?.service_type || [];
    if (!formValues.transportOptions.length) {
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
    if (!formValues.serviceType.length) {
      newErrors.serviceType = 'Select at least one service type.';
    } else if (formValues.serviceType.length > 3) {
      newErrors.serviceType = 'You can select up to 3 service types.';
    }
    // if (!formValues.paymentId.trim()) newErrors.paymentId = 'Payment ID is required.';
    // if (!formValues.documentType.trim()) newErrors.documentType = 'Document Type is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {

    // Alert.alert(JSON.stringify(profileDetails?.partner_type))

    if (validateFields()) {
      // Alert.alert(JSON.stringify(formValues?.transportOptions)) 
      // return true;
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
        });
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
          navigation?.goBack();
        }, 2000)
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
    console?.log(vehicleTypes, "siteDetails?.vehicle_type")


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
          },
        ]}>
          <Text style={[
            styles.dropdownText,
            {
              color: value ? COLORS[theme].textPrimary : COLORS[theme].placeholder,
            },
          ]}>
            {value || `Select ${label}`}
          </Text>
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
        style={styles.input}
        onChangeText={onChangeText}
        outlineColor={error ? 'red' : COLORS[theme].textInputBorder}
        activeOutlineColor={COLORS[theme].textPrimary}
        textColor={COLORS[theme].textPrimary}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
  const toggleTransportOption = (option) => {
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
    const selected = formValues.transportOptions.includes(label);
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


  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: COLORS[theme].background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <HeaderBar showBackArrow={true} title={t('personal_info')} />
      <FlashMessage position="top" />
      {
        isLoading ?
          <ActivityIndicator style={{ alignSelf: "center", justifyContent: "center" }} color={COLORS[theme].accent} size={wp(10)} />
          :
          <ScrollView
            style={{ paddingHorizontal: wp(5), marginTop: wp(3) }}
            showsVerticalScrollIndicator={false}
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
            {renderDropdownField(
              'Service Type',
              getLabelByValue(serviceTypes, formValues.serviceType),
              () => openModal('serviceType', 'Select Service Type', serviceTypes),
              errors.serviceType
            )}

            {renderTextField(
              'Payment ID',
              formValues.paymentId,
              text => handleChange('paymentId', text),
              errors.paymentId
            )}

            {renderTextField(
              'Document Type',
              formValues.documentType,
              text => handleChange('documentType', text),
              errors.documentType
            )}

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
                  {t('save')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
      }


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
    height: hp(5.5),
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
  },
  dropdownText: {
    fontSize: wp(4),
  },
  errorText: {
    color: 'red',
    marginTop: hp(0.5),
    fontSize: wp(3.5),
  },
});

export default PersonalInfoScreen;
