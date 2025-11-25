import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { poppins } from '../../resources/fonts';
import { hp, wp } from '../../resources/dimensions';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const AutoCloseMessageModal = ({
  visible,
  message = "",
  duration = 2000,
  onClose,
  backgroundColor = "#222",
  textColor = "#fff"
}) => {
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;

    // Animate progress from 0 to 1 over the duration
    Animated.timing(progress, {
      toValue: 1,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: false
    }).start();

    const timer = setTimeout(() => {
      onClose && onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '0%']  // Shrinks from full width to 0
  });

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={[styles.box, { backgroundColor }]}>
          <MaterialCommunityIcon 
            name="check-circle-outline" 
            size={wp(12)} 
            color={textColor} 
            style={{ marginBottom: hp(1) }} 
          />
          <Text style={[poppins.semi_bold.h7, { color: textColor, textAlign: 'center' }]}>
            {message}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressBackground}>
            <Animated.View
              style={[styles.progressBar, { backgroundColor: textColor, width: widthInterpolated }]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  box: {
    padding: wp(5),
    borderRadius: wp(2),
    minWidth: wp(60),
    alignItems: 'center',
    elevation: 8,
    width: wp(80),
    height: hp(20),
    justifyContent: 'center'
  },
  progressBackground: {
    height: hp(1.2),
    width: '80%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: hp(0.6),
    marginTop: hp(2),
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    borderRadius: hp(0.6)
  }
});

export default AutoCloseMessageModal;
