import { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const GOOGLE_MAPS_APIKEY = 'AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc'; // Replace with your API key

export default function useCurrentLocation() {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // ----------------------------------------
  // Request Permission
  // ----------------------------------------
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS handles permissions automatically
  };

  // ----------------------------------------
  // Get Address from Coordinates
  // ----------------------------------------
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const json = await response.json();
      if (json.results && json.results.length > 0) {
        const formattedAddress = json.results[0].formatted_address;
        setAddress(formattedAddress);
      } else {
        setAddress('Address not found');
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setAddress('Error fetching address');
    }
  };

  // ----------------------------------------
  // Get Location
  // ----------------------------------------
  const getLocation = async () => {
    setLocationLoading(true);
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Location permission is required.');
      setLocationLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      pos => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setLocation(coords);

        // Fetch address from coordinates
        getAddressFromCoordinates(coords.latitude, coords.longitude);

        setLocationLoading(false);
      },
      error => {
        console.log('Location Error:', error);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  return {
    location,
    currLocation: location,
    address,
    locationLoading,
    refreshLocation: getLocation,
  };
}
