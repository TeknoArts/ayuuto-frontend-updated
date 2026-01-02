import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Share, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getGroupDetails, spinForOrder, type Group, type Participant } from '@/utils/api';
import { getUserData, UserData } from '@/utils/auth';

export default function GroupDetailsScreen() {
  const params = useLocalSearchParams();
  const groupId = params.groupId as string;
  const viewOnly = params.viewOnly === 'true'; // Check if viewing via shared link
  
  const [group, setGroup] = useState<Group | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await getUserData();
      setUser(storedUser);
    };
    loadUser();
  }, []);

  const loadGroupDetails = useCallback(async () => {
    if (!groupId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const groupData = await getGroupDetails(groupId);
      if (groupData) {
        setGroup(groupData);
        
        // Check if current user is the owner
        if (user && groupData.createdBy) {
          const createdById = typeof groupData.createdBy === 'object' 
            ? groupData.createdBy.id 
            : groupData.createdBy;
          const userId = user.id;
          const userIsOwner = createdById?.toString() === userId?.toString() ||
                             createdById === userId;
          setIsOwner(userIsOwner);
        }
      }
    } catch (error: any) {
      console.error('Error loading group details:', error);
      // Show user-friendly error message
      Alert.alert(
        'Error',
        error?.message || 'Failed to load group details. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => loadGroupDetails(),
          },
          {
            text: 'Go Back',
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  }, [groupId, user]);

  // Track if we just navigated with a refresh param to prevent duplicate reloads
  const refreshHandledRef = useRef<string | null>(null);

  // Force reload when refresh param changes (from loading screens)
  useEffect(() => {
    const refreshParam = params.refresh as string;
    if (refreshParam && groupId && refreshHandledRef.current !== refreshParam) {
      console.log('GroupDetailsScreen: Refresh param detected, reloading group details');
      refreshHandledRef.current = refreshParam;
      // Small delay to ensure navigation is complete before reloading
      setTimeout(() => {
        loadGroupDetails();
      }, 300);
    }
  }, [params.refresh, groupId, loadGroupDetails]);

  useEffect(() => {
    if (groupId) {
      loadGroupDetails();
    }
  }, [groupId, loadGroupDetails]);

  // Reload when screen comes into focus (useful when navigating back)
  // Skip if we just handled a refresh param to avoid duplicate reloads
  useFocusEffect(
    useCallback(() => {
      if (groupId) {
        const refreshParam = params.refresh as string;
        // Only reload on focus if there's no refresh param (to avoid duplicate calls)
        if (!refreshParam) {
          console.log('GroupDetailsScreen: Screen focused, reloading group details');
          // Add a small delay to ensure previous navigation is complete
          const timer = setTimeout(() => {
            loadGroupDetails();
          }, 200);
          return () => clearTimeout(timer);
        } else {
          console.log('GroupDetailsScreen: Screen focused but refresh param present, skipping reload');
        }
      }
    }, [groupId, loadGroupDetails, params.refresh])
  );

  const handleSpin = async () => {
    if (isSpinning || !group || group.isOrderSet) return;
    
    setIsSpinning(true);
    
    try {
      const updatedGroup = await spinForOrder(groupId);
      if (updatedGroup) {
        setGroup(updatedGroup);
      } else {
        throw new Error('Failed to spin for order');
      }
    } catch (error: any) {
      console.error('Error spinning for order:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to spin for order. Please try again.'
      );
    } finally {
      setIsSpinning(false);
    }
  };

  const handlePaymentToggle = async (participantId: string, currentPaidStatus: boolean) => {
    // Prevent editing if user is not the owner or viewing via shared link
    if (!canEdit) {
      Alert.alert(
        'View Only',
        'You can only view this group. Only the group owner can make changes.'
      );
      return;
    }

    if (!group || !groupId) {
      console.warn('GroupDetailsScreen: Cannot toggle payment - group or groupId missing');
      Alert.alert('Error', 'Group information is missing. Please try again.');
      return;
    }

    try {
      const { updatePaymentStatus } = await import('@/utils/api');
      
      // Reload group first to ensure we have the latest state
      const latestGroup = await getGroupDetails(groupId);
      if (!latestGroup) {
        throw new Error('Failed to load group details');
      }
      setGroup(latestGroup);
      
      // Get sorted participants from latest group state
      const participants = latestGroup.participants || [];
      const sorted = latestGroup.isOrderSet
        ? [...participants].sort((a, b) => (a.order || 0) - (b.order || 0))
        : participants;
      
      // Check if this is the current recipient paying BEFORE updating
      const currentRecipientIndex = latestGroup.currentRecipientIndex || 0;
      const isFirstParticipant = sorted[currentRecipientIndex]?.id === participantId;
      const newPaidStatus = !currentPaidStatus;
      
      if (isFirstParticipant && newPaidStatus) {
        // For current recipient paying, update status first
        await updatePaymentStatus(groupId, participantId, true);
        
        // Reload again to get the updated payment status
        const updatedGroup = await getGroupDetails(groupId);
        if (!updatedGroup) {
          throw new Error('Failed to reload group after payment update');
        }
        setGroup(updatedGroup);
        
        // Calculate total savings amount (amount per person * member count)
        const totalSavings = updatedGroup.totalSavings || (updatedGroup.amountPerPerson || 0) * (updatedGroup.memberCount || 0);
        
        // Get current recipient info for dynamic display
        const currentRecipientIndex = updatedGroup.currentRecipientIndex || 0;
        const sortedParticipants = updatedGroup.isOrderSet
          ? [...(updatedGroup.participants || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
          : (updatedGroup.participants || []);
        const currentRecipient = sortedParticipants[currentRecipientIndex];
        const recipientName = currentRecipient?.name || '';
        const roundNumber = (currentRecipientIndex + 1).toString();
        
        // Navigate to payment processing screen
        try {
          router.push({
            pathname: '/(tabs)/payment-processing',
            params: {
              groupId,
              amount: totalSavings.toString(),
              recipientName,
              roundNumber,
              timestamp: Date.now().toString(), // Force remount on each navigation
            },
          });
        } catch (navError) {
          console.error('Navigation error:', navError);
          // Reload to show updated state even if navigation fails
          await loadGroupDetails();
          throw new Error('Failed to navigate to payment screen');
        }
      } else {
        // For other participants, just toggle payment status
        await updatePaymentStatus(groupId, participantId, newPaidStatus);
        
        // Reload group details to get updated payment status
        const updatedGroup = await getGroupDetails(groupId);
        if (updatedGroup) {
          setGroup(updatedGroup);
        }
      }
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to update payment status. Please try again.'
      );
      // Reload group details on error to ensure state is correct
      try {
        const updatedGroup = await getGroupDetails(groupId);
        if (updatedGroup) {
          setGroup(updatedGroup);
        }
      } catch (reloadError) {
        console.error('Error reloading group details:', reloadError);
      }
    }
  };

  if (isLoading || !group) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate total savings (amount per person * member count)
  const totalSavings = group.totalSavings ?? 
    ((group.amountPerPerson ?? 0) * (group.memberCount ?? 0));
  const savingsAmount = totalSavings > 0 ? totalSavings.toString() : '0';
  const collectionDay = group.collectionDate?.toString() || '2';
  const participants = group.participants || [];
  const sortedParticipants = group.isOrderSet
    ? [...participants].sort((a, b) => (a.order || 0) - (b.order || 0))
    : participants;
  const nextRecipient = group.currentRecipient || null;
  
  // Check if all participants have received payment (group is completed)
  const allParticipantsPaidOut = sortedParticipants.length > 0 && 
    sortedParticipants.every(p => p.hasReceivedPayment === true);

  const handleShare = async () => {
    if (!group) return;

    try {
      // Generate shareable link with viewOnly parameter
      const shareableLink = `ayuuto://group-details?groupId=${groupId}&viewOnly=true`;
      
      // Build share message with group details
      const participantsList = sortedParticipants
        .map((p, idx) => {
          const order = group.isOrderSet && p.order ? `${p.order}. ` : '';
          const status = p.hasReceivedPayment ? ' (PAID OUT)' : p.isPaid ? ' (PAID)' : ' (UNPAID)';
          return `${order}${p.name.toUpperCase()}${status}`;
        })
        .join('\n');

      const currentRecipientInfo = group.isOrderSet && group.currentRecipient
        ? `\nCurrent Recipient: ${group.currentRecipient.toUpperCase()}`
        : '';

      const shareMessage = `AYUUTO GROUP: ${group.name.toUpperCase()}\n\n` +
        `Total Savings: $${savingsAmount}\n` +
        `Members: ${group.memberCount}\n` +
        `Amount per Person: $${group.amountPerPerson || 0}\n` +
        `Collection Day: ${collectionDay}\n` +
        `${currentRecipientInfo}\n\n` +
        `Participants:\n${participantsList}\n\n` +
        `View Group: ${shareableLink}\n\n` +
        `Shared from Ayuuto App`;

      const result = await Share.share({
        message: shareMessage,
        title: `Ayuuto Group: ${group.name}`,
        url: shareableLink, // For apps that support URL sharing
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          console.log('Shared with activity type:', result.activityType);
        } else {
          // Shared
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log('Share dismissed');
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to share group details. Please try again.'
      );
    }
  };

  // Determine if user can edit (must be owner and not viewing via shared link)
  const canEdit = isOwner && !viewOnly;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              // Navigate to home and force refresh
              router.replace({
                pathname: '/(tabs)',
                params: { refresh: Date.now().toString() },
              });
            }}>
            <IconSymbol name="chevron.left" size={20} color="#61a5fb" />
            <Text style={styles.backText}>HOME</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scrollButton}>
            <IconSymbol name="doc.text.fill" size={20} color="#D4A574" />
          </TouchableOpacity>
        </View>

        {/* Read-Only Banner - Show when viewing via shared link */}
        {viewOnly && (
          <View style={styles.readOnlyBanner}>
            <IconSymbol name="eye.fill" size={16} color="#FFD700" />
            <Text style={styles.readOnlyText}>VIEW ONLY MODE - You can view but not edit this group</Text>
          </View>
        )}

        {/* Savings Card */}
        <View style={styles.savingsCard}>
          <View style={styles.savingsCardHeader}>
            <Text style={styles.savingsTitle}>SAVINGS</Text>
            {allParticipantsPaidOut ? (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>COMPLETED</Text>
              </View>
            ) : (
              <View style={styles.adminBadge}>
                <Text style={styles.adminText}>ADMIN</Text>
              </View>
            )}
          </View>

          <View style={styles.savingsAmountSection}>
            <View style={styles.amountLeft}>
              <IconSymbol name="dollarsign.circle.fill" size={40} color="#FFD700" />
              <Text style={styles.amountText}>{savingsAmount}</Text>
            </View>
            <View style={styles.nextRecipient}>
              <Text style={styles.nextRecipientLabel}>NEXT RECIPIENT</Text>
              <View style={styles.nextRecipientValue}>
                {allParticipantsPaidOut ? (
                  <View style={styles.progressIndicator}>
                    {sortedParticipants.map((_, index) => (
                      <View key={index} style={styles.progressBarSegment} />
                    ))}
                  </View>
                ) : nextRecipient ? (
                  <Text style={styles.nextRecipientName}>{nextRecipient.toUpperCase()}</Text>
                ) : (
                  <Text style={styles.questionMarks}>???</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.collectionDayContainer}>
            <Text style={styles.collectionDay}>COLLECTION DAY: {collectionDay}</Text>
          </View>
        </View>

        {/* Spin For Order Button - Only show if order is not set and user can edit */}
        {!group.isOrderSet && canEdit && (
          <TouchableOpacity 
            style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]}
            onPress={handleSpin}
            disabled={isSpinning}>
            <IconSymbol name="dice.fill" size={20} color="#001a3c" />
            <Text style={styles.spinButtonText}>
              {isSpinning ? 'SPINNING...' : 'SPIN FOR ORDER'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Payment Status Section */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentHeader}>
            <Text style={styles.paymentTitle}>PAYMENT STATUS</Text>
            {/* Share button - Only show to owners */}
            {isOwner && (
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleShare}
                activeOpacity={0.8}>
                <IconSymbol name="square.and.arrow.up" size={16} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>SHARE</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Participants List */}
          <View style={styles.participantsList}>
            {sortedParticipants.map((participant: Participant, index: number) => {
              const currentRecipientIndex = group.currentRecipientIndex || 0;
              const isFirst = index === currentRecipientIndex && group.isOrderSet;
              const isPaid = participant.isPaid === true;
              // Explicitly check for hasReceivedPayment - if it's true, participant has already received payment
              const hasReceivedPayment = participant.hasReceivedPayment === true;
              
              // Check if all other participants (excluding the current recipient) have paid
              // Note: Paid-out members still need to pay in subsequent rounds
              const otherParticipants = sortedParticipants.filter((_, i) => 
                i !== currentRecipientIndex
              );
              const allOthersPaid = otherParticipants.length > 0 && 
                otherParticipants.every(p => p.isPaid === true);
              
              // Determine if checkbox should be shown:
              // - Only show checkboxes AFTER order is set (group.isOrderSet must be true)
              // - Show checkbox for all participants except current recipient
              // - Paid-out members can still pay in subsequent rounds
              // IMPORTANT: Checkboxes are hidden until order is set via spinning
              const shouldShowCheckbox = group.isOrderSet === true && !isFirst;
              
              return (
                <View 
                  key={participant.id || index} 
                  style={[
                    styles.participantCard,
                    (isFirst && styles.participantCardPaid),
                    (isPaid && !isFirst && styles.participantCardPaid),
                    (allParticipantsPaidOut && styles.participantCardPaid)
                  ]}>
                  <View style={styles.participantTopRow}>
                    <View style={styles.participantLeft}>
                      {group.isOrderSet && participant.order && (
                        <View style={[
                          styles.orderNumber,
                          (isFirst || isPaid) && styles.orderNumberPaid,
                          allParticipantsPaidOut && styles.orderNumberPaid
                        ]}>
                          <Text style={styles.orderNumberText}>{participant.order}</Text>
                        </View>
                      )}
                      <Text style={styles.participantName}>{participant.name.toUpperCase()}</Text>
                      {/* Show PAID OUT tag next to name for participants who have received payment */}
                      {hasReceivedPayment && (
                        <View style={styles.paidOutTagInline}>
                          <Text style={styles.paidOutTextInline}>PAID OUT</Text>
                        </View>
                      )}
                    </View>
                    
            {/* Other Participants - Show checkbox or PAID status on the right (only if group is not completed and user can edit) */}
            {shouldShowCheckbox && !allParticipantsPaidOut && canEdit && (
              <View style={styles.paymentStatusContainer}>
                {isPaid ? (
                  <>
                    <Text style={styles.paidStatus}>PAID</Text>
                    <TouchableOpacity
                      style={styles.checkboxChecked}
                      onPress={() => participant.id && handlePaymentToggle(participant.id, true)}
                      activeOpacity={0.7}>
                      <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.paymentStatus}>UNPAID</Text>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => participant.id && handlePaymentToggle(participant.id, false)}
                      activeOpacity={0.7}>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
            {/* Show read-only status when in view-only mode */}
            {shouldShowCheckbox && !allParticipantsPaidOut && !canEdit && (
              <View style={styles.paymentStatusContainer}>
                {isPaid ? (
                  <Text style={styles.paidStatus}>PAID</Text>
                ) : (
                  <Text style={styles.paymentStatus}>UNPAID</Text>
                )}
              </View>
            )}
                    {/* Show PAID OUT tag on the right when group is completed */}
                    {allParticipantsPaidOut && hasReceivedPayment && (
                      <View style={styles.paidOutTagInline}>
                        <Text style={styles.paidOutTextInline}>PAID OUT</Text>
                      </View>
                    )}
                  </View>
                  
          {/* Current Recipient - Show PAY NOW button (only if they haven't received payment before and user can edit) */}
          {isFirst && !hasReceivedPayment && !isPaid && allOthersPaid && canEdit && !allParticipantsPaidOut && (
            <TouchableOpacity
              style={styles.payNowButton}
              onPress={() => participant.id && handlePaymentToggle(participant.id, false)}
              activeOpacity={0.8}>
              <Text style={styles.payNowButtonText}>PAY NOW</Text>
              <IconSymbol name="dollarsign.circle.fill" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Completion Card - Show when all participants have been paid out */}
        {allParticipantsPaidOut && (
          <View style={styles.completionCard}>
            <IconSymbol name="trophy.fill" size={60} color="#FFD700" />
            <Text style={styles.completionTitle}>AYUUTO COMPLETED</Text>
            <Text style={styles.completionMessage}>ALL MEMBERS HAVE BEEN PAID OUT SAFELY.</Text>
          </View>
        )}

        {/* NEXT ROUND Button - Show when current recipient has paid and group is not completed and user can edit */}
        {group.isOrderSet && !allParticipantsPaidOut && canEdit && (() => {
          const currentRecipientIndex = group.currentRecipientIndex || 0;
          const currentRecipient = sortedParticipants[currentRecipientIndex];
          return currentRecipient?.isPaid === true;
        })() && (
          <TouchableOpacity
            style={styles.nextRoundButton}
            onPress={async () => {
              if (!groupId) {
                console.error('GroupDetailsScreen: Cannot start next round - groupId missing');
                return;
              }
              
              try {
                console.log('NEXT ROUND button clicked, groupId:', groupId);
                
                // Reload group first to ensure we have the latest state
                const latestGroup = await getGroupDetails(groupId);
                if (!latestGroup) {
                  throw new Error('Failed to load group details');
                }
                setGroup(latestGroup);
                
                const { nextRound } = await import('@/utils/api');
                // Call nextRound API
                console.log('Calling nextRound API...');
                await nextRound(groupId);
                console.log('nextRound API call successful, navigating to next-round screen');
                
                // Get next recipient info for dynamic display
                // Reload group to get updated state after nextRound
                const updatedGroupAfterNext = await getGroupDetails(groupId);
                if (updatedGroupAfterNext) {
                  const sortedParticipants = updatedGroupAfterNext.isOrderSet
                    ? [...(updatedGroupAfterNext.participants || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
                    : (updatedGroupAfterNext.participants || []);
                  const nextRecipientIndex = updatedGroupAfterNext.currentRecipientIndex || 0;
                  const nextRecipient = sortedParticipants[nextRecipientIndex];
                  const nextRecipientName = nextRecipient?.name || '';
                  const roundNumber = (nextRecipientIndex + 1).toString();
                  
                  // Navigate to next-round loading screen
                  console.log('GroupDetailsScreen: Attempting to navigate to next-round screen with groupId:', groupId);
                  try {
                    router.push({
                      pathname: '/(tabs)/next-round',
                      params: {
                        groupId,
                        nextRecipientName,
                        roundNumber,
                        timestamp: Date.now().toString(), // Force remount on each navigation
                      },
                    });
                    console.log('GroupDetailsScreen: Navigation command sent to next-round screen');
                  } catch (navError) {
                    console.error('Navigation error:', navError);
                    // Reload to show updated state even if navigation fails
                    await loadGroupDetails();
                    throw new Error('Failed to navigate to next round screen');
                  }
                } else {
                  // Fallback if group reload fails
                  router.push({
                    pathname: '/(tabs)/next-round',
                    params: {
                      groupId,
                    },
                  });
                }
              } catch (error: any) {
                console.error('Error starting next round:', error);
                Alert.alert(
                  'Error',
                  error?.message || 'Failed to start next round. Please try again.'
                );
                // Reload group details on error
                try {
                  const updatedGroup = await getGroupDetails(groupId);
                  if (updatedGroup) {
                    setGroup(updatedGroup);
                  }
                } catch (reloadError) {
                  console.error('Error reloading group details:', reloadError);
                }
              }
            }}
            activeOpacity={0.8}>
            <Text style={styles.nextRoundButtonText}>NEXT ROUND</Text>
            <IconSymbol name="party.popper.fill" size={20} color="#001a3c" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(1 27 61)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  readOnlyBanner: {
    backgroundColor: '#1a2332',
    borderColor: '#FFD700',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  readOnlyText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    color: '#61a5fb',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scrollButton: {
    padding: 8,
  },
  savingsCard: {
    backgroundColor: '#001b3d',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    padding: 20,
    marginBottom: 20,
  },
  savingsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  savingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
  },
  adminBadge: {
    backgroundColor: '#002452',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  adminText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  savingsAmountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nextRecipient: {
    alignItems: 'flex-end',
  },
  nextRecipientLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  nextRecipientValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  questionMarks: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  collectionDayContainer: {
    marginTop: 8,
  },
  collectionDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  spinButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  spinButtonDisabled: {
    opacity: 0.7,
  },
  spinButtonText: {
    color: '#001a3c',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  nextRecipientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentSection: {
    marginTop: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#bc9426',
    letterSpacing: 1,
  },
  shareButton: {
    backgroundColor: '#0a2a69',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  participantsList: {
    gap: 12,
  },
  participantCard: {
    backgroundColor: '#002452',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9BA1A6',
    padding: 16,
  },
  participantCardPaid: {
    borderColor: '#4CAF50',
  },
  participantTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderNumber: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#9BA1A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNumberPaid: {
    backgroundColor: '#4CAF50',
  },
  orderNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentStatus: {
    fontSize: 14,
    color: '#687c97',
    fontWeight: '600',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#9BA1A6',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    width: 20,
    height: 20,
    borderWidth: 0,
    borderRadius: 4,
    backgroundColor: '#90EE90',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  paidOutTagInline: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  paidOutTextInline: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  payNowButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginTop: 8,
  },
  payNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  paidOutTag: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  paidOutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  nextRoundButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 20,
  },
  nextRoundButtonText: {
    color: '#001a3c',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  completedBadge: {
    backgroundColor: '#002452',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  progressIndicator: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  progressBarSegment: {
    width: 20,
    height: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  completionCard: {
    backgroundColor: '#04263b',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: 2,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  completionMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 24,
  },
});
