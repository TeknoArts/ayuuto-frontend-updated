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
  
  // Additional animations for modern effects
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const iconRotateAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  // Party popper animations
  const leftPopperAnim = useRef(new Animated.Value(0)).current;
  const rightPopperAnim = useRef(new Animated.Value(0)).current;
  const leftPopperScale = useRef(new Animated.Value(0)).current;
  const rightPopperScale = useRef(new Animated.Value(0)).current;
  const leftPopperBounceRef = useRef<Animated.CompositeAnimation | null>(null);
  const rightPopperBounceRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    console.log('PaymentProcessingScreen: Mounted with groupId:', groupId, 'amount:', amount, 'recipientName:', recipientName, 'roundNumber:', roundNumber);
    
    if (!groupId) {
      console.warn('PaymentProcessingScreen: No groupId, navigating to home');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
      return;
    }

    // Update payment status in the background (non-blocking)
    // This ensures the payment is recorded even if navigation was instant
    const participantId = params.participantId as string;
    if (participantId) {
      import('@/utils/api').then(({ updatePaymentStatus }) => {
        updatePaymentStatus(groupId, participantId, true).catch((error) => {
          console.error('PaymentProcessingScreen: Failed to update payment status:', error);
          // Error is logged but doesn't block the UI
        });
      });
    }

    // Reset flags - IMPORTANT: Reset on every mount to ensure it works for all rounds
    hasNavigated.current = false;
    animationRef.current = null;

    // Reset animation values
    progress.setValue(0);
    pulseAnim.setValue(1);
    scaleAnim.setValue(0.9);
    iconRotateAnim.setValue(0);
    glowAnim.setValue(0);
    leftPopperAnim.setValue(0);
    rightPopperAnim.setValue(0);
    leftPopperScale.setValue(0);
    rightPopperScale.setValue(0);

    // Start entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      // Party popper entrance animations
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.spring(leftPopperScale, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(rightPopperScale, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Party popper bounce animations
    const leftPopperBounce = Animated.loop(
      Animated.sequence([
        Animated.timing(leftPopperAnim, {
          toValue: -10,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(leftPopperAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    leftPopperBounceRef.current = leftPopperBounce;
    leftPopperBounce.start();

    const rightPopperBounce = Animated.loop(
      Animated.sequence([
        Animated.timing(rightPopperAnim, {
          toValue: 10,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rightPopperAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    rightPopperBounceRef.current = rightPopperBounce;
    rightPopperBounce.start();

    // Pulse animation for icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimationRef.current = pulse;
    pulse.start();

    // Rotate animation for dollar icon
    const iconRotate = Animated.loop(
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    iconRotateAnimationRef.current = iconRotate;
    iconRotate.start();

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

    // Cleanup: stop animations if component unmounts
    return () => {
      console.log('PaymentProcessingScreen: Cleanup - stopping animations');
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.stop();
        pulseAnimationRef.current = null;
      }
      if (iconRotateAnimationRef.current) {
        iconRotateAnimationRef.current.stop();
        iconRotateAnimationRef.current = null;
      }
      if (leftPopperBounceRef.current) {
        leftPopperBounceRef.current.stop();
        leftPopperBounceRef.current = null;
      }
      if (rightPopperBounceRef.current) {
        rightPopperBounceRef.current.stop();
        rightPopperBounceRef.current = null;
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

  const cardScale = scaleAnim;
  const iconScale = pulseAnim;
  const iconRotation = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Animated Glow Background */}
        <Animated.View 
          style={[
            styles.glowBackground,
            { opacity: glowOpacity }
          ]} 
        />

        {/* Main Content Card */}
        <Animated.View 
          style={[
            styles.card,
            {
              transform: [{ scale: cardScale }],
            },
          ]}>
          {/* Congratulations Header with Party Poppers */}
          <View style={styles.headerSection}>
            <View style={styles.congratulationsContainer}>
              {/* Left Party Popper */}
              <Animated.View
                style={[
                  styles.partyPopperContainer,
                  styles.partyPopperLeft,
                  {
                    transform: [
                      { scale: leftPopperScale },
                      { translateX: leftPopperAnim },
                    ],
                  },
                ]}>
                <IconSymbol name="party.popper.fill" size={40} color="#FFD700" />
              </Animated.View>

              {/* Congratulations Text */}
              <View style={styles.congratulationsTextContainer}>
                <Text style={styles.congratulationsText}>
                  {t('congratulations')}
                </Text>
                {recipientName && (
                  <Text style={styles.recipientNameText}>
                    {formatParticipantName(recipientName).toUpperCase()}
                  </Text>
                )}
              </View>

              {/* Right Party Popper */}
              <Animated.View
                style={[
                  styles.partyPopperContainer,
                  styles.partyPopperRight,
                  {
                    transform: [
                      { scale: rightPopperScale },
                      { translateX: rightPopperAnim },
                    ],
                  },
                ]}>
                <IconSymbol name="party.popper.fill" size={40} color="#FFD700" />
              </Animated.View>
            </View>
          </View>

          {/* Round Info */}
          <View style={styles.roundSection}>
            <Text style={styles.roundLabel}>{t('round')}</Text>
            <View style={styles.roundNumberContainer}>
              <Text style={styles.roundNumber}>{roundNumber}</Text>
            </View>
          </View>

          {/* Amount Section */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>{t('youAreReceiving')}</Text>
            <View style={styles.amountRow}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [
                      { scale: iconScale },
                      { rotate: iconRotation },
                    ],
                  },
                ]}>
                <IconSymbol name="dollarsign.circle.fill" size={48} color="#FFD700" />
              </Animated.View>
              <Text style={styles.amountValue}>{amount}</Text>
            </View>
          </View>

          {/* Enhanced Progress Bar */}
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
              <Animated.View
                style={[
                  styles.progressBarGlow,
                  {
                    width: progressWidth,
                    opacity: glowAnim,
                  },
                ]}
              />
            </View>
            <View style={styles.progressTextContainer}>
              <Animated.View
                style={[
                  styles.processingDots,
                  { opacity: pulseAnim },
                ]}>
                <Text style={styles.progressText}>Processing</Text>
                <Animated.Text
                  style={[
                    styles.dots,
                    {
                      opacity: pulseAnim.interpolate({
                        inputRange: [0.8, 1],
                        outputRange: [0.3, 1],
                      }),
                    },
                  ]}>
                  ...
                </Animated.Text>
              </Animated.View>
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000f1f',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  glowBackground: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    backgroundColor: '#000f1f',
    borderRadius: 300,
    opacity: 0.08,
    top: '-25%',
    left: '-25%',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#001428',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  headerSection: {
    marginBottom: 28,
    alignItems: 'center',
  },
  congratulationsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 8,
  },
  partyPopperContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderRadius: 20,
    padding: 8,
  },
  partyPopperLeft: {
    marginRight: 6,
  },
  partyPopperRight: {
    marginLeft: 6,
  },
  congratulationsTextContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  congratulationsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD700',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
    flexShrink: 1,
  },
  recipientNameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E0E0E0',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 2,
  },
  roundSection: {
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.15)',
  },
  roundLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9BA1A6',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  roundNumberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  roundNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 1.5,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.18)',
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9BA1A6',
    letterSpacing: 1,
    marginBottom: 14,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderRadius: 26,
    padding: 6,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 1.2,
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 3,
  },
  progressBarGlow: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  progressTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9BA1A6',
    textAlign: 'center',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  dots: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
    letterSpacing: 2,
  },
});

