/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, TouchableOpacity,
  Text, ActivityIndicator, Alert,
} from 'react-native'; import { TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { hp, wp } from '../../../resources/dimensions';
import { poppins } from '../../../resources/fonts';
import { COLORS } from '../../../resources/colors';
import { useTheme } from '../../../context/ThemeContext';
import HeaderBar from '../../../components/header';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchData } from '../../../api/api';
// import DocumentPicker, {
//   DirectoryPickerResponse,
//   DocumentPickerResponse,
//   isCancel,
//   isInProgress,
//   types,
// } from 'react-native-document-picker'
const ForgetPassword = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [formValues, setFormValues] = useState({
    mobileNumber: '',    otp: '',    newPassword: '',    confirmPassword: '',  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: New Password
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const [vOtp, setvOtp] = useState(null);
  const [timer, setTimer] = useState(60);
  const timerRef = useRef(null);

  // Timer countdown for OTP
  useEffect(() => {
    if (step === 2) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  useEffect(() => {
    if (timer === 0 && step === 2) {
      showMessage({
        message: 'OTP expired. Please request again.',
        type: 'danger',
      });
      setStep(1);
      clearInterval(timerRef.current);
    }
  }, [timer]);

  const handleChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const toggleShowPassword = field => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Validation
  const validateMobile = () => {
    const newErrors = {};
    const mobileRegex = /^[0-9]{10}$/;
    if (!formValues.mobileNumber.trim())
      newErrors.mobileNumber = 'Mobile number is required.';
    else if (!mobileRegex.test(formValues.mobileNumber))
      newErrors.mobileNumber = 'Enter a valid 10-digit mobile number.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = () => {
    const newErrors = {};
    if (!formValues.otp.trim()) newErrors.otp = 'OTP is required.';
    else if (formValues.otp.length !== 4) newErrors.otp = 'OTP must be 4 digits.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswords = () => {
    const newErrors = {};
    if (!formValues.newPassword.trim())
      newErrors.newPassword = 'New password is required.';
    else if (formValues.newPassword.length < 6)
      newErrors.newPassword = 'Password must be at least 6 characters.';
    if (!formValues.confirmPassword.trim())
      newErrors.confirmPassword = 'Please confirm your password.';
    else if (formValues.newPassword !== formValues.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // API calls
  const sendOtp = async () => {
    if (!validateMobile()) return;
    setLoading(true);
    try {
      const data = await fetchData('sendotp', 'POST', {
        phone_number: formValues.mobileNumber,
      });
      if (data?.status) {
        showMessage({ message: 'OTP sent successfully.', type: 'success' });
        setvOtp(data?.otp);
        setStep(2);
        setTimer(60);
      } else {
        showMessage({
          message: data?.message || 'Failed to send OTP.',
          type: 'danger',
        });
      }
    } catch (err) {
      showMessage({ message: 'Something went wrong.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!validateOtp()) return;
    setLoading(true);
    try {
      if (formValues.otp == vOtp) {
        showMessage({ message: 'OTP verified successfully.', type: 'success' });
        setStep(3);
        clearInterval(timerRef.current);
      } else {
        showMessage({ message: 'Invalid OTP.', type: 'danger' });
      }
    } catch (error) {
      showMessage({ message: 'Verification failed.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const setNewPassword = async () => {
    if (!validatePasswords()) return;
    setLoading(true);
    try {
      const res = await fetchData('setnewpassword', 'POST', {
        phone_number: formValues.mobileNumber,
        new_password: formValues.newPassword,
      });
      if (res?.status == 'true' || res?.status === true) {
        showMessage({
          message:res?.message,
          type: 'success',
        });
        navigation.goBack();
      } else {
        showMessage({
          message: res?.message || 'Failed to change password.',
          type: 'danger',
        });
      }
    } catch (err) {
      showMessage({ message: 'Error updating password.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Alert.alert('tets')
    if (step === 1) sendOtp();
    else if (step === 2) verifyOtp();
    else if (step === 3) setNewPassword();
  };

  // Input Renderer
  const renderTextField = (
    label,
    value,
    field,
    secure = false,
    keyboardType = 'default',
    maxLength = 50,
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: COLORS[theme].textPrimary }]}>
        {label}
      </Text>
      <View style={styles.inputWrapper}>
        <TextInput
          mode="outlined"
          placeholder={label}
          value={value}
          style={[styles.input, { paddingRight: secure ? 40 : 10 }]}
          onChangeText={text => handleChange(field, text)}
          secureTextEntry={secure && !showPassword[field]}
          keyboardType={keyboardType}
          outlineColor={errors[field] ? 'red' : COLORS[theme].textPrimary}
          activeOutlineColor={COLORS[theme].textPrimary}
          textColor={COLORS[theme].textPrimary}
          placeholderTextColor={COLORS[theme].textPrimary}
          maxLength={maxLength}
        />
        {secure && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => toggleShowPassword(field)}
          >
            <Icon
              name={showPassword[field] ? 'eye-off' : 'eye'}
              size={22}
              color={COLORS[theme].textPrimary}
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: COLORS[theme].background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <HeaderBar showBackArrow title={t('Forget Password')} />
      <FlashMessage position="top" />
      <ScrollView
        style={{ paddingHorizontal: wp(5), marginTop: wp(3) }}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 &&
          renderTextField(
            'Mobile Number',
            formValues.mobileNumber,
            'mobileNumber',
            false,
            'number-pad',
            10,
          )}

        {step === 2 && (
          <>
            {renderTextField('Enter OTP', formValues.otp, 'otp', false, 'number-pad', 4)}
            <Text
              style={{
                color: COLORS[theme].textSecondary,
                marginBottom: hp(1),
                textAlign: 'center',
              }}
            >
              OTP expires in: {timer}s
            </Text>
          </>
        )}
        {step === 3 && (
          <>
            {renderTextField(
              'New Password',
              formValues.newPassword,
              'newPassword',
              true,
              'default',
              20,
            )}
            {renderTextField(
              'Confirm Password',
              formValues.confirmPassword,
              'confirmPassword',
              true,
              'default',
              20,
            )}
          </>
        )}

        <View style={{ marginTop: hp(2), marginBottom: hp(3) }}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: COLORS[theme].accent },
            ]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS[theme].white} />
            ) : (
              <Text style={[poppins.regular.h4, { color: COLORS[theme].white }]}>
                {step === 1
                  ? t('Get OTP')
                  : step === 2
                    ? t('Verify OTP')
                    : t('Set Password')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  fieldContainer: { marginBottom: hp(2) },
  label: {
    marginBottom: hp(0.8),
    fontSize: wp(3.8),
    fontWeight: '500',
  },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  iconButton: {
    position: 'absolute',
    right: 10,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  input: { backgroundColor: 'transparent', height: hp(5.5) },
  errorText: { color: 'red', marginTop: hp(0.5), fontSize: wp(3.5) },
  saveButton: {
    paddingVertical: hp(1.5),
    borderRadius: 5,
    alignItems: 'center',
  },
});

export default ForgetPassword;
