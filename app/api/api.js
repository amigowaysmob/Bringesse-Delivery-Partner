export const fetchData = async (endpoint, method = 'GET', body = null, headers = {}) => {
  const DEV_BASE_URL = 'https://bringesse.in:4001/driver/';
  const LIVE_BASE_URL = 'https://bringesse.com:3001/driver/';

  const url = `${LIVE_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };
  const response = await fetch(url, {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : null,
  });
  // console?.log(response, "response")
  if (!response) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};
