import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Share, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LoadingBar } from '@/components/ui/loading-bar';
import {
  getGroupDetails,
  getGroupLogs,
  spinForOrder,
  enableGroupSharing,
  getGroupShareLink,
  type Group,
  type Participant,
  type GroupLogEntry,
} from '@/utils/api';
import { getUserData, UserData } from '@/utils/auth';
import { alert } from '@/utils/alert';
import { useI18n } from '@/utils/i18n';
import { formatParticipantName } from '@/utils/participant';

export default function GroupDetailsScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const groupId = params.groupId as string;
  const viewOnly = params.viewOnly === 'true'; // Check if viewing via shared link
  
  const [group, setGroup] = useState<Group | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [logs, setLogs] = useState<GroupLogEntry[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const isLoadingRef = useRef(false);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await getUserData();
      setUser(storedUser);
    };
    loadUser();
  }, []);

  const loadGroupDetails = useCallback(async (showLoading = false) => {
    if (!groupId) {
      setIsLoading(false);
      setIsInitialLoad(false);
      return;
    }

    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('GroupDetailsScreen: Load already in progress, skipping');
      return;
    }
    
    try {
      isLoadingRef.current = true;
      // Only show loading state on initial load or when explicitly requested
      if (isInitialLoad || showLoading) {
        setIsLoading(true);
      }
      setIsLogsLoading(true);

      const [groupData, logsData] = await Promise.all([
        getGroupDetails(groupId),
        getGroupLogs(groupId),
      ]);

      if (groupData) {
        setGroup(groupData);
        
        // Check if current user is the owner
        if (user && groupData.createdBy) {
          // Handle null createdBy (deleted user)
          if (typeof groupData.createdBy === 'object' && (!groupData.createdBy.id || groupData.createdBy.id === null)) {
            setIsOwner(false);
          } else {
            const createdById =
              typeof groupData.createdBy === 'object'
              ? groupData.createdBy.id 
              : groupData.createdBy;
            const userId = user.id;
            const userIsOwner =
              createdById?.toString() === userId?.toString() || createdById === userId;
            setIsOwner(userIsOwner);
          }
        }
      }

      if (logsData) {
        setLogs(logsData);
      }
    } catch (error: any) {
      console.error('Error loading group details:', error);
      // Show user-friendly error message
      alert(
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
      setIsLogsLoading(false);
      setIsInitialLoad(false);
      isLoadingRef.current = false;
    }
  }, [groupId, user, isInitialLoad]);

  // Track if we just navigated with a refresh param to prevent duplicate reloads
  const refreshHandledRef = useRef<string | null>(null);

  // Force reload when refresh param changes (from loading screens) - silent reload
  useEffect(() => {
    const refreshParam = params.refresh as string;
    if (refreshParam && groupId && refreshHandledRef.current !== refreshParam) {
      console.log('GroupDetailsScreen: Refresh param detected, reloading group details (silent)');
      refreshHandledRef.current = refreshParam;
      // Small delay to ensure navigation is complete before reloading
      setTimeout(() => {
        loadGroupDetails(false); // Silent reload
      }, 300);
    }
  }, [params.refresh, groupId, loadGroupDetails]);

  useEffect(() => {
    if (groupId) {
      // Only show loading on initial load when groupId changes
      loadGroupDetails(true);
    }
  }, [groupId, loadGroupDetails]);

  // Reload when screen comes into focus (useful when navigating back) - silent reload
  // Skip if we just handled a refresh param to avoid duplicate reloads
  useFocusEffect(
    useCallback(() => {
      if (groupId) {
        const refreshParam = params.refresh as string;
        // Only reload on focus if there's no refresh param (to avoid duplicate calls)
        if (!refreshParam) {
          console.log('GroupDetailsScreen: Screen focused, reloading group details (silent)');
          // Add a small delay to ensure previous navigation is complete
          const timer = setTimeout(() => {
            loadGroupDetails(false); // Silent reload
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

        // After spinning, show a loading/animation screen similar to Next Round
        const participants = updatedGroup.participants || [];
        const sorted = updatedGroup.isOrderSet
          ? [...participants].sort((a, b) => (a.order || 0) - (b.order || 0))
          : participants;
        const currentIndex = updatedGroup.currentRecipientIndex || 0;
        const current = sorted[currentIndex];
        const nextRecipientName = formatParticipantName(current?.name || '');
        const roundNumber = (currentIndex + 1).toString();

        router.push({
          pathname: '/(tabs)/next-round',
          params: {
            groupId,
            nextRecipientName,
            roundNumber,
            mode: 'spin',
            timestamp: Date.now().toString(), // Force remount per spin
          },
        });
      } else {
        throw new Error('Failed to spin for order');
      }
    } catch (error: any) {
      console.error('Error spinning for order:', error);
      alert(
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
      alert(
        'View Only',
        'You can only view this group. Only the group owner can make changes.'
      );
      return;
    }

    if (!group || !groupId) {
      console.warn('GroupDetailsScreen: Cannot toggle payment - group or groupId missing');
      alert('Error', 'Group information is missing. Please try again.');
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
        const recipientName = formatParticipantName(currentRecipient?.name || '');
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
        
        // Reload group details and logs to get updated payment status & history
        const [updatedGroup, logsData] = await Promise.all([
          getGroupDetails(groupId),
          getGroupLogs(groupId),
        ]);
        if (updatedGroup) {
          setGroup(updatedGroup);
        }
        if (logsData) {
          setLogs(logsData);
        }
      }
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      alert(
        'Error',
        error?.message || 'Failed to update payment status. Please try again.'
      );
      // Reload group details on error to ensure state is correct
      try {
        const [updatedGroup, logsData] = await Promise.all([
          getGroupDetails(groupId),
          getGroupLogs(groupId),
        ]);
        if (updatedGroup) {
          setGroup(updatedGroup);
        }
        if (logsData) {
          setLogs(logsData);
        }
      } catch (reloadError) {
        console.error('Error reloading group details:', reloadError);
      }
    }
  };

  if (isLoading || !group) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LoadingBar />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} text="Loading group details..." fullScreen />
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
  // Format next recipient name if it's an email
  const nextRecipient = group.currentRecipient 
    ? formatParticipantName(group.currentRecipient) 
    : null;
  const participantsCount = participants.length;
  const isParticipantsComplete =
    (group.memberCount ?? 0) > 0 &&
    participantsCount === (group.memberCount ?? 0);
  
  // Check if all participants have received payment at least once (group fully paid out)
  const allParticipantsPaidOut =
    sortedParticipants.length > 0 &&
    sortedParticipants.every((p) => p.hasReceivedPayment === true);

  // Check if everyone has paid into the *current* round
  const allParticipantsPaidThisRound =
    sortedParticipants.length > 0 &&
    sortedParticipants.every((p) => p.isPaid === true);

  // Check if all rounds are completed according to backend round status
  const allRoundsCompleted =
    group.rounds && group.rounds.length > 0
      ? group.rounds.every((round) => round.status === 'COMPLETED')
      : false;

  // Final group completion flag used for UI:
  // - everyone has received payout (backend rounds progressed), OR
  // - all rounds are marked COMPLETED by backend, OR
  // - last round and everyone has paid this round (frontend safety net)
  const isLastRound =
    sortedParticipants.length > 0 &&
    (group.currentRecipientIndex || 0) >= sortedParticipants.length - 1;

  const isGroupCompleted =
    allParticipantsPaidOut ||
    allRoundsCompleted ||
    (isLastRound && allParticipantsPaidThisRound);

  // Convenience: is the current recipient already marked paid for this round?
  const currentRecipientIndexGlobal = group.currentRecipientIndex || 0;
  const currentRecipientPaid =
    sortedParticipants[currentRecipientIndexGlobal]?.isPaid === true;

  const handleShare = async () => {
    if (!group) {
      alert('Error', 'Group information not available');
      return;
    }

    if (!isOwner) {
      alert('Error', 'Only group admin can share the group link');
      return;
    }

    try {
      let shareLink: string;

      try {
        // Try to get existing share link
        console.log('[Share] Attempting to get existing share link for group:', groupId);
        const shareData = await getGroupShareLink(groupId);
        shareLink = shareData.shareLink;
        console.log('[Share] Got existing share link:', shareLink);
      } catch (error: any) {
        console.log('[Share] Failed to get share link, error:', error.message);
        // If sharing not enabled or any error, try to enable it
        try {
          console.log('[Share] Attempting to enable sharing for group:', groupId);
          const shareData = await enableGroupSharing(groupId);
          shareLink = shareData.shareLink;
          console.log('[Share] Enabled sharing and got link:', shareLink);
        } catch (enableError: any) {
          console.error('[Share] Failed to enable sharing:', enableError);
          throw new Error(enableError?.message || 'Failed to create share link. Please try again.');
        }
      }

      if (!shareLink) {
        throw new Error('Share link not generated');
      }

      // Build share message
      const shareMessage = `Check out this Ayuuto group: ${group.name}\n\n` +
        `View the group details: ${shareLink}\n\n` +
        `Shared from Ayuuto App`;

      console.log('[Share] Sharing link:', shareLink);

      // Check if Share API is available
      if (!Share || typeof Share.share !== 'function') {
        throw new Error('Share functionality is not available on this device');
      }

      const result = await Share.share({
        message: shareMessage,
        title: `Ayuuto Group: ${group.name}`,
        url: shareLink,
      });

      if (result.action === Share.sharedAction) {
        console.log('[Share] Share link shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('[Share] Share dismissed by user');
      }
    } catch (error: any) {
      console.error('[Share] Error sharing:', error);
      const errorMessage = error?.message || 'Failed to share group link. Please try again.';
      alert('Error', errorMessage);
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
        </View>
        {group && (
          <View style={styles.groupNameContainer}>
            <Text style={styles.groupName} numberOfLines={2}>
              {group.name.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Read-Only Banner - Show when viewing via shared link */}
        {viewOnly && (
          <View style={styles.readOnlyBanner}>
            <IconSymbol name="eye.fill" size={16} color="#FFD700" />
            <Text style={styles.readOnlyText}>{t('viewOnlyMode')}</Text>
          </View>
        )}

        {/* Savings Card */}
        <View style={styles.savingsCard}>
          <View style={styles.savingsCardHeader}>
            <Text style={styles.savingsTitle}>{t('savings')}</Text>
            {allParticipantsPaidOut && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>{t('completed')}</Text>
              </View>
            )}
          </View>

          <View style={styles.savingsAmountSection}>
            <View style={styles.amountLeft}>
              <IconSymbol name="dollarsign.circle.fill" size={40} color="#FFD700" />
              <Text style={styles.amountText}>{savingsAmount}</Text>
            </View>
            <View style={styles.nextRecipient}>
              <Text style={styles.nextRecipientLabel}>{t('nextRecipient')}</Text>
              <View style={styles.nextRecipientValue}>
                {allParticipantsPaidOut ? (
                  <View style={styles.progressIndicator}>
                    {sortedParticipants.map((_, index) => (
                      <View key={index} style={styles.progressBarSegment} />
                    ))}
                  </View>
                ) : nextRecipient ? (
                  <Text style={styles.nextRecipientName}>{formatParticipantName(nextRecipient).toUpperCase()}</Text>
                ) : (
                  <Text style={styles.questionMarks}>???</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.collectionDayContainer}>
            <Text style={styles.collectionDay}>{t('collectionDay')} {collectionDay}</Text>
          </View>
        </View>

        {/* Manage Participants Button - show when group is missing participants and user can edit */}
        {canEdit && !group.isOrderSet && !isParticipantsComplete && (
          <TouchableOpacity
            style={[styles.spinButton, styles.addParticipantsButton]}
            onPress={() => {
              if (!groupId) return;
              router.push({
                pathname: '/(tabs)/manage-participants',
                params: {
                  groupId,
                  groupName: group.name,
                  memberCount: (group.memberCount ?? 0).toString(),
                },
              });
            }}
            activeOpacity={0.8}>
            <IconSymbol name="person.2.fill" size={20} color="#001a3c" />
            <Text style={styles.spinButtonText}>{t('manageParticipants')}</Text>
          </TouchableOpacity>
        )}

        {/* Spin For Order Button - Only show if order is not set, user can edit, and participants complete */}
        {!group.isOrderSet && canEdit && isParticipantsComplete && (
          <TouchableOpacity 
            style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]}
            onPress={handleSpin}
            disabled={isSpinning}>
            <IconSymbol name="dice.fill" size={20} color="#001a3c" />
            <Text style={styles.spinButtonText}>
              {isSpinning ? t('spinning') : t('spinForOrder')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Payment Status Section */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentHeader}>
            <Text style={styles.paymentTitle}>{t('paymentStatus')}</Text>
            {/* Share button - Only show to owners */}
            {isOwner && handleShare && (
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleShare}
                activeOpacity={0.8}>
                <IconSymbol name="square.and.arrow.up" size={16} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>{t('share') || 'Share'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Participants List */}
          <View style={styles.participantsList}>
            {sortedParticipants.map((participant: Participant, index: number) => {
              const currentRecipientIndex = group.currentRecipientIndex || 0;
              const isFirst = index === currentRecipientIndex && group.isOrderSet;
              const isPaid = participant.isPaid === true;
              // Participant has already received payout in some round,
              // OR (for current recipient) has just been paid this round.
              const hasReceivedPayment =
                participant.hasReceivedPayment === true ||
                (isFirst && isPaid);
              
              const rawName = (participant as any).user?.name || participant.name;
              const displayName = formatParticipantName(rawName);
              
              // Check if all other participants (excluding the current recipient) have paid
              // Note: Paid-out members still need to pay in subsequent rounds
              const otherParticipants = sortedParticipants.filter((_, i) => 
                i !== currentRecipientIndex
              );
              const allOthersPaid =
                otherParticipants.length > 0 &&
                otherParticipants.every((p) => p.isPaid === true);
              
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
                    (isGroupCompleted && styles.participantCardPaid)
                  ]}>
                  <View style={styles.participantTopRow}>
                    <View style={styles.participantLeft}>
                      {group.isOrderSet && participant.order && (
                        <View style={[
                          styles.orderNumber,
                          (isFirst || isPaid) && styles.orderNumberPaid,
                          isGroupCompleted && styles.orderNumberPaid
                        ]}>
                          <Text style={styles.orderNumberText}>{participant.order}</Text>
                        </View>
                      )}
                      <Text style={styles.participantName}>{(displayName || '').toUpperCase()}</Text>
                      {/* Show PAID OUT tag next to name for participants who have received payment (only when group is NOT completed) */}
                      {hasReceivedPayment && !isGroupCompleted && (
                        <View style={styles.paidOutTagInline}>
                          <Text style={styles.paidOutTextInline}>{t('paidOut')}</Text>
                        </View>
                      )}
                    </View>
                    
            {/* Other Participants - Show checkbox or PAID status on the right (only if group is not completed and user can edit) */}
            {/* Editable checkboxes: only when group not completed AND current recipient not yet paid */}
            {shouldShowCheckbox && !isGroupCompleted && canEdit && !currentRecipientPaid && (
              <View style={styles.paymentStatusContainer}>
                {isPaid ? (
                  <>
                    <Text style={styles.paidStatus}>{t('paid')}</Text>
                    <TouchableOpacity
                      style={styles.checkboxChecked}
                      onPress={() => participant.id && handlePaymentToggle(participant.id, true)}
                      activeOpacity={0.7}>
                      <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.paymentStatus}>{t('unpaid')}</Text>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => participant.id && handlePaymentToggle(participant.id, false)}
                      activeOpacity={0.7}>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
            {/* Read-only status when group is completed, current recipient paid, or view-only */}
            {shouldShowCheckbox &&
              (!isGroupCompleted && (!canEdit || currentRecipientPaid)) && (
              <View style={styles.paymentStatusContainer}>
                {isPaid ? (
                  <Text style={styles.paidStatus}>{t('paid')}</Text>
                ) : (
                  <Text style={styles.paymentStatus}>{t('unpaid')}</Text>
                )}
              </View>
            )}
                    {/* Show PAID OUT tag on the right when group is completed (only one badge when completed) */}
                    {isGroupCompleted && hasReceivedPayment && (
                      <View style={styles.paidOutTagInline}>
                        <Text style={styles.paidOutTextInline}>{t('paidOut')}</Text>
                      </View>
                    )}
                  </View>
                  
          {/* Current Recipient - Show PAY NOW button (only if they haven't received payment before and user can edit) */}
          {isFirst && !hasReceivedPayment && !isPaid && allOthersPaid && canEdit && !allParticipantsPaidOut && (
            <TouchableOpacity
              style={styles.payNowButton}
              onPress={() => participant.id && handlePaymentToggle(participant.id, false)}
              activeOpacity={0.8}>
              <Text style={styles.payNowButtonText}>{t('payNow')}</Text>
              <IconSymbol name="dollarsign.circle.fill" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
                </View>
              );
            })}
          </View>
        </View>

        {/* NEXT ROUND Button - Show when current recipient has paid and group is not completed and user can edit */}
        {group.isOrderSet && !isGroupCompleted && canEdit && (() => {
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
                
                const { nextRound } = await import('@/utils/api');
                console.log('Calling nextRound API...');
                const updatedGroup = await nextRound(groupId);
                console.log('nextRound API call successful');

                // Update local state with latest group data (including rounds)
                setGroup(updatedGroup);

                // Compute next recipient and round number from updated group
                const participants = updatedGroup.participants || [];
                const sorted = updatedGroup.isOrderSet
                  ? [...participants].sort((a, b) => (a.order || 0) - (b.order || 0))
                  : participants;

                let nextRecipientName = '';
                let roundNumber = '1';

                if (updatedGroup.currentRound && updatedGroup.rounds) {
                  roundNumber = updatedGroup.currentRound.roundNumber.toString();
                  const recipient = sorted.find(
                    (p) => p.id === updatedGroup.currentRound!.recipientParticipantId
                  );
                  nextRecipientName = formatParticipantName(recipient?.name || '');
                } else {
                  const nextIndex = updatedGroup.currentRecipientIndex || 0;
                  const nextRecipient = sorted[nextIndex];
                  nextRecipientName = formatParticipantName(nextRecipient?.name || '');
                  roundNumber = (nextIndex + 1).toString();
                }
                  
                  // Navigate to next-round loading screen
                console.log(
                  'GroupDetailsScreen: Navigating to next-round screen with groupId:',
                  groupId,
                  'round:',
                  roundNumber,
                  'recipient:',
                  nextRecipientName
                );

                    router.push({
                      pathname: '/(tabs)/next-round',
                      params: {
                        groupId,
                        nextRecipientName,
                        roundNumber,
                        timestamp: Date.now().toString(), // Force remount on each navigation
                      },
                    });
              } catch (error: any) {
                console.error('Error starting next round:', error);
                alert(
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
            <Text style={styles.nextRoundButtonText}>{t('nextRound')}</Text>
            <IconSymbol name="party.popper.fill" size={20} color="#001a3c" />
          </TouchableOpacity>
        )}

        {/* Completion Card - Show when Ayuuto is completed */}
        {isGroupCompleted && (
          <View style={styles.completionCard}>
            <IconSymbol name="trophy.fill" size={60} color="#FFD700" />
            <Text style={styles.completionTitle}>{t('ayuutoCompleted')}</Text>
            <Text style={styles.completionMessage}>{t('allMembersPaidOut')}</Text>
          </View>
        )}

        {/* Group Activity / Logs */}
        <View style={styles.logsSection}>
          <View style={styles.logsHeader}>
            <Text style={styles.logsTitle}>{t('groupActivity')}</Text>
            {logs.length > 3 && (
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/group-activity-log',
                    params: { groupId, groupName: group.name },
                  });
                }}
                activeOpacity={0.8}>
                <Text style={styles.viewMoreText}>{t('viewMore')}</Text>
                <IconSymbol name="chevron.right" size={14} color="#FFD700" />
              </TouchableOpacity>
            )}
          </View>
          {isLogsLoading ? (
            <View style={styles.logsEmptyState}>
              <LoadingSpinner size={32} text={t('loadingActivity')} />
            </View>
          ) : logs.length === 0 ? (
            <View style={styles.logsEmptyState}>
              <Text style={styles.logsEmptyText}>{t('noActivityYet')}</Text>
            </View>
          ) : (
            <View style={styles.logsList}>
              {logs.slice(0, 3).map((log) => {
                const timestamp = log.paidAt || log.createdAt;
                const dateLabel = timestamp
                  ? new Date(timestamp).toLocaleString()
                  : '';
                return (
                  <View key={log.id} style={styles.logItem}>
                    <View style={styles.logLeft}>
                      <View style={styles.logIcon}>
                        <IconSymbol
                          name="checkmark.circle.fill"
                          size={18}
                          color="#4CAF50"
                        />
                      </View>
                      <View style={styles.logTextContainer}>
                        <Text style={styles.logMainText}>
                          {log.participantName
                            ? `${log.participantName} paid`
                            : 'Payment recorded'}
                          {typeof log.roundNumber === 'number'
                            ? ` • Round ${log.roundNumber}`
                            : ''}
                        </Text>
                        {typeof log.amount === 'number' && log.amount > 0 && (
                          <Text style={styles.logSubText}>Amount: ${log.amount}</Text>
                        )}
                      </View>
                    </View>
                    <Text style={styles.logTimeText}>{dateLabel}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
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
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 0,
  },
  backText: {
    color: '#61a5fb',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  groupNameContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  scrollButton: {
    padding: 8,
    flex: 0,
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
  addParticipantsButton: {
    marginBottom: 16,
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
  logsSection: {
    marginTop: 24,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#bc9426',
    letterSpacing: 1,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  logsList: {
    marginTop: 4,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2332',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  logIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#14304a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTextContainer: {
    flex: 1,
  },
  logMainText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  logSubText: {
    fontSize: 12,
    color: '#9BA1A6',
    marginTop: 2,
  },
  logTimeText: {
    fontSize: 11,
    color: '#687c97',
    marginLeft: 8,
  },
  logsEmptyState: {
    paddingVertical: 12,
  },
  logsEmptyText: {
    fontSize: 13,
    color: '#9BA1A6',
  },
});
