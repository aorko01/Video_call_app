import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from './src/utils/axiosInstance';
import LoadingScreen from './src/screen/LoadingScreen'; // Import the LoadingScreen
import Register from './src/screen/Register';
import Number_verifier from './src/screen/Number_verifier';
import OTPVerification from './src/screen/Otpverification';
import Inbox from './src/screen/Inbox';
import Home from './src/screen/Home';

const Stack = createStackNavigator();

function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  const checkAccessToken = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) {
        const response = await axiosInstance.post('/user/isAccessTokenValid');
        if (response.data.valid) {
          setInitialRoute('Home');
          return;
        }
      }

      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        const refreshResponse = await axiosInstance.post('/user/refreshAccessToken', { refreshToken });
        if (refreshResponse.data.accessToken) {
          await AsyncStorage.setItem('accessToken', refreshResponse.data.accessToken);
          setInitialRoute('Home');
          return;
        }
      }

      setInitialRoute('NumberVerifier');
    } catch (error) {
      console.error('Error verifying tokens:', error.message);
      setInitialRoute('NumberVerifier');
    }
  };

  useEffect(() => {
    checkAccessToken();
  }, []);

  if (!initialRoute) {
    return <LoadingScreen />; // Show the loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Register" component={Register} options={{ title: 'Register' }} />
        <Stack.Screen name="NumberVerifier" component={Number_verifier} options={{ title: 'Verify Number' }} />
        <Stack.Screen name="OTPverification" component={OTPVerification} options={{ title: 'OTP' }} />
        <Stack.Screen name="Home" component={Home} options={{ title: 'Home' }} />
        <Stack.Screen name="Inbox" component={Inbox} options={{ title: 'Inbox' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
