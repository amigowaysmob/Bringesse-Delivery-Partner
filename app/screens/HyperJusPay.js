import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ToastAndroid,
  Platform,
  NativeModules,
  NativeEventEmitter,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HeaderBar from '../components/header';
import { COLORS } from '../resources/colors';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';

import HyperSDK from 'hyper-sdk-react'; // ✅ correct import (one only)

const HyperJusPay = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const showToast = (msg) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      console.log('Toast:', msg);
    }
  };

  /* ---------------------- 1️⃣ INITIATE JUSPAY SDK ---------------------- */
  const initiateJuspay = () => {
    const initPayload = {
      requestId: "init_" + Date.now(),
      service: "in.juspay.hyperpay",
      payload: {
        action: "initiate",
        clientId: "amigoways",
        merchantId: "amigoways",
        environment: "sandbox",
      },
    };
    // Alert.alert("test")
    console.log("Initiating JusPay SDK...");
    // HyperSDK.initiate(JSON.stringify(initPayload));

  };

  /* ---------------------- 2️⃣ EVENT LISTENER ---------------------- */
  useEffect(() => {
    // 🔥 IMPORTANT → Check module available
    const JUSPAY_MODULE = NativeModules.HyperSdkReact || NativeModules.HyperSDK;

    const eventEmitter = new NativeEventEmitter(JUSPAY_MODULE);

    // Start listener
    const eventListener = eventEmitter.addListener("HyperEvent", (resp) => {
      const data = JSON.parse(resp);
      const event = data.event || "";
      console.log("🔥 JusPay Event:", event, data);
      switch (event) {
        case "initiate_result":
          console.log("JusPay SDK Initiated Successfully");
          showToast("JusPay Initialized");
          break;

        case "hide_loader":
          console.log("Hide Loader Triggered");
          break;

        /* ----------- FINAL PAYMENT RESULT ------------ */
        case "process_result":
          const hasError = data.error || false;
          const payload = data.payload || {};
          const status = payload.status || ""; // charged, failed, aborted etc.
          console.log("📌 Final Process Result:", payload);
          if (!hasError) {
            showToast("Payment Success!");
          } else {
            switch (status) {
              case "backpressed":
                showToast("User cancelled the payment.");
                break;
              case "user_aborted":
                showToast("Payment Aborted.");
                break;
              case "pending_vbv":
              case "authorizing":
                showToast("Payment Pending...");
                break;
              default:
                showToast("Payment Failed.");
                break;
            }
          }
          break;

        default:
          console.log("Unhandled Event:", data);
          break;
      }
    });
    // Always call INITIATE before user pays
    initiateJuspay();
    return () => eventListener.remove();
  }, []);
  /* ---------------------- 3️⃣ PAYMENT PAYLOAD ---------------------- */
  const paymentPayload =
  {
    requestId: '658320e74dbc44fe907ae1cc2eee6695', service: 'in.juspay.hyperpay', payload: {
      clientId: 'amigoways', customerId: 'guest_user', orderId: 'order_1764313997196',
      returnUrl: 'https://yourdomain.com/payment-callback', currency: 'INR', customerPhone: '9999999999', service: 'in.juspay.hyperpay', environment: 'sandbox', merchantId: 'amigoways', amount: '1500', clientAuthTokenExpiry: '2025-11-28T07:28:17Z', clientAuthToken: 'tkn_d4670f4ac0b04b7988889d733dca1895', action: 'paymentPage', collectAvsInfo: false
    }, currTime: '2025-11-28T07:13:17Z', xRoutingId: ''
  }
  /* ---------------------- 4️⃣ START PAYMENT ---------------------- */
  const startPayment = () => {
    console.log("Starting Payment...", HyperSDK.process(JSON.stringify(paymentPayload))
    );
    HyperSDK.process(JSON.stringify(paymentPayload));
  };
  /* ---------------------- UI ---------------------- */
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('HyperJusPay')} showBackArrow />
      <View style={styles.container}>
        <Text style={[styles.title, { color: COLORS[theme].textPrimary }]}>
          JusPay HyperSDK Demo
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "green" }]}
        >
          <Text style={styles.buttonText}>Pay Now</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp(4),
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...poppins.semi_bold.h5,
    marginBottom: hp(3),
  },
  button: {
    backgroundColor: "#1A73E8",
    paddingVertical: hp(2),
    paddingHorizontal: wp(10),
    borderRadius: wp(3),
    marginVertical: hp(1.5),
  },
  buttonText: {
    ...poppins.semi_bold.h6,
    color: "#fff",
  },
});

export default HyperJusPay;

// Can i use this as an  hook 