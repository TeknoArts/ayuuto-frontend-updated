import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { alert } from '@/utils/alert';
import { useI18n } from '@/utils/i18n';

type ParticipantInput = {
  name: string;
};

export default function AddParticipantsScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const groupName = (params.groupName as string) || '';
  const amount = (params.amount as string) || '';
  const collectionDate = (params.collectionDate as string) || '';
  
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { name: '' },
    { name: '' },
  ]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Reset to empty fields every time screen is focused - do not load/restore names by default
  useFocusEffect(
    useCallback(() => {
      setParticipants([{ name: '' }, { name: '' }]);
    }, [])
  );

  const handleAddParticipant = () => {
    setParticipants([...participants, { name: '' }]);
  };

  const handleRemoveParticipant = (index: number) => {
    if (participants.length <= 2) {
      alert('Minimum Participants', 'At least 2 participants are required.');
      return;
    }
    const newParticipants = participants.filter((_, i) => i !== index);
    setParticipants(newParticipants);
  };

  const handleParticipantNameChange = (index: number, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = { name: value };
    setParticipants(newParticipants);
  };

  const handleCreateGroup = () => {
    // Validate: at least 2 participants with names
    const filledParticipants = participants.filter(p => p.name.trim().length > 0);
    
    if (filledParticipants.length < 2) {
      alert('Invalid Participants', 'Please enter at least 2 participant names.');
      return;
    }

    // Navigate to group-created screen with all data - group will be created there
    router.replace({
      pathname: '/(tabs)/group-created',
      params: {
        groupName,
        amount,
        collectionDate,
        participants: JSON.stringify(filledParticipants),
        timestamp: Date.now().toString(),
      },
    });
  };

  const filledCount = participants.filter(p => p.name.trim().length > 0).length;
  const isFormValid = filledCount >= 2;

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
                onPress={() => {
                  router.replace({
                    pathname: '/(tabs)/newgroup',
                    params: { 
                      groupName, 
                      amount,
                      collectionDate,
                    },
                  });
                }}>
                <IconSymbol name="chevron.left" size={20} color="#61a5fb" />
                <Text style={styles.backText}>{t('back')}</Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={styles.title}>ADD PARTICIPANTS</Text>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.participantsHeader}>
                <Text style={styles.participantsLabel}>PARTICIPANTS</Text>
                <View style={styles.counterBadge}>
                  <Text style={styles.counterText}>{filledCount}</Text>
                </View>
              </View>

              {/* Participant Input Fields */}
              {participants.map((participant, index) => (
                <View key={index} style={styles.participantRow}>
                  {/* Serial Number */}
                  <View style={styles.serialNumber}>
                    <Text style={styles.serialNumberText}>{index + 1}</Text>
                  </View>

                  {/* Text Input */}
                  <View style={styles.inputWrapper}>
                    <View style={[
                      styles.inputContainer,
                      focusedIndex === index && styles.inputContainerFocused
                    ]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter participant name"
                        placeholderTextColor="#9BA1A6"
                        value={participant.name}
                        onChangeText={(value) => handleParticipantNameChange(index, value)}
                        onFocus={() => setFocusedIndex(index)}
                        onBlur={() => setFocusedIndex(null)}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Remove Button (only show if more than 2 participants) */}
                  {participants.length > 2 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveParticipant(index)}
                      activeOpacity={0.7}>
                      <IconSymbol name="minus.circle.fill" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Add Participant Button */}
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddParticipant}
                activeOpacity={0.7}>
                <IconSymbol name="plus.circle.fill" size={20} color="#FFD700" />
                <Text style={styles.addButtonText}>ADD PARTICIPANT</Text>
              </TouchableOpacity>

            </View>
          </View>
        </ScrollView>

        {/* Create Button - Fixed at bottom */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={[
              styles.createButtonActive,
              !isFormValid && styles.createButton
            ]}
            onPress={handleCreateGroup}
            activeOpacity={0.8}
            disabled={!isFormValid}>
            <Text
              style={[
                styles.createButtonTextActive,
                !isFormValid && styles.createButtonText,
              ]}>
              CREATE & CELEBRATE
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 40,
  },
  form: {
    flex: 1,
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  participantsLabel: {
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
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  serialNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serialNumberText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputWrapper: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: 'rgb(0 10 26)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 56,
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
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(0 10 26)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  addButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bottomButtonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
    backgroundColor: 'rgb(1 27 61)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.1)',
  },
  createButton: {
    backgroundColor: '#152b45',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a3441',
  },
  createButtonActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  createButtonText: {
    color: '#67758a',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  createButtonTextActive: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
