import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { alert, confirm } from '@/utils/alert';
import { useI18n } from '@/utils/i18n';

export default function NewGroupScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const [groupName, setGroupName] = useState('');
  const [amount, setAmount] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [isGroupNameFocused, setIsGroupNameFocused] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isCollectionDateFocused, setIsCollectionDateFocused] = useState(false);

  // When returning from next screen (params passed), pre-fill form; otherwise reset
  useFocusEffect(
    useCallback(() => {
      const nameFromParams = (params.groupName as string) || '';
      const amountFromParams = (params.amount as string) || '';
      const dateFromParams = (params.collectionDate as string) || '';
      if (nameFromParams || amountFromParams || dateFromParams) {
        setGroupName(nameFromParams);
        setAmount(amountFromParams);
        setCollectionDate(dateFromParams);
      } else {
        setGroupName('');
        setAmount('');
        setCollectionDate('');
      }
      setIsGroupNameFocused(false);
      setIsAmountFocused(false);
      setIsCollectionDateFocused(false);
    }, [params.groupName, params.amount, params.collectionDate])
  );

  const isFormValid = groupName.trim().length > 0 && 
                      amount.trim().length > 0 && 
                      collectionDate.trim().length > 0;

  // Check if user has entered any data
  const hasData = groupName.trim().length > 0 || 
                  amount.trim().length > 0 || 
                  collectionDate.trim().length > 0;

  // Handle back press with confirmation if data entered
  const handleBackPress = useCallback(() => {
    if (hasData) {
      confirm(
        'Leave?',
        'Are you sure you want to leave? Your changes will be lost.',
        () => {
          // User confirmed - go to home
          router.replace('/(tabs)');
        },
        () => {
          // User cancelled - do nothing
        }
      );
      return true; // Prevent default back action
    }
    // No data entered, just go back
    router.replace('/(tabs)');
    return true;
  }, [hasData]);

  // Handle Android hardware back button
  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }, [handleBackPress])
  );

  const handleNext = () => {
    if (!isFormValid) {
      return;
    }
    
    // Validate amount - must be positive
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert(
        'Invalid Amount',
        'Please enter a valid amount greater than 0.'
      );
      return;
    }
    
    // Validate collection date - must be between 1-31
    const dateNum = parseInt(collectionDate);
    if (isNaN(dateNum) || dateNum < 1 || dateNum > 31) {
      alert(
        'Invalid Collection Date',
        'Collection date must be between 1 and 31.'
      );
      return;
    }
    
    // Navigate to next screen (add participants or member count selection)
    router.push({
      pathname: '/(tabs)/add-participants',
      params: {
        groupName,
        amount,
        collectionDate,
        fromWizard: 'true',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.content}>
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}>
              <IconSymbol name="chevron.left" size={20} color="#61a5fb" />
              <Text style={styles.backText}>{t('back')}</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('newGroupTitle')}</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Group Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>GROUP NAME</Text>
              <View style={[
                styles.inputContainer,
                isGroupNameFocused && styles.inputContainerFocused
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Eid Savings"
                  placeholderTextColor="#9BA1A6"
                  value={groupName}
                  onChangeText={setGroupName}
                  onFocus={() => setIsGroupNameFocused(true)}
                  onBlur={() => setIsGroupNameFocused(false)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>AMOUNT</Text>
              <View style={[
                styles.inputContainer,
                isAmountFocused && styles.inputContainerFocused
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1000"
                  placeholderTextColor="#9BA1A6"
                  value={amount}
                  onChangeText={(value) => {
                    // Only allow numeric input with optional decimal
                    const numericValue = value.replace(/[^0-9.]/g, '');
                    // Prevent multiple decimal points
                    const parts = numericValue.split('.');
                    if (parts.length > 2) {
                      return;
                    }
                    setAmount(numericValue);
                  }}
                  onFocus={() => setIsAmountFocused(true)}
                  onBlur={() => setIsAmountFocused(false)}
                  keyboardType="decimal-pad"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Collection Date Input */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>COLLECTION DATE</Text>
              <View style={[
                styles.inputContainer,
                isCollectionDateFocused && styles.inputContainerFocused
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="Day of month (1-31)"
                  placeholderTextColor="#9BA1A6"
                  value={collectionDate}
                  onChangeText={(value) => {
                    // Only allow numeric input
                    const numericValue = value.replace(/[^0-9]/g, '');
                    // Limit to 2 digits
                    if (numericValue.length <= 2) {
                      setCollectionDate(numericValue);
                    }
                  }}
                  onFocus={() => setIsCollectionDateFocused(true)}
                  onBlur={() => setIsCollectionDateFocused(false)}
                  keyboardType="number-pad"
                  autoCorrect={false}
                  maxLength={2}
                />
              </View>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={[
                styles.nextButtonActive,
                !isFormValid && styles.nextButton
              ]}
              onPress={handleNext}
              activeOpacity={0.8}
              disabled={!isFormValid}>
              <Text
                style={[
                  styles.nextButtonTextActive,
                  !isFormValid && styles.nextButtonText,
                ]}>
                {t('next')}
              </Text>
            </TouchableOpacity>
          </View>
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
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#152b45',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a3441',
  },
  nextButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  nextButtonText: {
    color: '#67758a',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  nextButtonTextActive: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
});

