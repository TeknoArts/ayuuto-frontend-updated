import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AddParticipantsScreen() {
  const params = useLocalSearchParams();
  const memberCount = parseInt(params.memberCount as string) || 2;
  
  const [participants, setParticipants] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  
  // Reset form when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Initialize participants array based on member count
      setParticipants(Array(memberCount).fill(''));
      setFocusedIndex(null);
    }, [memberCount])
  );
  
  // Initialize on mount if not already set
  useEffect(() => {
    if (participants.length === 0 && memberCount > 0) {
      setParticipants(Array(memberCount).fill(''));
    }
  }, []);
  
  const totalParticipants = memberCount;

  const filledCount = participants.filter(p => p.trim().length > 0).length;
  const isFormValid = participants.every(p => p.trim().length > 0);

  const handleParticipantChange = (index: number, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = value;
    setParticipants(newParticipants);
  };

  const handleNext = async () => {
    if (!isFormValid) {
      return;
    }
    try {
      const { addParticipants } = await import('@/utils/api');
      const groupId = params.groupId as string;
      const participantNames = participants.filter(p => p.trim().length > 0);
      
      await addParticipants(groupId, participantNames);
      
      // Navigate to collection screen
      router.push({
        pathname: '/(tabs)/collection',
        params: {
          ...params,
          participants: JSON.stringify(participantNames),
        },
      });
    } catch (error: any) {
      console.error('Error adding participants:', error);
      // You can add error handling UI here
    }
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
              {/* Type Names Section */}
              <View style={styles.typeNamesHeader}>
                <Text style={styles.typeNamesLabel}>TYPE NAMES</Text>
                <View style={styles.counterBadge}>
                  <Text style={styles.counterText}>{filledCount}/{totalParticipants}</Text>
                </View>
              </View>

              {/* Participant Input Fields */}
              {participants.map((participant, index) => (
                <View key={index} style={styles.inputSection}>
                  <View style={[
                    styles.inputContainer,
                    focusedIndex === index && styles.inputContainerFocused
                  ]}>
                    <TextInput
                      style={styles.input}
                      placeholder={`Participant ${index + 1}`}
                      placeholderTextColor="#9BA1A6"
                      value={participant}
                      onChangeText={(value) => handleParticipantChange(index, value)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
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
});

