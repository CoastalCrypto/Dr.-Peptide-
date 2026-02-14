import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../src/theme';
import { peptides } from '../../src/data/peptides';
import { Storage, KEYS } from '../../src/utils/storage';

export default function PeptideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const peptide = peptides.find(p => p.id === id);

  if (!peptide) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Peptide not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const addToTracker = async () => {
    const items = await Storage.get<any[]>(KEYS.TRACKER_ITEMS) || [];
    const newItem = {
      id: `item_${Date.now()}`,
      type: 'Peptide',
      name: peptide.name,
      dosage_amount: peptide.defaultDoseMcg,
      dosage_unit: 'mcg',
      route: peptide.routes[0],
      frequency: 'Daily',
      times_of_day: ['Morning'],
    };
    await Storage.set(KEYS.TRACKER_ITEMS, [...items, newItem]);
    router.push('/(tabs)');
  };

  const quickCalc = () => {
    router.push({
      pathname: '/(tabs)/calculator',
      params: {
        vialMg: peptide.defaultVialMg.toString(),
        doseMcg: peptide.defaultDoseMcg.toString(),
        bacWaterMl: peptide.defaultBacWaterMl.toString(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.name}>{peptide.name}</Text>
        {peptide.aliases.length > 0 && (
          <Text style={styles.aliases}>Also known as: {peptide.aliases.join(', ')}</Text>
        )}

        <View style={styles.tagsRow}>
          {peptide.categories.map(cat => (
            <View key={cat} style={styles.tag}>
              <Text style={styles.tagText}>{cat}</Text>
            </View>
          ))}
        </View>

        <Section title="Description" icon="information">
          <Text style={styles.bodyText}>{peptide.description}</Text>
        </Section>

        <Section title="Mechanism of Action" icon="atom">
          <Text style={styles.bodyText}>{peptide.mechanism}</Text>
        </Section>

        <Section title="Dosage Ranges" icon="needle">
          <DosageRow label="Low" value={peptide.dosage.low} />
          <DosageRow label="Moderate" value={peptide.dosage.moderate} />
          <DosageRow label="Higher" value={peptide.dosage.higher} />
          <Text style={styles.metaText}>Frequency: {peptide.frequency}</Text>
          <Text style={styles.metaText}>Cycle Length: {peptide.cycleLength}</Text>
        </Section>

        <Section title="Administration Routes" icon="routes">
          <View style={styles.routeRow}>
            {peptide.routes.map((r, i) => (
              <View key={r} style={[styles.routeChip, i === 0 && styles.routeChipPrimary]}>
                <Text style={[styles.routeText, i === 0 && styles.routeTextPrimary]}>{r}{i === 0 ? ' (primary)' : ''}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Common Protocols" icon="clipboard-list">
          {peptide.protocols.map((p, i) => (
            <View key={i} style={styles.protocolRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bodyText}>{p}</Text>
            </View>
          ))}
        </Section>

        <Section title="Side Effects" icon="alert-circle">
          <Text style={styles.subLabel}>Common / Mild</Text>
          {peptide.sideEffects.common.map((s, i) => <Text key={i} style={styles.sideEffect}>  • {s}</Text>)}
          <Text style={[styles.subLabel, { marginTop: 8 }]}>Uncommon / Moderate</Text>
          {peptide.sideEffects.uncommon.map((s, i) => <Text key={i} style={[styles.sideEffect, { color: colors.warning }]}>  • {s}</Text>)}
          <Text style={[styles.subLabel, { marginTop: 8 }]}>Rare / Serious</Text>
          {peptide.sideEffects.rare.map((s, i) => <Text key={i} style={[styles.sideEffect, { color: colors.error }]}>  • {s}</Text>)}
        </Section>

        <Section title="Contraindications" icon="shield-alert">
          {peptide.contraindications.map((c, i) => (
            <Text key={i} style={styles.contraText}>⚠ {c}</Text>
          ))}
        </Section>

        <Section title="Storage" icon="fridge">
          <Text style={styles.bodyText}>{peptide.storage}</Text>
        </Section>

        <View style={styles.actionBtns}>
          <TouchableOpacity testID="quick-calc-btn" style={styles.calcBtn} onPress={quickCalc}>
            <MaterialCommunityIcons name="calculator" size={20} color={colors.primaryForeground} />
            <Text style={styles.calcBtnText}>Quick Calculate</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="add-tracker-btn" style={styles.trackerBtn} onPress={addToTracker}>
            <MaterialCommunityIcons name="plus-circle" size={20} color={colors.accent} />
            <Text style={styles.trackerBtnText}>Add to Tracker</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon as any} size={18} color={colors.accent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function DosageRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dosageRow}>
      <Text style={styles.dosageLabel}>{label}</Text>
      <Text style={styles.dosageValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { ...typography.bodyLg, color: colors.error },
  name: { ...typography.h1, color: colors.textPrimary, marginBottom: 4 },
  aliases: { ...typography.bodySm, color: colors.textTertiary, marginBottom: spacing.md },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  tag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(46,117,182,0.2)' },
  tagText: { ...typography.bodySm, color: colors.primary, fontWeight: '600' },
  section: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 16 },
  bodyText: { ...typography.bodyBase, color: colors.textSecondary, lineHeight: 24 },
  metaText: { ...typography.bodySm, color: colors.textTertiary, marginTop: 6 },
  dosageRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dosageLabel: { ...typography.bodyBase, color: colors.textTertiary, fontWeight: '600' },
  dosageValue: { ...typography.bodyBase, color: colors.dosageHighlight, fontWeight: '700' },
  routeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  routeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
  routeChipPrimary: { backgroundColor: 'rgba(76,201,240,0.15)', borderColor: colors.accent },
  routeText: { ...typography.bodySm, color: colors.textSecondary },
  routeTextPrimary: { color: colors.accent, fontWeight: '600' },
  protocolRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  bullet: { color: colors.accent, fontSize: 16 },
  subLabel: { ...typography.caption, color: colors.textTertiary, marginBottom: 4 },
  sideEffect: { ...typography.bodySm, color: colors.textSecondary, marginBottom: 2 },
  contraText: { ...typography.bodyBase, color: colors.warning, marginBottom: 4 },
  actionBtns: { flexDirection: 'row', gap: 12, marginTop: spacing.md },
  calcBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, height: 52, borderRadius: 26, gap: 8 },
  calcBtnText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '700' },
  trackerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, height: 52, borderRadius: 26, gap: 8, borderWidth: 1, borderColor: colors.accent },
  trackerBtnText: { ...typography.bodyBase, color: colors.accent, fontWeight: '700' },
});
