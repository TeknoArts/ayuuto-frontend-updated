import { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppSplashScreen } from '@/components/splash-screen';
import { isAuthenticated as checkAuth } from '@/utils/auth';
import { I18nProvider } from '@/utils/i18n';
import { setupNotificationListeners, initializePushNotifications } from '@/utils/notifications';

// Prevent the native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    const checkAuthStatus = async () => {
      const authStatus = await checkAuth();
      setIsAuthenticated(authStatus);
      
      // Initialize push notifications if authenticated
      if (authStatus) {
        await initializePushNotifications();
      }
    };
    checkAuthStatus();
  }, []);

  // Setup notification listeners
  useEffect(() => {
    const removeListeners = setupNotificationListeners(
      (notification) => {
        console.log('Notification received:', notification);
        // Handle notification received while app is in foreground
      },
      (response) => {
        console.log('Notification tapped:', response);
        const data = response.notification.request.content.data;
        
        // Navigate based on notification data
        if (data?.groupId) {
          router.push({
            pathname: '/(tabs)/group-details',
            params: { groupId: data.groupId },
          });
        }
      }
    );

    return removeListeners;
  }, [router]);

  const handleSplashFinish = () => {
    setIsSplashVisible(false);
  };

  useEffect(() => {
    if (!isSplashVisible && isAuthenticated !== null) {
      SplashScreen.hideAsync();
      
      // Redirect to login if user is not authenticated
      if (!isAuthenticated) {
        router.replace('/login');
      } else {
        // User is authenticated, allow navigation to tabs
        router.replace('/(tabs)');
      }
    }
  }, [isSplashVisible, isAuthenticated]);

  return (
    <I18nProvider>
      {isSplashVisible ? (
        <AppSplashScreen onFinish={handleSplashFinish} />
      ) : (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
      )}
    </I18nProvider>
  );
}
