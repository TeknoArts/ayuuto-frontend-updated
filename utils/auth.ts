import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Auth utility functions (persistent session on device)
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Backend API Configuration
// ============================================
// IMPORTANT: Update these settings based on where you're running the app
// ============================================

// Set to true if testing on a PHYSICAL DEVICE (iPhone/Android phone)
// Set to false if testing on SIMULATOR/EMULATOR
const IS_PHYSICAL_DEVICE = true; // Change this based on your setup

// Your machine's LAN IP address (for physical devices)
// Find your IP by running: ifconfig | grep "inet " | grep -v 127.0.0.1
const PHYSICAL_DEVICE_IP = '192.168.18.126'; // Update this with your current LAN IP

const BACKEND_PORT = 5001;

// Automatically detects the correct URL based on platform and device type
const getApiBaseUrl = () => {
  let url: string;
  
  if (Platform.OS === 'web') {
    url = `http://localhost:${BACKEND_PORT}/api`;
  } else if (Platform.OS === 'ios') {
    if (IS_PHYSICAL_DEVICE) {
      // Physical iOS device - use your machine's IP
      url = `http://${PHYSICAL_DEVICE_IP}:${BACKEND_PORT}/api`;
    } else {
      // iOS Simulator - use localhost
      url = `http://localhost:${BACKEND_PORT}/api`;
    }
  } else if (Platform.OS === 'android') {
    if (IS_PHYSICAL_DEVICE) {
      // Physical Android device - use your machine's IP
      url = `http://${PHYSICAL_DEVICE_IP}:${BACKEND_PORT}/api`;
    } else {
      // Android Emulator - use 10.0.2.2 (special IP for emulator to access host)
      url = `http://10.0.2.2:${BACKEND_PORT}/api`;
    }
  } else {
    url = `http://localhost:${BACKEND_PORT}/api`;
  }
  
  // Log the URL being used for debugging
  if (__DEV__) {
    console.log(`[API] Using base URL: ${url} (Platform: ${Platform.OS}, Physical Device: ${IS_PHYSICAL_DEVICE})`);
  }
  
  return url;
};

const API_BASE_URL = getApiBaseUrl();

export interface UserData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

type AuthResponse = {
  success: boolean;
  data?: {
    user: UserData;
    token: string;
  };
  message?: string;
};

const memoryStore: Record<string, string> = {};

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStore[key] = value;
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memoryStore[key] ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function storageRemove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    delete memoryStore[key];
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// Check if user is authenticated (based on stored token)
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await storageGet(AUTH_TOKEN_KEY);
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Save authentication token
export async function saveAuthToken(token: string): Promise<void> {
  try {
    await storageSet(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
}

// Get authentication token
export async function getAuthToken(): Promise<string | null> {
  try {
    return await storageGet(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Save user data
export async function saveUserData(userData: UserData): Promise<void> {
  try {
    await storageSet(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

// Get user data
export async function getUserData(): Promise<UserData | null> {
  try {
    const data = await storageGet(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

// Clear authentication (logout)
export async function clearAuth(): Promise<void> {
  try {
    await storageRemove(AUTH_TOKEN_KEY);
    await storageRemove(USER_DATA_KEY);
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
}

// Safely parse JSON (handles empty / invalid responses)
async function parseJsonSafe(response: Response): Promise<AuthResponse | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as AuthResponse;
  } catch {
    return null;
  }
}

// Fetch with timeout helper
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 10000): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Network request timed out. Please check if the backend server is running.')), timeout)
    ),
  ]);
}

// Generic auth API error handler for register/login/forgot/reset flows
function buildNetworkErrorMessage(path: string): string {
  return `Cannot connect to server!\n\nTrying to connect to: ${API_BASE_URL}${path}\n\nTroubleshooting:\n1. Backend running? Check: http://${PHYSICAL_DEVICE_IP}:${BACKEND_PORT}${path}\n2. IP correct? Current: ${PHYSICAL_DEVICE_IP}\n3. Same Wi-Fi? Phone and computer must be on same network\n4. Firewall? Allow port ${BACKEND_PORT} or disable temporarily`;
}

// Call backend: register
export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: UserData; token: string }> {
  const url = `${API_BASE_URL}/auth/register`;
  
  if (__DEV__) {
    console.log(`[API] Registering user: ${url}`);
  }
  
  try {
    const response = await fetchWithTimeout(
      url,
      {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
      },
      15000 // 15 second timeout
    );

  const json = await parseJsonSafe(response);

  if (!json) {
    const statusMessage = response.ok ? 'Empty response from server' : `Server error (${response.status})`;
    throw new Error(statusMessage);
  }

  if (!response.ok || !json.success || !json.data) {
    const message = json.message || 'Failed to register';
    throw new Error(message);
  }

  return json.data;
  } catch (error: any) {
    // Improve error messages for common issues
    if (__DEV__) {
      console.error('[API] Register error:', error);
    }
    
    if (error.message.includes('timed out')) {
      const errorMsg = `Connection timeout!\n\nTrying to connect to: ${API_BASE_URL}\n\nTroubleshooting:\n1. Make sure backend is running: cd ayuuto-backend && npm start\n2. Find your IP: ifconfig | grep "inet " | grep -v 127.0.0.1\n3. Update IP in utils/auth.ts line 19 (current: ${PHYSICAL_DEVICE_IP})\n4. Ensure phone and computer are on the SAME Wi-Fi network\n5. Check firewall allows port ${BACKEND_PORT}`;
      throw new Error(errorMsg);
    }
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      const errorMsg = `Cannot connect to server!\n\nTrying to connect to: ${API_BASE_URL}\n\nTroubleshooting:\n1. Backend running? Check: http://${PHYSICAL_DEVICE_IP}:${BACKEND_PORT}/api/auth/register\n2. IP correct? Current: ${PHYSICAL_DEVICE_IP}\n3. Same Wi-Fi? Phone and computer must be on same network\n4. Firewall? Allow port ${BACKEND_PORT} or disable temporarily`;
      throw new Error(errorMsg);
    }
    throw error;
  }
}

// Call backend: login
export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<{ user: UserData; token: string }> {
  const path = '/auth/login';
  const url = `${API_BASE_URL}${path}`;
  
  if (__DEV__) {
    console.log(`[API] Logging in user: ${url}`);
  }
  
  try {
    const response = await fetchWithTimeout(
      url,
      {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
      },
      15000 // 15 second timeout
    );

  const json = await parseJsonSafe(response);

  if (!json) {
    const statusMessage = response.ok ? 'Empty response from server' : `Server error (${response.status})`;
    throw new Error(statusMessage);
  }

  if (!response.ok || !json.success || !json.data) {
    const message = json.message || 'Failed to login';
    throw new Error(message);
  }

  return json.data;
  } catch (error: any) {
    // Improve error messages for common issues
    if (__DEV__) {
      console.error('[API] Login error:', error);
    }
    
    if (error.message.includes('timed out')) {
      const errorMsg = `Connection timeout!\n\nTrying to connect to: ${API_BASE_URL}\n\nTroubleshooting:\n1. Make sure backend is running: cd ayuuto-backend && npm start\n2. Find your IP: ifconfig | grep "inet " | grep -v 127.0.0.1\n3. Update IP in utils/auth.ts line 19 (current: ${PHYSICAL_DEVICE_IP})\n4. Ensure phone and computer are on the SAME Wi-Fi network\n5. Check firewall allows port ${BACKEND_PORT}`;
      throw new Error(errorMsg);
    }
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      throw new Error(buildNetworkErrorMessage('/auth/login'));
    }
    throw error;
  }
}

// Call backend: request password reset (by email only)
export async function requestPasswordReset(payload: {
  email: string;
}): Promise<string> {
  const path = '/auth/forgot-password';
  const url = `${API_BASE_URL}${path}`;

  if (__DEV__) {
    console.log(`[API] Requesting password reset: ${url}`);
    console.log(`[API] Email to send OTP: ${payload.email}`);
  }

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      15000
    );

    const json = await parseJsonSafe(response);

    if (!json) {
      const statusMessage = response.ok ? 'Empty response from server' : `Server error (${response.status})`;
      throw new Error(statusMessage);
    }

    if (!response.ok || !json.success) {
      const message = json.message || 'Failed to request password reset';
      throw new Error(message);
    }

    return json.message || 'If an account with that email exists, you will receive reset instructions.';
  } catch (error: any) {
    if (__DEV__) {
      console.error('[API] Forgot password error:', error);
    }

    if (error.message.includes('timed out')) {
      const errorMsg = `Connection timeout!\n\nTrying to connect to: ${API_BASE_URL}${path}\n\nTroubleshooting:\n1. Make sure backend is running: cd ayuuto-backend && npm start\n2. Find your IP: ifconfig | grep "inet " | grep -v 127.0.0.1\n3. Update IP in utils/auth.ts line 19 (current: ${PHYSICAL_DEVICE_IP})\n4. Ensure phone and computer are on the SAME Wi-Fi network\n5. Check firewall allows port ${BACKEND_PORT}`;
      throw new Error(errorMsg);
    }
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      throw new Error(buildNetworkErrorMessage(path));
    }
    throw error;
  }
}

// Call backend: verify OTP
export async function verifyOTP(payload: {
  email: string;
  otp: string;
}): Promise<{ verificationToken: string }> {
  const path = '/auth/verify-otp';
  const url = `${API_BASE_URL}${path}`;

  if (__DEV__) {
    console.log(`[API] Verifying OTP: ${url}`);
  }

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      15000
    );

    const json = await parseJsonSafe(response);

    if (!json) {
      const statusMessage = response.ok ? 'Empty response from server' : `Server error (${response.status})`;
      throw new Error(statusMessage);
    }

    if (!response.ok || !json.success) {
      const message = json.message || 'Failed to verify OTP';
      throw new Error(message);
    }

    if (!json.data || !json.data.verificationToken) {
      throw new Error('Verification token not received from server');
    }

    return {
      verificationToken: json.data.verificationToken,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('[API] Verify OTP error:', error);
    }

    if (error.message.includes('timed out')) {
      const errorMsg = `Connection timeout!\n\nTrying to connect to: ${API_BASE_URL}${path}\n\nTroubleshooting:\n1. Make sure backend is running: cd ayuuto-backend && npm start\n2. Find your IP: ifconfig | grep "inet " | grep -v 127.0.0.1\n3. Update IP in utils/auth.ts line 19 (current: ${PHYSICAL_DEVICE_IP})\n4. Ensure phone and computer are on the SAME Wi-Fi network\n5. Check firewall allows port ${BACKEND_PORT}`;
      throw new Error(errorMsg);
    }
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      throw new Error(buildNetworkErrorMessage(path));
    }
    throw error;
  }
}

// Call backend: reset password using verification token (after OTP verification)
export async function resetPasswordWithVerificationToken(payload: {
  email: string;
  verificationToken: string;
  newPassword: string;
}): Promise<string> {
  const path = '/auth/reset-password';
  const url = `${API_BASE_URL}${path}`;

  if (__DEV__) {
    console.log(`[API] Resetting password with verification token: ${url}`);
  }

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: payload.email,
          verificationToken: payload.verificationToken,
          newPassword: payload.newPassword,
        }),
      },
      15000
    );

    const json = await parseJsonSafe(response);

    if (!json) {
      const statusMessage = response.ok ? 'Empty response from server' : `Server error (${response.status})`;
      throw new Error(statusMessage);
    }

    if (!response.ok || !json.success) {
      const message = json.message || 'Failed to reset password';
      throw new Error(message);
    }

    return json.message || 'Password has been reset successfully.';
  } catch (error: any) {
    if (__DEV__) {
      console.error('[API] Reset password error:', error);
    }

    if (error.message.includes('timed out')) {
      const errorMsg = `Connection timeout!\n\nTrying to connect to: ${API_BASE_URL}${path}\n\nTroubleshooting:\n1. Make sure backend is running: cd ayuuto-backend && npm start\n2. Find your IP: ifconfig | grep "inet " | grep -v 127.0.0.1\n3. Update IP in utils/auth.ts line 19 (current: ${PHYSICAL_DEVICE_IP})\n4. Ensure phone and computer are on the SAME Wi-Fi network\n5. Check firewall allows port ${BACKEND_PORT}`;
      throw new Error(errorMsg);
    }
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      throw new Error(buildNetworkErrorMessage(path));
    }
    throw error;
  }
}

// Legacy function for backward compatibility (deprecated)
export async function resetPasswordWithToken(payload: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<string> {
  return resetPasswordWithVerificationToken({
    email: payload.email,
    verificationToken: payload.token,
    newPassword: payload.newPassword,
  });
}


