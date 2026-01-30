import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { alert } from '@/utils/alert';
import { useI18n } from '@/utils/i18n';

export default function NewGroupScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const [groupName, setGroupName] = useState('');
  const [memberCount, setMemberCount] = useState('');
  const [isGroupNameFocused, setIsGroupNameFocused] = useState(false);
  const [isMemberCountFocused, setIsMemberCountFocused] = useState(false);

  // When returning from add-participants (params passed), pre-fill form; otherwise reset
  useFocusEffect(
    useCallback(() => {
      const nameFromParams = (params.groupName as string) || '';
      const countFromParams = (params.memberCount as string) || '';
      if (nameFromParams || countFromParams) {
        setGroupName(nameFromParams);
        setMemberCount(countFromParams || '2');
      } else {
        setGroupName('');
        setMemberCount('');
      }
      setIsGroupNameFocused(false);
      setIsMemberCountFocused(false);
    }, [params.groupName, params.memberCount])
  );

  const isFormValid = groupName.trim().length > 0 && memberCount.trim().length > 0;

  const handleIncrement = () => {
    const currentValue = parseInt(memberCount) || 2;
    const newValue = Math.min(currentValue + 1, 100);
    setMemberCount(newValue.toString());
  };

  const handleDecrement = () => {
    const currentValue = parseInt(memberCount) || 2;
    const newValue = Math.max(currentValue - 1, 2);
    setMemberCount(newValue.toString());
  };

  const handleNext = () => {
    if (!isFormValid) {
      return;
    }
    
    // Validate member count - must be at least 2
    const count = parseInt(memberCount);
    if (count < 2) {
      alert(
        'Invalid Member Count',
        'At least 2 members are required to create a group.'
      );
      return;
    }
    
    // Step 2 in creation flow: configure participants for this group (no API call yet).
    router.push({
      pathname: '/(tabs)/add-participants',
      params: {
        groupName,
        memberCount,
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
              onPress={() => router.back()}>
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
              <Text style={styles.label}>{t('groupName')}</Text>
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

            {/* Member Count Input */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>{t('memberCount')}</Text>
              <View style={[
                styles.inputContainerNoBorder,
                isMemberCountFocused && styles.inputContainerFocused
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="2-100"
                  placeholderTextColor="#9BA1A6"
                  value={memberCount}
                  onChangeText={(value) => {
                    // Only allow numeric input
                    const numericValue = value.replace(/[^0-9]/g, '');
                    setMemberCount(numericValue);
                    
                    // Show alert if user enters 1
                    if (numericValue === '1') {
                      alert(
                        t('invalidMemberCount'),
                        t('atLeastTwoMembers')
                      );
                      // Reset to minimum 2
                      setMemberCount('2');
                    }
                  }}
                  onFocus={() => setIsMemberCountFocused(true)}
                  onBlur={() => setIsMemberCountFocused(false)}
                  keyboardType="number-pad"
                  autoCorrect={false}
                />
                {isMemberCountFocused && (
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
            {/* Next Button */}
            <TouchableOpacity
              style={[
                styles.nextButton,
                isFormValid && styles.nextButtonActive
              ]}
              onPress={handleNext}
              activeOpacity={0.8}
              disabled={!isFormValid}>
              <Text
                style={[
                  styles.nextButtonText,
                  isFormValid && styles.nextButtonTextActive,
                ]}>
                {t('next')}
              </Text>
            </TouchableOpacity>
            </View>
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
  inputContainerNoBorder: {
    backgroundColor: 'rgb(0 10 26)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 16,
    flex: 1,
  },
  stepperContainer: {
    backgroundColor: '#2a3441',
    borderRadius: 8,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
});

