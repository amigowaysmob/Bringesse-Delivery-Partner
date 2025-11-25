import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Alert, Image,
  ActivityIndicator, TextInput, FlatList, Keyboard,
  KeyboardAvoidingView, TouchableWithoutFeedback, Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid } from 'react-native';
import { hp, wp } from '../../../resources/dimensions';
import { poppins } from '../../../resources/fonts';
import { COLORS } from '../../../resources/colors';
import { useTheme } from '../../../context/ThemeContext';
import { IMAGE_ASSETS } from '../../../resources/images';

// 🔑 Replace this with your own Google Maps API Key
const GOOGLE_API_KEY = 'AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc';

const SelectLocation = ({ visible, onDismiss, onConfirm, type }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const mapRef = useRef(null);
  const { theme } = useTheme();

  // 🔹 Request location permission
  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  // 🔹 Get current location
  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required.');
      setMapLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const region = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setLocation(region);
        getAddressFromCoords(latitude, longitude);
        setMapLoading(false);
      },
      (error) => {
        Alert.alert('Error', 'Failed to get current location');
        setMapLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // 🔹 Convert coords → address
  const getAddressFromCoords = async (latitude, longitude) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        const formattedAddress = data.results[0]?.formatted_address || 'Unknown location';
        setAddress(formattedAddress);
      } else {
        setAddress('Failed to fetch address');
      }
    } catch (error) {
      setAddress('Failed to fetch address');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Fetch autocomplete suggestions
  const fetchSuggestions = async (input) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchPlaceDetails = async (placeId) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
  
      if (data.status === 'OK') {
        const loc = data.result.geometry.location;
        const formattedAddress = data.result.formatted_address;
  
        const newRegion = {
          latitude: loc.lat,
          longitude: loc.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
  
        setLocation(newRegion); // update location state
        setAddress(formattedAddress);
        setSearchText(formattedAddress);
        setSuggestions([]);
        // Animate map to new location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 500); // 500ms animation
        }
        // Trigger address fetch asynchronously
        getAddressFromCoords(loc.lat, loc.lng);
  
        Keyboard.dismiss();
      } else {
        Alert.alert('Error', 'Failed to fetch place details');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch place details');
    }
  };
  
  // 🔹 Marker drag end
  const handleMarkerDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const newLoc = { ...location, latitude, longitude };
    setLocation(newLoc);
    getAddressFromCoords(latitude, longitude);
  };

  // 🔹 Confirm location
  const handleConfirm = () => {
    if (location) {
      onConfirm(location, address, type);
      onDismiss();
      setSearchText('');
      setSuggestions([]);
      setAddress('');
      setLocation(null);
    }
  };

  // 🔹 Handle text input
  const handleSearchChange = (text) => {
    setSearchText(text);
    fetchSuggestions(text);
  };

  useEffect(() => {
    if (visible) getCurrentLocation();
    else {
      setSearchText('');
      setSuggestions([]);
      setAddress('');
      setLocation(null);
      setMapLoading(true);
    }
  }, [visible]);

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <View style={[styles.modalContainer, { backgroundColor: COLORS[theme].background }]}>
              {/* 🔍 Search bar */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search location"
                  value={searchText}
                  onChangeText={handleSearchChange}
                  placeholderTextColor="#999"
                />
                {searchText.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchText('');
                      setSuggestions([]);
                      Keyboard.dismiss();
                    }}
                    style={styles.clearBtn}
                  >
                    <Text style={[styles.clearText, {
                      color: COLORS[theme].primary
                    }]}>×</Text>
                  </TouchableOpacity>
                )}
                {loadingSuggestions && <ActivityIndicator size="small" color="#666" />}
                {suggestions.length > 0 && (
                  <FlatList
                    keyboardShouldPersistTaps="handled"
                    data={suggestions}
                    keyExtractor={(item) => item.place_id}
                    style={styles.suggestionList}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => fetchPlaceDetails(item.place_id)}
                      >
                        <Text style={styles.suggestionText}>{item.description}</Text>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
              {/* 🗺 Map Section */}
              {mapLoading ? (
                <ActivityIndicator size="large" color={COLORS[theme].accent} style={styles.loader} />
              ) : (
                location && (
                  <>
                    <MapView
                      ref={mapRef}
                      style={styles.map}
                      // region={location}
                      initialRegion={location}
                      showsUserLocation
                      onRegionChangeComplete={(region) => setLocation(region)}
                      onMapReady={() => setMapLoading(false)} // helps hide loader only when map is ready
                      moveOnMarkerPress={false}  
                    >
                      <Marker
                        coordinate={{
                          latitude: location.latitude,
                          longitude: location.longitude,
                        }}
                        draggable
                        onDragEnd={handleMarkerDragEnd}
                      >
                        <Image
                          source={IMAGE_ASSETS.ic_pickup_marker}
                          style={styles.markerIcon}
                        />
                      </Marker>
                    </MapView>

                    <TouchableOpacity style={styles.submitButton} onPress={() => getAddressFromCoords(location.latitude, location.longitude)}>
                      <Text style={styles.submitText}>Get Address</Text>
                    </TouchableOpacity>

                    {address !== '' && (
                      <View style={styles.addressContainer}>
                        <Text numberOfLines={2} style={styles.addressText}>
                          {isLoading ? 'Loading address...' : address}
                        </Text>
                      </View>
                    )}

                    {/* ✅ Footer Buttons */}
                    <View style={styles.footer}>
                      <TouchableOpacity
                        style={[styles.confirmButton, { backgroundColor:"green" }]}
                        onPress={handleConfirm}
                      >
                        <Text style={styles.confirmText}>Confirm Location</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelButton} onPress={onDismiss}>
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};
// 🎨 Styles
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: wp(100),
    alignItems: 'center',
    height: hp(100),
  },
  searchContainer: {
    position: 'absolute',
    top: wp(6),
    width: '95%',
    zIndex: 20,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: wp(4),
    height: hp(6),
    paddingHorizontal: wp(4),
    fontSize: wp(4),
    color: '#000',
    borderWidth: 1,
    borderColor: '#ccc',
    width: '90%',
  },
  clearBtn: {
    position: 'absolute',
    right: wp(3),
  },
  clearText: {
    fontSize: wp(8),
  },
  suggestionList: {
    maxHeight: hp(40),
    backgroundColor: '#fff',
    marginTop: wp(2),
    borderRadius: 8,
  },
  suggestionItem: {
    padding: wp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    color: '#000',
    fontSize: wp(3.6),
  },
  map: {
    width: '100%',
    height: hp(60),
    marginTop: hp(9),
  },
  markerIcon: {
    width: wp(12),
    height: wp(12),
    resizeMode: 'contain',
  },
  submitButton: {
    backgroundColor: '#007BFF',
    padding: 14,
    marginTop: 10,
    borderRadius: 10,
    alignItems: 'center',
    width: '95%',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressContainer: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    width: '95%',
  },
  addressText: {
    fontSize: wp(3),
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
    marginTop: 15,
  },
  confirmButton: {
    padding: 15,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default SelectLocation;
