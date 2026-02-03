import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal,
  StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { COLORS } from '../resources/colors';
import { hp, wp } from '../resources/dimensions';
import { useTheme } from '../context/ThemeContext';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { fetchData } from '../api/api';
import { useSelector } from 'react-redux';

const VerifyPhoneModal = ({ visible, onClose, onVerified }) => {
  const { theme } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Phone Input, 2: OTP Input
  const [loading, setLoading] = useState(false);
  const [vOtp, setvOtp] = useState(null);
  const [timer, setTimer] = useState(60);
  const timerRef = useRef(null);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  // Handle timer countdown
  useEffect(() => {
    if (step === 2 && visible) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [step, visible]);

  // Handle timeout
  useEffect(() => {
    if (timer === 0) {
      showMessage({
        message: 'OTP expired. Please try again.',
        type: 'danger',
      });
      closeModal();
    }
  }, [timer]);

  const sendOtp = async () => {
    // onVerified(phoneNumber);
    // closeModal();
    if (!phoneNumber.trim()) {
      showMessage({ message: 'Phone number is required.', type: 'danger' });
      return;
    }
    try {
      setLoading(true);
      const data = await fetchData('sendotp', 'POST', {
        phone_number: phoneNumber,
      }, null);
      setvOtp(data?.otp);
      if (data.status) {
        showMessage({ message: 'OTP sent successfully.', type: 'success' });
        setStep(2);
        setTimer(60); // Start 60 second timer
      } else {
        showMessage({ message: data.message || 'Failed to send OTP.', type: 'danger' });
      }
    } catch (error) {
      showMessage({ message: 'Something went wrong.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };
  const verifyOtp = () => {
    if (!otp.trim()) {
      showMessage({ message: 'Enter OTP to proceed.', type: 'danger' });
      return;
    }
    // onVerified(phoneNumber);
    // closeModal();
    if (otp == vOtp) {
      onVerified(phoneNumber);
      closeModal();
    } else {
      showMessage({ message: 'Invalid OTP.', type: 'danger' });
    }
  };

  const closeModal = () => {
    setStep(1);
    setPhoneNumber('');
    setOtp('');
    setvOtp(null);
    setTimer(60);
    clearInterval(timerRef.current);
    onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="none">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <FlashMessage position="top" />
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.modalContainer, { backgroundColor: COLORS[theme].background }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }} />
              <Text style={[styles.headerTitle, { color: COLORS[theme].textPrimary }]}>
                {step === 1 ? 'Enter Phone Number' : 'Verify OTP'}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Text style={[styles.closeText, { color: COLORS[theme].textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            {step === 1 ? (
              <TextInput
                placeholder="Phone Number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={[styles.input, {
                  borderColor: COLORS[theme].textPrimary,
                  color: COLORS[theme].textPrimary
                }]}
                placeholderTextColor={COLORS[theme].textPrimary}
                maxLength={10}
              />
            ) : (
              <>
                <TextInput
                  placeholder="Enter OTP"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  style={[styles.input, {
                    borderColor: COLORS[theme].primary,
                    color: COLORS[theme].textPrimary
                  }]}
                  placeholderTextColor={COLORS[theme].primary}
                  maxLength={4}
                />
                <Text style={{ color: COLORS[theme].textSecondary, marginBottom: hp(1), textAlign: 'center' }}>
                  OTP expires in: {timer}s
                </Text>
              </>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: COLORS[theme].accent }]}
              onPress={step === 1 ? sendOtp : verifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{step === 1 ? 'Send OTP' : 'Verify'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default VerifyPhoneModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  modalContainer: {
    width: wp(90),
    padding: wp(5),
    borderRadius: 10,
    elevation: 5,
    borderWidth: wp(0.5),
    borderColor: '#ccc',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    marginBottom: hp(2),
    justifyContent: "space-around",
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: wp(4.5),
  },
  closeButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  closeText: {
    fontSize: wp(4),
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: wp(1),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    marginBottom: hp(2),
    fontSize: wp(4),
  },
  button: {
    paddingVertical: hp(1.2),
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: wp(4),
    fontWeight: '500',
  },
});
