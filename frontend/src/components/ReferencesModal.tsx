import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../theme';

interface ReferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

const REFERENCES = [
  {
    category: 'Peptide Research',
    sources: [
      {
        title: 'PubMed Central',
        description: 'National Library of Medicine database of biomedical literature',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/',
      },
      {
        title: 'Journal of Peptide Science',
        description: 'Peer-reviewed journal for peptide research',
        url: 'https://onlinelibrary.wiley.com/journal/10991387',
      },
      {
        title: 'Peptides Journal (Elsevier)',
        description: 'International journal covering peptide research',
        url: 'https://www.sciencedirect.com/journal/peptides',
      },
    ],
  },
  {
    category: 'Drug Information',
    sources: [
      {
        title: 'U.S. Food & Drug Administration (FDA)',
        description: 'Official FDA drug databases and safety information',
        url: 'https://www.fda.gov/drugs',
      },
      {
        title: 'OpenFDA',
        description: 'FDA open data API for drug labels and adverse events',
        url: 'https://open.fda.gov/',
      },
      {
        title: 'DailyMed (NIH)',
        description: 'National Institutes of Health drug labeling database',
        url: 'https://dailymed.nlm.nih.gov/',
      },
    ],
  },
  {
    category: 'General Medical References',
    sources: [
      {
        title: 'MedlinePlus',
        description: 'National Library of Medicine consumer health information',
        url: 'https://medlineplus.gov/',
      },
      {
        title: 'ClinicalTrials.gov',
        description: 'Database of clinical studies conducted worldwide',
        url: 'https://clinicaltrials.gov/',
      },
      {
        title: 'World Health Organization (WHO)',
        description: 'International health guidance and research',
        url: 'https://www.who.int/',
      },
    ],
  },
];

export function ReferencesModal({ visible, onClose }: ReferencesModalProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const openUrl = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>References & Citations</Text>
              <Text style={styles.subtitle}>Information Sources</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.disclaimer}>
              <MaterialCommunityIcons name="information" size={20} color={colors.accent} />
              <Text style={styles.disclaimerText}>
                The information in PepTrack Pro is compiled from peer-reviewed scientific literature 
                and official government databases. This app is for research purposes only and does 
                not constitute medical advice.
              </Text>
            </View>

            {REFERENCES.map((category, idx) => (
              <View key={idx} style={styles.category}>
                <Text style={styles.categoryTitle}>{category.category}</Text>
                {category.sources.map((source, sIdx) => (
                  <TouchableOpacity
                    key={sIdx}
                    style={styles.sourceCard}
                    onPress={() => openUrl(source.url)}
                  >
                    <View style={styles.sourceInfo}>
                      <Text style={styles.sourceTitle}>{source.title}</Text>
                      <Text style={styles.sourceDesc}>{source.description}</Text>
                    </View>
                    <MaterialCommunityIcons 
                      name="open-in-new" 
                      size={18} 
                      color={colors.accent} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                For specific peptide citations, tap on any peptide in the Research section 
                to view detailed information and source references.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: spacing.lg,
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  disclaimerText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  category: {
    marginBottom: spacing.lg,
  },
  categoryTitle: {
    ...typography.bodyBase,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceTitle: {
    ...typography.bodySm,
    color: colors.accent,
    fontWeight: '600',
  },
  sourceDesc: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  footer: {
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
  },
  footerText: {
    ...typography.bodySm,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ReferencesModal;
