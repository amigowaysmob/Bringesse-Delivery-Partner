import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { COLORS } from '../resources/colors';
import HeaderBar from '../components/header';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { fetchData } from '../api/api';
import { showMessage } from 'react-native-flash-message';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const AccountManagement = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const profile = useSelector(state => state.Auth?.profileDetails);
  const accessToken = useSelector(state => state.Auth?.accessToken);
  const siteDetails = useSelector(state => state.Auth?.siteDetails);

  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const onConfirmDeactivate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await fetchData(
        '/account/delete',
        'POST',
        {
          driverId: profile?.driver_id,
          status: 2,
        },
        {
          Authorization: `Bearer ${accessToken}`,
        }
      );
      if (data?.status === true || data?.status === 'true' || data?.status_code == 200) {
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'login-screen' }],
        });
        showMessage({
          message: 'Account Deleted Successfully',
          type: 'success',
        });
      } else {
        showMessage({
          message: data?.message || 'Failed to delete account',
          type: 'danger',
        });
      }
    } catch (error) {
      console.log('Error deleting account:', error);
      showMessage({
        message: 'Something went wrong',
        type: 'danger',
      });
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: COLORS[theme].background }}
    >
      <HeaderBar title={t('Delete Account')} showBackArrow />

      <View style={styles.container}>
        <View style={styles.card}>
          <MaterialCommunityIcon
            name="alert-remove-outline"
            style={[styles.icon, { color: COLORS[theme].accent }]}
          />

          <Text style={[styles.title, { color: COLORS[theme].textPrimary }]}>
            Delete Account
          </Text>

          <Text
            style={[
              styles.description,
              { color: COLORS[theme].textPrimary },
            ]}
          >
            {siteDetails?.account_delete}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowConfirm(true)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONFIRM MODAL */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => !loading && setShowConfirm(false)}
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: COLORS[theme].background },
            ]}
          >
            <MaterialCommunityIcon
              name="alert-remove-outline"
              style={[styles.modalIcon, { color: COLORS[theme].accent }]}
            />

            <Text
              style={[
                styles.modalTitle,
                { color: COLORS[theme].textPrimary },
              ]}
            >
              Confirm Delete Account
            </Text>

            <Text
              style={[poppins.regular.h7,
              styles.modalText,
              { color: COLORS[theme].textPrimary },
              ]}
            >
              {siteDetails?.delete_confirmation}
            </Text>
            {loading ? (
              <ActivityIndicator
                size="large"
                color={COLORS[theme].accent}
                style={{ marginTop: wp(4) }}
              />
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setShowConfirm(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.deactivateBtn]}
                  onPress={onConfirmDeactivate}
                >
                  <Text style={styles.deactivateText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  card: {
    width: wp(90),
    borderRadius: wp(4),
    padding: wp(6),
    alignItems: 'center',
  },
  icon: {
    fontSize: wp(15),
    marginBottom: wp(3),
  },
  title: {
    ...poppins.semi_bold.h6,
    marginBottom: wp(2),
  },
  description: {
    ...poppins.regular.h8,
    textAlign: 'center',
    marginBottom: wp(5),
  },
  button: {
    backgroundColor: '#ff0000',
    paddingVertical: wp(3),
    width: '100%',
    borderRadius: wp(2),
    alignItems: 'center',
  },
  buttonText: {
    ...poppins.semi_bold.h7,
    color: '#eeeeec',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: wp(95),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp(4),
    padding: wp(6),
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: wp(10),
    marginBottom: wp(2),
  },
  modalTitle: {
    ...poppins.semi_bold.h6,
    marginBottom: wp(2),
  },
  modalText: {
    marginBottom: wp(4),
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalBtn: {
    width: '48%',
    paddingVertical: wp(2.5),
    borderRadius: wp(2),
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#444',
  },
  deactivateBtn: {
    backgroundColor: '#E53935',
  },
  cancelText: {
    color: '#fff',
    fontWeight: '600',
  },
  deactivateText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default AccountManagement;
