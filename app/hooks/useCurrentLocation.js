import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { requestLocationPermission } from '../utils/utils';

const GOOGLE_MAPS_APIKEY = 'AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc'; // Replace with your API key

export default function useCurrentLocation() {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // ----------------------------------------
  // Request Permission
  // ----------------------------------------
  const requestPermission = async () => {
    return await requestLocationPermission();
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
    
    // Request permission first
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to show your position on the map.',
        [{ text: 'OK' }]
      );
      setLocationLoading(false);
      return;
    }

    // Get current position
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
        console.error('Location Error:', error);
        
        // Handle specific error codes
        let errorMessage = 'Failed to get location.';
        if (error.code === 1) {
          // PERMISSION_DENIED
          errorMessage = 'Location permission was denied. Please enable it in Settings.';
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE
          errorMessage = 'Location information is unavailable.';
        } else if (error.code === 3) {
          // TIMEOUT
          errorMessage = 'Location request timed out. Please try again.';
        }
        
        Alert.alert('Location Error', errorMessage);
        setLocationLoading(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 10000,
        forceRequestLocation: true,
        showLocationDialog: true,
      }
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
