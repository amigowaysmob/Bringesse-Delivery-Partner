import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/splash-screen';
import LoginScreen from '../screens/login-screen';
import HomeTabRouter from './home_router';
import GetStartedScreen from '../screens/GetStartedScreen';
import PersonalInfoScreen from '../screens/tabs/Edit-profile/PersonalInfo';
import EditProfile from '../screens/tabs/Edit-profile/editProfile';
import RegisterScreen from '../screens/tabs/Edit-profile/RegisterScreen';
import WalletHistory from '../screens/WalletHistory';
import SubscriptionList from '../screens/SubscriptionList';
import UpdateProfilePic from '../screens/UpdateProfilePic';
import ChangePassword from '../screens/tabs/Edit-profile/ChangePassword';
import TermsandCondtions from '../screens/TermsandCondtions';
import BookingAction from '../screens/BookingAction';
import TransportManagement from '../screens/TransportManagement';
import BookingCompleted from '../screens/BookingCompleted';
import PaymentDocs from '../screens/tabs/Edit-profile/PaymentDocs';
import UploadDocuments from '../screens/UploadDocuments';
import { navigationRef } from './RootNavigation';
import RevenueScreen from '../screens/RevenueScreen';
import ForgetPassword from '../screens/tabs/Edit-profile/ForgetPassword';
import SubsciptionHistory from '../screens/SubsciptionHistory';
import PendingHistory from '../screens/PendingHistory';
import PendingOrdersHistory from '../screens/PendingOrdersHistory';
import BookingProductAction from '../screens/BookingProductAction';
import UploadDriverDocs from '../screens/UploadDriverDocs';
import ReferFriend from '../screens/ReferFriend';
import HyperJusPay from '../screens/HyperJusPay';
import QuickShare from '../screens/QuickShare';
import CustomerSupport from '../screens/CustomerSupport';
import uploadRegisterDocs from '../screens/uploadRegisterDocs';
import AccountManagement from '../screens/AccountManagement';
const Stack = createNativeStackNavigator();
const MyTheme = {
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: 'rgb(255, 45, 85)',
    background: 'rgb(0,0,0,0)',
    card: 'rgb(255, 255, 255)',
    text: 'rgb(244, 244, 244)',
    border: 'rgb(199, 199, 204)',
    notification: 'rgb(255, 69, 58)',
  },
};
function InitialRouter() {
  return (
    <NavigationContainer theme={MyTheme} ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="SplashScreen">
        <Stack.Screen name="splashscreen" component={SplashScreen} />
        <Stack.Screen name="login-screen" component={LoginScreen} />
        <Stack.Screen name="home-screen" component={HomeTabRouter} screenOptions={{
          animationEnabled: false,  // Disable animations for all screens
        }} />
        <Stack.Screen name="GetStartedScreen" component={GetStartedScreen} />
        <Stack.Screen name="PersonalInfoScreen" component={PersonalInfoScreen} />
        <Stack.Screen name="EditProfile" component={EditProfile}
        />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen name="WalletHistory" component={WalletHistory} />
        <Stack.Screen name="UpdateProfilePic" component={UpdateProfilePic} />
        <Stack.Screen name="SubscriptionList" component={SubscriptionList} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen name="TermsAndCondtions" component={TermsandCondtions} />
        <Stack.Screen name="BookingAction" component={BookingAction} />
        <Stack.Screen name="TransportManagement" component={TransportManagement} />
        <Stack.Screen name="BookingCompleted" component={BookingCompleted} />
        <Stack.Screen name="PaymentDocs" component={PaymentDocs} />
        <Stack.Screen name="UploadDocuments" component={UploadDocuments} />
        <Stack.Screen name="RevenueScreen" component={RevenueScreen} />
        <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
        <Stack.Screen name="SubsciptionHistory" component={SubsciptionHistory} />
        <Stack.Screen name="PendingHistory" component={PendingHistory} />
        <Stack.Screen name="PendingOrdersHistory" component={PendingOrdersHistory} />
        <Stack.Screen name="BookingProductAction" component={BookingProductAction} />
        <Stack.Screen name="UploadDriverDocs" component={UploadDriverDocs} />
        <Stack.Screen name="ReferFriend" component={ReferFriend} />
        <Stack.Screen name="HyperJusPay" component={HyperJusPay} />
        <Stack.Screen name="QuickShare" component={QuickShare} />
        <Stack.Screen name="CustomerSupport" component={CustomerSupport} />
        <Stack.Screen name="uploadRegisterDocs" component={uploadRegisterDocs} />
        <Stack.Screen name="AccountManagement" component={AccountManagement} />
        {/* AccountManagement */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default InitialRouter;
