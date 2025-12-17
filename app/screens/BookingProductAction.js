import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ToastAndroid,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { hp, wp } from "../resources/dimensions";
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

const GOOGLE_MAPS_APIKEY = "AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc";

const BookingAction = ({ route }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const profile = useSelector((state) => state.Auth.profile);
  const siteDetails = useSelector((state) => state.Auth.siteDetails);
  const { data, uId } = route.params;
  // -------------- Initialize Booking Details Safely ----------------
  const [bookingDetails, setBookingDetails] = useState({
    group: data?.group ?? "",
    orderStatus: data?.orderStatus ?? "",
    vehicleId: data?.vehicleId ?? "",
    deliveryAddress: {
      address: data?.deliveryAddress?.address ?? "",
      address_type: data?.deliveryAddress?.address_type ?? "",
      flat_no: data?.deliveryAddress?.flat_no ?? "",
      id: data?.deliveryAddress?.id ?? "",
      is_default: data?.deliveryAddress?.is_default ?? "false",
      lat: data?.deliveryAddress?.lat ?? null,
      lon: data?.deliveryAddress?.lon ?? data?.deliveryAddress?.lng ?? null,
      location: data?.deliveryAddress?.location ?? "",
      note: data?.deliveryAddress?.note ?? "",
    },
    otp: data?.otp?.toString() ?? "", // OTP as string
    store: {
      name: data?.store?.name ?? "",
      _id: data?.store?._id ?? "",
    },
    user: {
      name: data?.user?.name ?? "",
      contactNo: data?.user?.contactNo ?? "",
      _id: data?.user?._id ?? "",
    },
    total: data?.total ?? 0,
    createdAt: data?.createdAt ?? new Date().toISOString(),
    orderId: data?.orderId ?? "",
    status: data?.status ?? "",
    uniqueId: data?.uniqueId ?? "",
  });

  const [currentLoc, setCurrentLoc] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [confirmModalShow, setConfirmModal] = useState(false);
  const mapRef = useRef(null);

  // ---------------- GET CURRENT LOCATION ----------------
  const getLocationOnce = () =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const loc = { latitude, longitude };
          setCurrentLoc(loc);
          resolve(loc);
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
      );
    });

  // ---------------- UPDATE LOCATION ----------------
  const updateLocation = async () => {
    if (!currentLoc || !bookingDetails?.orderId) return;
    try {
      const payload = {
        orderId: bookingDetails.orderId,
        driverId: profile?.driver_id,
        lat: currentLoc.latitude,
        lon: currentLoc.longitude,
      };
      await fetchData("update/order/location", "POST", payload);
    } catch (err) {
      console.log("Location update failed", err);
    }
  };

  // ---------------- FETCH ROUTE ----------------
  const fetchRoute = async (origin, destination) => {
    if (!origin || !destination) return [];
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
      console.log("Route fetch error:", e);
    }
    return [];
  };

  // ---------------- INITIALIZE ----------------
  useEffect(() => {
    let interval;
    const init = async () => {
      try {
        const loc = await getLocationOnce();
        const d = bookingDetails?.deliveryAddress;

        if (d?.lat && d?.lon) {
          const dest = { latitude: d.lat, longitude: d.lon };
          const route = await fetchRoute(loc, dest);
          setRouteCoordinates(route);
        }

        interval = setInterval(updateLocation, 10000);
      } catch (err) {
        console.log("Init error:", err);
      }
    };
    init();
    return () => clearInterval(interval);
  }, []);

  // ---------------- FIT MAP ----------------
  useEffect(() => {
    const d = bookingDetails?.deliveryAddress;
    if (!mapRef.current || !currentLoc || !d?.lat || !d?.lon) return;

    mapRef.current.fitToCoordinates(
      [currentLoc, { latitude: d.lat, longitude: d.lon }],
      { edgePadding: { top: 80, bottom: 80, left: 80, right: 80 }, animated: true }
    );
  }, [routeCoordinates]);

  // ---------------- HANDLE ORDER COMPLETE ----------------
  const handleComplete = async (nextStatus, otp) => {
    // return
    const actualOtp = data?.userOtp?.toString() || "";
    if (!otp) return ToastAndroid.show("Please enter OTP", ToastAndroid.SHORT);
    if (otp.length !== 4) return ToastAndroid.show("OTP must be 4 digits", ToastAndroid.SHORT);
    if (!/^\d+$/.test(otp)) return ToastAndroid.show("OTP must be numbers only", ToastAndroid.SHORT);
    if (otp !== actualOtp) return ToastAndroid.show("Invalid OTP", ToastAndroid.SHORT);
    try {
      const payload = {
        orderIds: [bookingDetails.orderId], // wrap single orderId in array
        driverId: profile?.driver_id,
        lat: currentLoc.latitude,
        lon: currentLoc.longitude,
        status: "complete",
      };
      const res = await fetchData("update/order", "POST", payload);
      if (res?.status) {
        ToastAndroid.show(res.message, ToastAndroid.SHORT);
        navigation.goBack();
      } else {
        ToastAndroid.show(res.message, ToastAndroid.SHORT);
      }
    } catch (err) {
      ToastAndroid.show("Something went wrong", ToastAndroid.SHORT);
    } finally {
      setConfirmModal(false);
    }
  };
  // ---------------- PHONE CALL ----------------
  const makeCall = (phoneNumber) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`);
  };
  
  if (!currentLoc) {
    return (
      <View style={styles.center}>
        <HeaderBar title={t("Booking")} showBackArrow />
        <ActivityIndicator size="large" color={COLORS[theme].accent} />
        <Text style={{ alignSelf: "center", color: COLORS[theme].textPrimary }}>
          Fetching location...
        </Text>
      </View>
    );
  }

  const d = bookingDetails?.deliveryAddress;
  const customer = bookingDetails?.user;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t("Booking")} showBackArrow />

      {/* MAP */}
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
        {/* DRIVER MARKER */}
        <Marker coordinate={currentLoc}>
          <Image
            source={{
              uri: profile?.driver_image
                ? `${siteDetails?.media_url}drivers/images/${profile.driver_image}`
                : "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            }}
            style={styles.driverImage}
          />
        </Marker>

        {/* DELIVERY MARKER */}
        {d?.lat && d?.lon && (
          <Marker
            coordinate={{ latitude: d.lat, longitude: d.lon }}
            pinColor="green"
            title="Delivery Location"
          />
        )}

        {/* POLYLINE */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="red"
            strokeWidth={wp(1)}
          />
        )}
      </MapView>

      {/* BOTTOM CARD */}
      <View style={[styles.card, { backgroundColor: COLORS[theme].cardBackground }]}>
        <View style={styles.rowSpace}>
          <Text style={[styles.statusText, { color: COLORS[theme].textPrimary }]}>
            Booking {bookingDetails?.status}
          </Text>
          <Text style={[styles.statusText, { color: COLORS[theme].textPrimary }]}>#{bookingDetails?.uniqueId}</Text>
        </View>

        <TouchableOpacity style={styles.viewDetailsBtn}>
          <View>
            <Text style={[styles.customerText, { color: COLORS[theme].textPrimary }]}>
              {customer?.name ?? "Unknown"}
            </Text>
            <Text style={[styles.customerText, { color: COLORS[theme].textPrimary }]}>
              {customer?.contactNo ?? "N/A"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => makeCall(customer?.contactNo)} style={styles.whatsappBtn}>
            <MaterialCommunityIcon name="whatsapp" size={wp(10)} color="#25D366" />
          </TouchableOpacity>
        </TouchableOpacity>

        {bookingDetails?.status !== "completed" && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS[theme].accent }]}
            onPress={() => setConfirmModal(true)}
          >
            <Text style={{ color: "#fff" }}>
              {bookingDetails?.status === "accepted" ? "Start Pickup" : "Mark Completed"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <BookingConfirmModal
        theme={theme}
        visible={confirmModalShow}
        onConfirm={handleComplete}
        onClose={() => setConfirmModal(false)}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  map: { width: wp(100), height: hp(90) },
  driverImage: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(8),
    borderWidth: 2,
    borderColor: "#fff",
  },
  card: {
    position: "absolute",
    bottom: hp(1),
    left: wp(2),
    right: wp(2),
    padding: wp(4),
    borderRadius: wp(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  rowSpace: { flexDirection: "row", justifyContent: "space-between", marginBottom: hp(1) },
  statusText: { fontSize: wp(4), fontWeight: "bold" },
  viewDetailsBtn: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: wp(2),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerText: { fontSize: wp(4) },
  whatsappBtn: { justifyContent: "center", alignItems: "center" },
  actionButton: {
    marginTop: hp(1.5),
    paddingVertical: hp(1.5),
    borderRadius: wp(2),
    alignItems: "center",
  },
  center: { flex: 1 },
});

export default BookingAction;
