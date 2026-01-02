
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import polyline from '@mapbox/polyline';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { wp, hp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
const GOOGLE_MAPS_APIKEY = 'AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc';

const StoreLocation = ({ userstatus, close }) => {
  const { theme } = useTheme();
  const mapRef = useRef(null);

// Inside your component
const handleCall = (number) => {
  if (!number) return;
  const url = `tel:${number}`;
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log("Can't handle phone number:", number);
      }
    })
    .catch((err) => console.error('An error occurred', err));
};


  const [currentLoc, setCurrentLoc] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // ✅ SAFELY DERIVE DATA
  const longitude = userstatus?.location?.coordinates?.[0];
  const latitude = userstatus?.location?.coordinates?.[1];
  const storeName = userstatus?.name;

  // -------- GET CURRENT LOCATION --------
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

  // -------- FETCH ROUTE --------
  const fetchRoute = async (origin, destination) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const json = await res.json();

      if (json.routes?.length) {
        const pts = polyline.decode(json.routes[0].overview_polyline.points);
        return pts.map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));
      }
    } catch (e) {
      console.log('Route fetch error:', e);
    }
    return [];
  };

  // -------- INIT --------
  useEffect(() => {
    if (!latitude || !longitude) return;
    // console.log("Fetching route to:", userstatus?.contactNo);
    const init = async () => {
      try {
        const loc = await getLocationOnce();
        const route = await fetchRoute(loc, {
          latitude,
          longitude,
        });
        setRouteCoordinates(route);
      } catch (err) {
        console.log('Init error:', err);
      }
    };

    init();
  }, [latitude, longitude]);

  // -------- FIT MAP --------
  useEffect(() => {
    if (!mapRef.current || !currentLoc || !latitude || !longitude) return;

    mapRef.current.fitToCoordinates(
      [currentLoc, { latitude, longitude }],
      {
        edgePadding: { top: 80, bottom: 80, left: 80, right: 80 },
        animated: true,
      }
    );
  }, [routeCoordinates, currentLoc]);

  // ✅ CONDITIONAL RENDER (NOT HOOKS)
  if (!userstatus) return null;
  if (!currentLoc) {
    return (
      <View style={[styles.card, styles.center, { backgroundColor: COLORS[theme].background }]}>
        <TouchableOpacity style={{
          position: 'absolute', top: hp(2), right: wp(5),
        }} onPress={close}>
          <MaterialCommunityIcon name="close" size={wp(8)} color={COLORS[theme].textPrimary} />
        </TouchableOpacity>
        <ActivityIndicator size="large" color={COLORS[theme].accent} />
        <Text style={{ color: COLORS[theme].textPrimary, marginTop: hp(2) }}>
          Fetching location...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: COLORS[theme].background }]}>
      <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: wp(4) }}>
        <TouchableOpacity onPress={close}>
          <MaterialCommunityIcon name="chevron-left" size={wp(8)} color={COLORS[theme].textPrimary} />
        </TouchableOpacity>
        <View style={{ margin: wp(2) }}>
          <Text
            style={[
              poppins.medium.h7,
              styles.storeName,
              { color: COLORS[theme].textPrimary },
            ]}
          >
            {storeName}
          </Text>
          <Text
            style={[
              poppins.medium.h7,
              { color: COLORS[theme].textPrimary },
            ]}
          >
            {userstatus?.contactNo}
          </Text>
        </View>
        <View style={{ position: "absolute", right: wp(4) }}>
          <TouchableOpacity onPress={() => handleCall(userstatus?.contactNo)}>
            <MaterialCommunityIcon name="phone" size={wp(7)} color={COLORS[theme].textPrimary} />
          </TouchableOpacity>
        </View>

      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: currentLoc.latitude,
          longitude: currentLoc.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        <Marker coordinate={currentLoc}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
            style={styles.driverImage}
          />
        </Marker>
        <Marker
          coordinate={{ latitude, longitude }}
          pinColor="green"
          title={storeName}
        />
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="red"
            strokeWidth={wp(1)}
          />
        )}
      </MapView>
    </View>
  );
};
export default StoreLocation;
const styles = StyleSheet.create({
  card: {
    width: wp(99),
    height: hp(86),
    borderRadius: wp(1),
    borderWidth: wp(0.4),
    alignSelf: 'center',
    position: "absolute",
    zIndex: 99, 
    bottom: wp(0.1),
    // borderColor: '#ccc',
  },
  map: {
    width: '100%',
    height: '90%',
  },
  closeText: {
    fontSize: wp(5),
    fontWeight: 'bold',
  },
  driverImage: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    borderWidth: 2,
    borderColor: '#fff',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});