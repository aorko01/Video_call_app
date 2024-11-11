import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Formik} from 'formik';
import * as Yup from 'yup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {launchImageLibrary} from 'react-native-image-picker';
import axiosInstance from '../utils/axiosInstance';

const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username too short')
    .max(50, 'Username too long')
    .required('Username is required'),
  firstName: Yup.string()
    .min(2, 'First name too short')
    .max(50, 'First name too long')
    .required('First name is required'),
  middleName: Yup.string()
    .max(50, 'Middle name too long'),
  lastName: Yup.string()
    .min(2, 'Last name too short')
    .max(50, 'Last name too long')
    .required('Last name is required'),
  dateOfBirth: Yup.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .required('Date of birth is required'),
  gender: Yup.string()
    .oneOf(['male', 'female', 'other'], 'Please select a valid gender')
    .required('Gender is required'),
});

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function RegisterScreen({route, navigation}) {
  const {mobileNumber} = route.params;
  console.log('Mobile number in register:', mobileNumber);
  const [profilePicture, setProfilePicture] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleRegister = async (values, {setSubmitting, setErrors}) => {
    try {
      const formData = new FormData();
      
      // Append all text fields
      formData.append('username', values.username);
      formData.append('firstName', values.firstName);
      formData.append('middleName', values.middleName || '');
      formData.append('lastName', values.lastName);
      formData.append('dateOfBirth', values.dateOfBirth.toISOString());
      formData.append('gender', values.gender);
      formData.append('mobileNumber', mobileNumber);

      // Append profile picture if exists
      if (profilePicture) {
        const filename = profilePicture.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';
        
        formData.append('profilePicture', {
          uri: Platform.OS === 'android' ? profilePicture : profilePicture.replace('file://', ''),
          name: filename,
          type,
        });
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const response = await axiosInstance.post('/user/register', formData, config);
      
      if (response.data.success) {
        try {
          // Save tokens to AsyncStorage
          await Promise.all([
            AsyncStorage.setItem('accessToken', response.data.accessToken),
            AsyncStorage.setItem('refreshToken', response.data.refreshToken),
            AsyncStorage.setItem('user', JSON.stringify(response.data.user))
          ]);
          
          // Update axios instance with new access token
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;

          
          // Navigate to Home screen
          navigation.replace('Home');
        } catch (storageError) {
          console.error('Error saving to AsyncStorage:', storageError);
          alert('Error saving login information. Please try again.');
        }
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.param] = err.msg;
        });
        setErrors(backendErrors);
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Registration failed. Please try again.');
      }
      console.error('Registration error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openImagePicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.5,
        includeBase64: false,
      },
      response => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          console.log('ImagePicker Error: ', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          setProfilePicture(response.assets[0].uri);
        }
      },
    );
  };

  return (
    <LinearGradient colors={['#324141', '#1a1c1c']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Create Account</Text>
          <Formik
            initialValues={{
              username: '',
              firstName: '',
              middleName: '',
              lastName: '',
              dateOfBirth: new Date(2000, 0, 1),
              gender: '',
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleRegister}>
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              setFieldValue,
              isSubmitting,
            }) => (
              <View style={styles.form}>
                <TouchableOpacity
                  style={styles.profilePictureContainer}
                  onPress={openImagePicker}>
                  {profilePicture ? (
                    <Image
                      source={{uri: profilePicture}}
                      style={styles.profilePicture}
                    />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <MaterialCommunityIcons
                        name="camera-plus"
                        color="#fff"
                        size={40}
                      />
                      <Text style={styles.uploadText}>Upload Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a unique username"
                    placeholderTextColor="#666"
                    onChangeText={handleChange('username')}
                    onBlur={handleBlur('username')}
                    value={values.username}
                    autoCapitalize="none"
                  />
                  {touched.username && errors.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your first name"
                    placeholderTextColor="#666"
                    onChangeText={handleChange('firstName')}
                    onBlur={handleBlur('firstName')}
                    value={values.firstName}
                    autoCapitalize="words"
                  />
                  {touched.firstName && errors.firstName && (
                    <Text style={styles.errorText}>{errors.firstName}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Middle Name (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your middle name"
                    placeholderTextColor="#666"
                    onChangeText={handleChange('middleName')}
                    onBlur={handleBlur('middleName')}
                    value={values.middleName}
                    autoCapitalize="words"
                  />
                  {touched.middleName && errors.middleName && (
                    <Text style={styles.errorText}>{errors.middleName}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your last name"
                    placeholderTextColor="#666"
                    onChangeText={handleChange('lastName')}
                    onBlur={handleBlur('lastName')}
                    value={values.lastName}
                    autoCapitalize="words"
                  />
                  {touched.lastName && errors.lastName && (
                    <Text style={styles.errorText}>{errors.lastName}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date of Birth</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.dateText}>
                      {formatDate(values.dateOfBirth)}
                    </Text>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={24}
                      color="#ccc"
                    />
                  </TouchableOpacity>
                  {touched.dateOfBirth && errors.dateOfBirth && (
                    <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
                  )}
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={values.dateOfBirth}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setFieldValue('dateOfBirth', selectedDate);
                      }
                    }}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                  />
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.genderContainer}>
                    {['male', 'female', 'other'].map((gender) => (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.genderButton,
                          values.gender === gender && styles.genderButtonSelected,
                        ]}
                        onPress={() => setFieldValue('gender', gender)}>
                        <Text
                          style={[
                            styles.genderButtonText,
                            values.gender === gender && styles.genderButtonTextSelected,
                          ]}>
                          {gender.charAt(0).toUpperCase() + gender.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {touched.gender && errors.gender && (
                    <Text style={styles.errorText}>{errors.gender}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}>
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Registering...' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
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
    flexGrow: 1,
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  form: {
    width: '100%',
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#1c7a76',
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  uploadText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    fontSize: 16,
  },
  datePickerButton: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 5,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  genderButtonSelected: {
    backgroundColor: '#1c7a76',
    borderColor: '#1c7a76',
  },
  genderButtonText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#1c7a76',
    borderRadius: 8,
    paddingVertical: 15,
    marginTop: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#164744',
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});