/* eslint-disable react-native/no-inline-styles */
import React, { useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { hp, wp } from '../../resources/dimensions';
import { COLORS } from '../../resources/colors';
import { commonStyles } from '../../resources/styles';
const { width } = Dimensions.get('window');
/* 🧩 Dynamic tab icon mapping */
const getTabIcon = (routeName, isFocused, colorScheme) => {
  const iconColor = isFocused
    ? COLORS[colorScheme].white
    : COLORS[colorScheme].tabInActive;
  switch (routeName) {
    case 'Home':
      return <IonicIcon name="home" color={iconColor} size={wp(6)} />;
    case 'Booking':
      return (
        <MaterialCommunityIcon
          name="truck-delivery-outline"
          size={wp(6)}
          color={iconColor}
        />
      );
    case 'Notification':
      return (
        <IonicIcon
          name="notifications-outline"
          color={iconColor}
          size={wp(6)}
        />
      );
    case 'ExplorePackages':
      return <IonicIcon name="apps" color={iconColor} size={wp(6)} />;
    case 'OrdersScreen':
      return (
        <MaterialCommunityIcon
          name="cart-outline"
          size={wp(6)}
          color={iconColor}
        />
      );
    case 'More':
      return <MaterialIcon name="person" color={iconColor} size={wp(6)} />;
    default:
      return <IonicIcon name="home" color={iconColor} size={wp(6)} />;
  }
};

const BottomTabBar = ({ state, descriptors, navigation }) => {
  const { theme } = useTheme();
  const tabCount = state.routes.length;
  const TAB_WIDTH = width / tabCount;

  /* 🔄 Press scale animations (one per tab) */
  const scaleValues = useRef(
    state.routes.map(() => useSharedValue(1))
  ).current;

  return (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: COLORS[theme].background },
        commonStyles[theme].shadow,
      ]}
    >
      <View style={styles.tabs}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const animatedIconStyle = useAnimatedStyle(() => ({
            transform: [{ scale: scaleValues[index].value }],
          }));

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={1}
              onPressIn={() => {
                scaleValues[index].value = withTiming(0.85, {
                  duration: 120,
                });
              }}
              onPressOut={() => {
                scaleValues[index].value = withTiming(1, {
                  duration: 180,
                });
              }}
              onPress={onPress}
              style={[
                styles.tabButton,
                { width: TAB_WIDTH },
              ]}
            >
              <Animated.View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isFocused
                      ? COLORS[theme].accent
                      : 'transparent',
                    borderColor: isFocused
                      ? COLORS[theme].accent
                      : COLORS[theme].tabInActive,
                  },
                  animatedIconStyle,
                ]}
              >
                {getTabIcon(route.name, isFocused, theme)}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/* 🎨 Styles */
const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    height: wp(16),
    alignItems: 'center',
    borderTopWidth: wp(0.2),
    borderColor: '#CCC',
    overflow: 'hidden',
  },
  tabs: {
    flexDirection: 'row',
    width: wp(100),
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1),
  },
  iconCircle: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomTabBar;
