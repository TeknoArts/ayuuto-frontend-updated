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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { alert } from '@/utils/alert';
import { formatParticipantName } from '@/utils/participant';

type ParticipantInput = {
  label: string;
  email?: string | null;
};

export default function AddParticipantsScreen() {
  const params = useLocalSearchParams();
  const memberCount = parseInt(params.memberCount as string) || 2;
  
  const [participants, setParticipants] = useState<ParticipantInput[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [openSlotIndex, setOpenSlotIndex] = useState<number | null>(null);
  const [emailInput, setEmailInput] = useState('');
  
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

  
  const totalParticipants = memberCount;

  const filledCount = participants.filter((p) => p.email).length;
  // Allow progressing even if not all participants are selected.
  // You can even skip participants entirely and manage them later.
  const isFormValid = true;

  const handleAddByEmail = (index: number) => {
    const trimmedEmail = emailInput.trim().toLowerCase();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // Add as participant with email only
    const newParticipants = [...participants];
    newParticipants[index] = {
      label: trimmedEmail,
      selectedUserId: null,
      email: trimmedEmail,
    };
    setParticipants(newParticipants);
    setOpenSlotIndex(null);
    setEmailInput('');
  };

  const handleNext = () => {
    if (!isFormValid) {
      return;
    }

    const groupName = (params.groupName as string) || 'Ayuuto Group';
    
    // Prepare participants data with emails only
    const participantsData = participants
      .filter((p) => p.email)
      .map((p) => ({
        userId: null,
        email: p.email || null,
        name: p.label || p.email || 'Participant',
      }));

    // Pass all collected data forward to the collection screen;
    // group will actually be created there in a single API flow.
    router.push({
      pathname: '/(tabs)/collection',
      params: {
        groupName,
        memberCount: String(memberCount),
        participants: JSON.stringify(participantsData),
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
                            {participant.email 
                              ? formatParticipantName(participant.label) 
                              : 'Empty slot'}
                          </Text>
                          {!participant.email && (
                            <Text style={styles.slotSubtitle}>Tap to add participant by email</Text>
                          )}
                          {participant.email && (
                            <Text style={styles.slotSubtitle}>{formatParticipantName(participant.email)}</Text>
                          )}
                        </View>
                        <View style={styles.slotIconContainer}>
                          <IconSymbol
                            name={participant.email ? 'envelope.fill' : 'plus.circle.fill'}
                            size={24}
                            color={participant.email ? '#61a5fb' : '#FFD700'}
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
          setEmailInput('');
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setOpenSlotIndex(null);
              setEmailInput('');
            }}>
            <View style={styles.modalOverlayInner}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Invite participant</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setOpenSlotIndex(null);
                      setEmailInput('');
                    }}>
                    <IconSymbol name="xmark.circle.fill" size={22} color="#9BA1A6" />
                  </TouchableOpacity>
                </View>

                {/* Email Input Section */}
                <View style={styles.emailInputSection}>
                  <View style={styles.emailInputContainer}>
                    <IconSymbol name="envelope" size={16} color="#9BA1A6" />
                    <TextInput
                      style={styles.emailInput}
                      placeholder="Enter email address"
                      placeholderTextColor="#9BA1A6"
                      value={emailInput}
                      onChangeText={setEmailInput}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      onSubmitEditing={() => {
                        if (openSlotIndex !== null && emailInput.trim().length > 0) {
                          handleAddByEmail(openSlotIndex);
                        }
                      }}
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.addEmailButton,
                      emailInput.trim().length > 0 && styles.addEmailButtonActive
                    ]}
                    onPress={() => {
                      if (openSlotIndex !== null) {
                        handleAddByEmail(openSlotIndex);
                      }
                    }}
                    disabled={emailInput.trim().length === 0}
                    activeOpacity={0.7}>
                    <IconSymbol 
                      name="plus" 
                      size={20} 
                      color={emailInput.trim().length > 0 ? '#000000' : '#9BA1A6'} 
                    />
                  </TouchableOpacity>
                </View>
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
  dropdownLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  emailInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  emailInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1628',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1a2332',
    gap: 8,
  },
  emailInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
  },
  addEmailButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1a2332',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a3441',
  },
  addEmailButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1a2332',
  },
  dividerText: {
    color: '#9BA1A6',
    fontSize: 12,
    fontWeight: '500',
  },
});

