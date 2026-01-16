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
        {/* Decorative Elements */}
        <View style={styles.decorativeContainer}>
          <View style={styles.decorativeLeft}>
            <IconSymbol name="arrow.triangle.2.circlepath" size={28} color="#61a5fb" />
          </View>
          <View style={styles.decorativeRight}>
            <IconSymbol name="arrow.triangle.2.circlepath" size={28} color="#61a5fb" />
          </View>
        </View>

        {/* Main Content Card */}
        <View style={styles.card}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.mainTitle}>
              {isSpin ? t('settingOrder') : t('nextRoundStarting')}
            </Text>
          </View>

          {/* Round Section */}
          <View style={styles.roundSection}>
            <Text style={styles.roundLabel}>
              {isSpin ? t('preparingRound') : t('round')}
            </Text>
            <Text style={styles.roundNumber}>{roundNumber}</Text>
          </View>

          {/* Recipient Section */}
          {isSpin ? (
            <View style={styles.recipientSection}>
              <Text style={styles.recipientLabel}>{t('spinningParticipants')}</Text>
            </View>
          ) : nextRecipientName ? (
            <View style={styles.recipientSection}>
              <Text style={styles.recipientLabel}>{t('nextLabel')}</Text>
              <Text style={styles.recipientName}>
                {formatParticipantName(nextRecipientName).toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={styles.recipientSection}>
              <Text style={styles.recipientLabel}>{t('starting')}</Text>
            </View>
          )}

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
            <Text style={styles.progressText}>
              {isSpin ? 'Setting order...' : 'Preparing round...'}
            </Text>
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
    opacity: 0.5,
  },
  decorativeRight: {
    transform: [{ rotate: '15deg' }],
    opacity: 0.5,
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
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 1.5,
    textAlign: 'center',
    lineHeight: 36,
  },
  roundSection: {
    alignItems: 'center',
    marginBottom: 24,
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
  recipientSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  recipientLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA1A6',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  recipientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textAlign: 'center',
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
    backgroundColor: '#61a5fb',
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

