import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { typography, spacing } from '../src/theme';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = createStyles(colors);

  const sections = [
    {
      title: 'Information We Collect',
      content: `PepTrack Pro collects the following types of information:

• Personal Tracking Data: Peptide, supplement, and medication usage records you enter, including dosages, schedules, and administration routes.

• Health Journal Data: Weight, energy levels, sleep quality, mood, and personal notes you choose to log.

• Calculator Presets: Reconstitution calculations and saved presets for your convenience.

• Device Information: Basic device identifiers for app functionality and crash reporting.

We do NOT collect:
• Your real name or contact information (unless you sign in with Google)
• Location data
• Financial information
• Data from other apps on your device`
    },
    {
      title: 'How We Use Your Information',
      content: `Your data is used exclusively to:

• Provide the core tracking and calculation features of the app
• Generate AI-powered health insights and summaries (if you choose to use this feature)
• Sync your data across devices (if you sign in with Google)
• Improve app performance and fix bugs

We will NEVER:
• Sell your personal health data to third parties
• Use your data for advertising purposes
• Share identifiable information with external parties`
    },
    {
      title: 'Data Storage & Security',
      content: `• Local Storage: By default, all your data is stored locally on your device using encrypted storage.

• Cloud Sync (Optional): If you sign in with Google, your data may be synced to secure cloud servers for backup and cross-device access.

• Encryption: All data transmissions use industry-standard TLS encryption.

• Access Control: Your data is accessible only to you through your device or authenticated account.`
    },
    {
      title: 'Your Rights & Choices',
      content: `You have full control over your data:

• Export: You can export all your data at any time from the Profile tab.

• Delete: You can permanently delete all your data from within the app.

• Opt-Out: You can use the app in "Guest Mode" without creating an account.

• Corrections: You can edit or delete any entry you've made at any time.`
    },
    {
      title: 'Third-Party Services',
      content: `PepTrack Pro may use the following third-party services:

• Google Sign-In: For optional account authentication (subject to Google's Privacy Policy)

• AI Services: For generating health summaries and research information (queries are anonymized)

• Analytics: Basic crash reporting to improve app stability (no personal health data is shared)`
    },
    {
      title: 'Medical Disclaimer',
      content: `PepTrack Pro is designed for informational and personal tracking purposes ONLY.

• This app is NOT a medical device and should NOT be used to diagnose, treat, cure, or prevent any disease.

• Always consult a qualified healthcare provider before starting any peptide, supplement, or medication regimen.

• The dosage calculations and research information provided are for educational purposes only.

• Never disregard professional medical advice based on information from this app.`
    },
    {
      title: 'Children\'s Privacy',
      content: `PepTrack Pro is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.`
    },
    {
      title: 'Changes to This Policy',
      content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy within the app. You are advised to review this Privacy Policy periodically for any changes.`
    },
    {
      title: 'Contact Us',
      content: `If you have any questions about this Privacy Policy, please contact us at:

Email: support@peptrackpro.com

Last Updated: February 2026`
    }
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          PepTrack Pro ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.
        </Text>
        
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.sm },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 50 },
  intro: {
    ...typography.bodyBase,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionContent: {
    ...typography.bodyBase,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
