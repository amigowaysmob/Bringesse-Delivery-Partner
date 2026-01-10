import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Image, Linking,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import polyline from '@mapbox/polyline';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { wp, hp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { requestLocationPermission } from '../utils/utils';

const GOOGLE_MAPS_APIKEY = 'AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc';

const StoreLocation = ({ userstatus, close }) => {
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const siteDetails = useSelector(state => state.Auth?.siteDetails);
  const [currentLoc, setCurrentLoc] = useState(null); // Driver location
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const longitude = userstatus?.location?.coordinates?.[0];
  const latitude = userstatus?.location?.coordinates?.[1];
  const storeName = userstatus?.name;

  // -------- HANDLE CALL --------
  const handleCall = (number) => {
    if (!number) return;
    const url = `tel:${number}`;
    Linking.canOpenURL(url)
      .then(supported => supported && Linking.openURL(url))
      .catch(err => console.error('An error occurred', err));
  };

  // -------- GET DRIVER LOCATION --------
  const getLocationOnce = async () => {
    // Request permission first
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const loc = { latitude, longitude };
          setCurrentLoc(loc);
          resolve(loc);
        },
        (err) => {
          console.error('Location error:', err);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
      );
    });
  };

  // -------- FETCH ROUTE --------
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
      console.log('Route fetch error:', e);
    }
    return [];
  };

  // -------- INIT --------
  useEffect(() => {
    if (!latitude || !longitude) return;

    const init = async () => {
      try {
        const loc = await getLocationOnce();
        const route = await fetchRoute(loc, { latitude, longitude });
        setRouteCoordinates(route);
      } catch (err) {
        console.log('Init error:', err);
      }
    };

    init();
  }, [latitude, longitude]);

  // -------- FIT MAP TO DRIVER & STORE --------
  useEffect(() => {
    if (!mapRef.current || !currentLoc || !latitude || !longitude) return;

    mapRef.current.fitToCoordinates(
      [currentLoc, { latitude, longitude }],
      { edgePadding: { top: 80, bottom: 80, left: 80, right: 80 }, animated: true }
    );
  }, [routeCoordinates, currentLoc]);

  // -------- AUTO-FOLLOW DRIVER --------
  useEffect(() => {
    if (!mapRef.current || !currentLoc) return;

    mapRef.current.animateToRegion({
      latitude: currentLoc.latitude,
      longitude: currentLoc.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }, [currentLoc]);

  // -------- CONDITIONAL RENDER --------
  if (!userstatus) return null;

  if (!currentLoc) {
    return (
      <View style={[styles.card, styles.center, { backgroundColor: COLORS[theme].background }]}>
        <TouchableOpacity style={{ position: 'absolute', top: hp(2), right: wp(5) }} onPress={close}>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: wp(4) }}>
        <TouchableOpacity onPress={close}>
          <MaterialCommunityIcon name="chevron-left" size={wp(8)} color={COLORS[theme].textPrimary} />
        </TouchableOpacity>
        <View style={{ margin: wp(2) }}>
          <Text style={[poppins.medium.h7, { color: COLORS[theme].textPrimary }]}>
            {storeName}
          </Text>
          <Text style={[poppins.medium.h7, { color: COLORS[theme].textPrimary }]}>
            {userstatus?.contactNo}
          </Text>
        </View>
        <View style={{ position: 'absolute', right: wp(4) }}>
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
        showsCompass
        rotateEnabled
      >
        {/* DRIVER MARKER */}
        <Marker
          coordinate={currentLoc}
          title="Me"
          tracksViewChanges={false} // improves performance
        >
          <Image
            source={{
              uri:
                siteDetails?.media_url +
                'vehicles/' +
                profileDetails?.vechile_image?.image,
            }}
            style={styles.driverImage}
            resizeMode="contain"
          />
        </Marker>

        {/* STORE/PICKUP MARKER */}
        <Marker
          coordinate={{ latitude, longitude }}
          pinColor="green"
          title={storeName}
        />

        {/* ROUTE */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={COLORS[theme].accent}
            strokeWidth={wp(1.5)}
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
    height: hp(83),
    borderRadius: wp(1),
    borderWidth: wp(0.4),
    alignSelf: 'center',
    position: 'absolute',
    zIndex: 99,
    bottom: wp(0.1),
  },
  map: {
    width: '100%',
    height: '90%',
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
