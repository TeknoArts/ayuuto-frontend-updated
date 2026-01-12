import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getUsers, type UserSummary } from '@/utils/api';

type ParticipantInput = {
  label: string;
  selectedUserId?: string | null;
};

export default function AddParticipantsScreen() {
  const params = useLocalSearchParams();
  const memberCount = parseInt(params.memberCount as string) || 2;
  
  const [participants, setParticipants] = useState<ParticipantInput[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserSummary[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [openSlotIndex, setOpenSlotIndex] = useState<number | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Reset form when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Initialize participants array based on member count
      setParticipants(Array(memberCount).fill({ label: '' }));
      setFocusedIndex(null);
    }, [memberCount])
  );
  
  // Initialize on mount if not already set
  useEffect(() => {
    if (participants.length === 0 && memberCount > 0) {
      setParticipants(Array(memberCount).fill({ label: '' }));
    }
  }, []);

  // Load available users for dropdown
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoadingUsers(true);
        const users = await getUsers();
        if (isMounted) {
          setAvailableUsers(users);
        }
      } catch (error) {
        console.error('Error loading users for participant dropdown:', error);
      } finally {
        if (isMounted) {
          setIsLoadingUsers(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);
  
  const totalParticipants = memberCount;

  const filledCount = participants.filter((p) => p.selectedUserId).length;
  // Allow progressing even if not all participants are selected.
  // You can even skip participants entirely and manage them later.
  const isFormValid = true;

  const handleSelectUserForIndex = (index: number, user: UserSummary) => {
    const newParticipants = [...participants];
    newParticipants[index] = {
      label: user.name || user.email,
      selectedUserId: user.id,
    };
    setParticipants(newParticipants);
    setOpenSlotIndex(null);
    setUserSearchQuery('');
  };

  const handleNext = () => {
    if (!isFormValid) {
      return;
    }

    const groupName = (params.groupName as string) || 'Ayuuto Group';
    const selectedUserIds = participants
      .filter((p) => p.selectedUserId)
      .map((p) => p.selectedUserId as string);

    // Pass all collected data forward to the collection screen;
    // group will actually be created there in a single API flow.
    router.push({
      pathname: '/(tabs)/collection',
      params: {
        groupName,
        memberCount: String(memberCount),
        participants: JSON.stringify(selectedUserIds),
        fromWizard: 'true',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {/* Header with Back Button */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}>
                <IconSymbol name="chevron.left" size={20} color="#61a5fb" />
                <Text style={styles.backText}>BACK</Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={styles.title}>NEW GROUP</Text>

            {/* Form */}
            <View style={styles.form}>
            {/* Participant Slots Section */}
              <View style={styles.typeNamesHeader}>
              <Text style={styles.typeNamesLabel}>PARTICIPANT SLOTS</Text>
                <View style={styles.counterBadge}>
                  <Text style={styles.counterText}>{filledCount}/{totalParticipants}</Text>
                </View>
              </View>

              {/* Participant Slots as Cards */}
              {participants.map((participant, index) => (
                <View key={index} style={styles.inputSection}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      setOpenSlotIndex(index);
                      setFocusedIndex(index);
                    }}>
                    <View
                      style={[
                        styles.inputContainer,
                        focusedIndex === index && styles.inputContainerFocused,
                      ]}>
                      <View style={styles.slotContent}>
                        <View style={styles.slotIndexCircle}>
                          <Text style={styles.slotIndexText}>{index + 1}</Text>
                        </View>
                        <View style={styles.slotTextContainer}>
                          <Text style={styles.slotTitle}>
                            {participant.selectedUserId ? participant.label : 'Empty slot'}
                          </Text>
                          {!participant.selectedUserId && (
                            <Text style={styles.slotSubtitle}>Tap to select a user</Text>
                          )}
                        </View>
                        <View style={styles.slotIconContainer}>
                          <IconSymbol
                            name={participant.selectedUserId ? 'person.fill' : 'plus.circle.fill'}
                            size={24}
                            color={participant.selectedUserId ? '#4CAF50' : '#FFD700'}
                          />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Next Button */}
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  isFormValid && styles.nextButtonActive
                ]}
                onPress={handleNext}
                activeOpacity={0.8}
                disabled={!isFormValid}>
                <Text style={[
                  styles.nextButtonText,
                  isFormValid && styles.nextButtonTextActive
                ]}>
                  NEXT
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* User selection modal */}
      <Modal
        visible={openSlotIndex !== null}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setOpenSlotIndex(null);
          setUserSearchQuery('');
        }}>
        <TouchableWithoutFeedback
          onPress={() => {
            setOpenSlotIndex(null);
            setUserSearchQuery('');
          }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select participant</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setOpenSlotIndex(null);
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

                {isLoadingUsers ? (
                  <Text style={styles.dropdownEmptyText}>Loading users...</Text>
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
                    return (
                      <Text style={styles.dropdownEmptyText}>No users match your search.</Text>
                    );
                  }
                  return (
                    <ScrollView style={styles.dropdownList} keyboardShouldPersistTaps="handled">
                      {filtered.map((user) => (
                        <TouchableOpacity
                          key={user.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            if (openSlotIndex !== null) {
                              handleSelectUserForIndex(openSlotIndex, user);
                            }
                          }}
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
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(1 27 61)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  header: {
    marginBottom: 24,
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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 40,
  },
  form: {
    flex: 1,
  },
  typeNamesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeNamesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
  },
  counterBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: 'rgb(0 10 26)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 72,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    borderColor: '#FFD700',
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotIndexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1f3a5f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotIndexText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  slotTextContainer: {
    flex: 1,
  },
  slotTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  slotSubtitle: {
    color: '#9BA1A6',
    fontSize: 12,
    marginTop: 2,
  },
  slotIconContainer: {
    paddingLeft: 8,
  },
  selectUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  selectUserText: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: '500',
  },
  dropdown: {
    marginTop: 6,
    backgroundColor: '#001327',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a3441',
    maxHeight: 180,
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
  dropdownEmptyText: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#9BA1A6',
    fontSize: 13,
  },
  nextButton: {
    backgroundColor: '#152b45',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2a3441',
  },
  nextButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  nextButtonText: {
    color: '#67758a',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  nextButtonTextActive: {
    color: '#000000',
  },
  modalOverlay: {
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

