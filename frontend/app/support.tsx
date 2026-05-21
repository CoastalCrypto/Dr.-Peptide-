import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { typography, spacing } from '../src/theme';
import { useRouter } from 'expo-router';

const SUPPORT_EMAIL = 'support@peptrackpro.com';

const FAQ_ITEMS = [
  {
    question: 'Is PepTrack Pro a medical app?',
    answer: 'No. PepTrack Pro is designed for research and informational purposes only. It is NOT a medical device and should not be used as a substitute for professional medical advice, diagnosis, or treatment.',
  },
  {
    question: 'How accurate is the calculator?',
    answer: 'The calculator provides estimates for research purposes only. All calculations should be verified by a qualified professional before any use. The app developers assume no liability for calculation results.',
  },
  {
    question: 'Where does the peptide information come from?',
    answer: 'Peptide information is compiled from publicly available research papers, scientific literature, and peer-reviewed journals. See our References section for citation sources.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. Your data is stored locally on your device using secure storage. If you enable Cloud Sync, data is encrypted and stored securely. We do not sell or share your personal information.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'You can delete your account and all associated data from the Profile screen. Scroll down to find the "Delete Account" option in the Danger Zone section.',
  },
  {
    question: 'Can I use this app for self-medication?',
    answer: 'No. This app is strictly for research and educational purposes. Always consult a licensed healthcare provider before using any peptide, supplement, or medication.',
  },
];

export default function SupportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const styles = createStyles(colors);

  const handleEmailSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=PepTrack Pro Support Request`);
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert('Empty Message', 'Please enter your feedback or question.');
      return;
    }
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=PepTrack Pro Feedback&body=${encodeURIComponent(feedbackText)}`);
    setFeedbackText('');
    Alert.alert('Thank You', 'Your feedback email has been prepared. Please send it from your email app.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Help & Support</Text>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
            <MaterialCommunityIcons name="email-outline" size={24} color={colors.accent} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email Support</Text>
              <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Quick Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Feedback</Text>
          <View style={styles.feedbackCard}>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Describe your issue or suggestion..."
              placeholderTextColor={colors.textTertiary}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSubmitFeedback}>
              <MaterialCommunityIcons name="send" size={18} color={colors.primaryForeground} />
              <Text style={styles.sendBtnText}>Send Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {FAQ_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <MaterialCommunityIcons
                  name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textTertiary}
                />
              </View>
              {expandedFaq === index && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Developer</Text>
              <Text style={styles.infoValue}>PepTrack Pro Team</Text>
            </View>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://coastalcrypto.github.io/Dr.-Peptide-/terms-of-service.html')}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          PepTrack Pro is for research and informational purposes only. Not intended for medical use.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.bodyBase,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    ...typography.bodyBase,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  contactValue: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  feedbackCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
  },
  feedbackInput: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.textPrimary,
    minHeight: 100,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  sendBtnText: {
    ...typography.bodyBase,
    color: colors.primaryForeground,
    fontWeight: '600',
  },
  faqItem: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    ...typography.bodyBase,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    paddingRight: spacing.sm,
  },
  faqAnswer: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.bodySm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  legalLink: {
    ...typography.bodySm,
    color: colors.accent,
  },
  legalDivider: {
    color: colors.textTertiary,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 16,
  },
});
