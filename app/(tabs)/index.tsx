import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getUserData, UserData } from '@/utils/auth';
import { getUserGroups, deleteGroup, type Group } from '@/utils/api';
import { useI18n } from '@/utils/i18n';

export default function HomeScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  // Handle refresh param from navigation
  useEffect(() => {
    const refreshParam = params.refresh as string;
    if (refreshParam) {
      console.log('HomeScreen: Refresh param detected, reloading groups');
      // Small delay to ensure navigation is complete
      setTimeout(() => {
        loadGroups();
      }, 500);
    }
  }, [params.refresh, loadGroups]);

  // Reload groups when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen: Screen focused, reloading groups');
      // Small delay to ensure navigation is complete
      const reload = async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        await loadGroups();
      };
      reload();
      // No cleanup needed - we want this to run every time screen focuses
    }, [loadGroups])
  );

    const loadUser = async () => {
      const storedUser = await getUserData();
      setUser(storedUser);
    };

  const loadGroups = useCallback(async () => {
    // Get current user - try from state first, then from storage
    let currentUser = user;
    if (!currentUser || !currentUser.id) {
      console.log('HomeScreen: User not in state, loading from storage');
      currentUser = await getUserData();
      if (currentUser) {
        setUser(currentUser);
      }
    }
    
    if (!currentUser || !currentUser.id) {
      console.log('HomeScreen: Cannot load groups: user not available');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('HomeScreen: Loading groups for user:', currentUser.id);
      const userGroups = await getUserGroups();
      // Filter to show only groups created by the user (AYUUTO MANAGER)
      const managedGroups = userGroups.filter((g) => {
        if (!g.createdBy) {
          console.warn('Group missing createdBy:', g.name);
          return false;
        }
        
        // Check if createdBy matches user ID (handle both object and string formats)
        const createdById = typeof g.createdBy === 'object' ? g.createdBy?.id : g.createdBy;
        const userId = currentUser.id;
        
        if (!userId) {
          console.warn('User ID is missing');
          return false;
        }
        
        // Compare as strings to handle ObjectId vs string mismatches
        const createdByIdStr = createdById?.toString();
        const userIdStr = userId.toString();
        const matches = createdByIdStr === userIdStr || 
               createdById === userId ||
               (g.createdBy && typeof g.createdBy === 'object' && g.createdBy.id?.toString() === userIdStr);
        
        // Debug logging for troubleshooting
        if (__DEV__) {
          console.log('Group filter check:', {
            groupName: g.name,
            createdById: createdByIdStr,
            userId: userIdStr,
            matches,
            createdByType: typeof g.createdBy,
            createdByObject: g.createdBy
          });
        }
        
        return matches;
      });
      
      // Sort by creation date (newest first)
      managedGroups.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      console.log('HomeScreen: Loaded groups - Total:', userGroups.length, 'Managed:', managedGroups.length, 'User ID:', currentUser.id);
      
      // Debug: Log first group's createdBy structure if we have groups but none match
      if (managedGroups.length === 0 && userGroups.length > 0) {
        console.warn('HomeScreen: No managed groups found!');
        console.warn('HomeScreen: User ID:', currentUser.id);
        console.warn('HomeScreen: First group createdBy:', JSON.stringify(userGroups[0]?.createdBy, null, 2));
        // Show all groups for debugging
        userGroups.slice(0, 3).forEach((g, idx) => {
          const createdById = typeof g.createdBy === 'object' ? g.createdBy?.id : g.createdBy;
          console.log(`HomeScreen: Group ${idx + 1} - Name: ${g.name}, CreatedBy ID: ${createdById}, Match: ${String(createdById) === String(currentUser.id)}`);
        });
      }
      
      setGroups(managedGroups);
      console.log('HomeScreen: Groups state updated successfully, count:', managedGroups.length);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      t('delete'),
      `Are you sure you want to delete "${groupName}"? This action cannot be undone.`,
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            // Store the group being deleted for optimistic update
            const groupToDelete = groups.find(g => g.id === groupId);
            
            try {
              // Set deleting state to show loading indicator
              setDeletingGroupId(groupId);
              
              // Optimistically remove the group from the UI for immediate feedback
              setGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
              
              // Delete the group from the backend
              await deleteGroup(groupId);
              
              // Reload groups to ensure consistency with backend
              // Use a small delay to ensure backend has processed the deletion
              setTimeout(async () => {
                await loadGroups();
                setDeletingGroupId(null);
              }, 300);
            } catch (error: any) {
              // If deletion fails, restore the group in the UI
              if (groupToDelete) {
                setGroups(prevGroups => {
                  // Insert the group back in its original position
                  const newGroups = [...prevGroups];
                  const originalIndex = groups.findIndex(g => g.id === groupId);
                  if (originalIndex >= 0) {
                    newGroups.splice(originalIndex, 0, groupToDelete);
                  } else {
                    newGroups.push(groupToDelete);
                  }
                  return newGroups;
                });
              }
              
              setDeletingGroupId(null);
              Alert.alert(
                t('error'),
                error.message || 'Failed to delete group. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleGroupPress = (groupId: string) => {
    router.push({
      pathname: '/(tabs)/group-details',
      params: { groupId },
    });
  };

  const displayName = user?.name || user?.email || 'Friend';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Welcome to Ayuuto, {displayName}!</Text>
            <Text style={styles.sloganText}>ORGANIZE WITH TRUST, CELEBRATE TOGETHER.</Text>
          </View>
          <TouchableOpacity 
            style={styles.flagButton}
            onPress={() => router.push('/(tabs)/activity-log')}>
            <IconSymbol name="clock.fill" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* New Group Button */}
        <TouchableOpacity
          style={styles.newGroupButton}
          onPress={() => router.push('/(tabs)/newgroup')}>
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
          <Text style={styles.newGroupText}>{t('newGroup')}</Text>
        </TouchableOpacity>

        {/* Ayuuto Manager Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleYellow}>{t('ayuutoManager')}</Text>
          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Loading...</Text>
            </View>
          ) : groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>YOU DON'T MANAGE ANY GROUPS YET.</Text>
          </View>
          ) : (
            <FlatList
              data={groups}
              keyExtractor={(item) => item.id}
              renderItem={({ item: group }) => (
                <View style={styles.groupCard}>
                  <TouchableOpacity
                    style={styles.groupCardContent}
                    onPress={() => handleGroupPress(group.id)}
                    activeOpacity={0.7}>
                    <View style={styles.groupCardLeft}>
                      <Text style={styles.groupCardName}>{group.name.toUpperCase()}</Text>
                      <View style={styles.groupCardDetails}>
                        <IconSymbol name="dollarsign.circle.fill" size={14} color="#FFD700" />
                        <Text style={styles.groupCardDetailsText}>
                          {(() => {
                            // Calculate total savings - use totalSavings if available, otherwise calculate from amountPerPerson
                            const total = group.totalSavings ?? 
                              ((group.amountPerPerson && group.memberCount) 
                                ? group.amountPerPerson * group.memberCount 
                                : 0);
                            // Always show the amount (even if 0) and participant count
                            return `${total} • ${group.memberCount} Participants`;
                          })()}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        deletingGroupId === group.id && styles.deleteButtonDisabled
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (deletingGroupId !== group.id) {
                          handleDeleteGroup(group.id, group.name);
                        }
                      }}
                      activeOpacity={0.7}
                      disabled={deletingGroupId === group.id}>
                      {deletingGroupId === group.id ? (
                        <View style={styles.deleteLoading}>
                          <Text style={styles.deleteLoadingText}>...</Text>
                        </View>
                      ) : (
                        <IconSymbol name="trash.fill" size={18} color="#FF6B6B" />
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              )}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.groupSeparator} />}
              contentContainerStyle={styles.groupsListContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* My Ayuutos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleBlue}>MY AYUUTOS</Text>
          <View style={styles.fundCard}>
            <View style={styles.fundCardHeader}>
              <Text style={styles.fundName}>FRIDAY COMMUNITY FUND</Text>
              <Text style={styles.turnIndicator}>TURN 2</Text>
            </View>
            <View style={styles.fundDetails}>
              <IconSymbol name="dollarsign.circle.fill" size={16} color="#FFD700" />
              <Text style={styles.fundDetailsText}>1500 • 3 Participants</Text>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sloganText: {
    fontSize: 12,
    color: '#9BA1A6',
    letterSpacing: 1,
  },
  flagButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1a2332',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3441',
  },
  newGroupButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  newGroupText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitleYellow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  sectionTitleBlue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4FC3F7',
    letterSpacing: 1,
    marginBottom: 16,
  },
  emptyState: {
    borderWidth: 2,
    borderColor: '#9BA1A6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: '#9BA1A6',
    fontSize: 14,
    letterSpacing: 1,
  },
  groupsList: {
    gap: 12,
  },
  groupsListContainer: {
    gap: 12,
  },
  groupSeparator: {
    height: 12,
  },
  groupCard: {
    backgroundColor: '#002b61',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3441',
    overflow: 'hidden',
  },
  groupCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  groupCardLeft: {
    flex: 1,
  },
  groupCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  groupCardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupCardDetailsText: {
    color: '#9BA1A6',
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteLoading: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLoadingText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fundCard: {
    backgroundColor: '#002b61',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a3441',
  },
  fundCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fundName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
    flex: 1,
  },
  turnIndicator: {
    fontSize: 12,
    color: '#9BA1A6',
    letterSpacing: 1,
  },
  fundDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fundDetailsText: {
    color: '#9BA1A6',
    fontSize: 14,
  },
});
