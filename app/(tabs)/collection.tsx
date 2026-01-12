import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';

type Frequency = 'MONTHLY' | 'WEEKLY';

export default function CollectionScreen() {
  const params = useLocalSearchParams();
  const [amount, setAmount] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('MONTHLY');
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isCollectionDateFocused, setIsCollectionDateFocused] = useState(false);

  // Reset form when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setAmount('');
      setCollectionDate('');
      setFrequency('MONTHLY');
      setIsAmountFocused(false);
      setIsCollectionDateFocused(false);
    }, [])
  );

  const isFormValid = amount.trim().length > 0 && collectionDate.trim().length > 0;

  const handleAmountChange = (value: string) => {
    // Only allow numeric input (including decimal point for cents)
    const numericValue = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return;
    }
    setAmount(numericValue);
  };

  const handleIncrement = () => {
    const currentValue = parseFloat(amount) || 0;
    const newValue = currentValue + 1;
    setAmount(newValue.toString());
  };

  const handleDecrement = () => {
    const currentValue = parseFloat(amount) || 0;
    const newValue = Math.max(currentValue - 1, 0);
    setAmount(newValue.toString());
  };

  const handleCollectionDateChange = (value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue === '') {
      setCollectionDate('');
      return;
    }

    const numValue = parseInt(numericValue, 10);
    
    // Validate based on frequency
    if (frequency === 'WEEKLY') {
      // Weekly: 1-7 (Monday-Sunday)
      if (numValue >= 1 && numValue <= 7) {
        setCollectionDate(numericValue);
      } else if (numValue > 7) {
        // If user types a number > 7, set to 7
        setCollectionDate('7');
      }
    } else {
      // Monthly: 1-31
      if (numValue >= 1 && numValue <= 31) {
        setCollectionDate(numericValue);
      } else if (numValue > 31) {
        // If user types a number > 31, set to 31
        setCollectionDate('31');
      }
    }
  };

  // Clear collection date when frequency changes to prevent invalid values
  const handleFrequencyChange = (newFrequency: Frequency) => {
    setFrequency(newFrequency);
    setCollectionDate(''); // Clear date when frequency changes
  };

  const handleCreate = async () => {
    if (!isFormValid) {
      return;
    }
    try {
      const { createGroup, addParticipants, setCollectionDetails } = await import('@/utils/api');

      const existingGroupId = params.groupId as string | undefined;
      const fromWizard = params.fromWizard === 'true';

      let groupId = existingGroupId;

      if (!groupId && fromWizard) {
        const groupName = (params.groupName as string) || 'Ayuuto Group';
        const memberCount = parseInt((params.memberCount as string) || '2') || 2;

        // Create the group first
        const group = await createGroup(groupName, memberCount);
        groupId = group.id;

        // Optionally attach participants if provided
        const participantsParam = params.participants as string | undefined;
        if (participantsParam) {
          try {
            const userIds: string[] = JSON.parse(participantsParam);
            if (Array.isArray(userIds) && userIds.length > 0) {
              const payload = userIds.map((id) => ({ userId: id }));
              await addParticipants(groupId, payload as any);
            }
          } catch (e) {
            console.warn('Failed to parse participants from params:', e);
          }
        }
      }

      if (!groupId) {
        console.error('No groupId available for setting collection details.');
        return;
      }

      // Set collection details for the group
      await setCollectionDetails(
        groupId,
        parseFloat(amount),
        frequency,
        parseInt(collectionDate)
      );

      // Navigate to group created celebration screen
      router.push({
        pathname: '/(tabs)/group-created',
        params: {
          ...params,
          groupId,
          amount,
          frequency,
          collectionDate,
          timestamp: Date.now().toString(),
        },
      });
    } catch (error: any) {
      console.error('Error creating group / setting collection details:', error);
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
              {/* Amount Per Person Section */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>AMOUNT PER PERSON</Text>
                <View style={[
                  styles.amountInputContainer,
                  isAmountFocused && styles.inputContainerFocused
                ]}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor="#9BA1A6"
                    value={amount}
                    onChangeText={handleAmountChange}
                    onFocus={() => setIsAmountFocused(true)}
                    onBlur={() => setIsAmountFocused(false)}
                    keyboardType="decimal-pad"
                    autoCorrect={false}
                    textAlign="center"
                  />
                  {isAmountFocused && (
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={handleIncrement}
                        activeOpacity={0.7}>
                        <IconSymbol name="chevron.up" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                      <View style={styles.stepperDivider} />
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={handleDecrement}
                        activeOpacity={0.7}>
                        <IconSymbol name="chevron.down" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Frequency Selection */}
              <View style={styles.frequencySection}>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    frequency === 'MONTHLY' && styles.frequencyButtonActive
                  ]}
                  onPress={() => handleFrequencyChange('MONTHLY')}
                  activeOpacity={0.8}>
                  <Text style={styles.frequencyButtonText}>MONTHLY</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    frequency === 'WEEKLY' && styles.frequencyButtonActive
                  ]}
                  onPress={() => handleFrequencyChange('WEEKLY')}
                  activeOpacity={0.8}>
                  <Text style={styles.frequencyButtonText}>WEEKLY</Text>
                </TouchableOpacity>
              </View>

              {/* Collection Date/Day Section */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>
                  {frequency === 'WEEKLY' ? 'COLLECTION DAY (1-7)' : 'COLLECTION DATE (1-31)'}
                </Text>
                <View style={[
                  styles.inputContainer,
                  isCollectionDateFocused && styles.inputContainerFocused
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder={frequency === 'WEEKLY' ? '1-7' : '1-31'}
                    placeholderTextColor="#9BA1A6"
                    value={collectionDate}
                    onChangeText={handleCollectionDateChange}
                    onFocus={() => setIsCollectionDateFocused(true)}
                    onBlur={() => setIsCollectionDateFocused(false)}
                    keyboardType="number-pad"
                    autoCorrect={false}
                  />
                </View>
                {frequency === 'WEEKLY' && (
                  <Text style={styles.helperText}>
                    1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday, 7 = Sunday
                  </Text>
                )}
              </View>

              {/* Create Button */}
              <TouchableOpacity
                style={[
                  styles.createButton,
                  isFormValid && styles.createButtonActive
                ]}
                onPress={handleCreate}
                activeOpacity={0.8}
                disabled={!isFormValid}>
                <Text style={styles.createButtonText}>CREATE & CELEBRATE!</Text>
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
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 40,
  },
  form: {
    flex: 1,
  },
  inputSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  amountInputContainer: {
    backgroundColor: '#002452',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  inputContainerFocused: {
    borderColor: '#FFD700',
  },
  amountInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 16,
    textAlign: 'center',
  },
  stepperContainer: {
    backgroundColor: '#2a3441',
    borderRadius: 8,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    width: 32,
    height: 40,
  },
  stepperButton: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  stepperDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#1a2332',
  },
  frequencySection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  frequencyButton: {
    flex: 1,
    backgroundColor: '#002452',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 56,
  },
  frequencyButtonActive: {
    backgroundColor: '#182a3d',
    borderColor: '#FFD700',
  },
  frequencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  inputContainer: {
    backgroundColor: '#002452',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#9BA1A6',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  createButton: {
    backgroundColor: '#152b45',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2a3441',
  },
  createButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});

