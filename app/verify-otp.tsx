import { useState, useRef, useEffect } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { verifyOTP } from '@/utils/auth';
import { alert } from '@/utils/alert';
import { useI18n } from '@/utils/i18n';

export default function VerifyOTPScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || '');
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 5 digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 5) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    // Handle backspace
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpValue?: string) => {
    const otpCode = otpValue || otp.join('');
    
    if (otpCode.length !== 5) {
      alert(
        t('incompleteOTP'),
        t('pleaseEnterCompleteOTP')
      );
      return;
    }

    if (!email) {
      alert(
        t('emailRequired'),
        t('pleaseEnterEmail')
      );
      return;
    }

    try {
      setIsVerifying(true);

      const result = await verifyOTP({ email, otp: otpCode });
      
      // Navigate to reset password screen with verification token
      router.push({
        pathname: '/reset-password',
        params: {
          email,
          verificationToken: result.verificationToken,
        },
      });
    } catch (err: any) {
      alert(
        t('verificationFailed'),
        err?.message || t('invalidOTP')
      );
      // Clear OTP on error
      setOtp(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
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
            <Text style={styles.tagline}>{t('organizeWithTrust')}</Text>
          </View>

          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 5-digit OTP code sent to {email}
            </Text>
          </View>

          {/* OTP Input Fields */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit !== '' && styles.otpInputFilled,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isVerifying}
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isVerifying && styles.buttonDisabled]}
            onPress={() => handleVerifyOTP()}
            disabled={isVerifying || otp.join('').length !== 5}
          >
            {isVerifying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{t('verifyOTP')}</Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <TouchableOpacity
            style={styles.resendButton}
            onPress={() => router.back()}
            disabled={isVerifying}
          >
            <Text style={styles.resendButtonText}>Resend OTP</Text>
          </TouchableOpacity>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={16} color="#4FC3F7" />
            <Text style={styles.infoText}>
              Check your email for the 5-digit OTP code. The code expires in 10 minutes.
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 56,
    height: 64,
    backgroundColor: 'rgb(0 10 26)',
    borderWidth: 2,
    borderColor: '#2a3441',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  otpInputFilled: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
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
  resendButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendButtonText: {
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
