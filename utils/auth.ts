import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Auth utility functions (persistent session on device)
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Backend API base URL
// NOTE: When testing on a real device, replace "localhost" with your machine's LAN IP.
// Make sure this PORT matches the one in ayuuto-backend/server.js
const API_BASE_URL = 'http://192.168.18.116:5001/api';

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

// Call backend: register
export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: UserData; token: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

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
}

// Call backend: login
export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<{ user: UserData; token: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

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
}


