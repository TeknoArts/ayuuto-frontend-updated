import { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppSplashScreen } from '@/components/splash-screen';
import { isAuthenticated as checkAuth } from '@/utils/auth';

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
    };
    checkAuthStatus();
  }, []);

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

  if (isSplashVisible) {
    return <AppSplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
