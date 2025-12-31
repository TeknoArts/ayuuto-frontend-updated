// Auth utility functions
// Using in-memory storage for now (can be extended with AsyncStorage for persistence)

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// In-memory storage (will be lost on app restart)
// TODO: Replace with AsyncStorage for persistence
let memoryStorage: Record<string, string> = {};

// Helper to check if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
      const test = '__localStorage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    }
  } catch {
    // localStorage not available
  }
  return false;
}

// Get item from storage
function getItem(key: string): string | null {
  if (isLocalStorageAvailable()) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      return memoryStorage[key] || null;
    }
  }
  return memoryStorage[key] || null;
}

// Set item in storage
function setItem(key: string, value: string): void {
  if (isLocalStorageAvailable()) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fall through to memory storage
    }
  }
  memoryStorage[key] = value;
}

// Remove item from storage
function removeItem(key: string): void {
  if (isLocalStorageAvailable()) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Fall through to memory storage
    }
  }
  delete memoryStorage[key];
}

export interface UserData {
  name?: string;
  email?: string;
  phone?: string;
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = getItem(AUTH_TOKEN_KEY);
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Save authentication token
export async function saveAuthToken(token: string): Promise<void> {
  try {
    setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
}

// Save user data
export async function saveUserData(userData: UserData): Promise<void> {
  try {
    setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

// Get user data
export async function getUserData(): Promise<UserData | null> {
  try {
    const data = getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

// Clear authentication
export async function clearAuth(): Promise<void> {
  try {
    removeItem(AUTH_TOKEN_KEY);
    removeItem(USER_DATA_KEY);
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
}

