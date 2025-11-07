import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { wp, hp } from '../resources/dimensions';
import { useSelector } from 'react-redux';
import LottieView from 'lottie-react-native'; // ✅ import Lottie
import { IMAGE_ASSETS } from '../resources/images';

const UserawaitStatus = ({  userstatus }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const siteDetails = useSelector(state => state.Auth?.siteDetails);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  // If userstatus is true (active), hide this component
  if (userstatus) return null;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: COLORS[theme].background },
      ]}
    >
      {/* Lottie Animation */}
      <LottieView
        source={IMAGE_ASSETS?.loading} // ✅ your Lottie file
        autoPlay
        loop
        style={styles.lottie}
      />

      {/* Optional Text */}
      <Text
        style={[
          styles.waitText,
          { color: COLORS[theme].textPrimary },
        ]}
      >
        {'Your account is under review. Please wait...'}
      </Text>
    </View>
  );
};

export default UserawaitStatus;

const styles = StyleSheet.create({
  card: {
    // flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: wp(95),
    height: hp(45),
    borderRadius: wp(4), borderColor: '#ccc', borderWidth: wp(0.4)
  },
  lottie: {
    width: wp(75),
    height: wp(75),
  }, waitText: {
    marginTop: wp(4),
    fontSize: wp(3.5),
    fontWeight: '600',
  },
});
