import { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useI18n } from '@/utils/i18n';
import { formatParticipantName } from '@/utils/participant';

export default function PaymentProcessingScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const groupId = params.groupId as string;
  const amount = params.amount as string;
  const recipientName = params.recipientName as string || '';
  const roundNumber = params.roundNumber as string || '1';
  const timestamp = params.timestamp as string || Date.now().toString();
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log('PaymentProcessingScreen: Mounted with groupId:', groupId, 'amount:', amount, 'recipientName:', recipientName, 'roundNumber:', roundNumber);
    
    if (!groupId) {
      console.warn('PaymentProcessingScreen: No groupId, navigating to home');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
      return;
    }

    // Reset flags - IMPORTANT: Reset on every mount to ensure it works for all rounds
    hasNavigated.current = false;
    animationRef.current = null;

    // Reset animation value to 0 before starting - CRITICAL for subsequent navigations
    progress.setValue(0);

    // Animate progress bar from 0 to 100% over 3 seconds with smooth easing
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    });

    animationRef.current = animation;

    animation.start((finished) => {
      if (!finished) {
        console.log('PaymentProcessingScreen: Animation was cancelled');
        return;
      }
      
      if (hasNavigated.current) {
        console.log('PaymentProcessingScreen: Already navigated, skipping');
        return;
      }
      
      hasNavigated.current = true;
      console.log('PaymentProcessingScreen: Animation complete, navigating back to group-details');
      
      // Navigate directly to group-details with refresh parameter
      // Using push with a unique refresh timestamp ensures the screen reloads
      setTimeout(() => {
        if (!hasNavigated.current) return; // Double check
        
        console.log('PaymentProcessingScreen: Navigating to group-details with groupId:', groupId);
        
        try {
          router.push({
            pathname: '/(tabs)/group-details',
            params: {
              groupId,
              refresh: Date.now().toString(), // Unique timestamp forces refresh
            },
          });
          console.log('PaymentProcessingScreen: Navigation command executed successfully');
        } catch (error) {
          console.error('PaymentProcessingScreen: Navigation failed, trying fallback:', error);
          // Fallback navigation
          setTimeout(() => {
            router.replace({
              pathname: '/(tabs)/group-details',
              params: {
                groupId,
                refresh: Date.now().toString(),
              },
            });
          }, 100);
        }
      }, 200);
    });

    // Cleanup: stop animation if component unmounts
    return () => {
      console.log('PaymentProcessingScreen: Cleanup - stopping animation');
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      hasNavigated.current = false;
      progress.setValue(0);
    };
    // Include all params including timestamp in dependencies to ensure re-run on every navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, amount, recipientName, roundNumber, timestamp]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Decorative Elements */}
        <View style={styles.decorativeContainer}>
          <View style={styles.decorativeLeft}>
            <IconSymbol name="party.popper.fill" size={32} color="#FFD700" />
          </View>
          <View style={styles.decorativeRight}>
            <IconSymbol name="party.popper.fill" size={32} color="#FFD700" />
          </View>
        </View>

        {/* Main Content Card */}
        <View style={styles.card}>
          {/* Congratulations Header */}
          <View style={styles.headerSection}>
            <Text style={styles.congratulationsText}>
              {t('congratulations')} {recipientName ? formatParticipantName(recipientName).toUpperCase() : ''}
            </Text>
          </View>

          {/* Round Info */}
          <View style={styles.roundSection}>
            <Text style={styles.roundLabel}>{t('round')}</Text>
            <Text style={styles.roundNumber}>{roundNumber}</Text>
          </View>

          {/* Amount Section */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>{t('youAreReceiving')}</Text>
            <View style={styles.amountRow}>
              <IconSymbol name="dollarsign.circle.fill" size={32} color="#FFD700" />
              <Text style={styles.amountValue}>{amount}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressWidth,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>Processing...</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#011b3d',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  decorativeContainer: {
    position: 'absolute',
    top: '15%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    zIndex: 0,
  },
  decorativeLeft: {
    transform: [{ rotate: '-15deg' }],
    opacity: 0.6,
  },
  decorativeRight: {
    transform: [{ rotate: '15deg' }],
    opacity: 0.6,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#002b61',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#1a3a5f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  headerSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  congratulationsText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 1.5,
    textAlign: 'center',
    lineHeight: 40,
  },
  roundSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5f',
  },
  roundLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA1A6',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  roundNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9BA1A6',
    letterSpacing: 0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9BA1A6',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

