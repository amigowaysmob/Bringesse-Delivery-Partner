import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator, ToastAndroid, Image, TouchableOpacity, Linking,
  Alert,
} from "react-native";
import { hp, wp } from "../resources/dimensions";
import { poppins } from "../resources/fonts";
import { COLORS } from "../resources/colors";
import { useTheme } from "../context/ThemeContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import HeaderBar from "../components/header";
import { useSelector } from "react-redux";
import { fetchData } from "../api/api";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker, Polyline } from "react-native-maps";
import Geolocation from "react-native-geolocation-service";
import polyline from "@mapbox/polyline";
import MaterialCommunityIcon from "react-native-vector-icons/MaterialCommunityIcons";
import BookingConfirmModal from "./BookingConfirmModal";
import BookingDetailsModal from "./BookingDetailsModal";
import ConfirmModal from "../components/header/ConfirmModal";
const GOOGLE_MAPS_APIKEY = "AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc";
const BookingAction = ({ route }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const profile = useSelector((state) => state.Auth.profile);
  const siteDetails = useSelector((state) => state.Auth.siteDetails);
  const { bid, data, uId } = route.params;
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(data);
  const [currentLoc, setCurrentLoc] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [confirmModalShow, setConfirmModal] = useState(false);
  const mapRef = useRef(null);
  // ---------------- GET CURRENT LOCATION ----------------
  const getLocationOnce = async () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCurrentLoc({ latitude, longitude });
          resolve({ latitude, longitude });
        },
        (err) => {
          console.log(err);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
      );
    });
  };

  // ---------------- UPDATE LOCATION ----------------
  const updateLocation = async () => {
    if (!profile?.driver_id || !currentLoc) return;
    try {
      const payload = {
        orderId: bookingDetails?.orderId?._id,
        driverId: profile.driver_id,
        lat: currentLoc.latitude,
        lon: currentLoc.longitude,
      };
      const res = await fetchData('update/order/location', 'POST', payload, null);
      console.log(res, "locationres")
      if (res?.status) {
        // ToastAndroid.show(res.message, ToastAndroid.SHORT);
      }
    } catch (err) {
      console.error('UPDATE booking error:', err);
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
    }
  };
  const handleComplete = async (nextStatus, otp) => {
    // Check empty OTP
    if (!otp || otp.trim() === "") {
      ToastAndroid.show("Please enter OTP", ToastAndroid.SHORT);
      return;
    }
    // Check OTP length
    if (otp.length !== 4) {
      ToastAndroid.show("OTP must be 4 digits", ToastAndroid.SHORT);
      return;
    }
    // Check numeric only
    if (!/^\d+$/.test(otp)) {
      ToastAndroid.show("OTP must contain only numbers", ToastAndroid.SHORT);
      return;
    }
    // Validate with backend/user stored OTP
    const actualOtp = bookingDetails?.userOtp?.toString();
    if (otp !== actualOtp) {
      ToastAndroid.show("Invalid OTP! Please try again", ToastAndroid.SHORT);
      return;
    }
    try {
      const payload = {
        orderId: bookingDetails?.orderId?._id,
        driverId: profile.driver_id,
        lat: currentLoc.latitude,
        lon: currentLoc.longitude,
        status: "complete",
      };
      const res = await fetchData("update/order", "POST", payload, null);
      console.log(res, "order?UPDATE");
      if (res?.status) {
        navigation?.goBack();
        ToastAndroid.show(res.message, ToastAndroid.SHORT);
      } else {
        ToastAndroid.show(res.message, ToastAndroid.SHORT);
      }
    } catch (err) {
      console.error("UPDATE booking error:", err);
      ToastAndroid.show("Something went wrong", ToastAndroid.SHORT);
    }
    finally{
    setConfirmModal(false);
    }
  };
  // ---------------- FETCH ROUTE ----------------
  const fetchRoute = async (origin, destination) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const json = await res.json();
      if (json.routes?.length) {
        const pts = polyline.decode(json.routes[0].overview_polyline.points);
        return pts.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
      }
    } catch (e) {
      console.log("route error", e);
    }
    return [];
  };
  // ---------------- INITIALIZE ----------------
  useEffect(() => {
    const init = async () => {
      try {
        const location = await getLocationOnce();
        setBookingDetails(data);
        const interval = setInterval(updateLocation, 10000);
        // Load route
        if (!bookingDetails?.deliveryAddress) return
        if (bookingDetails?.deliveryAddress?.address) {
          const d = bookingDetails.deliveryAddress.address;
          const route = await fetchRoute(location, { latitude: d.lat, longitude: d.lon });
          setRouteCoordinates(route);
        }
        return () => clearInterval(interval);
      } catch (err) {
        console.log("Location init error:", err);
      }
    };
    init();
  }, []);
  // ---------------- FIT MAP ----------------
  useEffect(() => {
    if (!mapRef.current || !currentLoc || !bookingDetails?.deliveryAddress?.address) return;
    const d = bookingDetails.deliveryAddress.address;
    mapRef.current.fitToCoordinates(
      [currentLoc, { latitude: d.lat, longitude: d.lon }],
      { edgePadding: { top: 80, bottom: 80, left: 80, right: 80 }, animated: true }
    );
  }, [routeCoordinates]);
  // ---------------- CALL ----------------
  const makeCall = (phoneNumber) => Linking.openURL(`tel:${phoneNumber}`);
  if (!currentLoc) {
    return (
      <View style={styles.center}>
        <HeaderBar title={t("Booking")} showBackArrow />
        <ActivityIndicator size="large" color={COLORS[theme].accent} />
        <Text style={{ alignSelf: "center" }}>Fetching location...</Text>
      </View>
    );
  }
  const delivery = bookingDetails.deliveryAddress.address;
  const customer = bookingDetails?.orderId?.userId;
  return (
    <GestureHandlerRootView style={{ flex: 1,backgroundColor:COLORS[theme].background }}>
      <HeaderBar title={t("Booking")} showBackArrow />
      {/* <Text>{JSON.stringify(bookingDetails?.orderId?._id)}</Text> */}
      {/* MAP */}
      {currentLoc && delivery &&
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentLoc.latitude,
            longitude: currentLoc.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          showsUserLocation
        >
          <Marker coordinate={currentLoc}>
            <Image
              source={{ uri: `${siteDetails?.media_url}drivers/images/${profile?.driver_image}` }}
              style={styles.driverImage}
            />
          </Marker>
          {delivery && (
            <Marker coordinate={{ latitude: delivery.lat, longitude: delivery.lon }} pinColor="green" title="Delivery Location" />
          )}
          {routeCoordinates && routeCoordinates.length > 0 && <Polyline coordinates={routeCoordinates} strokeColor="blue" strokeWidth={4} />}
        </MapView>
      }
      {/* BOTTOM CARD */}
      <View style={[styles.card, { backgroundColor: '#ccc' }]}>
        <View style={styles.rowSpace}>
          <Text style={[poppins.semi_bold.h6, styles.statusText]}>
            Booking {bookingDetails.status}
          </Text>
          <Text style={[poppins.semi_bold.h6, styles.statusText]}>#{uId}</Text>
        </View>
        <TouchableOpacity style={styles.viewDetailsBtn}
        //  onPress={() => setShowDetailsModal(true)}
        >
          <View>
            <Text style={[poppins.regular.h6, { color: COLORS[theme].accent }]}>{customer?.name}</Text>
            <Text style={[poppins.regular.h6, { color: COLORS[theme].accent }]}>{customer?.contactNo}</Text>
          </View>
          <MaterialCommunityIcon
            name="phone"
            onPress={() => makeCall(customer?.contactNo)}
            size={wp(10)}
            color={COLORS[theme].accent}
          />
        </TouchableOpacity>
        {bookingDetails.status !== "completed" && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS[theme].accent }]}
            onPress={() => setConfirmModal(true)}
          >
            <Text style={[poppins.semi_bold.h5, { color: "#fff" }]}>
              {bookingDetails.status === "accepted" ? "Start Pickup" : "Mark Completed"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {/* it wwill be used later */}
      <BookingConfirmModal
        visible={confirmModalShow}
        // status={bookingDetails.status}
        theme={theme}
        onConfirm={handleComplete}
        onClose={() => setConfirmModal(false)}
      />
      {/* <ConfirmModal
        visible={confirmModalShow}
        onCancel={() => setConfirmModal(false)}
        onConfirm={() => handleComplete()}
        // loading={acceptLoading}
        title="Confirm Accept"
        message={`Are you sure you want to complete the Order?`}
      /> */}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  map: { width: wp(100), height: hp(90) },
  driverImage: { width: wp(15), height: wp(15), borderRadius: wp(7.5), borderWidth: wp(0.5), borderColor: "#fff" },
  card: { position: "absolute", bottom: hp(1), left: wp(2), right: wp(2), padding: wp(4), borderRadius: wp(2), elevation: 3 },
  rowSpace: { flexDirection: "row", justifyContent: "space-between" },
  statusText: { color: "green", textTransform: "capitalize" },
  viewDetailsBtn: { paddingHorizontal: wp(5), paddingVertical: hp(1.2), borderWidth: 1, borderColor: "#999", borderRadius: wp(2), marginVertical: hp(1.5), flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  actionButton: { paddingVertical: hp(1.5), borderRadius: wp(2), alignItems: "center" },
  center: { flex: 1, },
});

export default BookingAction;
