import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { wp, hp } from '../resources/dimensions';
import { COLORS } from '../resources/colors';
import { poppins } from '../resources/fonts';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BookingDetailsModal = ({ visible, onClose, booking, theme }) => {
  if (!booking) return null;

  const {
    uniqueId,
    status,
    pickupAddress,
    dropAddress,
    customer,
    vehicleType,
    otp,
    totalDistance,
    estimatedFare,
    createdAt,
    vehicle,drop
  } = booking;

  const makeCall = (number) => {
    if (number) {
      Linking.openURL(`tel:${number}`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: COLORS[theme].viewBackground, borderWidth: 1, borderColor: COLORS[theme].textPrimary }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* <Text style={{color:"#000"}}>{JSON.stringify(booking?.vehicle?.name)}</Text> */}
            <Text style={[poppins.semi_bold.h5, { color: COLORS[theme].textPrimary, marginBottom: hp(2) }]}>
              <Icon name="clipboard-text-outline" size={wp(6)} color={COLORS[theme].textPrimary} /> Booking Details
            </Text>
            {customer?.phone && (
              <View style={styles.detailRow}>
                <View style={styles.iconText}>
                  <Icon name="phone" size={wp(5)} color={COLORS[theme].textPrimary} />
                  <Text style={[poppins.regular.h7, { marginLeft: wp(1.5), color: COLORS[theme].textPrimary }]}>
                    Phone:
                  </Text>
                </View>
                <View style={styles.callRow}>
                  <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary }]}>
                    {customer.phone}
                  </Text>
                  <TouchableOpacity onPress={() => makeCall(customer.phone)}>
                    <Icon name="phone-forward" size={wp(10)} color="#4CAF50" style={{ marginLeft: wp(3) }} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <DetailRow icon="identifier" label="Booking ID" value={uniqueId} theme={theme} />
            <DetailRow icon="check-circle-outline" label="Status" value={status} theme={theme} />
            <DetailRow icon="map-marker" label="Pickup Address" value={pickupAddress} theme={theme} />
            {
              drop && 
              <DetailRow icon="map-marker-distance" label="Drop Address" value={dropAddress} theme={theme} />
            }
            {
              customer?.name && 
            <DetailRow icon="account" label="Customer Name" value={customer?.name} theme={theme} />
            }
            <DetailRow icon="car" label="Vehicle Type" value={vehicle?.name} theme={theme} />
            {/* <DetailRow icon="lock" label="OTP" value={otp || 'N/A'} theme={theme} /> */}
            {/* <DetailRow icon="map-marker-path" label="Distance" value={`${totalDistance} km`} theme={theme} /> */}
            {/* <DetailRow icon="cash" label="Fare" value={`₹ ${estimatedFare}`} theme={theme} /> */}
            <DetailRow icon="calendar" label="Created At" value={new Date(createdAt).toLocaleString()} theme={theme} />
          </ScrollView>

          <TouchableOpacity style={[styles.closeButton, {
            backgroundColor: COLORS[theme].accent
          }]} onPress={onClose}>
            <Text style={[poppins.semi_bold.h6, { color: COLORS[theme].white }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const DetailRow = ({ icon, label, value, theme }) => (
  <View style={styles.detailRow}>
    <View style={styles.iconText}>
      <Icon name={icon} size={wp(5)} color={COLORS[theme].textPrimary} />
      <Text style={[poppins.regular.h7, { marginLeft: wp(1.5), color: COLORS[theme].textPrimary }]}>
        {label}:
      </Text>
    </View>
    <Text style={[poppins.semi_bold.h7, { color: COLORS[theme].textPrimary }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: wp(1),
  },
  modalContent: {
    borderRadius: wp(3),
    padding: wp(4),
    maxHeight: hp(80),
  },
  detailRow: {
    marginBottom: hp(1.8),
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    marginTop: hp(2),
    paddingVertical: hp(1.2),
    borderRadius: wp(2),
    alignItems: 'center',
  },
});

export default BookingDetailsModal;
