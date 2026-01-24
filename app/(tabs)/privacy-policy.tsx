import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TouchableOpacity } from 'react-native';
import { useI18n } from '@/utils/i18n';

export default function PrivacyPolicyScreen() {
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        
        {/* Header Title */}
        <Text style={styles.mainTitle}>Privacy Policy</Text>
        <Text style={styles.appName}>Ayuuto APP</Text>
        
        {/* Last Updated */}
        <Text style={styles.lastUpdated}>Last updated: 01 Jan 2026</Text>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionText}>
            Ayuuto App respects your privacy. This Privacy Policy explains what information we collect, how we use it, and how we protect it.
          </Text>
        </View>

        {/* Information We Collect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.sectionText}>
            Ayuuto App only collects the minimum information required for the app to function.
          </Text>
          <Text style={styles.sectionText}>
            We collect the following personal data:
          </Text>
          <Text style={styles.bulletPoint}>• First name</Text>
          <Text style={styles.bulletPoint}>• Last name</Text>
          <Text style={styles.bulletPoint}>• Email address</Text>
          <Text style={styles.bulletPoint}>• Phone number</Text>
          <Text style={styles.sectionText}>
            No other personal data is collected or processed.
          </Text>
        </View>

        {/* How We Use Your Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.sectionText}>
            Your information is used solely to:
          </Text>
          <Text style={styles.bulletPoint}>• Identify users within savings groups</Text>
          <Text style={styles.bulletPoint}>• Enable group organization and communication</Text>
          <Text style={styles.bulletPoint}>• Ensure clarity and trust between participants</Text>
          <Text style={styles.sectionText}>
            Ayuuto App does not use your data for marketing, advertising, or analytics.
          </Text>
        </View>

        {/* No Financial Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. No Financial Data</Text>
          <Text style={styles.sectionText}>
            Ayuuto App does not handle, store, or process any money or financial transactions.
          </Text>
          <Text style={styles.sectionText}>
            All savings arrangements and payments take place outside the app, directly between users.
          </Text>
        </View>

        {/* Data Storage and Hosting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Storage and Hosting</Text>
          <Text style={styles.sectionText}>
            All data is securely stored on servers hosted by Railway.
          </Text>
          <Text style={styles.sectionText}>
            We take reasonable technical and organizational measures to protect your information from unauthorized access, loss, or misuse.
          </Text>
        </View>

        {/* Third-Party Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
          <Text style={styles.sectionText}>
            Ayuuto App does not share your personal data with third parties.
          </Text>
          <Text style={styles.sectionText}>
            No external tools or services process user data beyond our hosting provider (Railway).
          </Text>
        </View>

        {/* Data Retention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Retention</Text>
          <Text style={styles.sectionText}>
            Your data is stored only for as long as you use the Ayuuto App.
          </Text>
          <Text style={styles.sectionText}>
            If you stop using the app or request deletion, your personal data will be removed within a reasonable time.
          </Text>
        </View>

        {/* Your Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Your Rights</Text>
          <Text style={styles.sectionText}>
            You have the right to:
          </Text>
          <Text style={styles.bulletPoint}>• Access the personal data we hold about you</Text>
          <Text style={styles.bulletPoint}>• Request correction of inaccurate information</Text>
          <Text style={styles.bulletPoint}>• Request deletion of your data</Text>
          <Text style={styles.sectionText}>
            To exercise these rights, contact us using the details below.
          </Text>
        </View>

        {/* Children's Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.sectionText}>
            Ayuuto App is not intended for use by children under the age of 13.
          </Text>
          <Text style={styles.sectionText}>
            We do not knowingly collect personal data from children.
          </Text>
        </View>

        {/* Changes to This Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to This Privacy Policy</Text>
          <Text style={styles.sectionText}>
            We may update this Privacy Policy from time to time.
          </Text>
          <Text style={styles.sectionText}>
            Any changes will be published on this page with an updated revision date.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Information</Text>
          <Text style={styles.sectionText}>
            If you have questions about this Privacy Policy or how your data is handled, please contact us:
          </Text>
          <Text style={styles.contactInfo}>Email: hello@ayuuto.app</Text>
        </View>

        {/* Spacing at bottom */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(1 27 61)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2332',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9BA1A6',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#E0E0E0',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
    color: '#E0E0E0',
    marginLeft: 16,
    marginBottom: 6,
  },
  contactInfo: {
    fontSize: 14,
    lineHeight: 22,
    color: '#FFD700',
    marginTop: 8,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});
