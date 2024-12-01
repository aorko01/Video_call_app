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
    console.log("accessToken: " + accessToken)

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



// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NGFlYWYzNmFjM2JmNzczZGRiZjUwMyIsInVzZXJuYW1lIjoiYjIyMiIsImlhdCI6MTczMjk2MzA1OSwiZXhwIjoxNzM1NTU1MDU5fQ.zt21f_F_lpiEPQdljKXQRPIsLZh6IRqr58U5tokDfcU

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NGFlYTBhNmFjM2JmNzczZGRiZjRjZSIsInVzZXJuYW1lIjoibmlyam9uYSIsImlhdCI6MTczMjk2MjgyNiwiZXhwIjoxNzM1NTU0ODI2fQ.xwt59-hEE8v28_8vkg7MTRWfYN33-ZiVT5Pl170-Lr4