/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useState } from 'react';
import {
    View, StyleSheet, ScrollView, Platform,
    KeyboardAvoidingView, TouchableOpacity, Text,
    Alert,
    PermissionsAndroid,
    ToastAndroid,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { hp, wp } from '../../../resources/dimensions';
import { poppins } from '../../../resources/fonts';
import { COLORS } from '../../../resources/colors';
import { useTheme } from '../../../context/ThemeContext';
import HeaderBar from '../../../components/header';
import SelectionModal from '../../../components/header/SelectModal';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { fetchData } from '../../../api/api';
import Geolocation from 'react-native-geolocation-service';
import VerifyPhoneModal from '../../VerifyPhoneModal';


const RegisterScreen = () => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const siteDetails = useSelector(state => state.Auth.siteDetails);
    const [location, setLocation] = useState(null);
    const [verifyModalVisible, setVerifyModalVisible] = useState(false);
    const [verifiedPhone, setVerifiedPhone] = useState('');
    // Focus effect will run every time screen is focused
    useFocusEffect(
        useCallback(() => {
            getLocation();
        }, [])
    );

    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios') {
            return true; // iOS permissions handled via Info.plist
        }
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message: 'App needs access to your location.',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('Permission error:', err);
            return false;
        }
    };
    const getLocation = async () => {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Location permission is required.');
            return;
        }
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // console.log('REGISLOCALTION:', latitude, longitude);
                // Alert.alert();
                setLocation({ latitude, longitude });
            },
            (error) => {
                console.error('Geolocation error:', error);
                Alert.alert('Location Error', error.message || 'Failed to get location.');
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 10000,
                forceRequestLocation: true,
                showLocationDialog: true,
            }
        );
    };
    const [formValues, setFormValues] = useState(__DEV__ ? {
        firstName: 'test', lastName: 'test2', location: 'testLocation',
        email: 'teat@gmail.com', password: '123456', confirmPassword: '123456',
        vehicleCategory: '', vehicleType: '', serviceType: [],
        acceptedTerms: false,  // New field for terms acceptance
        transportOptions: [],  // changed from acceptedTerms boolean to array of selected transport options
        mobileNumber: '1234567890',   // added mobileNumber field
        weight: '100',         // added weight field (numeric)
        vehicle_no: 'TN01TG0023',
        referal_code: 'TESTRef0001',

    } :
        {
            firstName: '',
            lastName: '',
            location: '',
            email: '',
            password: '',
            confirmPassword: '',
            vehicleCategory: '',
            vehicleType: '',
            serviceType: [],
            acceptedTerms: false,
            transportOptions: [],
            mobileNumber: '',
            weight: '',
            vehicle_no: '',
            referal_code: '',

        }
    );
    // Function to toggle terms acceptance
    const toggleAcceptedTerms = () => {
        setFormValues(prev => ({ ...prev, acceptedTerms: !prev.acceptedTerms }));
    };

    const [errors, setErrors] = useState({});
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState('');
    const [modalData, setModalData] = useState([]);
    const [modalTitle, setModalTitle] = useState('');
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [vehicleCategories, setVehicleCategories] = useState([]);
    const [serviceTypes, setServiceTypes] = useState([]);
    const dispatch = useDispatch();

    useEffect(() => {
        setVehicleCategories(
            siteDetails?.vehicle_category?.map(category => ({
                label: category.name,
                value: category._id,
                vehicles: category?.vehicles,
            })) || []
        );
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

    const handleChange = (field, value) => {
        setFormValues(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: null }));
    };

    const toggleTransportOption = (option) => {
        let newOptions = [...formValues.transportOptions];
        if (newOptions.includes(option)) {
            newOptions = newOptions.filter(opt => opt !== option);
        } else {
            newOptions.push(option);
        }
        handleChange('transportOptions', newOptions);
    };

    const validateFields = () => {
        const newErrors = {};
        if (!formValues.firstName.trim()) newErrors.firstName = 'First name is required.';
        if (!formValues.lastName.trim()) newErrors.lastName = 'Last name is required.';
        if (!formValues.location.trim()) newErrors.location = 'Location is required.';
        if (!formValues.email.trim()) newErrors.email = 'Email is required.';
        if (!formValues.password.trim()) newErrors.password = 'Password is required.';
        if (formValues.password !== formValues.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
        if (!formValues.vehicleCategory) newErrors.vehicleCategory = 'Vehicle Category is required.';
        if (!formValues.vehicleType) newErrors.vehicleType = 'Vehicle Type is required.';
        if (!formValues.serviceType.length) newErrors.serviceType = 'Select at least one service type.';
        if (!formValues.transportOptions.length) newErrors.transportOptions = 'Please select Transport, Delivery, or both.';
        if (!formValues.acceptedTerms) newErrors.acceptedTerms = 'You must accept the Terms and Privacy Policy to continue.';
        if (!formValues.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile number is required.';
        else if (!/^\d{7,15}$/.test(formValues.mobileNumber)) newErrors.mobileNumber = 'Enter a valid mobile number.';
        if (!formValues.weight.trim()) newErrors.weight = 'Weight is required.';
        else if (isNaN(Number(formValues.weight)) || Number(formValues.weight) <= 0) newErrors.weight = 'Enter a valid weight.';
        if (!formValues.vehicle_no.trim()) newErrors.vehicle_no = 'Vehicle number is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handlePhoneVerification = (phone) => {
        // setVerifiedPhone(phone);
        setFormValues(prev => ({ ...prev, mobileNumber: phone }));
        ToastAndroid.show('Phone number verified.', ToastAndroid.SHORT);
        showMessage({ message: 'Phone number verified.', type: 'success' });
    };

    const handleSubmit = async () => {
        if (validateFields()) {
            let payLoad = {
                first_name: formValues?.firstName.trim(),
                "last_name": formValues?.lastName || "",                     // assuming optional
                "email": formValues?.email,
                "password": formValues?.password,
                "phone_no": formValues?.mobileNumber,
                "location": formValues?.location,
                "lon": location?.longitude,                                                   // not collected, maybe from GPS
                "lat": location?.latitude,                                                // not collected, maybe from GPS
                "service_type": formValues?.serviceType,          // assuming only first is needed
                "vehicle_type": formValues?.vehicleType,
                "partner_type": formValues?.transportOptions || "",
                "vehicle_category": formValues?.vehicleCategory,
                "vehicle_number": formValues?.vehicle_no,
                "capacity": `${formValues?.weight}` || "",
                "referral_code": formValues?.referal_code                    // mapped from 
            }
            try {
                const data = await fetchData('signup/', 'POST', payLoad, {
                });
                // Alert.alert(JSON.stringify(data))
                const userDatas = data;

                if (data?.status == "true") {
                    const userDatas = data;
                    // console.log('User data saved', userDatas);
                    try {
                        await AsyncStorage.setItem('user_data', JSON.stringify(userDatas));
                        console.log('User data saved');
                    } catch (error) {
                        console.error('AsyncStorage error:', error);
                    }
                    // Show success
                    ToastAndroid.show(userDatas?.message, ToastAndroid.SHORT);
                    showMessage({
                        message: userDatas?.message,
                        description: userDatas?.message,
                        type: 'success',
                    });
                    const { access_token, refresh_token, ...profileData } = userDatas;
                    await AsyncStorage.setItem('access_token', access_token);
                    await AsyncStorage.setItem('refresh_token', refresh_token);
                    // Redux update
                    dispatch({
                        type: 'UPDATE_PROFILE',
                        payload: profileData,
                    });
                    // Store access and refresh tokens
                    dispatch({
                        type: 'SET_TOKENS',
                        payload: {
                            access_token: access_token,
                            refresh_token: refresh_token,
                        },
                    });
                    // Navigate
                    setTimeout(() => {
                        // navigation.replace('home-screen');
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'home-screen' }],
                          });
                    }, 2000);
                } else {
                    ToastAndroid.show(userDatas?.message, ToastAndroid.SHORT);
                    showMessage({
                        message: userDatas.message,
                        // description: userDatas.message || t('Something went wrong'),
                        type: 'danger',
                    });
                }
            } catch (error) {
                console.error('profile API Error:', error);
            } finally {
                // setLoading(false);
            }
        }
    };

    // useEffect(()=>{
    //     // Alert.alert("rter")
    //     showMessage({
    //         message: "userDatas?.message",
    //         description: "userDatas?.message",
    //         type: 'success',
    //     });
    // },[])

    function handleNavigate(){
        navigation?.navigate('TermsAndCondtions')
    }



    const renderTermsCheckbox = () => {
        return (
            <TouchableOpacity
                style={styles.checkboxContainer}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcon
                onPress={toggleAcceptedTerms}
                    name={formValues.acceptedTerms ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={wp(8)}
                    color={COLORS[theme].textPrimary}
                />
                <TouchableOpacity onPress={() => handleNavigate()}>
                    <Text style={[styles.checkboxLabel, { color: COLORS[theme].textPrimary }]}>
                        I accept the <Text style={{ color: COLORS[theme].accent, textDecorationLine: 'underline' }}>Terms and Privacy Policy</Text>
                    </Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
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
        if (!Array.isArray(data)) data = [];
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
    const renderLabel = (label, isRequired = false) => (
        <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>
            {label}
            {isRequired && <Text style={{ color: 'red' }}> *</Text>}
        </Text>
    );
    const renderTextField = (label, value, onChangeText, error, secure = false, isRequired = true, numeric) => (
        <View style={styles.fieldContainer}>
            {renderLabel(label, isRequired)}
            {/* <Text>{numeric ? "num":"def"}</Text> */}
            <TextInput
                keyboardType={numeric ? 'number-pad' : 'default'} maxLength={label == 'Mobile Number' || label == 'Vehicle Number' ? 10 : label == 'Weight' ? 6 : label == 'Email ID' ? 50 : 25}
                placeholder={label}
                mode="outlined"
                value={value}
                secureTextEntry={secure}
                style={styles.input}
                onChangeText={onChangeText}
                outlineColor={error ? 'red' : COLORS[theme].textInputBorder}
                activeOutlineColor={COLORS[theme].textPrimary}
                textColor={COLORS[theme].textPrimary}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );

    const renderDropdownField = (label, value, onPress, error, isRequired = true) => (
        <View style={styles.fieldContainer}>
            {renderLabel(label, isRequired)}
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                <View style={[
                    styles.dropdown,
                    { borderColor: error ? 'red' : COLORS[theme].textPrimary },
                ]}>
                    <Text style={[
                        styles.dropdownText,
                        { color: value ? COLORS[theme].textPrimary : COLORS[theme].placeholder },
                    ]}>
                        {value || `Select ${label}`}
                    </Text>
                </View>
            </TouchableOpacity>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
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
            <View >
            <FlashMessage style={{zIndex:111111}} position="top" />
            </View>
            <HeaderBar showBackArrow={true} title="Register" />
            <ScrollView
                style={{ paddingHorizontal: wp(5), marginTop: wp(3) }}
                showsVerticalScrollIndicator={false}
            >
                {renderTextField('First Name', formValues.firstName, text => handleChange('firstName', text), errors.firstName, false, true)}
                {renderTextField('Last Name', formValues.lastName, text => handleChange('lastName', text), errors?.lastName)}
                {renderTextField('Location', formValues.location, text => handleChange('location', text), errors.location)}
                {renderTextField('Email ID', formValues.email, text => handleChange('email', text), errors.email)}
                {renderTextField('Referal Code', formValues.referal_code, text => handleChange('referal_code', text), errors?.referal_code, false, false)}
                <TouchableOpacity onPress={() => setVerifyModalVisible(true)} style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>{'Mobile Number'}</Text>
                    <TextInput
                        style={styles.input}
                        mode="outlined"
                        value={formValues.mobileNumber}
                        editable={false}
                        placeholder="Verify Mobile Number"
                        textColor={COLORS[theme].textPrimary}
                        right={<TextInput.Icon icon="chevron-right" color={COLORS[theme].textPrimary} />}
                    />
                </TouchableOpacity>

                {renderTextField('Password', formValues.password, text => handleChange('password', text), errors.password, true, true)}
                {renderTextField('Confirm Password', formValues.confirmPassword, text => handleChange('confirmPassword', text), errors.confirmPassword, true)}
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
                {renderTextField('Weight', formValues.weight, text => handleChange('weight', text), errors.weight, false, true, true)}
                {renderTextField('Vehicle Number', formValues.vehicle_no, text => handleChange('vehicle_no', text), errors.vehicle_no)}
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


                <View style={{ marginTop: hp(2) }}>
                    {renderTermsCheckbox()}
                    {errors.acceptedTerms && <Text style={styles.errorText}>{errors.acceptedTerms}</Text>}
                </View>

                <View style={{ marginTop: hp(3), marginBottom: hp(3) }}>
                    <TouchableOpacity
                        disabled={!formValues?.acceptedTerms}
                        onPress={handleSubmit}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: formValues?.acceptedTerms ? COLORS[theme].accent : COLORS[theme].accent + 60,
                            paddingVertical: hp(1.5),
                            borderRadius: 5,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={[poppins.medium.h4, { color: COLORS[theme].white }]}>
                            Register
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <VerifyPhoneModal
                visible={verifyModalVisible}
                onClose={() => setVerifyModalVisible(false)}
                onVerified={handlePhoneVerification}
            />
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
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: wp(6),
    },
    checkboxLabel: {
        fontSize: wp(4),
        marginLeft: wp(2),
    },
});

export default RegisterScreen;
