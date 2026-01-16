import { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useI18n } from '@/utils/i18n';
import { formatParticipantName } from '@/utils/participant';

export default function NextRoundScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const groupId = params.groupId as string;
  const nextRecipientName = params.nextRecipientName as string || '';
  const roundNumber = params.roundNumber as string || '2';
  const timestamp = params.timestamp as string || Date.now().toString();
  const mode = (params.mode as string) || 'next'; // 'next' | 'spin'
  const isSpin = mode === 'spin';
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log('NextRoundScreen: useEffect triggered, groupId:', groupId, 'roundNumber:', roundNumber, 'nextRecipientName:', nextRecipientName);
    
    if (!groupId) {
      console.warn('NextRoundScreen: No groupId provided');
      // If no groupId, navigate to home immediately
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
      return;
    }

    console.log('NextRoundScreen: Starting animation for groupId:', groupId, 'Round:', roundNumber);

    // Reset flags - IMPORTANT: Reset on every mount to ensure it works for all rounds
    hasNavigated.current = false;
    animationRef.current = null;

    // Reset animation value to 0 before starting - CRITICAL for subsequent navigations
    progress.setValue(0);

    // Start animation immediately - screen content should already be visible
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
        console.log('NextRoundScreen: Animation was cancelled');
        return;
      }
      
      if (hasNavigated.current) {
        console.log('NextRoundScreen: Already navigated, skipping');
        return;
      }
      
      hasNavigated.current = true;
      console.log('NextRoundScreen: Animation complete, navigating back to group-details');
      
      // Navigate directly to group-details with refresh parameter
      // Using push with a unique refresh timestamp ensures the screen reloads
      setTimeout(() => {
        if (!hasNavigated.current) return; // Double check
        
        console.log('Next round animation complete, navigating to group-details with groupId:', groupId);
        
        try {
          router.push({
            pathname: '/(tabs)/group-details',
            params: {
              groupId,
              refresh: Date.now().toString(), // Unique timestamp forces refresh
            },
          });
          console.log('NextRoundScreen: Navigation command executed successfully');
        } catch (error) {
          console.error('NextRoundScreen: Navigation failed, trying fallback:', error);
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
      console.log('NextRoundScreen: Cleanup - stopping animation');
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      hasNavigated.current = false;
      progress.setValue(0);
    };
    // Include all params including timestamp in dependencies to ensure re-run on every navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, roundNumber, nextRecipientName, timestamp]);

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

        {/* Header Text varies by mode */}
        <Text style={styles.nextRoundText}>
          {isSpin ? t('settingOrder') : t('nextRoundStarting')}
        </Text>
        <Text style={styles.roundNumberText}>
          {isSpin ? `${t('preparingRound')} ${roundNumber}` : `${t('round')} ${roundNumber}`}
        </Text>
        {isSpin ? (
          <Text style={styles.nextRecipientText}>{t('spinningParticipants')}</Text>
        ) : nextRecipientName ? (
          <Text style={styles.nextRecipientText}>{t('nextLabel')} {formatParticipantName(nextRecipientName).toUpperCase()}</Text>
        ) : (
          <Text style={styles.startingText}>{t('starting')}</Text>
        )}

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
  nextRoundText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 3,
    marginBottom: 8,
    textAlign: 'center',
  },
  roundNumberText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  nextRecipientText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 60,
    textAlign: 'center',
  },
  startingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 60,
    textAlign: 'center',
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

