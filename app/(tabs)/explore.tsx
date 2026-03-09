import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { clearAuth, getUserData, UserData } from '@/utils/auth';
import { useI18n } from '@/utils/i18n';
import { alert } from '@/utils/alert';

export default function SettingsScreen() {
  const [user, setUser] = useState<UserData | null>(null);
  const { language, setLanguage, t } = useI18n();

  useEffect(() => {
    const loadData = async () => {
      const storedUser = await getUserData();
      setUser(storedUser);
    };

    loadData();
  }, []);

  const handleLanguageToggle = async (value: boolean) => {
    const newLanguage = value ? 'so' : 'en';
    try {
      await setLanguage(newLanguage);
      // Force a re-render by reloading the screen
      // The I18nProvider will update all components using useI18n
    } catch (error) {
      console.error('Error saving language preference:', error);
      alert(t('error'), 'Failed to change language. Please try again.');
    }
  };

  const displayName = user?.name || user?.email || 'Guest';
  const displayEmail = user?.email || '';
  const initials =
    (user?.name || user?.email || 'A')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 1);

  const handleLogout = () => {
    alert(
      t('logout'),
      t('logoutConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await clearAuth();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    alert(
      t('deleteAccount'),
      t('deleteAccountConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement delete account API call
            await clearAuth();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.title}>{t('settings')}</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{displayName}</Text>
            {displayEmail && (
              <Text style={styles.email}>{displayEmail.toUpperCase()}</Text>
            )}
          </View>
        </View>

        {/* Language Selection Card */}
        <View style={styles.languageCard}>
          <View style={styles.languageLeft}>
            <IconSymbol name="globe" size={20} color="#FFFFFF" />
            <Text style={styles.flagEmoji}>{language === 'en' ? '🇬🇧' : '🇸🇴'}</Text>
            <Text style={styles.languageText}>{language === 'en' ? t('english') : t('somali')}</Text>
          </View>
          <Switch
            value={language === 'so'}
            onValueChange={handleLanguageToggle}
            trackColor={{ false: '#1a2332', true: '#FFD700' }}
            thumbColor={language === 'so' ? '#FFFFFF' : '#9BA1A6'}
            ios_backgroundColor="#1a2332"
          />
        </View>

        {/* Privacy Policy Card */}
        <TouchableOpacity 
          style={styles.privacyCard}
          onPress={() => router.push('/(tabs)/privacy-policy')}
          activeOpacity={0.8}>
          <IconSymbol name="doc.text.fill" size={20} color="#FFD700" />
          <Text style={styles.privacyText}>Privacy Policy</Text>
          <IconSymbol name="chevron.right" size={16} color="#9BA1A6" />
        </TouchableOpacity>

        {/* Logout Card */}
        <TouchableOpacity 
          style={styles.logoutCard}
          onPress={handleLogout}
          activeOpacity={0.8}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#61a5fb" />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>

        {/* Delete Account Card */}
        <TouchableOpacity 
          style={styles.deleteAccountCard}
          onPress={handleDeleteAccount}
          activeOpacity={0.8}>
          <IconSymbol name="trash.fill" size={20} color="#9BA1A6" />
          <Text style={styles.deleteAccountText}>{t('deleteAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(1 27 61)',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 24,
    letterSpacing: 1,
  },
  profileCard: {
    backgroundColor: '#002b61',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a2332',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 0,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 14,
    color: '#9BA1A6',
    letterSpacing: 0.5,
  },
  languageCard: {
    backgroundColor: '#002b61',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1a2332',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagEmoji: {
    fontSize: 20,
  },
  languageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  privacyCard: {
    backgroundColor: '#002b61',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#1a2332',
  },
  privacyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    flex: 1,
  },
  logoutCard: {
    backgroundColor: '#002b61',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#1a2332',
  },
  logoutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#61a5fb',
    letterSpacing: 1,
    flex: 1,
  },
  deleteAccountCard: {
    backgroundColor: '#4a1a3d',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#6a2a4d',
  },
  deleteAccountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    letterSpacing: 1,
    flex: 1,
  },
});

