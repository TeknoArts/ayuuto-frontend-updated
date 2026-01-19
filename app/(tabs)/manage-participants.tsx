import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LoadingBar } from '@/components/ui/loading-bar';
import {
  getGroupDetails,
  getUserGroups,
  addParticipants,
  removeParticipant,
  type Group,
  type Participant,
  type UserSummary,
} from '@/utils/api';
import { getUserData } from '@/utils/auth';
import { alert } from '@/utils/alert';
import { useI18n } from '@/utils/i18n';
import { formatParticipantName } from '@/utils/participant';

export default function ManageParticipantsScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const groupId = params.groupId as string;
  const groupName = (params.groupName as string) || '';
  const memberCount = parseInt((params.memberCount as string) || '0') || 0;

  const [group, setGroup] = useState<Group | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    try {
      setIsLoading(true);
      const groupData = await getGroupDetails(groupId);
      if (groupData) {
        setGroup(groupData);
        setParticipants(groupData.participants || []);
      }
    } catch (error) {
      console.error('Error loading group for manage-participants:', error);
      alert(t('error'), t('failedToLoadGroupDetails'));
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  useEffect(() => {
    let isMounted = true;
    const loadUsers = async () => {
      try {
        const users = await getUserGroups(); // reuse API to get users from existing groups
        if (!isMounted) return;
        // Flatten unique users from createdBy and participants
        const map = new Map<string, UserSummary>();
        users.forEach((g) => {
          if (g.createdBy && typeof g.createdBy === 'object' && g.createdBy.id && g.createdBy.id !== null) {
            map.set(g.createdBy.id, {
              id: g.createdBy.id,
              name: g.createdBy.name || 'Deleted User',
              email: '',
            });
          }
          (g.participants || []).forEach((p) => {
            if (p.userId) {
              const key = p.userId;
              if (!map.has(key)) {
                map.set(key, {
                  id: key,
                  name: (p.user && p.user.name) || p.name || '',
                  email: p.user?.email,
                });
              }
            }
          });
        });
        setAvailableUsers(Array.from(map.values()));
      } catch (error: any) {
        console.error('Error loading users for manage-participants:', error);
        // Only show error if modal is open (user is actively trying to add participant)
        if (isUserModalOpen) {
          alert(
            t('error'),
            error?.message || t('failedToLoadUsers')
          );
        }
      }
    };
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddParticipant = async (user: UserSummary) => {
    if (!groupId || !group) return;
    if (group.participants && group.participants.length >= (group.memberCount || 0)) {
      alert(t('limitReached'), t('allSlotsFilledMessage'));
      return;
    }
    try {
      setIsSaving(true);
      await addParticipants(groupId, [{ userId: user.id }]);
      await loadGroup();
      setUserSearchQuery('');
      setIsUserModalOpen(false);
    } catch (error: any) {
      console.error('Error adding participant:', error);
      alert(t('error'), error?.message || t('failedToAdd'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = () => {
    if (!groupId) return;
    router.push({
      pathname: '/(tabs)/group-details',
      params: { groupId, refresh: Date.now().toString() },
    });
  };

  const remainingSlots =
    group && group.memberCount && group.participants
      ? Math.max(0, group.memberCount - group.participants.length)
      : 0;

  if (isLoading || !group) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LoadingBar />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} text="Loading participants..." fullScreen />
        </View>
      </SafeAreaView>
    );
  }

  const canEdit = true; // this screen is only accessible to owners via UI

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {isSaving && <LoadingBar />}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/group-details',
                params: { groupId, refresh: Date.now().toString() },
              })
            }>
            <IconSymbol name="chevron.left" size={20} color="#61a5fb" />
            <Text style={styles.backText}>{t('back')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{t('manageParticipants')}</Text>
        <Text style={styles.subtitle}>{groupName.toUpperCase()}</Text>

        {/* Current participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CURRENT PARTICIPANTS</Text>
          {participants.length === 0 ? (
            <Text style={styles.emptyText}>{t('noParticipantsYet')}</Text>
          ) : (
            <View style={styles.participantsList}>
              {participants.map((p) => {
                const rawName = (p as any).user?.name || p.name;
                const displayName = formatParticipantName(rawName);
                return (
                  <View key={p.id} style={styles.participantRow}>
                    <View style={styles.participantInfo}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {(displayName || '?').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.participantName}>{displayName}</Text>
                        {p.user?.email && (
                          <Text style={styles.participantEmail}>{p.user.email}</Text>
                        )}
                      </View>
                    </View>
                    {canEdit && !group.isOrderSet && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={async () => {
                          if (!groupId || !p.id) return;
                          alert(
                            'Remove Participant',
                            `Are you sure you want to remove ${displayName || 'this participant'}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Remove',
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    setIsSaving(true);
                                    await removeParticipant(groupId, p.id as string);
                                    await loadGroup();
                                  } catch (e: any) {
                                    console.error('Error removing participant:', e);
                                    alert(
                                      t('error'),
                                      e?.message || t('failedToRemove')
                                    );
                                  } finally {
                                    setIsSaving(false);
                                  }
                                },
                              },
                            ]
                          );
                        }}>
                        <IconSymbol name="trash.fill" size={18} color="#FF6B6B" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Add participant (if slots remain and group not ordered) */}
        {canEdit && !group.isOrderSet && remainingSlots > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('addParticipantSlots')} ({remainingSlots} {remainingSlots !== 1 ? t('slotsLeftPlural') : t('slotsLeft')} {t('left')})
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsUserModalOpen(true)}
              activeOpacity={0.8}
              disabled={remainingSlots <= 0 || isSaving}>
              <IconSymbol name="person.badge.plus" size={18} color="#001a3c" />
              <Text style={styles.addButtonText}>
                {remainingSlots > 0 ? t('addParticipant') : t('allSlotsFilled')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Done button */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
          disabled={isSaving}>
          {isSaving ? (
            <View style={styles.doneButtonLoading}>
              <LoadingSpinner size={20} color="#FFFFFF" />
              <Text style={styles.doneButtonText}>Saving...</Text>
            </View>
          ) : (
            <Text style={styles.doneButtonText}>DONE</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      {/* User selection modal */}
      <Modal
        visible={isUserModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setIsUserModalOpen(false);
          setUserSearchQuery('');
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setIsUserModalOpen(false);
              setUserSearchQuery('');
            }}>
            <View style={styles.modalOverlayInner}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select participant</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsUserModalOpen(false);
                      setUserSearchQuery('');
                    }}>
                    <IconSymbol name="xmark.circle.fill" size={22} color="#9BA1A6" />
                  </TouchableOpacity>
                </View>

                <View style={styles.dropdownSearchContainer}>
                  <IconSymbol name="magnifyingglass" size={14} color="#9BA1A6" />
                  <TextInput
                    style={styles.dropdownSearchInput}
                    placeholder="Search users by name or email"
                    placeholderTextColor="#9BA1A6"
                    value={userSearchQuery}
                    onChangeText={setUserSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {availableUsers.length === 0 ? (
                  <Text style={styles.emptyText}>No users available to add.</Text>
                ) : (() => {
                  const q = userSearchQuery.trim().toLowerCase();
                  const filtered =
                    q.length === 0
                      ? availableUsers
                      : availableUsers.filter(
                          (u) =>
                            (u.name && u.name.toLowerCase().includes(q)) ||
                            (u.email && u.email.toLowerCase().includes(q))
                        );
                  if (filtered.length === 0) {
                    return <Text style={styles.emptyText}>No users match your search.</Text>;
                  }
                  return (
                    <ScrollView style={styles.dropdownList} keyboardShouldPersistTaps="handled">
                      {filtered.map((user) => (
                        <TouchableOpacity
                          key={user.id}
                          style={styles.dropdownItem}
                          onPress={() => handleAddParticipant(user)}
                          activeOpacity={0.7}>
                          <Text style={styles.dropdownItemName}>{user.name || user.email}</Text>
                          <Text style={styles.dropdownItemEmail}>{user.email}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  );
                })()}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  backText: {
    color: '#61a5fb',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  subtitle: {
    color: '#9BA1A6',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  participantsList: {
    gap: 10,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#002452',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1a2332',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f3a5f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  participantName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  participantEmail: {
    color: '#9BA1A6',
    fontSize: 12,
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButtonText: {
    color: '#001a3c',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: '#001327',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a3441',
    maxHeight: 220,
    overflow: 'hidden',
  },
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2332',
    gap: 6,
  },
  dropdownSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 4,
  },
  dropdownList: {
    maxHeight: 180,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2332',
  },
  dropdownItemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownItemEmail: {
    color: '#9BA1A6',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: '#9BA1A6',
    fontSize: 13,
    paddingVertical: 8,
  },
  doneButton: {
    backgroundColor: '#152b45',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a3441',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  doneButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  modalOverlay: {
    flex: 1,
  },
  modalOverlayInner: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#001327',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});


