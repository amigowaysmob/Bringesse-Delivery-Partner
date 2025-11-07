/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { hp, wp } from '../../resources/dimensions'; // Assuming this is a utility for width percentage
import { COLORS } from '../../resources/colors'; // Static color scheme
import { commonStyles } from '../../resources/styles'; // Assuming common styles
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext'; // Assuming theme context
import { IMAGE_ASSETS } from '../../resources/images';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
const { width } = Dimensions.get('window');
const TAB_WIDTH = width / 5; // Each tab has equal width

// Static tab labels and icons
const getTabIcon = (routeName, isFocused, colorScheme) => {
  const iconColor = isFocused
    ? COLORS[colorScheme].white
    : COLORS[colorScheme].tabInActive;

  switch (routeName) {
    case 'Home':
      return <IonicIcon name="home" color={iconColor} size={wp(6)} />;
    case 'Booking':
      return <MaterialCommunityIcon
        name="truck-delivery-outline"
        size={wp(6)}
        color={iconColor}
      />
    // <Image source={IMAGE_ASSETS?.moneybag} style={{width:wp(6),height:wp(6),tintColor:iconColor}} />;
    case 'Notification':
      return <IonicIcon name="notifications-outline" color={iconColor} size={wp(6)} />;
    case 'ExplorePackages':
      return <IonicIcon name="apps" color={iconColor} size={wp(6)} />;
    case 'T-Social':
      return <MaterialCommunityIcon
        name="cart-outline"
        size={wp(6)}
        color={iconColor}
      />
    // <Image source={IMAGE_ASSETS?.schedule} style={{ width: wp(6), height: wp(6), tintColor: iconColor }} />
    case 'More':
      return <MaterialIcon name="person" color={iconColor} size={wp(6)} />;
    default:
      return <IonicIcon name="home" color={iconColor} size={wp(5)} />;
  }
};

const BottomTabBar = ({ state, descriptors, navigation }) => {
  const { theme } = useTheme(); // Get the current theme

  const translateX = useSharedValue(0);

  // Animate tab indicator on tab change
  React.useEffect(() => {
    translateX.value = withTiming(state.index * TAB_WIDTH, { duration: 300 });
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: COLORS[theme].viewBackground },
        commonStyles[theme].shadow, // Assuming shadow is defined in commonStyles
      ]}
    >
      <View style={styles.tabs}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || route.name; // Get label

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

          const activeColor = isFocused
            ? COLORS[theme].tabActive
            : COLORS[theme].tabInActive;

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabButton,
                {
                  // borderTopWidth: isFocused ? wp(0.5) : 0,
                  borderColor: COLORS[theme].accent,
                  padding: wp(2),
                  backgroundColor: isFocused ? COLORS[theme].accent : COLORS[theme].background, borderRadius: wp(20), height: wp(10), alignSelf: "center", width: wp(10)
                },
              ]}
            >
              {getTabIcon(route.name, isFocused, theme)}
            </TouchableOpacity>
          );
        })}
      </View>
      {/* <Animated.View style={[styles.indicator, indicatorStyle]} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    height: wp(16),
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    // justifyContent: 'space-around',
    // alignItems: 'center',
    width: wp(100)
  },
  tabButton: {
    // alignItems: 'center',flex:1
    marginHorizontal: hp(2.2),
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: TAB_WIDTH - wp(4),
    marginHorizontal: wp(2),
    height: wp(0.5),
    borderBottomLeftRadius: wp(1),
    borderBottomRightRadius: wp(1),
  },
});

export default BottomTabBar;
