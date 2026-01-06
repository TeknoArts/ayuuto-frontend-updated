import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getUserData, getAuthToken } from './auth';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationToken {
  token: string;
  deviceId?: string;
  platform: 'ios' | 'android' | 'web';
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      console.warn('Notifications are not available on simulator/emulator');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get the push notification token (FCM token)
 */
export async function getPushToken(): Promise<string | null> {
  try {
    console.log('🔔 Getting push token...');
    
    if (!Device.isDevice) {
      console.warn('❌ Push tokens are only available on physical devices (not emulator)');
      return null;
    }
    console.log('✅ Running on physical device');

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('❌ Notification permissions not granted');
      return null;
    }
    console.log('✅ Notification permissions granted');

    // Get project ID from Expo Constants
    // For Expo SDK 54, we can get it from Constants
    const Constants = (await import('expo-constants')).default;
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId || 
      Constants.easConfig?.projectId ||
      Constants.expoConfig?.extra?.expoClient?.projectId;
    
    if (!projectId) {
      console.warn('❌ Expo project ID not found. Push notifications may not work properly.');
      console.warn('   Run: eas build:configure to set up your project ID');
      console.warn('   Or check app.json for expo.extra.eas.projectId');
      return null;
    }
    console.log(`✅ Project ID found: ${projectId}`);

    console.log('📱 Requesting Expo push token...');
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    console.log(`✅ Push token obtained: ${tokenData.data.substring(0, 30)}...`);
    return tokenData.data;
  } catch (error) {
    console.error('❌ Error getting push token:', error);
    return null;
  }
}

/**
 * Register push notification token with backend
 */
export async function registerPushToken(token: string): Promise<boolean> {
  try {
    console.log('📤 Registering push token with backend...');
    
    const user = await getUserData();
    if (!user || !user.id) {
      console.warn('❌ Cannot register push token: user not logged in');
      return false;
    }
    console.log(`✅ User logged in: ${user.name} (${user.id})`);

    // Use the API utility function
    const { registerPushToken: registerTokenAPI } = await import('./api');
    
    // Get API base URL for logging
    const { API_BASE_URL } = await import('./api');
    console.log(`📡 Sending token to backend: ${API_BASE_URL}/users/push-token`);
    await registerTokenAPI(
      token,
      Platform.OS,
      Device.modelName || 'unknown'
    );

    console.log('✅ Push token registered successfully with backend!');
    return true;
  } catch (error: any) {
    console.error('❌ Error registering push token:', error);
    console.error('   Error message:', error.message);
    console.error('   Check backend logs for more details');
    return false;
  }
}

/**
 * Initialize push notifications
 * Call this after user logs in
 */
export async function initializePushNotifications(): Promise<void> {
  try {
    console.log('\n🚀 Initializing push notifications...');
    const token = await getPushToken();
    if (token) {
      console.log('✅ Got push token, registering with backend...');
      const success = await registerPushToken(token);
      if (success) {
        console.log('✅ Push notifications initialized successfully');
      } else {
        console.warn('⚠️ Push token registration returned false');
      }
    } else {
      console.warn('⚠️ No push token obtained - cannot initialize notifications');
      console.warn('   This might be because:');
      console.warn('   - App is running on emulator (use physical device)');
      console.warn('   - Notification permissions not granted');
      console.warn('   - Expo project ID not configured');
    }
  } catch (error) {
    console.error('❌ Error initializing push notifications:', error);
  }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationTapped: (notification: Notifications.NotificationResponse) => void
) {
  // Listener for notifications received while app is foregrounded
  const receivedListener = Notifications.addNotificationReceivedListener(onNotificationReceived);

  // Listener for when user taps on a notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(onNotificationTapped);

  return () => {
    Notifications.removeNotificationSubscription(receivedListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: null, // Show immediately
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

