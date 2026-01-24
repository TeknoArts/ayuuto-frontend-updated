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
        
        {/* Last Updated */}
        <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</Text>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.sectionText}>
            Welcome to Ayuuto. We are committed to protecting your privacy and ensuring you have a positive experience on our app. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </Text>
        </View>

        {/* Information We Collect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          
          <Text style={styles.subsectionTitle}>2.1 Personal Information</Text>
          <Text style={styles.sectionText}>
            When you create an account, we collect:
          </Text>
          <Text style={styles.bulletPoint}>• Name</Text>
          <Text style={styles.bulletPoint}>• Email address</Text>
          <Text style={styles.bulletPoint}>• Phone number (optional)</Text>

          <Text style={styles.subsectionTitle}>2.2 Group Information</Text>
          <Text style={styles.sectionText}>
            When you create or join a group, we collect:
          </Text>
          <Text style={styles.bulletPoint}>• Group name and description</Text>
          <Text style={styles.bulletPoint}>• Participant information (names and email addresses)</Text>
          <Text style={styles.bulletPoint}>• Payment and transaction records</Text>
          <Text style={styles.bulletPoint}>• Collection amounts and schedules</Text>

          <Text style={styles.subsectionTitle}>2.3 Device Information</Text>
          <Text style={styles.sectionText}>
            We automatically collect certain information about your device, including:
          </Text>
          <Text style={styles.bulletPoint}>• Device type and operating system</Text>
          <Text style={styles.bulletPoint}>• Unique device identifiers</Text>
          <Text style={styles.bulletPoint}>• Push notification tokens</Text>
        </View>

        {/* How We Use Your Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.sectionText}>
            We use the information we collect to:
          </Text>
          <Text style={styles.bulletPoint}>• Provide, maintain, and improve our services</Text>
          <Text style={styles.bulletPoint}>• Process transactions and manage group activities</Text>
          <Text style={styles.bulletPoint}>• Send you notifications about group activities and payments</Text>
          <Text style={styles.bulletPoint}>• Communicate with you about your account and our services</Text>
          <Text style={styles.bulletPoint}>• Detect, prevent, and address technical issues</Text>
          <Text style={styles.bulletPoint}>• Comply with legal obligations</Text>
        </View>

        {/* Information Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Information Sharing and Disclosure</Text>
          <Text style={styles.sectionText}>
            We do not sell your personal information. We may share your information only in the following circumstances:
          </Text>
          <Text style={styles.bulletPoint}>• With other group members: Your name and email may be visible to other participants in groups you join</Text>
          <Text style={styles.bulletPoint}>• Service providers: We may share information with third-party service providers who perform services on our behalf (e.g., cloud hosting, email delivery)</Text>
          <Text style={styles.bulletPoint}>• Legal requirements: We may disclose information if required by law or to protect our rights and safety</Text>
          <Text style={styles.bulletPoint}>• Business transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred</Text>
        </View>

        {/* Data Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          <Text style={styles.sectionText}>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </Text>
        </View>

        {/* Your Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Your Rights</Text>
          <Text style={styles.sectionText}>
            You have the right to:
          </Text>
          <Text style={styles.bulletPoint}>• Access your personal information</Text>
          <Text style={styles.bulletPoint}>• Correct inaccurate or incomplete information</Text>
          <Text style={styles.bulletPoint}>• Request deletion of your account and data</Text>
          <Text style={styles.bulletPoint}>• Opt-out of certain communications</Text>
          <Text style={styles.sectionText}>
            To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
          </Text>
        </View>

        {/* Data Retention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Data Retention</Text>
          <Text style={styles.sectionText}>
            We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this Privacy Policy. When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal or regulatory purposes.
          </Text>
        </View>

        {/* Children's Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.sectionText}>
            Our services are not intended for children under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
          </Text>
        </View>

        {/* Changes to This Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to This Privacy Policy</Text>
          <Text style={styles.sectionText}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
          </Text>
        </View>

        {/* Contact Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have any questions about this Privacy Policy, please contact us:
          </Text>
          <Text style={styles.contactInfo}>Email: support@ayuuto.app</Text>
          <Text style={styles.contactInfo}>Website: www.ayuuto.app</Text>
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
