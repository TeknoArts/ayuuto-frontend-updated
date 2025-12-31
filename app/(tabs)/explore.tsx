import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { clearAuth, getUserData, UserData } from '@/utils/auth';

export default function SettingsScreen() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await getUserData();
      setUser(storedUser);
    };

    loadUser();
  }, []);

  const displayName = user?.name || user?.email || 'Guest';
  const initials =
    (user?.name || user?.email || 'Ayuuto')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your Ayuuto experience</Text>

        {/* Avatar + name */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
        </View>

        {/* Settings buttons */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <IconSymbol name="person.fill" size={22} color="#FFD700" />
              <Text style={styles.rowLabel}>Profile Settings</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#9BA1A6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <IconSymbol name="lock.fill" size={22} color="#FFD700" />
              <Text style={styles.rowLabel}>Privacy Settings</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#9BA1A6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <IconSymbol name="paperplane.fill" size={22} color="#FFD700" />
              <Text style={styles.rowLabel}>Terms &amp; Conditions</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#9BA1A6" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await clearAuth();
            router.replace('/login');
          }}>
          <Text style={styles.logoutText}>Logout</Text>
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9BA1A6',
    marginBottom: 24,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#002b61',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 2,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#00152f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1a2332',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

