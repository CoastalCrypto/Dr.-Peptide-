import { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, FONT_MARKER } from '../src/theme';
import { Storage, KEYS } from '../src/utils/storage';

const WAIVER_TEXT = `IMPORTANT LEGAL NOTICE & DISCLAIMER

Please read this disclaimer carefully before using PepTrack Pro. By proceeding, you acknowledge and agree to the following terms:


FOR INFORMATIONAL & RESEARCH PURPOSES ONLY

PepTrack Pro and all its content — including peptide profiles, medication information, dosage calculations, health tracking features, and AI-generated responses — are provided strictly for informational, educational, and personal research purposes only.

This app is designed to assist individuals in organizing and tracking their personal health data. It is NOT a medical device, diagnostic tool, or treatment recommendation platform.


NOT MEDICAL ADVICE

Nothing in this app constitutes medical advice, diagnosis, or treatment recommendations. The information provided should never be used as a substitute for professional medical advice from a qualified, licensed healthcare provider.

Do not disregard professional medical advice or delay seeking it because of something you read or calculated in this app.


NO DOCTOR-PATIENT RELATIONSHIP

Use of PepTrack Pro does not create any doctor-patient, advisor-client, or other professional healthcare relationship between you and the app's developers, contributors, data sources, or any affiliated parties.


CONSULT YOUR HEALTHCARE PROVIDER

Always consult with a licensed physician or qualified healthcare professional before:

  •  Starting, changing, or stopping any medication, peptide, or supplement regimen
  •  Using any peptide, research compound, or injectable substance
  •  Making any health decisions based on information from this app
  •  Self-administering any injectable or pharmacological substance
  •  Combining multiple compounds or medications


FDA DISCLAIMER

The statements and information in this app have not been evaluated by the Food and Drug Administration. This app and its content are not intended to diagnose, treat, cure, or prevent any disease or medical condition.

Many peptides discussed in this app are classified as research chemicals and are not FDA-approved for human use. Legal status varies by jurisdiction.


DOSAGE CALCULATOR DISCLAIMER

The peptide reconstitution calculator provides mathematical calculations only. These calculations are based on the inputs you provide and standard reconstitution formulas.

  •  All calculations should be independently verified before use
  •  Errors in dosing can have serious, potentially life-threatening consequences
  •  Never rely solely on this app for dosage decisions
  •  The developers assume no responsibility for calculation errors or misuse


ASSUMPTION OF RISK

You acknowledge that the use of peptides, supplements, research chemicals, and medications carries inherent risks, including but not limited to adverse reactions, drug interactions, contamination, incorrect dosing, and other health hazards.

You assume full and complete responsibility for any and all actions taken based on information provided by this app. The developers, contributors, and affiliates of PepTrack Pro shall not be held liable for any damages, injuries, adverse effects, or losses resulting from the use of this app or reliance on its content.


USER ACKNOWLEDGMENTS

By proceeding, you confirm that:

  •  You are at least 18 years of age
  •  You understand this app is for informational purposes only
  •  You will verify all information independently with qualified sources
  •  You will consult qualified healthcare professionals for all medical decisions
  •  You will report any adverse effects to your healthcare provider immediately
  •  You will use this app responsibly and in accordance with all applicable laws
  •  You will not use this app as a substitute for professional medical care
  •  You understand and accept all risks associated with peptide and supplement use


DATA & PRIVACY

Health data entered into PepTrack Pro is stored locally on your device by default. Cloud backup is optional and requires account creation. We recommend reviewing our Privacy Policy for complete details on data handling and security.`;

export default function WaiverScreen() {
  const router = useRouter();
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 60;
    if (isNearBottom) setScrolledToBottom(true);
  };

  const acceptWaiver = async () => {
    await Storage.set(KEYS.WAIVER_ACCEPTED, true);
    router.replace('/onboarding');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>⚠️</Text>
        <Text style={styles.headerTitle}>Legal Disclaimer</Text>
        <Text style={styles.headerSubtitle}>Please read carefully and scroll to the bottom</Text>
      </View>

      <ScrollView
        testID="waiver-scroll"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.waiverCard}>
          <Text style={styles.waiverText}>{WAIVER_TEXT}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!scrolledToBottom && (
          <Text style={styles.scrollHint}>↓ Scroll down to read the full disclaimer ↓</Text>
        )}
        <TouchableOpacity
          testID="waiver-agree-btn"
          style={[styles.agreeBtn, !scrolledToBottom && styles.agreeBtnDisabled]}
          onPress={acceptWaiver}
          disabled={!scrolledToBottom}
        >
          <Text style={[styles.agreeBtnText, !scrolledToBottom && styles.agreeBtnTextDisabled]}>
            {scrolledToBottom ? '✅  I Understand & Agree' : 'Scroll to Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.md, paddingHorizontal: spacing.lg },
  headerIcon: { fontSize: 48, marginBottom: spacing.sm },
  headerTitle: { fontFamily: FONT_MARKER, fontSize: 28, color: colors.warning, textAlign: 'center' },
  headerSubtitle: { ...typography.bodySm, color: colors.textTertiary, textAlign: 'center', marginTop: 4 },
  scrollView: { flex: 1, marginHorizontal: spacing.md },
  scrollContent: { paddingBottom: spacing.lg },
  waiverCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)' },
  waiverText: { ...typography.bodyBase, color: colors.textSecondary, lineHeight: 24 },
  footer: { padding: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.background },
  scrollHint: { ...typography.bodySm, color: colors.accent, textAlign: 'center', marginBottom: spacing.sm },
  agreeBtn: { height: 60, borderRadius: 30, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  agreeBtnDisabled: { backgroundColor: colors.surfaceHighlight, opacity: 0.5 },
  agreeBtnText: { fontFamily: FONT_MARKER, fontSize: 18, color: colors.background },
  agreeBtnTextDisabled: { color: colors.textTertiary },
});
