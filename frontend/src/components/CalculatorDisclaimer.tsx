import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../theme';
import { Storage } from '../utils/storage';

const CALCULATOR_DISCLAIMER_KEY = 'peptrack_calculator_disclaimer_accepted';

interface CalculatorDisclaimerProps {
  visible: boolean;
  onAccept: () => void;
  isFirstTime?: boolean;
}

export function CalculatorDisclaimer({ visible, onAccept, isFirstTime = false }: CalculatorDisclaimerProps) {
  const { colors } = useTheme();
  const [accepted, setAccepted] = useState(false);
  const styles = createStyles(colors);

  const handleAccept = async () => {
    if (isFirstTime) {
      await Storage.set(CALCULATOR_DISCLAIMER_KEY, 'true');
    }
    onAccept();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="alert-circle" size={48} color={colors.warning} />
            <Text style={styles.title}>Important Notice</Text>
            <Text style={styles.subtitle}>FOR RESEARCH USE ONLY</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Please Read Carefully</Text>
            
            <View style={styles.disclaimerItem}>
              <MaterialCommunityIcons name="flask" size={20} color={colors.accent} />
              <Text style={styles.disclaimerText}>
                This calculator is provided for <Text style={styles.bold}>informational and research purposes only</Text>. It is designed to assist researchers and individuals in understanding reconstitution calculations.
              </Text>
            </View>

            <View style={styles.disclaimerItem}>
              <MaterialCommunityIcons name="doctor" size={20} color={colors.accent} />
              <Text style={styles.disclaimerText}>
                This tool is <Text style={styles.bold}>NOT a substitute for professional medical advice</Text>, diagnosis, or treatment. Never disregard professional medical guidance or delay seeking it because of information from this app.
              </Text>
            </View>

            <View style={styles.disclaimerItem}>
              <MaterialCommunityIcons name="account-check" size={20} color={colors.accent} />
              <Text style={styles.disclaimerText}>
                <Text style={styles.bold}>Always consult a licensed medical professional</Text> before using any peptide, supplement, or substance. Self-administration without proper medical supervision can be dangerous.
              </Text>
            </View>

            <View style={styles.disclaimerItem}>
              <MaterialCommunityIcons name="calculator-variant" size={20} color={colors.accent} />
              <Text style={styles.disclaimerText}>
                All calculations provided are <Text style={styles.bold}>estimates only</Text>. The developer and publisher assume no liability for any outcomes resulting from the use of this calculator or information provided.
              </Text>
            </View>

            <View style={styles.disclaimerItem}>
              <MaterialCommunityIcons name="scale-balance" size={20} color={colors.accent} />
              <Text style={styles.disclaimerText}>
                By using this calculator, you acknowledge that you understand these terms and accept full responsibility for your actions. The app developers are not responsible for any adverse effects or consequences.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {isFirstTime && (
              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => setAccepted(!accepted)}
              >
                <MaterialCommunityIcons 
                  name={accepted ? "checkbox-marked" : "checkbox-blank-outline"} 
                  size={24} 
                  color={accepted ? colors.accent : colors.textTertiary} 
                />
                <Text style={styles.checkboxText}>
                  I understand and accept these terms
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.acceptBtn,
                isFirstTime && !accepted && styles.acceptBtnDisabled
              ]}
              onPress={handleAccept}
              disabled={isFirstTime && !accepted}
            >
              <Text style={styles.acceptBtnText}>
                {isFirstTime ? 'I Understand & Accept' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Helper to check if disclaimer has been accepted
export async function hasAcceptedCalculatorDisclaimer(): Promise<boolean> {
  const accepted = await Storage.get(CALCULATOR_DISCLAIMER_KEY);
  return accepted === 'true';
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: 20,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 500,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.warning,
    fontWeight: '700',
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
  content: {
    padding: spacing.lg,
    maxHeight: 400,
  },
  sectionTitle: {
    ...typography.bodyBase,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  disclaimerItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingRight: spacing.md,
  },
  disclaimerText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkboxText: {
    ...typography.bodySm,
    color: colors.textPrimary,
    flex: 1,
  },
  acceptBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptBtnDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  acceptBtnText: {
    ...typography.bodyBase,
    color: colors.primaryForeground,
    fontWeight: '700',
  },
});

export default CalculatorDisclaimer;
