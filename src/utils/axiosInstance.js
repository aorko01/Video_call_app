import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Determine the baseURL depending on the platform

const baseURL = 'http://video_call_app.aorko.me/api/v1'
// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: baseURL,  // Use the dynamic baseURL
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
