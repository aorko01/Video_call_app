import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon from './../assets/icons/AppIcon'; // Adjust the path if needed

const LoadingScreen = () => {
  return (
    <LinearGradient colors={['#1a2634', '#0f141c']} style={styles.container}>
      <View style={styles.iconContainer}>
        <AppIcon /> {/* Use the provided AppIcon */}
      </View>
      <ActivityIndicator size="large" color="#1c7a76" style={styles.loader} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20, // Add some spacing between the icon and the loader
  },
  loader: {
    marginTop: 20, // Ensures spacing around the ActivityIndicator
  },
});

export default LoadingScreen;
