import { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function GroupCreatedScreen() {
  const params = useLocalSearchParams();
  const groupId = params.groupId as string;
  const timestamp = params.timestamp as string || Date.now().toString();
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log('GroupCreatedScreen: useEffect triggered, groupId:', groupId, 'timestamp:', timestamp);
    
    if (!groupId) {
      console.warn('GroupCreatedScreen: No groupId provided');
      // If no groupId, navigate to home immediately
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
      return;
    }

    console.log('GroupCreatedScreen: Starting animation for groupId:', groupId);

    // Reset flags - IMPORTANT: Reset on every mount to ensure it works for all uses
    hasNavigated.current = false;
    
    // Stop any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    // Reset animation value to 0 before starting - CRITICAL for subsequent navigations
    progress.setValue(0);

    // Small delay to ensure component is fully mounted and rendered before starting animation
    const timeoutId = setTimeout(() => {
      console.log('GroupCreatedScreen: Starting animation now');
      
      // Start animation immediately - screen content should already be visible
      // Animate progress bar from 0 to 100% over 3 seconds with smooth easing
      const animation = Animated.timing(progress, {
        toValue: 1,
        duration: 3000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      });

      animationRef.current = animation;
      
      console.log('GroupCreatedScreen: Animation created, starting...');
      animation.start((finished) => {
        console.log('GroupCreatedScreen: Animation callback, finished:', finished);
        
        if (!finished) {
          console.log('GroupCreatedScreen: Animation was cancelled');
          return;
        }
        
        if (hasNavigated.current) {
          console.log('GroupCreatedScreen: Already navigated, skipping');
          return;
        }
        
        hasNavigated.current = true;
        console.log('GroupCreatedScreen: Animation complete, navigating to group-details');
        
        // Navigate directly to group-details with refresh parameter
        // Using push with a unique refresh timestamp ensures the screen reloads
        setTimeout(() => {
          if (hasNavigated.current === false) {
            console.log('GroupCreatedScreen: Navigation check failed, aborting');
            return;
          }
          
          console.log('GroupCreatedScreen: Navigating to group-details with groupId:', groupId);
          
          try {
            router.push({
              pathname: '/(tabs)/group-details',
              params: {
                groupId,
                refresh: Date.now().toString(), // Unique timestamp forces refresh
                timestamp: Date.now().toString(), // Additional unique key
                fromCreated: 'true', // Flag to indicate we came from group creation
              },
            });
            console.log('GroupCreatedScreen: Navigation command executed successfully');
          } catch (error) {
            console.error('GroupCreatedScreen: Navigation failed, trying fallback:', error);
            // Fallback navigation
            setTimeout(() => {
              router.replace({
                pathname: '/(tabs)/group-details',
                params: {
                  groupId,
                  refresh: Date.now().toString(),
                  timestamp: Date.now().toString(),
                  fromCreated: 'true',
                },
              });
            }, 100);
          }
        }, 200);
      });
    }, 150);

    // Cleanup: stop animation and clear timeout if component unmounts
    return () => {
      console.log('GroupCreatedScreen: Cleanup - stopping animation and clearing timeout');
      clearTimeout(timeoutId);
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      hasNavigated.current = false;
      progress.setValue(0);
    };
    // Include all params including timestamp in dependencies to ensure re-run on every navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, timestamp]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Decorative Elements */}
        {/* <View style={styles.decorativeContainer}>
          <View style={styles.decorativeLeft}>
            <IconSymbol name="checkmark.circle.fill" size={32} color="#4CAF50" />
          </View>
          <View style={styles.decorativeRight}>
            <IconSymbol name="checkmark.circle.fill" size={32} color="#4CAF50" />
          </View>
        </View> */}

        {/* Main Content Card */}
        <View style={styles.card}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <IconSymbol name="checkmark.circle.fill" size={64} color="#4CAF50" />
            <Text style={styles.groupCreatedText}>Group Created</Text>
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
            <Text style={styles.progressText}>Loading group details...</Text>
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
    alignItems: 'center',
    marginBottom: 32,
  },
  groupCreatedText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 36,
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

