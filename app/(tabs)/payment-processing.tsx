import { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useI18n } from '@/utils/i18n';

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
        {/* Confetti Poppers */}
        <View style={styles.confettiContainer}>
          <View style={styles.confettiLeft}>
            <IconSymbol name="party.popper.fill" size={40} color="#FFD700" />
          </View>
          <View style={styles.confettiRight}>
            <IconSymbol name="party.popper.fill" size={40} color="#FFD700" />
          </View>
        </View>

        {/* Congratulations Text */}
        <Text style={styles.congratulationsText}>{t('congratulations')}</Text>
        {recipientName ? (
          <Text style={styles.recipientText}>{recipientName.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.roundText}>{t('round')} {roundNumber}</Text>
        <Text style={styles.amountText}>{t('youAreReceiving')}</Text>
        <View style={styles.amountContainer}>
          <IconSymbol name="dollarsign.circle.fill" size={40} color="#FFD700" />
          <Text style={styles.amountValue}>{amount}</Text>
        </View>

        {/* Progress Bar Container */}
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
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(1, 27, 61, 0.95)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confettiContainer: {
    position: 'absolute',
    top: '20%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  confettiLeft: {
    transform: [{ rotate: '-20deg' }],
  },
  confettiRight: {
    transform: [{ rotate: '20deg' }],
  },
  congratulationsText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 3,
    marginBottom: 10,
    textAlign: 'center',
  },
  recipientText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  roundText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFD700',
    letterSpacing: 1.5,
    marginBottom: 20,
    textAlign: 'center',
  },
  amountText: {
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 30,
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 60,
  },
  amountValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  progressContainer: {
    width: '80%',
    marginTop: 40,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
});

