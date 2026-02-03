import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { hp, wp } from '../resources/dimensions';
import { COLORS } from '../resources/colors';
import { poppins } from '../resources/fonts';
import { useTranslation } from 'react-i18next';

const InstructionModal = ({ visible, onClose }) => {

    const {t} = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* IMAGE */}
          <Image
            source={require('../assets/images/donotcancel.jpg')}
            style={styles.image}
            resizeMode="contain"
          />

          {/* TITLE */}
          <Text style={styles.title}>🚨 Don’t Cancel 🚨</Text>

          {/* CONTENT */}
          <View style={styles.content}>
            <Text style={styles.point}>🚫{t('if you Cancel frequently')} </Text>
            <Text style={styles.subPoint}>
             {t('Bringesse will reduce the number of ride you receive. ')}
            </Text>

            <Text style={styles.point}>🏍️ {t('if you cancel after receive Pickup')} </Text>
            <Text style={styles.subPoint}>
            {t('Your account & login will be blocked & restricted')}
            </Text>

            <Text style={styles.point}>💰 {t("Don't ask Extra payment from Customer")} </Text>
            {/* <Text style={styles.subPoint}>
             
            </Text> */}
          </View>

          {/* BUTTON */}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

export default InstructionModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: wp(85),
    backgroundColor: '#fff',
    borderRadius: wp(4),
    paddingBottom: hp(2),
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: hp(22),
  },
  title: {
    textAlign: 'center',
    fontFamily: poppins.semi_bold.fontFamily,
    fontSize: wp(5),
    color: '#000',
    marginVertical: hp(1.5),
  },
  content: {
    paddingHorizontal: wp(5),
  },
  point: {
    fontFamily: poppins.medium.fontFamily,
    fontSize: wp(4),
    color: '#000',
    marginTop: hp(1),
  },
  subPoint: {
    fontFamily: poppins.regular.fontFamily,
    fontSize: wp(3.6),
    color: '#444',
    marginTop: hp(0.3),
    lineHeight: wp(5),
  },
  button: {
    marginTop: hp(2),
    marginHorizontal: wp(5),
    backgroundColor: '#F7C600',
    paddingVertical: hp(1.4),
    borderRadius: wp(10),
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: poppins.semi_bold.fontFamily,
    fontSize: wp(4.2),
    color: '#000',
  },
});