// api.js
// utils/api.js
import { useNavigation } from '@react-navigation/native';
import { Alert, Platform } from 'react-native';

export const fetchData = async (endpoint, method = 'GET', body = null, headers = {}) => {
  const baseUrl = 'https://bringesse.com:3001/driver/';
  const url = `${baseUrl}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };
  // console?.log(url,"url")
  const response = await fetch(url, {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : null,
  });
  console?.log(response, "response")
  if (!response) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};
