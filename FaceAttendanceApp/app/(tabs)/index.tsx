import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Animated,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';

const API_URL = 'http://192.168.100.85:8000';
const { width } = Dimensions.get('window');

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [facing, setFacing] = useState<CameraType>('front');
  const [activeTab, setActiveTab] = useState<'register' | 'attendance'>('register');
  const [employeeName, setEmployeeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  
  // Sophisticated animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const buttonPressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.spring(inputFocusAnim, {
      toValue: focusedInput ? 1 : 0,
      tension: 50,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, [focusedInput]);

  const animateButtonPress = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(buttonPressAnim, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonPressAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        
        if (photo) {
          setCameraVisible(false);
          
          if (activeTab === 'register') {
            await registerEmployee(photo.uri);
          } else {
            await markAttendance(photo.uri);
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
        console.error(error);
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        if (activeTab === 'register') {
          await registerEmployee(result.assets[0].uri);
        } else {
          await markAttendance(result.assets[0].uri);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error(error);
    }
  };

  const registerEmployee = async (imageUri: string) => {
    if (!employeeName.trim()) {
      Alert.alert('Name Required', 'Please enter the employee name to continue.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', employeeName);
      
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', data.message);
        setEmployeeName('');
      } else {
        Alert.alert('Registration Failed', data.message);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to reach the server. Please check your connection.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (imageUri: string) => {
    setLoading(true);

    try {
      const formData = new FormData();
      
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await fetch(`${API_URL}/api/mark-attendance`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Attendance Marked', data.message);
      } else {
        Alert.alert('Recognition Failed', data.message);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to reach the server. Please check your connection.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(isDark);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.centerContent, { opacity: fadeAnim }]}>
          <View style={styles.permissionIcon}>
            <Text style={styles.permissionIconText}>📷</Text>
          </View>
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionMessage}>
            Attendify uses your camera to capture and recognize faces for attendance tracking.
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton} 
            onPress={requestPermission}
            activeOpacity={0.8}>
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  if (cameraVisible) {
    return (
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCameraVisible(false)}
                activeOpacity={0.7}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.cameraGuide}>
              <View style={styles.faceBorder} />
              <Text style={styles.cameraInstruction}>Position your face</Text>
            </View>
            
            <View style={styles.cameraFooter}>
              <View style={styles.captureButtonContainer}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                  activeOpacity={0.9}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Attendify</Text>
          <Text style={styles.tagline}>Secure face recognition attendance</Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeContainer}>
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, activeTab === 'register' && styles.modeButtonActive]}
              onPress={() => setActiveTab('register')}
              activeOpacity={1}>
              <Text style={[styles.modeButtonText, activeTab === 'register' && styles.modeButtonTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, activeTab === 'attendance' && styles.modeButtonActive]}
              onPress={() => setActiveTab('attendance')}
              activeOpacity={1}>
              <Text style={[styles.modeButtonText, activeTab === 'attendance' && styles.modeButtonTextActive]}>
                Check In
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          
          {/* Registration Form */}
          {activeTab === 'register' && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>New Employee</Text>
              <Text style={styles.sectionDescription}>
                Enter the employee's name and capture their photo
              </Text>
              
              <Animated.View 
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: inputFocusAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [isDark ? '#38383A' : '#E5E5EA', isDark ? '#FFFFFF' : '#000000']
                    }),
                  }
                ]}>
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
                  value={employeeName}
                  onChangeText={setEmployeeName}
                  onFocus={() => setFocusedInput(true)}
                  onBlur={() => setFocusedInput(false)}
                  autoCapitalize="words"
                  returnKeyType="done"
                />
              </Animated.View>
            </View>
          )}

          {/* Check In Section */}
          {activeTab === 'attendance' && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Check In</Text>
              <Text style={styles.sectionDescription}>
                Take a photo to mark your attendance
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Animated.View style={{ transform: [{ scale: buttonPressAnim }] }}>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => animateButtonPress(() => setCameraVisible(true))}
                disabled={loading}
                activeOpacity={0.85}>
                <Text style={styles.primaryActionText}>Take Photo</Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={pickImage}
              disabled={loading}
              activeOpacity={0.7}>
              <Text style={styles.secondaryActionText}>Choose from Library</Text>
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingCard}>
                <ActivityIndicator 
                  size="large" 
                  color={isDark ? '#FFFFFF' : '#000000'} 
                />
                <Text style={styles.loadingText}>Processing</Text>
              </View>
            </View>
          )}
        </View>

      </Animated.View>
    </ScrollView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000000' : '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  
  // Header Styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 60,
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: isDark ? '#FFFFFF' : '#000000',
    letterSpacing: -1.2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: isDark ? '#8E8E93' : '#636366',
    letterSpacing: -0.2,
  },

  // Mode Selector
  modeContainer: {
    paddingHorizontal: 32,
    marginBottom: 40,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    borderRadius: 14,
    padding: 3,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 11,
  },
  modeButtonActive: {
    backgroundColor: isDark ? '#FFFFFF' : '#000000',
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: isDark ? '#8E8E93' : '#636366',
    letterSpacing: -0.3,
  },
  modeButtonTextActive: {
    color: isDark ? '#000000' : '#FFFFFF',
  },

  // Content Area
  contentArea: {
    paddingHorizontal: 32,
  },
  formSection: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: isDark ? '#FFFFFF' : '#000000',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: isDark ? '#8E8E93' : '#636366',
    lineHeight: 22,
    marginBottom: 24,
    letterSpacing: -0.2,
  },

  // Input Styles
  inputWrapper: {
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
  },
  input: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 17,
    fontWeight: '400',
    color: isDark ? '#FFFFFF' : '#000000',
    letterSpacing: -0.3,
  },

  // Action Buttons
  actionSection: {
    gap: 12,
  },
  primaryAction: {
    backgroundColor: isDark ? '#FFFFFF' : '#000000',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: isDark ? '#FFFFFF' : '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.15 : 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryActionText: {
    color: isDark ? '#000000' : '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
  },
  secondaryActionText: {
    color: isDark ? '#FFFFFF' : '#000000',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },

  // Loading State
  loadingOverlay: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    paddingVertical: 32,
    paddingHorizontal: 48,
    borderRadius: 20,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: isDark ? '#8E8E93' : '#636366',
    letterSpacing: -0.2,
  },

  // Permission Screen
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionIconText: {
    fontSize: 36,
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: isDark ? '#FFFFFF' : '#000000',
    marginBottom: 12,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    fontWeight: '400',
    color: isDark ? '#8E8E93' : '#636366',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    letterSpacing: -0.2,
  },
  permissionButton: {
    backgroundColor: isDark ? '#FFFFFF' : '#000000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    shadowColor: isDark ? '#FFFFFF' : '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  permissionButtonText: {
    color: isDark ? '#000000' : '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },

  // Camera UI
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  cameraHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(20px)',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  cameraGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceBorder: {
    width: 240,
    height: 300,
    borderRadius: 120,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
  },
  cameraInstruction: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cameraFooter: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  captureButtonContainer: {
    padding: 6,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px)',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
});
