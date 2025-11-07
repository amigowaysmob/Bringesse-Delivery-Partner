/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet,
  ScrollView, Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Text, ActivityIndicator,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { hp, wp } from '../../../resources/dimensions';
import { poppins } from '../../../resources/fonts';
import { COLORS } from '../../../resources/colors';
import { useTheme } from '../../../context/ThemeContext';
import HeaderBar from '../../../components/header';
import { useDispatch, useSelector } from 'react-redux';
import { fetchData } from '../../../api/api';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import VerifyPhoneModal from '../../VerifyPhoneModal';
import DeviceInfo from 'react-native-device-info';

const EditProfile = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const accessToken = useSelector(state => state.Auth.accessToken);
  const dispatch = useDispatch();
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    phoneNumber: '',
    password: '',
    location: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateFields = () => {
    const newErrors = {};
    if (!formValues.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!formValues.lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!formValues.email.trim()) newErrors.email = 'Email is required.';
    if (!formValues.password.trim()) newErrors.password = 'Password is required.';
    if (!formValues.location.trim()) newErrors.location = 'Location is required.';
    if (!formValues.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneVerification = (phone) => {
    // setVerifiedPhone(phone);
    setFormValues(prev => ({ ...prev, mobileNumber: phone }));
    showMessage({ message: 'Phone number verified.', type: 'success' });
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;
    if (!accessToken || !profileDetails?.driver_id) return;
    const payLoad = {
      driver_id: profileDetails?.driver_id,
      first_name: formValues?.firstName,
      last_name: formValues?.lastName,
      email: formValues?.email,
      phone_no: formValues?.mobileNumber,
    };
    try {
      setLoading(true);
      const data = await fetchData('updateprofile', 'PATCH', payLoad, {
        Authorization: `${accessToken}`,
        driver_id: profileDetails?.driver_id,
        device_id: await DeviceInfo.getUniqueId(),
      });

      if (data?.status === 'true') {
        showMessage({ message: data?.message, type: 'success' });
        dispatch({
          type: 'UPDATE_PROFILE',
          payload: data,
        });
        setTimeout(() => {
          navigation?.goBack();
          setLoading(false);
        }, 500);
      } else {
        showMessage({ message: data?.message, type: 'error' });
        setLoading(false);
      }
    } catch (error) {
      console.error('updateprofile API Error:', error);
      showMessage({ message: 'Failed to update profile.', type: 'error' });
      setLoading(false);
    } finally {
    }
  };

  useEffect(() => {
    console?.log(JSON.stringify(profileDetails, null, 2), 'profileDetails')
    if (profileDetails) {
      setFormValues({
        firstName: profileDetails?.first_name || '',
        lastName: profileDetails?.last_name || '',
        email: profileDetails?.email || '',
        mobileNumber: profileDetails?.phone_no || '',
        phoneNumber: profileDetails?.phone_no || '',
        password: '******',
        location: profileDetails?.location || '',
      });
    }
  }, [profileDetails]);

  const renderTextField = (label, value, field, secure = false) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>{label}</Text>
      <TextInput
        mode="outlined"
        value={value}
        style={styles.input}
        onChangeText={text => handleChange(field, text)}
        secureTextEntry={secure}
        outlineColor={errors[field] ? 'red' : COLORS[theme].textPrimary}
        activeOutlineColor={COLORS[theme].textPrimary}
        textColor={COLORS[theme].textPrimary}
      />
      {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
    </View>
  );
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: COLORS[theme].background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <HeaderBar showBackArrow title={t('Edit Profile')} />
      <FlashMessage position="top" />
      <ScrollView
        style={{ paddingHorizontal: wp(5), marginTop: wp(3) }}
        showsVerticalScrollIndicator={false}
      >
        {renderTextField('First Name', formValues.firstName, 'firstName')}
        {renderTextField('Last Name', formValues.lastName, 'lastName')}
        {renderTextField('Email ID', formValues.email, 'email')}
        <TouchableOpacity onPress={() => setVerifyModalVisible(true)} style={styles.fieldContainer}>
          <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            mode="outlined"
            value={formValues.mobileNumber}
            editable={false}
            placeholder="Verify Mobile Number"
            textColor={COLORS[theme].textPrimary}
            outlineColor={COLORS[theme].textPrimary}
            right={<TextInput.Icon icon="chevron-right" color={COLORS[theme].textPrimary} />}
          />
        </TouchableOpacity>
        {renderTextField('Location', formValues.location, 'location')}
        {/* {renderTextField('Password', formValues.password, 'password', true)} */}
        <TouchableOpacity onPress={() => navigation?.navigate('ChangePassword')} style={styles.fieldContainer}>
          <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>Password</Text>
          <TextInput
            style={[styles.input, {
              // alignItems:"center"
              // justifyContent:"center"
            }]}
            mode="outlined"
            value={"********"}
            editable={false}
            placeholder="Verify Mobile Number"
            outlineColor={COLORS[theme].textPrimary}
            textColor={COLORS[theme].textPrimary}
            right={<TextInput.Icon icon="chevron-right" color={COLORS[theme].textPrimary} />}
          />
        </TouchableOpacity>
        <View style={{ marginTop: hp(2), marginBottom: hp(3) }}>
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.8}
            style={[
              styles.saveButton,
              { backgroundColor: COLORS[theme].accent },
            ]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS[theme].white} />
            ) : (
              <Text style={[poppins.regular.h4, { color: COLORS[theme].white }]}>
                {t('save')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <VerifyPhoneModal
        visible={verifyModalVisible}
        onClose={() => setVerifyModalVisible(false)}
        onVerified={handlePhoneVerification}
      />
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fieldContainer: { marginBottom: hp(2), },
  label: {
    marginBottom: hp(0.8), fontSize: wp(3.8), fontWeight: '500',
  },
  input: {
    backgroundColor: 'transparent', height: hp(5.5),
    // borderColor:"red",borderWidth:wp(1)
  },
  errorText: {
    color: 'red',
    marginTop: hp(0.5), fontSize: wp(3.5),
  },
  saveButton: {
    paddingVertical: hp(1), borderRadius: 5, alignItems: 'center',
  },
});

export default EditProfile;
