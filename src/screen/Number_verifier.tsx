import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon from './../assets/icons/AppIcon';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CountryPicker from 'react-native-country-picker-modal';
import axiosInstance from '../utils/axiosInstance';

export default function NumberVerifier({ navigation }) {
  const [number, setNumber] = useState('');
  const [agree, setAgree] = useState(false);
  const [countryCode, setCountryCode] = useState('IN');
  const [callingCode, setCallingCode] = useState('91');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onSelectCountry = (country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setCountryPickerVisible(false);
  };

  const handleNext = async () => {
    if (agree) {
      setIsLoading(true);
      try {
        const fullNumber = `+${callingCode}${number}`;
        const response = await axiosInstance.post('/user/checkMobileNumber', {
          mobileNumber: fullNumber,
        });
        
        if (!response.data.exists) {
          navigation.navigate('OTPverification', { mobileNumber: fullNumber });
        } else {
          alert('Number already registered');
        }
      } catch (error) {
        console.error('Error checking mobile number:', error.response?.data || error.message);
        
        // Show modal if there's an error
        setErrorMessage('Invalid mobile number, please try again.');
        setErrorModalVisible(true);
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('You must agree to the terms and policies.');
    }
  };

  const closeErrorModal = () => {
    setErrorModalVisible(false);
    setErrorMessage('');
  };

  return (
    <LinearGradient colors={['#324141', '#1a1c1c']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.iconContainer}>
            <AppIcon />
          </View>
          <Text style={styles.title}>Digiletter</Text>
          
          <View style={styles.phoneInputContainer}>
            <TouchableOpacity
              style={styles.countryPickerButton}
              onPress={() => setCountryPickerVisible(true)}
            >
              <CountryPicker
                withFilter
                withFlag
                withCallingCode
                withEmoji
                withCallingCodeButton
                countryCode={countryCode}
                onSelect={onSelectCountry}
                visible={countryPickerVisible}
                onClose={() => setCountryPickerVisible(false)}
                theme={{
                  backgroundColor: '#324141',
                  onBackgroundTextColor: '#FFFFFF',
                  fontSize: 16,
                  filterPlaceholderTextColor: '#CCCCCC',
                  activeOpacity: 0.7,
                }}
              />
            </TouchableOpacity>

            <TextInput
              style={styles.numberInput}
              placeholder="Enter your number"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={number}
              onChangeText={setNumber}
            />
          </View>

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
            style={[styles.button, !agree && styles.disabledButton]}
            onPress={handleNext}
            disabled={!agree || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Next</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={closeErrorModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={closeErrorModal}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  countryPickerButton: {
    height: 50,
    justifyContent: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginRight: 10,
    paddingHorizontal: 10,
  },
  numberInput: {
    flex: 1,
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: '#fff',
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
    backgroundColor: '#7a7a7a',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  modalText: {
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#1c7a76',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});
