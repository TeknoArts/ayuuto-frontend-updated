import { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Text, Animated, Easing, BackHandler, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { createGroup } from '@/utils/api';
import { alert, confirm } from '@/utils/alert';

export default function GroupCreatedScreen() {
  const params = useLocalSearchParams();
  const groupName = params.groupName as string;
  const amount = params.amount as string;
  const collectionDate = params.collectionDate as string;
  const participantsJson = params.participants as string;
  const timestamp = params.timestamp as string || Date.now().toString();
  
  // Legacy support - if groupId is passed directly (old flow)
  const legacyGroupId = params.groupId as string;
  
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const hasNavigated = useRef(false);
  const [statusText, setStatusText] = useState('Creating your group...');
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(legacyGroupId || null);
  const [isCreating, setIsCreating] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle back button - show confirmation
  const handleBackPress = useCallback(() => {
    if (isCreating && !hasError) {
      // Group is being created, show confirmation
      confirm(
        'Leave Group Creation?',
        'Are you sure you want to leave? Your group is being created.',
        () => {
          // User confirmed - go to home
          router.replace('/(tabs)');
        },
        () => {
          // User cancelled - do nothing
        }
      );
      return true; // Prevent default back action
    } else if (hasError) {
      // Error occurred, go home
      router.replace('/(tabs)');
      return true;
    }
    return false;
  }, [isCreating, hasError]);

  // Handle Android hardware back button
  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }, [handleBackPress])
  );

  useEffect(() => {
    console.log('GroupCreatedScreen: Starting, groupName:', groupName, 'timestamp:', timestamp);
    
    // Reset flags
    hasNavigated.current = false;
    setIsCreating(true);
    setHasError(false);
    
    // Stop any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    // Reset animation value
    progress.setValue(0);

    // Create group if we have the data (new flow)
    const createGroupAsync = async () => {
      if (groupName && participantsJson && !legacyGroupId) {
        try {
          const participants = JSON.parse(participantsJson);
          const participantsData = participants.map((p: { name: string }) => ({
            name: p.name.trim(),
            email: null,
          }));
          
          const amountNum = parseFloat(amount) || 0;
          const collectionDateNum = parseInt(collectionDate) || 1;
          
          console.log('GroupCreatedScreen: Creating group with:', {
            groupName,
            participantCount: participantsData.length,
            amount: amountNum,
            collectionDate: collectionDateNum,
          });
          
          const newGroup = await createGroup(
            groupName,
            participantsData.length,
            participantsData,
            amountNum,
            collectionDateNum
          );
          
          console.log('GroupCreatedScreen: Group created successfully:', newGroup.id);
          setCreatedGroupId(newGroup.id);
          setStatusText('Group created successfully!');
          setIsCreating(false);
        } catch (error: any) {
          console.error('GroupCreatedScreen: Error creating group:', error);
          setStatusText('Error creating group');
          setIsCreating(false);
          setHasError(true);
          alert(
            'Error',
            error.message || 'Failed to create group. Please try again.',
            () => {
              // Navigate to home on dismiss
              router.replace('/(tabs)');
            }
          );
          return;
        }
      } else if (legacyGroupId) {
        // Legacy flow - group already created
        setStatusText('Group created successfully!');
        setIsCreating(false);
      } else {
        // No data - go home
        console.warn('GroupCreatedScreen: No data provided');
        router.replace('/(tabs)');
        return;
      }
    };

    // Start group creation
    createGroupAsync();

    // Start animation
    const timeoutId = setTimeout(() => {
      const animation = Animated.timing(progress, {
        toValue: 1,
        duration: 3000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      });

      animationRef.current = animation;
      
      animation.start((finished) => {
        if (!finished || hasNavigated.current) return;
        
        hasNavigated.current = true;
        
        // Wait a bit to ensure group is created
        setTimeout(() => {
          const groupId = createdGroupId || legacyGroupId;
          if (groupId) {
            router.replace({
              pathname: '/(tabs)/group-details',
              params: {
                groupId,
                refresh: Date.now().toString(),
                fromCreated: 'true',
              },
            });
          } else {
            // Group ID not ready yet, wait more
            setTimeout(() => {
              router.replace('/(tabs)');
            }, 3000);
          }
        }, 500);
      });
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      hasNavigated.current = false;
      progress.setValue(0);
    };
  }, [groupName, timestamp]);

  // Watch for createdGroupId changes to navigate
  useEffect(() => {
    if (createdGroupId && hasNavigated.current === false) {
      console.log('GroupCreatedScreen: Group ID ready:', createdGroupId);
    }
  }, [createdGroupId]);

  // Navigate when animation completes and group is ready
  useEffect(() => {
    const checkAndNavigate = () => {
      if (createdGroupId && progress._value >= 0.95 && !hasNavigated.current) {
        hasNavigated.current = true;
        router.replace({
          pathname: '/(tabs)/group-details',
          params: {
            groupId: createdGroupId,
            refresh: Date.now().toString(),
            fromCreated: 'true',
          },
        });
      }
    };

    const listener = progress.addListener(({ value }) => {
      if (value >= 0.95) {
        checkAndNavigate();
      }
    });

    return () => {
      progress.removeListener(listener);
    };
  }, [createdGroupId, progress]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Back button for iOS */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleBackPress}
        activeOpacity={0.7}>
        <IconSymbol name="xmark" size={20} color="#9BA1A6" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.headerSection}>
            <IconSymbol 
              name={hasError ? "xmark.circle.fill" : "checkmark.circle.fill"} 
              size={64} 
              color={hasError ? "#FF6B6B" : "#22C55E"} 
            />
            <Text style={styles.groupCreatedText}>
              {hasError ? 'Error' : 'Creating Group'}
            </Text>
            {groupName && (
              <Text style={styles.groupNameText}>{groupName}</Text>
            )}
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { width: progressWidth },
                  hasError && styles.progressBarError,
                ]}
              />
            </View>
            <Text style={styles.progressText}>{statusText}</Text>
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
  backButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  groupNameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
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
    backgroundColor: '#22C55E',
    borderRadius: 3,
  },
  progressBarError: {
    backgroundColor: '#FF6B6B',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9BA1A6',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
