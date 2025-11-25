// components/ConfirmModal.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { wp } from '../../resources/dimensions';
import { poppins } from '../../resources/fonts';
import { useTheme } from '../../context/ThemeContext';
const ConfirmModal = ({ visible, onCancel, onConfirm, title, message, loading }) => {
  const { theme } = useTheme();
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: '#fff' }]}>
          {title && <Text style={[poppins.semi_bold.h6, { marginBottom: wp(2) }]}>{title}</Text>}
          {message && <Text style={[poppins.regular.h7, { marginBottom: wp(4) }]}>{message}</Text>}
          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#999' }]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={[poppins.semi_bold.h7, { color: '#fff' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#FF0000' }]}
              onPress={onConfirm}
              disabled={loading}
            >
              <Text style={[poppins.semi_bold.h7, { color: '#fff' }]}>
                {loading ? 'Processing...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: wp(80),
    padding: wp(5),
    borderRadius: wp(3),
    alignItems: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: wp(3),
    borderRadius: wp(2),
    alignItems: 'center',
    marginHorizontal: wp(1),
  },
});
export default ConfirmModal;