import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon from './../assets/icons/AppIcon'; // Ensure this path is correct
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function NumberVerifier() {
  const [number, setNumber] = useState('');
  const [agree, setAgree] = useState(false);

  const handleNext = () => {
    if (agree) {
      console.log('Number:', number);
    } else {
      alert('You must agree to the terms and policies.');
    }
  };

  return (
    <LinearGradient colors={['#324141', '#1a1c1c']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.iconContainer}>
            <AppIcon />
          </View>
          <Text style={styles.title}>Digiletter</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your number"
            placeholderTextColor="#ccc"
            keyboardType="numeric"
            value={number}
            onChangeText={setNumber}
          />
          <View style={styles.checkboxContainer}>
            <TouchableOpacity onPress={() => setAgree(!agree)}>
              <MaterialCommunityIcons
                name={agree ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={agree ? 'white' : '#fff'}
              />
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>
              I agree to the terms and policies
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.button, !agree && styles.disabledButton]} // Apply disabled style
            onPress={handleNext}
            disabled={!agree} // Disable button if not agreed
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginBottom: 150,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: '#fff',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',             
    justifyContent: 'flex-start',     
    alignItems: 'center',             
    marginBottom: 20,
    marginRight: 135,              
  },
  checkboxLabel: {
    color: '#fff',
    marginLeft: 8,                   
  },
  button: {
    backgroundColor: '#1c7a76',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  disabledButton: {
    backgroundColor: '#7a7a7a', // Gray color when disabled
  },
});
