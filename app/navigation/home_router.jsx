import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabBar from './bottom-tab/BottomTabBar';
import MoreScreen from '../screens/tabs/menuScreen';
import HomeScreen from '../screens/tabs/home-screen';
import Tsocial from '../screens/tabs/account/Tsocial';
import { useTranslation } from 'react-i18next';
import Notification from '../screens/Notification';
import OrdersScreen from '../screens/OrdersScreen';
import TransportManagement from '../screens/TransportManagement';
import { useSelector } from 'react-redux';
import { Alert } from 'react-native';

const Tab = createBottomTabNavigator();
function HomeTabRouter() {
  const { t } = useTranslation();
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  useEffect(() => {
    // Alert.alert(JSON.stringify(profileDetails.partner_type.includes('Delivery')));
  }, []);

  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{
        unmountOnBlur: true,
        headerShown: false,
        animationEnabled: false,
      }}
    >
      <Tab.Screen name={t('Home')} component={HomeScreen} />
      {
        // profileDetails?.partner_type?.includes('Transport') &&
      <Tab.Screen name={t('Booking')} component={TransportManagement} />
      }
      {
        // profileDetails?.partner_type?.includes('Delivery') &&
        <Tab.Screen
          name={t('T-Social')}
          component={OrdersScreen}
        />
      }
      <Tab.Screen name={t('Notification')} component={Notification} />
      <Tab.Screen name={t('More')} component={MoreScreen} />
    </Tab.Navigator>
  );
}
export default HomeTabRouter;
