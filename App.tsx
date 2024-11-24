import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Register from './src/screen/Register';
import Number_verifier from './src/screen/Number_verifier';
import OTPVerification from './src/screen/Otpverification';
import Home from './src/screen/Home';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home"
      screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Register"
          component={Register}
          options={{ title: 'Register' }}
        />
        <Stack.Screen
          name="NumberVerifier"
          component={Number_verifier}
          options={{ title: 'Verify Number' }}
        />
        <Stack.Screen
          name="OTPverification"
          component={OTPVerification}
          options={{ title: 'OTP' }}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ title: 'Home' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
