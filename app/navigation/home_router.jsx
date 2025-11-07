import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabBar from './bottom-tab/BottomTabBar';
import MoreScreen from '../screens/tabs/menuScreen';
import HomeScreen from '../screens/tabs/home-screen';
import Tsocial from '../screens/tabs/account/Tsocial';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Notification from '../screens/Notification';
import RevenueScreen from '../screens/RevenueScreen';
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
      {/* Conditionally show Booking, Notification, T-Social */}
        <>
          <Tab.Screen name={t('Booking')} component={TransportManagement} />
          <Tab.Screen
            name={t('T-Social')}
            component={OrdersScreen}
            // initialParams={{ currentUserId: profile?.id }}
          />
        </>
      <Tab.Screen name={t('Notification')} component={Notification} />
      <Tab.Screen name={t('More')} component={MoreScreen} />
    </Tab.Navigator>
  );
}
export default HomeTabRouter;
