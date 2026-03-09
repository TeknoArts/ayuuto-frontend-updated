import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '@/utils/i18n';
import { formatParticipantName } from '@/utils/participant';
import { spinForOrder } from '@/utils/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { alert } from '@/utils/alert';

const { width } = Dimensions.get('window');
const ORBIT_SIZE = Math.min(width * 0.85, 320);
const MIN_SPIN_DURATION_MS = 2500; // Always show spinning animation for at least this long

type Phase = 'spinning' | 'result';

export default function SpinLoadingScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const groupId = params.groupId as string;

  const [phase, setPhase] = useState<Phase>('spinning');
  const [resultData, setResultData] = useState<{
    roundNumber: string;
    nextRecipientName: string;
  } | null>(null);

  const spinOuter = useRef(new Animated.Value(0)).current;
  const spinInner = useRef(new Animated.Value(0)).current;
  const diceScale = useRef(new Animated.Value(1)).current;
  const pulseRing = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;
  const progress = useRef(new Animated.Value(0)).current;

  const isTestMode = groupId === 'test';

  // Reset state when groupId or _ts changes - ensures spinning screen shows on every spin
  // (fixes reused screen from previous navigation not showing animation on 2nd+ group)
  const navKey = params._ts as string | undefined;
  useEffect(() => {
    setPhase('spinning');
    setResultData(null);
  }, [groupId, navKey]);

  useEffect(() => {
    if (!groupId) {
      router.back();
      return;
    }

    // Outer ring: slow continuous rotation
    const outerAnim = Animated.loop(
      Animated.timing(spinOuter, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Inner ring: faster opposite rotation
    const innerAnim = Animated.loop(
      Animated.timing(spinInner, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Dice: playful bounce + spin
    const diceAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(diceScale, {
          toValue: 1.15,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(diceScale, {
          toValue: 0.95,
          duration: 400,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse ring: expanding/contracting
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRing, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseRing, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Glow: subtle breathing
    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.8,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    outerAnim.start();
    innerAnim.start();
    diceAnim.start();
    pulseAnim.start();
    glowAnim.start();

    return () => {
      outerAnim.stop();
      innerAnim.stop();
      diceAnim.stop();
      pulseAnim.stop();
      glowAnim.stop();
    };
  }, [groupId]);

  useEffect(() => {
    let cancelled = false;

    const runSpin = async () => {
      if (!groupId || cancelled) return;

      // Test mode: just show animation for 3.5s then go back
      if (isTestMode) {
        await new Promise((r) => setTimeout(r, 3500));
        if (cancelled) return;
        router.replace('/(tabs)');
        return;
      }

      try {
        const spinStartTime = Date.now();
        const updatedGroup = await spinForOrder(groupId);
        if (cancelled) return;

        if (updatedGroup) {
          // Ensure spinning animation shows for minimum duration
          const elapsed = Date.now() - spinStartTime;
          const remaining = Math.max(0, MIN_SPIN_DURATION_MS - elapsed);
          if (remaining > 0) {
            await new Promise((r) => setTimeout(r, remaining));
          }
          if (cancelled) return;

          const participants = updatedGroup.participants || [];
          const sorted = updatedGroup.isOrderSet
            ? [...participants].sort((a, b) => (a.order || 0) - (b.order || 0))
            : participants;
          const currentIndex = updatedGroup.currentRecipientIndex || 0;
          const current = sorted[currentIndex];
          const nextRecipientName = formatParticipantName(current?.name || '');
          const roundNumber = (currentIndex + 1).toString();

          if (cancelled) return;

          // Transition to result phase (round + recipient + progress) on same screen
          setResultData({ roundNumber, nextRecipientName });
          setPhase('result');
        } else {
          throw new Error('Failed to spin for order');
        }
      } catch (error: unknown) {
        if (cancelled) return;
        const msg =
          error instanceof Error ? error.message : 'Failed to spin for order. Please try again.';
        alert('Error', msg, [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    };

    runSpin();

    return () => {
      cancelled = true;
    };
  }, [groupId, isTestMode]);

  // When result phase starts, run progress animation then navigate to group-details
  useEffect(() => {
    if (phase !== 'result' || !groupId || groupId === 'test') return;

    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) {
        router.replace({
          pathname: '/(tabs)/group-details',
          params: { groupId, refresh: Date.now().toString() },
        });
      }
    });
    return () => anim.stop();
  }, [phase, groupId, progress]);

  const outerRotate = spinOuter.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const innerRotate = spinInner.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const pulseScale = pulseRing.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.15],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {phase === 'spinning' ? (
            <>
              {/* Centered orbit container - all rings & icon share same center */}
              <View style={styles.orbitWrapper}>
            {/* Outer glow */}
            <Animated.View
              style={[styles.glowCircle, { opacity: glowOpacity }]}
            />

            {/* Outer spinning ring */}
            <Animated.View
              style={[styles.ringOuter, { transform: [{ rotate: outerRotate }] }]}
            />

            {/* Inner spinning ring */}
            <Animated.View
              style={[styles.ringInner, { transform: [{ rotate: innerRotate }] }]}
            />

            {/* Pulse ring */}
            <Animated.View
              style={[styles.pulseRing, { transform: [{ scale: pulseScale }] }]}
            />

            {/* Center dice - perfectly centered */}
            <Animated.View
              style={[
                styles.diceWrapper,
                { transform: [{ scale: diceScale }] },
              ]}>
              <View style={styles.diceInner}>
                <IconSymbol name="dice.fill" size={64} color="#FFD700" />
              </View>
            </Animated.View>
          </View>

              {/* Text */}
              <Text style={styles.title}>{t('spinningParticipants')}</Text>
              <Text style={styles.subtitle}>{t('settingOrder')}</Text>
            </>
          ) : (
            /* Result phase - Order set, round & recipient, progress bar */
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>{t('settingOrder')}</Text>
              <View style={styles.resultRoundSection}>
                <Text style={styles.resultRoundLabel}>{t('round')}</Text>
                <Text style={styles.resultRoundNumber}>
                  {resultData?.roundNumber || '1'}
                </Text>
              </View>
              <View style={styles.resultRecipientSection}>
                <Text style={styles.resultRecipientLabel}>{t('nextLabel')}</Text>
                <Text style={styles.resultRecipientName}>
                  {(resultData?.nextRecipientName || '').toUpperCase()}
                </Text>
              </View>
              <View style={styles.resultProgressContainer}>
                <View style={styles.resultProgressBg}>
                  <Animated.View
                    style={[styles.resultProgressFill, { width: progressWidth }]}
                  />
                </View>
                <Text style={styles.resultProgressText}>
                  {t('preparingRound') || 'Preparing round...'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const ringSize = (mult: number) => ({
  position: 'absolute' as const,
  left: '50%' as const,
  top: '50%' as const,
  width: ORBIT_SIZE * mult,
  height: ORBIT_SIZE * mult,
  marginLeft: (-ORBIT_SIZE * mult) / 2,
  marginTop: (-ORBIT_SIZE * mult) / 2,
  borderRadius: (ORBIT_SIZE * mult) / 2,
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001233',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  orbitWrapper: {
    width: ORBIT_SIZE,
    height: ORBIT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    ...ringSize(0.95),
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.12)',
  },
  ringOuter: {
    ...ringSize(0.9),
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: 'rgba(255, 215, 0, 0.5)',
    borderRightColor: 'rgba(255, 215, 0, 0.15)',
    borderBottomColor: 'rgba(255, 215, 0, 0.35)',
    borderLeftColor: 'rgba(255, 215, 0, 0.08)',
  },
  ringInner: {
    ...ringSize(0.5),
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    borderStyle: 'dashed',
  },
  pulseRing: {
    ...ringSize(0.68),
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.18)',
  },
  diceWrapper: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 120,
    height: 120,
    marginLeft: -60,
    marginTop: -60,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 42, 97, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  diceInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginTop: 40,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 2,
  },
  resultCard: {
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
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 24,
  },
  resultRoundSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5f',
  },
  resultRoundLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA1A6',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  resultRoundNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  resultRecipientSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resultRecipientLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA1A6',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  resultRecipientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  resultProgressContainer: {
    width: '100%',
    marginTop: 8,
  },
  resultProgressBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  resultProgressFill: {
    height: '100%',
    backgroundColor: '#61a5fb',
    borderRadius: 3,
  },
  resultProgressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9BA1A6',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
