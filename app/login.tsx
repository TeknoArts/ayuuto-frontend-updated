import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { loginUser, saveAuthToken, saveUserData } from '@/utils/auth';
import { alert } from '@/utils/alert';
import { useI18n } from '@/utils/i18n';

export default function LoginScreen() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }

    try {
      setIsLoading(true);

      const { user, token } = await loginUser({ email, password });

      await saveAuthToken(token);
      await saveUserData({
        id: user.id,
        name: user.name,
        email: user.email,
      });

      // Initialize push notifications after successful login
      const { initializePushNotifications } = await import('@/utils/notifications');
      await initializePushNotifications();

      router.replace('/(tabs)');
    } catch (err: any) {
      // Only show error for authentication failures (invalid credentials)
      const errorMessage = err?.message || '';
      if (errorMessage.toLowerCase().includes('invalid credentials') || 
          errorMessage.toLowerCase().includes('failed to login')) {
        alert(
          t('loginFailed'),
          t('invalidCredentials')
        );
      } else {
        // Show other errors as popup
        alert(
          t('error'),
          errorMessage || t('unableToLogin')
        );
        console.error('Login error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>AYUUTO</Text>
            <Text style={styles.tagline}>{t('organizeWithTrust')}</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>{t('welcomeBack')}</Text>
            <Text style={styles.subtitle}>{t('signIn')}</Text>

            {/* Email/Phone Input */}
            <View style={styles.inputContainer}>
              <IconSymbol name="envelope.fill" size={20} color="#9BA1A6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('emailOrPhone')}
                placeholderTextColor="#9BA1A6"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <IconSymbol name="lock.fill" size={20} color="#9BA1A6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder={t('password')}
                placeholderTextColor="#9BA1A6"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}>
                <IconSymbol
                  name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                  size={20}
                  color="#9BA1A6"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>LOGIN</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(1 27 61)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 4,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 12,
    color: '#9BA1A6',
    letterSpacing: 1,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BA1A6',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(0 10 26)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3441',
    marginBottom: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  passwordInput: {
    paddingRight: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#4FC3F7',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    color: '#9BA1A6',
    fontSize: 14,
  },
  signUpLink: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

