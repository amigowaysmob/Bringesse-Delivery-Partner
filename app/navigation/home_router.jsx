import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomTabBar from './bottom-tab/BottomTabBar';
import MoreScreen from '../screens/tabs/menuScreen';
import HomeScreen from '../screens/tabs/home-screen';
import { useTranslation } from 'react-i18next';
import Notification from '../screens/Notification';
import OrdersScreen from '../screens/OrdersScreen';
import TransportManagement from '../screens/TransportManagement';
const Tab = createBottomTabNavigator();
function HomeTabRouter() {
  const { t } = useTranslation();

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
