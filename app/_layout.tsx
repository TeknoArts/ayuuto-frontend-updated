import { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox } from 'react-native';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppSplashScreen } from '@/components/splash-screen';
import { isAuthenticated as checkAuth } from '@/utils/auth';
import { I18nProvider } from '@/utils/i18n';
import { setupNotificationListeners, initializePushNotifications } from '@/utils/notifications';
import { AlertProvider } from '@/components/ui/alert-provider';

// Prevent the native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Ignore API error logs from showing in the error overlay
// These errors are already handled and shown to users via Alert popups
LogBox.ignoreLogs([
  '[API] Login error:',
  '[API] Register error:',
  '[API] Forgot password error:',
  '[API] Verify OTP error:',
  '[API] Reset password error:',
  '[API] Authentication error:',
  'Error loading groups:',
  'Error loading group details:',
  'Error adding participant:',
  'Error removing participant:',
  'Error creating group',
  'Error updating payment status:',
  'Error spinning for order:',
]);

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

  // Handle deep links (app opened via URL)
  useEffect(() => {
    // Function to handle deep links
    const handleDeepLink = (url: string | null) => {
      if (!url) return;
      
      console.log('Deep link received:', url);
      
      try {
        // Parse URL: ayuuto://group/{groupId}?invite=true&token=xxx
        // Or: https://yourdomain.com/group/{groupId}?invite=true&token=xxx
        const parsed = Linking.parse(url);
        
        // Check if it's a group deep link
        // Format: ayuuto://group/{groupId} or ayuuto://group?groupId={id}
        const isGroupLink = parsed.path === 'group' || 
                           parsed.path?.includes('group') ||
                           parsed.hostname === 'group' ||
                           parsed.queryParams?.groupId;
        
        if (isGroupLink) {
          // Extract groupId from path segments or query params
          let groupId: string | undefined;
          
          if (parsed.pathSegments && parsed.pathSegments.length > 0) {
            groupId = parsed.pathSegments[0];
          } else if (parsed.queryParams?.groupId) {
            groupId = String(parsed.queryParams.groupId);
          } else if (parsed.path) {
            // Try to extract from path like "/group/123" or "group/123"
            const pathParts = parsed.path.split('/').filter(p => p);
            const groupIndex = pathParts.findIndex(p => p === 'group');
            if (groupIndex >= 0 && pathParts[groupIndex + 1]) {
              groupId = pathParts[groupIndex + 1];
            }
          }
          
          const isInvite = parsed.queryParams?.invite === 'true';
          
          if (groupId) {
            // Wait for authentication check to complete
            if (isAuthenticated === null) {
              // Wait a bit for auth to complete, then retry
              setTimeout(() => handleDeepLink(url), 1000);
              return;
            }
            
            if (!isAuthenticated) {
              console.log('User not authenticated, will navigate after login');
              // Navigate to login first
              router.replace('/login');
              // Store groupId for after login (you might want to use AsyncStorage)
              return;
            }
            
            // Navigate to group details
            router.push({
              pathname: '/(tabs)/group-details',
              params: { 
                groupId: String(groupId),
                invite: isInvite ? 'true' : undefined,
              },
            });
          }
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    };

    // Handle initial URL (when app is opened via deep link)
    // Note: Expo Router handles initial URLs automatically via the URL scheme
    // The event listener below will handle deep links when app is already open

    // Handle URL changes (when app is already open)
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [router, isAuthenticated]);

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
      <AlertProvider>
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
      </AlertProvider>
    </I18nProvider>
  );
}
