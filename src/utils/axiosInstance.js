
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: 'http://10.0.2.2:3000/api/v1',  // Replace with your backend API base URL
  timeout: 10000,  // Adjust as needed
});

// Add a request interceptor to include access token in headers
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get the access token from AsyncStorage
    const accessToken = await AsyncStorage.getItem('accessToken');

    // If access token is available, add it to headers
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
