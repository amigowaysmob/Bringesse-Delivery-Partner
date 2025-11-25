/* eslint-disable react-native/no-inline-styles */
import React, { useEffect ,useRef} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,AppState
} from 'react-native';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { hp, wp } from '../../resources/dimensions';
import { COLORS } from '../../resources/colors';
import { commonStyles } from '../../resources/styles';
import usePendingCount from '../../hooks/userpendingCount';

const { width } = Dimensions.get('window');

// 🧩 Dynamic tab icon mapping
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
      return <IonicIcon name="notifications-outline" color={iconColor} size={wp(6)} />;
    case 'ExplorePackages':
      return <IonicIcon name="apps" color={iconColor} size={wp(6)} />;
    case 'T-Social':
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
      return <IonicIcon name="home" color={iconColor} size={wp(5)} />;
  }
};

const BottomTabBar = ({ state, descriptors, navigation }) => {

  const { theme } = useTheme();
  const tabCount = state.routes.length;
  const TAB_WIDTH = width / tabCount;
  // 🔄 Animate indicator (optional)
  const translateX = useSharedValue(0);
  useEffect(() => {
    translateX.value = withTiming(state.index * TAB_WIDTH, { duration: 300 });
  }, [state.index, TAB_WIDTH]);
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: TAB_WIDTH,
  }));
  const appState = useRef(AppState.currentState);
  // useEffect(() => {
  //   const subscription = AppState.addEventListener('change', nextAppState => {
  //     if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
  //       // App has come to foreground
  //       navigation.navigate('Home'); // <- Navigate to Home tab
  //     }
  //     appState.current = nextAppState;
  //   });
  //   return () => {
  //     subscription.remove();
  //   };
  // }, [navigation]);
  return (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: COLORS[theme].viewBackground },
        commonStyles[theme].shadow,
      ]}
    >
      <View style={styles.tabs}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
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

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.8}
              style={[
                styles.tabButton,
                {
                  width: TAB_WIDTH,
                },
              ]}
            >
              {/* Circle background for active tab */}
              <View
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
                ]}
              >
                {getTabIcon(route.name, isFocused, theme)}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// 🎨 Styles
const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    height: wp(16),
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: wp(0.2),
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
    // borderWidth: wp(0.3),
  },
});

export default BottomTabBar;
