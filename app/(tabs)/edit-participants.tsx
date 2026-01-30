import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getGroupDetails, updateParticipantEmails } from '@/utils/api';
import { alert } from '@/utils/alert';

interface ParticipantEmail {
  id: string;
  name: string;
  email: string;
}

export default function EditParticipantsScreen() {
  const { groupId, groupName } = useLocalSearchParams<{ groupId: string; groupName: string }>();
  const [participants, setParticipants] = useState<ParticipantEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadGroupParticipants();
  }, [groupId]);

  const loadGroupParticipants = async () => {
    try {
      setIsLoading(true);
      const group = await getGroupDetails(groupId);
      
      // Map participants to email form - use participant email or user email (for registered users)
      const participantEmails = group.participants.map((p: any) => ({
        id: p.id || p._id,
        name: p.name,
        email: (p.email || (p.user && p.user.email) || '').trim(),
      }));
      
      setParticipants(participantEmails);
    } catch (error: any) {
      console.error('Error loading participants:', error);
      alert('Error', error.message || 'Failed to load participants');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (index: number, email: string) => {
    const updated = [...participants];
    updated[index].email = email;
    setParticipants(updated);
  };

  const validateEmails = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (const p of participants) {
      if (p.email && !emailRegex.test(p.email.trim())) {
        alert('Invalid Email', `"${p.email}" is not a valid email address for ${p.name}`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateEmails()) return;

    // Filter only participants with emails
    const participantsWithEmails = participants
      .filter(p => p.email && p.email.trim())
      .map(p => ({
        participantId: p.id,
        email: p.email.trim(),
      }));

    if (participantsWithEmails.length === 0) {
      alert('No Emails', 'Please enter at least one email address to send invitations');
      return;
    }

    try {
      setIsSaving(true);
      const result = await updateParticipantEmails(groupId, participantsWithEmails);
      
      const successCount = result.emailResults?.filter((e: any) => e.success).length || 0;
      const failCount = result.emailResults?.filter((e: any) => !e.success).length || 0;
      
      let message = `Updated ${result.updatedParticipants?.length || 0} email(s).`;
      if (successCount > 0) {
        message += `\nSent ${successCount} invitation email(s).`;
      }
      if (failCount > 0) {
        message += `\n${failCount} email(s) failed to send.`;
      }
      
      alert('Success', message, () => {
        router.back();
      });
    } catch (error: any) {
      console.error('Error updating emails:', error);
      alert('Error', error.message || 'Failed to update emails');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Participants</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading participants...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Participants</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.groupName}>{groupName?.toUpperCase() || 'GROUP'}</Text>
          <Text style={styles.subtitle}>Add email addresses to send invitations</Text>

          {participants.length > 0 && (
            <View style={styles.emailSummary}>
              <Text style={styles.emailSummaryText}>
                {participants.filter((p) => p.email).length} of {participants.length} participants have email
              </Text>
            </View>
          )}

          <View style={styles.participantsList}>
            {participants.map((participant, index) => (
              <View key={participant.id} style={styles.participantCard}>
                <View style={styles.participantHeader}>
                  <View style={styles.serialNumber}>
                    <Text style={styles.serialText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.participantName}>{participant.name}</Text>
                  {participant.email ? (
                    <View style={styles.hasEmailBadge}>
                      <IconSymbol name="checkmark.circle.fill" size={18} color="#22C55E" />
                      <Text style={styles.hasEmailText}>Email</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.emailInputContainer}>
                  <IconSymbol name="envelope.fill" size={18} color="#9BA1A6" style={styles.emailIcon} />
                  <TextInput
                    style={styles.emailInput}
                    placeholder="Enter email address"
                    placeholderTextColor="#6B7280"
                    value={participant.email}
                    onChangeText={(text) => handleEmailChange(index, text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <IconSymbol name="paperplane.fill" size={20} color="#000" />
                <Text style={styles.saveButtonText}>UPDATE & SEND EMAILS</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001a3d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#001a3d',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9BA1A6',
    marginBottom: 16,
  },
  emailSummary: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  emailSummaryText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '500',
  },
  participantsList: {
    gap: 16,
  },
  participantCard: {
    backgroundColor: '#002b61',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a3441',
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serialNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serialText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  participantName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  hasEmailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  hasEmailText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001a3d',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2a3441',
  },
  emailIcon: {
    marginRight: 10,
  },
  emailInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9BA1A6',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#001a3d',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});
