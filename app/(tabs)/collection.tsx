import { useState, useCallback, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useI18n } from '@/utils/i18n';

type Frequency = 'MONTHLY' | 'WEEKLY';

export default function CollectionScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const [amount, setAmount] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('MONTHLY');
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isCollectionDateFocused, setIsCollectionDateFocused] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const isCreatingRef = useRef(false);

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
    if (!isFormValid || isCreatingRef.current) {
      return;
    }

    // Lock immediately to prevent double taps and show loader
    isCreatingRef.current = true;
    setIsCreating(true);
    
    const existingGroupId = params.groupId as string | undefined;
    const fromWizard = params.fromWizard === 'true';
    
    // Create group first (fast operation), then navigate immediately
    let groupId = existingGroupId;
    
    if (!groupId && fromWizard) {
      try {
        const { createGroup, addParticipants, setCollectionDetails } = await import('@/utils/api');
        const groupName = (params.groupName as string) || 'Ayuuto Group';
        const memberCount = parseInt((params.memberCount as string) || '2') || 2;

        // Create the group first (can take time on slow network)
        const group = await createGroup(groupName, memberCount);
        groupId = group.id;

        // Navigate ASAP after we have groupId (instant UX)
        const amountValue = parseFloat(amount);
        const collectionDateValue = parseInt(collectionDate, 10);

        // Unlock before navigating to avoid setState after unmount
        isCreatingRef.current = false;
        setIsCreating(false);

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

        // Do the slower setup work in background (non-blocking)
        (async () => {
          // Add participants if provided
          const participantsParam = params.participants as string | undefined;
          if (participantsParam) {
            try {
              const participantsData = JSON.parse(participantsParam);
              if (Array.isArray(participantsData) && participantsData.length > 0) {
                const payload = participantsData.map((p: any) => {
                  if (typeof p === 'string') {
                    return { userId: p };
                  }
                  return {
                    userId: p.userId || null,
                    email: p.email || null,
                    name: p.name || null,
                  };
                });
                await addParticipants(groupId!, payload as any);
              }
            } catch (e) {
              console.warn('Failed to parse participants from params:', e);
            }
          }

          // Set collection details
          try {
            await setCollectionDetails(groupId!, amountValue, frequency, collectionDateValue);
          } catch (error: any) {
            console.error('Error setting collection details:', error);
          }
        })();

        return;
      } catch (error: any) {
        console.error('Error creating group:', error);
        alert(t('error'), error?.message || t('failedToCreate'));
        isCreatingRef.current = false;
        setIsCreating(false);
        return;
      }
    }

    if (!groupId) {
      console.error('No groupId available for setting collection details.');
      alert(t('error'), 'Failed to create group');
      isCreatingRef.current = false;
      setIsCreating(false);
      return;
    }

    // Navigate immediately to celebration screen
    isCreatingRef.current = false;
    setIsCreating(false);
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
    
    // Set collection details in background (after navigation)
    (async () => {
      try {
        const { setCollectionDetails } = await import('@/utils/api');
        await setCollectionDetails(
          groupId!,
          parseFloat(amount),
          frequency,
          parseInt(collectionDate)
        );
      } catch (error: any) {
        console.error('Error setting collection details:', error);
        // Error is non-critical, group is already created
      }
    })();
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
            {/* Header with Back Button - go to add-participants (emails) with same wizard params */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  const groupName = (params.groupName as string) || '';
                  const memberCount = (params.memberCount as string) || '2';
                  const participants = (params.participants as string) || '[]';
                  router.replace({
                    pathname: '/(tabs)/add-participants',
                    params: { groupName, memberCount, participants, fromWizard: 'true' },
                  });
                }}>
                <IconSymbol name="chevron.left" size={20} color="#61a5fb" />
                <Text style={styles.backText}>{t('back')}</Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={styles.title}>{t('newGroupTitle')}</Text>

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
                  <Text style={styles.frequencyButtonText}>{t('monthly')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    frequency === 'WEEKLY' && styles.frequencyButtonActive
                  ]}
                  onPress={() => handleFrequencyChange('WEEKLY')}
                  activeOpacity={0.8}>
                  <Text style={styles.frequencyButtonText}>{t('weekly')}</Text>
                </TouchableOpacity>
              </View>

              {/* Collection Date/Day Section */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>
                  {frequency === 'WEEKLY' ? `${t('collectionDay')} (1-7)` : `${t('collectionDate')} (1-31)`}
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
                  isFormValid && styles.createButtonActive,
                  isCreating && styles.createButtonDisabled,
                ]}
                onPress={handleCreate}
                activeOpacity={isCreating ? 1 : 0.8}
                disabled={!isFormValid || isCreating}>
                {/* Keep text to preserve button size; hide it visually when loading */}
                <Text style={[styles.createButtonText, isCreating && styles.createButtonTextHidden]}>
                  {t('create')} & {t('celebrate')}!
                </Text>
                {isCreating && (
                  <View style={styles.createButtonSpinnerOverlay} pointerEvents="none">
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
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
  createButtonDisabled: {
    opacity: 0.85,
  },
  createButtonTextHidden: {
    opacity: 0,
  },
  createButtonSpinnerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

