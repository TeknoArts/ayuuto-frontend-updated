import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getUserData, UserData } from '@/utils/auth';

export default function HomeScreen() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await getUserData();
      setUser(storedUser);
    };

    loadUser();
  }, []);

  const displayName = user?.name || user?.email || 'Friend';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Welcome to Ayuuto, {displayName}!</Text>
            <Text style={styles.sloganText}>ORGANIZE WITH TRUST, CELEBRATE TOGETHER.</Text>
          </View>
          <TouchableOpacity style={styles.flagButton}>
            <IconSymbol name="flag.fill" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* New Group Button */}
        <TouchableOpacity style={styles.newGroupButton}>
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
          <Text style={styles.newGroupText}>NEW GROUP</Text>
        </TouchableOpacity>

        {/* Ayuuto Manager Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleYellow}>AYUUTO MANAGER</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>YOU DON'T MANAGE ANY GROUPS YET.</Text>
          </View>
        </View>

        {/* My Ayuutos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleBlue}>MY AYUUTOS</Text>
          <View style={styles.fundCard}>
            <View style={styles.fundCardHeader}>
              <Text style={styles.fundName}>FRIDAY COMMUNITY FUND</Text>
              <Text style={styles.turnIndicator}>TURN 2</Text>
            </View>
            <View style={styles.fundDetails}>
              <IconSymbol name="dollarsign.circle.fill" size={16} color="#FFD700" />
              <Text style={styles.fundDetailsText}>1500 • 3 Participants</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(1 27 61)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sloganText: {
    fontSize: 12,
    color: '#9BA1A6',
    letterSpacing: 1,
  },
  flagButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1a2332',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3441',
  },
  newGroupButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  newGroupText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitleYellow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  sectionTitleBlue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4FC3F7',
    letterSpacing: 1,
    marginBottom: 16,
  },
  emptyState: {
    borderWidth: 2,
    borderColor: '#9BA1A6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: '#9BA1A6',
    fontSize: 14,
    letterSpacing: 1,
  },
  fundCard: {
    backgroundColor: '#002b61',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a3441',
  },
  fundCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fundName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
    flex: 1,
  },
  turnIndicator: {
    fontSize: 12,
    color: '#9BA1A6',
    letterSpacing: 1,
  },
  fundDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fundDetailsText: {
    color: '#9BA1A6',
    fontSize: 14,
  },
});
