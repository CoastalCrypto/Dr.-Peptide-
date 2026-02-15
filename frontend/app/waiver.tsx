import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { typography, spacing, FONT_MARKER } from '../src/theme';
import { Storage, KEYS } from '../src/utils/storage';

export default function WaiverScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    await Storage.set(KEYS.WAIVER_ACCEPTED, true);
    const onboarded = await Storage.get<boolean>(KEYS.ONBOARDED);
    if (onboarded) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="shield-alert" size={64} color={colors.warning} />
          <Text style={styles.title}>Important Disclaimer</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Educational Use Only</Text>
          <Text style={styles.paragraph}>
            PepTrack Pro is designed for informational and personal tracking purposes only. This app is NOT intended to provide medical advice, diagnosis, or treatment recommendations.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Not Medical Advice</Text>
          <Text style={styles.paragraph}>
            The information provided within this app, including but not limited to peptide research data, dosage calculators, and health tracking features, should NOT be used as a substitute for professional medical advice.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Consult a Professional</Text>
          <Text style={styles.paragraph}>
            Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition, treatment, or health goals. Never disregard professional medical advice or delay seeking it because of something you have read or tracked in this app.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>User Responsibility</Text>
          <Text style={styles.paragraph}>
            By using PepTrack Pro, you acknowledge that you are solely responsible for your health decisions. The creators and developers of this app assume no liability for any actions taken based on the information provided.
          </Text>
        </View>

        <View style={styles.warningBox}>
          <MaterialCommunityIcons name="alert-circle" size={24} color={colors.error} />
          <Text style={styles.warningText}>
            Peptides and medications can have serious side effects. Improper use can be dangerous. Always consult with a licensed healthcare professional before using any substances.
          </Text>
        </View>

        <TouchableOpacity
          testID="waiver-checkbox"
          style={styles.checkboxRow}
          onPress={() => setAccepted(!accepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
            {accepted && <MaterialCommunityIcons name="check" size={18} color={colors.background} />}
          </View>
          <Text style={styles.checkboxLabel}>
            I understand and accept that PepTrack Pro is for educational and personal tracking purposes only, and I will consult a healthcare professional for medical advice.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="waiver-continue-btn"
          style={[styles.continueBtn, !accepted && styles.continueBtnDisabled]}
          onPress={handleAccept}
          disabled={!accepted}
        >
          <Text style={[styles.continueBtnText, !accepted && styles.continueBtnTextDisabled]}>
            Continue to PepTrack Pro
          </Text>
        </TouchableOpacity>
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
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  title: {
    fontFamily: FONT_MARKER,
    fontSize: 28,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontFamily: FONT_MARKER,
    fontSize: 18,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  paragraph: {
    ...typography.bodyBase,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,69,58,0.15)',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.3)',
  },
  warningText: {
    ...typography.bodySm,
    color: colors.error,
    flex: 1,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  continueBtn: {
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  continueBtnText: {
    fontFamily: FONT_MARKER,
    fontSize: 18,
    color: colors.background,
  },
  continueBtnTextDisabled: {
    color: colors.textTertiary,
  },
});
