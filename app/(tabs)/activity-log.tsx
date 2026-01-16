import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useI18n } from '@/utils/i18n';
import { getUserGroups, type Group } from '@/utils/api';
import { formatParticipantName } from '@/utils/participant';

interface Activity {
  id: string;
  type: 'group_created' | 'payment_received' | 'payment_made' | 'round_started' | 'order_set';
  groupId: string;
  groupName: string;
  participantName?: string;
  amount?: number;
  roundNumber?: number;
  timestamp: Date;
  description: string;
}

export default function ActivityLogScreen() {
  const { t } = useI18n();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const groups = await getUserGroups();
      
      // Generate activities from groups
      const allActivities: Activity[] = [];
      
      groups.forEach((group: Group) => {
        // Group creation activity
        if (group.createdAt) {
          allActivities.push({
            id: `group_${group.id}_created`,
            type: 'group_created',
            groupId: group.id,
            groupName: group.name,
            timestamp: new Date(group.createdAt),
            description: `Group "${group.name}" was created`,
          });
        }

        // Order set activity (if order is set)
        if (group.isOrderSet && group.participants) {
          const sortedParticipants = [...group.participants].sort((a, b) => (a.order || 0) - (b.order || 0));
          const firstRecipient = sortedParticipants[0];
          if (firstRecipient) {
            allActivities.push({
              id: `group_${group.id}_order_set`,
              type: 'order_set',
              groupId: group.id,
              groupName: group.name,
              participantName: formatParticipantName(firstRecipient.name),
              timestamp: new Date(group.createdAt || Date.now()), // Approximate time
              description: `Order was set for "${group.name}"`,
            });
          }
        }

        // Payment activities
        if (group.participants) {
          group.participants.forEach((participant) => {
            // Payment made activity
            if (participant.paidAt) {
              const totalSavings = group.totalSavings || (group.amountPerPerson || 0) * (group.memberCount || 0);
              allActivities.push({
                id: `payment_${group.id}_${participant.id}_${participant.paidAt}`,
                type: 'payment_made',
                groupId: group.id,
                groupName: group.name,
                participantName: formatParticipantName(participant.name),
                amount: group.amountPerPerson || 0,
                timestamp: new Date(participant.paidAt),
                description: `${formatParticipantName(participant.name)} paid $${group.amountPerPerson || 0} in "${group.name}"`,
              });
            }

            // Payment received activity
            if (participant.receivedPaymentAt) {
              const totalSavings = group.totalSavings || (group.amountPerPerson || 0) * (group.memberCount || 0);
              const roundNumber = group.currentRecipientIndex !== undefined ? group.currentRecipientIndex + 1 : 1;
              allActivities.push({
                id: `received_${group.id}_${participant.id}_${participant.receivedPaymentAt}`,
                type: 'payment_received',
                groupId: group.id,
                groupName: group.name,
                participantName: formatParticipantName(participant.name),
                amount: totalSavings,
                roundNumber,
                timestamp: new Date(participant.receivedPaymentAt),
                description: `${formatParticipantName(participant.name)} received $${totalSavings} in Round ${roundNumber} of "${group.name}"`,
              });
            }
          });
        }

        // Round started activities (inferred from currentRecipientIndex changes)
        if (group.isOrderSet && group.participants && group.currentRecipientIndex > 0) {
          const sortedParticipants = [...group.participants].sort((a, b) => (a.order || 0) - (b.order || 0));
          const currentRecipient = sortedParticipants[group.currentRecipientIndex];
          if (currentRecipient) {
            allActivities.push({
              id: `round_${group.id}_${group.currentRecipientIndex}`,
              type: 'round_started',
              groupId: group.id,
              groupName: group.name,
              participantName: formatParticipantName(currentRecipient.name),
              roundNumber: group.currentRecipientIndex + 1,
              timestamp: new Date(), // Approximate - would need backend tracking
              description: `Round ${group.currentRecipientIndex + 1} started - ${formatParticipantName(currentRecipient.name)} is next recipient in "${group.name}"`,
            });
          }
        }
      });

      // Sort activities by timestamp (newest first)
      allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setActivities(allActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [loadActivities])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadActivities();
  }, [loadActivities]);

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getActivityIcon = (type: Activity['type']): string => {
    switch (type) {
      case 'group_created':
        return 'plus.circle.fill';
      case 'payment_received':
        return 'dollarsign.circle.fill';
      case 'payment_made':
        return 'checkmark.circle.fill';
      case 'round_started':
        return 'arrow.clockwise.circle.fill';
      case 'order_set':
        return 'dice.fill';
      default:
        return 'circle.fill';
    }
  };

  const getActivityColor = (type: Activity['type']): string => {
    switch (type) {
      case 'group_created':
        return '#61a5fb';
      case 'payment_received':
        return '#FFD700';
      case 'payment_made':
        return '#4CAF50';
      case 'round_started':
        return '#FF6B6B';
      case 'order_set':
        return '#9BA1A6';
      default:
        return '#FFFFFF';
    }
  };

  const handleActivityPress = (groupId: string) => {
    router.push({
      pathname: '/(tabs)/group-details',
      params: { groupId },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
        }>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={20} color="#61a5fb" />
            <Text style={styles.backText}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('activityLog')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Activities List */}
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('loadingActivities')}</Text>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="clock.fill" size={48} color="#9BA1A6" />
            <Text style={styles.emptyStateText}>{t('noActivities')}</Text>
            <Text style={styles.emptyStateSubtext}>{t('noActivitiesSubtext')}</Text>
          </View>
        ) : (
          <View style={styles.activitiesList}>
            {activities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityCard}
                onPress={() => handleActivityPress(activity.groupId)}
                activeOpacity={0.7}>
                <View style={styles.activityLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${getActivityColor(activity.type)}20` },
                    ]}>
                    <IconSymbol
                      name={getActivityIcon(activity.type)}
                      size={24}
                      color={getActivityColor(activity.type)}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityGroup}>{activity.groupName}</Text>
                    {activity.amount && (
                      <Text style={styles.activityAmount}>${activity.amount}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.activityRight}>
                  <Text style={styles.activityTime}>{formatDate(activity.timestamp)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 80, // Same width as back button to center title
  },
  activitiesList: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: '#002b61',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a2332',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activityGroup: {
    fontSize: 14,
    color: '#9BA1A6',
    marginBottom: 2,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 2,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityTime: {
    fontSize: 12,
    color: '#687c97',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9BA1A6',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#687c97',
    marginTop: 8,
  },
});

