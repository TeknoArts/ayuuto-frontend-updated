import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LoadingBar } from '@/components/ui/loading-bar';
import { getGroupLogs, type GroupLogEntry } from '@/utils/api';
import { formatParticipantName } from '@/utils/participant';

export default function GroupActivityLogScreen() {
  const params = useLocalSearchParams();
  const groupId = params.groupId as string;
  const groupName = params.groupName as string || 'Group';

  const [logs, setLogs] = useState<GroupLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = useCallback(async () => {
    if (!groupId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const logsData = await getGroupLogs(groupId);
      if (logsData) {
        // Sort logs by date (most recent first)
        const sortedLogs = [...logsData].sort((a, b) => {
          const dateA = new Date(a.paidAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.paidAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setLogs(sortedLogs);
      }
    } catch (error: any) {
      console.error('Error loading group logs:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      loadLogs();
    }
  }, [groupId, loadLogs]);

  useFocusEffect(
    useCallback(() => {
      if (groupId) {
        loadLogs();
      }
    }, [groupId, loadLogs])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLogs();
  }, [loadLogs]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)} day${Math.floor(diffInDays) === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {isLoading && <LoadingBar />}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={20} color="#61a5fb" />
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {groupName.toUpperCase()}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
        }>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>GROUP ACTIVITY LOG</Text>
          <Text style={styles.subtitle}>
            {logs.length} {logs.length === 1 ? 'activity' : 'activities'}
          </Text>
        </View>

        {/* Logs List */}
        {isLoading ? (
          <View style={styles.emptyState}>
            <LoadingSpinner size={40} text="Loading activity..." />
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="clock.fill" size={48} color="#9BA1A6" />
            <Text style={styles.emptyStateText}>No activity yet.</Text>
            <Text style={styles.emptyStateSubtext}>
              Activity will appear here as payments are recorded.
            </Text>
          </View>
        ) : (
          <View style={styles.logsList}>
            {logs.map((log, index) => {
              const timestamp = log.paidAt || log.createdAt;
              const dateLabel = timestamp
                ? new Date(timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : '';
              const relativeTime = timestamp ? formatDate(timestamp) : '';

              return (
                <View key={log.id || index} style={styles.logItem}>
                  <View style={styles.logLeft}>
                    <View style={styles.logIcon}>
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={20}
                        color="#4CAF50"
                      />
                    </View>
                    <View style={styles.logTextContainer}>
                      <Text style={styles.logMainText}>
                        {log.participantName
                          ? `${formatParticipantName(log.participantName)} paid`
                          : 'Payment recorded'}
                        {typeof log.roundNumber === 'number'
                          ? ` • Round ${log.roundNumber}`
                          : ''}
                      </Text>
                      {typeof log.amount === 'number' && log.amount > 0 && (
                        <Text style={styles.logSubText}>Amount: ${log.amount}</Text>
                      )}
                      {log.paidBy && (
                        <Text style={styles.logSubText}>
                          Paid by: {log.paidBy.name}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.logRight}>
                    <Text style={styles.logTimeText}>{relativeTime}</Text>
                    <Text style={styles.logDateText}>{dateLabel}</Text>
                  </View>
                </View>
              );
            })}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2332',
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
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerSpacer: {
    width: 60, // Same width as back button to center title
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9BA1A6',
    letterSpacing: 0.5,
  },
  logsList: {
    gap: 12,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#002452',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a2332',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#14304a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  logTextContainer: {
    flex: 1,
  },
  logMainText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  logSubText: {
    fontSize: 12,
    color: '#9BA1A6',
    marginTop: 2,
  },
  logRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  logTimeText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 2,
  },
  logDateText: {
    fontSize: 11,
    color: '#687c97',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9BA1A6',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#687c97',
    marginTop: 8,
    textAlign: 'center',
  },
});
