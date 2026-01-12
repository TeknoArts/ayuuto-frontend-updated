import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { requestPasswordReset } from '@/utils/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSendOTP = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      console.log(`[FORGOT PASSWORD] Sending OTP request for email: ${email}`);
      
      const message = await requestPasswordReset({ email });
      
      console.log(`[FORGOT PASSWORD] OTP request successful: ${message}`);
      setSuccess(true);
      
      // Navigate to OTP screen after 1.5 seconds
      setTimeout(() => {
        router.push({
          pathname: '/verify-otp',
          params: { email },
        });
      }, 1500);
    } catch (err: any) {
      console.error(`[FORGOT PASSWORD] Error:`, err);
      setError(err?.message || 'Unable to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>AYUUTO</Text>
            <Text style={styles.tagline}>ORGANIZE WITH TRUST, CELEBRATE TOGETHER.</Text>
          </View>

          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a 5-digit OTP code.
            </Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          
          {success && (
            <View style={styles.successContainer}>
              <IconSymbol name="checkmark.circle.fill" size={24} color="#4CAF50" />
              <View style={styles.successTextContainer}>
                <Text style={styles.successTitle}>OTP sent!</Text>
                <Text style={styles.successText}>
                  Check your email ({email}) for the 5-digit OTP code.
                </Text>
                <Text style={styles.successNote}>
                  Redirecting to OTP verification...
                </Text>
              </View>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <IconSymbol name="envelope.fill" size={20} color="#9BA1A6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#9BA1A6"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
                if (success) setSuccess(false);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading && !success}
            />
          </View>

          {/* Send OTP Button */}
          {!success ? (
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>SEND OTP</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setSuccess(false);
                setEmail('');
              }}
            >
              <Text style={styles.secondaryButtonText}>SEND TO DIFFERENT EMAIL</Text>
            </TouchableOpacity>
          )}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={16} color="#4FC3F7" />
            <Text style={styles.infoText}>
              Check your inbox (and spam folder) for the 5-digit OTP code. The OTP expires in 10 minutes.
            </Text>
          </View>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
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
    marginBottom: 32,
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
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9BA1A6',
    lineHeight: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  successContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  successTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  successTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  successNote: {
    color: '#9BA1A6',
    fontSize: 12,
    marginTop: 4,
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
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4FC3F7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#4FC3F7',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderColor: '#4FC3F7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    color: '#4FC3F7',
    fontSize: 12,
    marginLeft: 8,
    lineHeight: 18,
  },
  backToLogin: {
    alignItems: 'center',
    marginTop: 8,
  },
  backToLoginText: {
    color: '#4FC3F7',
    fontSize: 14,
  },
});
