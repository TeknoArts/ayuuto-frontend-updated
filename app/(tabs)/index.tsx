import { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getUserData, UserData } from '@/utils/auth';
import { getUserGroups, deleteGroup, type Group } from '@/utils/api';
import { useI18n } from '@/utils/i18n';
import { alert } from '@/utils/alert';

export default function HomeScreen() {
  const { t, language } = useI18n();
  const params = useLocalSearchParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [managedGroups, setManagedGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const loadGroups = useCallback(async (showLoading = false) => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('HomeScreen: Load already in progress, skipping');
      return;
    }

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
      setIsInitialLoad(false);
      return;
    }
    
    try {
      isLoadingRef.current = true;
      // Only show loading state on initial load or when explicitly requested
      if (isInitialLoad || showLoading) {
        setIsLoading(true);
      }
      console.log('HomeScreen: Loading groups for user:', currentUser.id);
      const userGroups = await getUserGroups();
      console.log('HomeScreen: Total groups received from API:', userGroups.length);
      if (userGroups.length > 0) {
        console.log('HomeScreen: First group sample:', {
          name: userGroups[0].name,
          createdBy: userGroups[0].createdBy,
          participants: userGroups[0].participants?.length || 0,
        });
      }

      // Groups created by the user (AYUUTO MANAGER)
      const managerGroups = userGroups.filter((g) => {
        if (!g.createdBy) {
          console.warn('Group missing createdBy:', g.name);
          return false;
        }
        
        // Handle null createdBy (deleted user)
        if (typeof g.createdBy === 'object' && (!g.createdBy.id || g.createdBy.id === null)) {
          console.warn('Group has deleted creator:', g.name);
          return false;
        }
        
        // Check if createdBy matches user ID (handle both object and string formats)
        const createdById = typeof g.createdBy === 'object' ? g.createdBy?.id : g.createdBy;
        const userId = currentUser.id;
        
        if (!userId || !createdById) {
          console.warn('User ID or CreatedBy ID is missing');
          return false;
        }
        
        // Compare as strings to handle ObjectId vs string mismatches
        const createdByIdStr = createdById.toString();
        const userIdStr = userId.toString();
        const matches = createdByIdStr === userIdStr || createdById === userId;
        
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

      // Groups where user is a participant but NOT the creator (MY AYUUTOS)
      const participantGroups = userGroups.filter((g) => {
        const userId = currentUser!.id;
        if (!userId) {
          console.log('HomeScreen: No userId found for participant check');
          return false;
        }
        
        // Check if user is a participant in this group
        // Participants can have userId directly or user.id nested
        const isParticipant = g.participants?.some((p) => {
          if (typeof p !== 'object') {
            console.log('HomeScreen: Participant is not an object:', p);
            return false;
          }
          
          // Check userId field
          if (p.userId && p.userId.toString() === userId.toString()) {
            console.log('HomeScreen: Found participant match via userId:', p.userId, '===', userId);
            return true;
          }
          
          // Check user.id field (nested user object)
          if (p.user && typeof p.user === 'object' && p.user.id) {
            if (p.user.id.toString() === userId.toString()) {
              console.log('HomeScreen: Found participant match via user.id:', p.user.id, '===', userId);
              return true;
            }
          }
          
          // Check id field as fallback (only if it's a user ID, not participant ID)
          // Note: This might match participant IDs, so we should be careful
          // Actually, let's skip this check as participant.id is the participant record ID, not user ID
          
          return false;
        });
        
        if (!isParticipant) {
          // Debug: Log why this group is not included
          console.log('HomeScreen: Group not included in My Ayuuto - not a participant:', {
            groupName: g.name,
            groupId: g.id,
            participantCount: g.participants?.length || 0,
            participants: g.participants?.map(p => ({
              userId: p.userId,
              user: p.user,
              id: p.id,
            })),
            currentUserId: userId,
          });
          return false;
        }
        
        // If no createdBy, include if user is a participant
        if (!g.createdBy) {
          console.log('HomeScreen: Group included (no createdBy):', g.name);
          return true;
        }
        
        // Handle null createdBy (deleted user) - include if user is a participant
        if (typeof g.createdBy === 'object' && (!g.createdBy.id || g.createdBy.id === null)) {
          console.log('HomeScreen: Group included (null createdBy.id):', g.name);
          return true;
        }
        
        // Check if user is NOT the creator
        const createdById = typeof g.createdBy === 'object' ? g.createdBy?.id : g.createdBy;
        if (!createdById) {
          console.log('HomeScreen: Group included (no createdById):', g.name);
          return true; // If no creator ID, include if user is participant
        }
        const isOwner = createdById.toString() === userId.toString();
        if (isOwner) {
          console.log('HomeScreen: Group excluded (user is owner):', g.name);
        } else {
          console.log('HomeScreen: Group included in My Ayuuto:', g.name);
        }
        return !isOwner;
      });

      // Sort both lists by creation date (newest first)
      managerGroups.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      participantGroups.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      console.log(
        'HomeScreen: Loaded groups - Total:',
        userGroups.length,
        'Managed:',
        managerGroups.length,
        'Joined:',
        participantGroups.length,
        'User ID:',
        currentUser.id
      );
      
      // Debug: Log why groups might be filtered out
      if (userGroups.length > 0 && managerGroups.length === 0 && participantGroups.length === 0) {
        console.warn('HomeScreen: WARNING - Groups received but none match filters!');
        userGroups.slice(0, 3).forEach((g, idx) => {
          console.warn(`Group ${idx + 1}:`, {
            name: g.name,
            createdBy: g.createdBy,
            hasParticipants: !!g.participants && g.participants.length > 0,
            participantCount: g.participants?.length || 0,
          });
        });
      }

      // Debug: Log first group's createdBy structure if we have groups but none match
      if (managerGroups.length === 0 && userGroups.length > 0) {
        console.warn('HomeScreen: No managed groups found!');
        console.warn('HomeScreen: User ID:', currentUser.id);
        console.warn('HomeScreen: First group createdBy:', JSON.stringify(userGroups[0]?.createdBy, null, 2));
        // Show all groups for debugging
        userGroups.slice(0, 3).forEach((g, idx) => {
          const createdById = typeof g.createdBy === 'object' ? g.createdBy?.id : g.createdBy;
          console.log(`HomeScreen: Group ${idx + 1} - Name: ${g.name}, CreatedBy ID: ${createdById}, Match: ${String(createdById) === String(currentUser.id)}`);
        });
      }
      
      setManagedGroups(managerGroups);
      setJoinedGroups(participantGroups);
      console.log(
        'HomeScreen: Groups state updated successfully, managed:',
        managerGroups.length,
        'joined:',
        participantGroups.length
      );
    } catch (error: any) {
      console.error('Error loading groups:', error);
      
      // If authentication error, redirect to login
      if (error.message && (error.message.includes('Not authorized') || error.message.includes('token invalid') || error.message.includes('expired') || error.message.includes('Please log in again'))) {
        console.log('HomeScreen: Authentication failed, redirecting to login');
        // Clear auth and redirect to login
        const { clearAuth } = await import('@/utils/auth');
        await clearAuth();
        router.replace('/login');
        return;
      }
      
      // Show error to user for other errors
      if (isInitialLoad || showLoading) {
        alert(
          'Error',
          error?.message || 'Failed to load groups. Please try again.',
          [
            {
              text: 'Retry',
              onPress: () => loadGroups(true),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
      }
      
      setManagedGroups([]);
      setJoinedGroups([]);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
      isLoadingRef.current = false;
    }
  }, [user, isInitialLoad]);

  const loadUser = useCallback(async () => {
    const storedUser = await getUserData();
    setUser(storedUser);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user, loadGroups]);

  // Handle refresh param from navigation (silent reload)
  useEffect(() => {
    const refreshParam = params.refresh as string;
    if (refreshParam) {
      console.log('HomeScreen: Refresh param detected, reloading groups (silent)');
      // Small delay to ensure navigation is complete
      setTimeout(() => {
        loadGroups(false); // Don't show loading state on refresh
      }, 500);
    }
  }, [params.refresh, loadGroups]);

  // Reload groups when screen comes into focus (but don't show loading state)
  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen: Screen focused, reloading groups (silent)');
      // Small delay to ensure navigation is complete
      const reload = async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await loadGroups(false); // Don't show loading state on focus
      };
      reload();
      // No cleanup needed - we want this to run every time screen focuses
    }, [loadGroups])
  );

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    alert(
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
            const groupToDeleteManaged = managedGroups.find((g) => g.id === groupId);
            const groupToDeleteJoined = joinedGroups.find((g) => g.id === groupId);
            
            try {
              // Set deleting state to show loading indicator
              setDeletingGroupId(groupId);
              
              // Optimistically remove the group from both lists for immediate feedback
              setManagedGroups((prev) => prev.filter((g) => g.id !== groupId));
              setJoinedGroups((prev) => prev.filter((g) => g.id !== groupId));
              
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
              if (groupToDeleteManaged) {
                setManagedGroups((prev) => [...prev, groupToDeleteManaged]);
              }
              if (groupToDeleteJoined) {
                setJoinedGroups((prev) => [...prev, groupToDeleteJoined]);
              }
              
              setDeletingGroupId(null);
              alert(
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
    if (!groupId) {
      console.error('HomeScreen: Cannot navigate - groupId is missing');
      alert('Error', 'Group ID is missing. Please try again.');
      return;
    }
    
    // Convert to string and log for debugging
    const groupIdString = String(groupId).trim();
    console.log('HomeScreen: Navigating to group details');
    console.log('HomeScreen: groupId type:', typeof groupId);
    console.log('HomeScreen: groupId value:', groupId);
    console.log('HomeScreen: groupIdString:', groupIdString);
    
    if (!groupIdString || groupIdString === 'undefined' || groupIdString === 'null') {
      console.error('HomeScreen: Invalid groupId:', groupIdString);
      alert('Error', 'Invalid group ID. Please try again.');
      return;
    }
    
    try {
      router.push({
        pathname: '/(tabs)/group-details',
        params: { 
          groupId: groupIdString,
        },
      });
      console.log('HomeScreen: Navigation command executed');
    } catch (error) {
      console.error('HomeScreen: Navigation error:', error);
      alert('Error', 'Failed to navigate to group details. Please try again.');
    }
  };

  const displayName = user?.name || user?.email || 'Friend';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>{t('welcomeToAyuuto')}, {displayName}!</Text>
            <Text style={styles.sloganText}>{t('organizeWithTrust')}</Text>
          </View>
          <View style={styles.flagButton}>
            <Text style={styles.flagEmoji}>{language === 'so' ? '🇸🇴' : '🇬🇧'}</Text>
          </View>
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
              <Text style={styles.emptyStateText}>{t('loading')}</Text>
            </View>
          ) : managedGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{t('dontManageGroups')}</Text>
            </View>
          ) : (
            <FlatList
              data={managedGroups}
              keyExtractor={(item) => item.id || String(item)}
              renderItem={({ item: group }) => (
                <View style={styles.groupCard}>
                  <TouchableOpacity
                    style={styles.groupCardContent}
                    onPress={() => {
                      if (group.id) {
                        handleGroupPress(group.id);
                      } else {
                        console.error('HomeScreen: Group missing id:', group);
                      }
                    }}
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
          <Text style={styles.sectionTitleBlue}>{t('myAyuutos')}</Text>
          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Loading...</Text>
            </View>
          ) : joinedGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>YOU ARE NOT A PARTICIPANT IN ANY AYUUTO YET.</Text>
            </View>
          ) : (
            <FlatList
              data={joinedGroups}
              keyExtractor={(item) => item.id || String(item)}
              renderItem={({ item: group }) => (
                <View style={styles.groupCard}>
                  <TouchableOpacity
                    style={styles.groupCardContent}
                    onPress={() => {
                      if (group.id) {
                        handleGroupPress(group.id);
                      } else {
                        console.error('HomeScreen: Group missing id:', group);
                      }
                    }}
                    activeOpacity={0.7}>
                    <View style={styles.groupCardLeft}>
                      <Text style={styles.groupCardName}>{group.name.toUpperCase()}</Text>
                      <View style={styles.groupCardDetails}>
                        <IconSymbol name="dollarsign.circle.fill" size={14} color="#FFD700" />
                        <Text style={styles.groupCardDetailsText}>
                          {(() => {
                            const total = group.totalSavings ??
                              ((group.amountPerPerson && group.memberCount)
                                ? group.amountPerPerson * group.memberCount
                                : 0);
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
  flagEmoji: {
    fontSize: 24,
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
