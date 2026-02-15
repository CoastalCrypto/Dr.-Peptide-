import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { typography, spacing } from '../../src/theme';
import { Storage, KEYS } from '../../src/utils/storage';
import { useFocusEffect } from 'expo-router';

interface JournalEntry {
  id: string;
  date: string;
  weight?: number;
  weight_unit: string;
  energy_level?: number;
  sleep_quality?: number;
  sleep_hours?: number;
  mood?: string;
  gym_activity?: {
    type: string;
    duration_mins: number;
    intensity: number;
  };
  notes?: string;
}

const MOODS = [
  { emoji: '😄', label: 'Great', value: 'great' },
  { emoji: '🙂', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😔', label: 'Low', value: 'low' },
  { emoji: '😞', label: 'Bad', value: 'bad' },
];

const WORKOUT_TYPES = [
  { icon: 'weight-lifter', label: 'Weights', value: 'weights' },
  { icon: 'run', label: 'Cardio', value: 'cardio' },
  { icon: 'yoga', label: 'Yoga', value: 'yoga' },
  { icon: 'bike', label: 'Cycling', value: 'cycling' },
  { icon: 'swim', label: 'Swimming', value: 'swimming' },
  { icon: 'karate', label: 'Sports', value: 'sports' },
  { icon: 'walk', label: 'Walking', value: 'walking' },
  { icon: 'dumbbell', label: 'Other', value: 'other' },
];

function MiniBarChart({ data, max, label, colors }: { data: number[]; max: number; label: string; colors: any }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ ...typography.caption, color: colors.textTertiary, marginBottom: spacing.sm }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 70, gap: 6 }}>
        {data.slice(-7).map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <View style={{ width: '80%', borderRadius: 4, minHeight: 4, height: max > 0 ? (v / max) * 60 : 0, backgroundColor: colors.accent }} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function JournalScreen() {
  const { colors } = useTheme();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [weight, setWeight] = useState('');
  const [energy, setEnergy] = useState(0);
  const [sleepQuality, setSleepQuality] = useState(0);
  const [sleepHours, setSleepHours] = useState('');
  const [mood, setMood] = useState('');
  const [gymType, setGymType] = useState('');
  const [gymDuration, setGymDuration] = useState('');
  const [gymIntensity, setGymIntensity] = useState(0);
  const [notes, setNotes] = useState('');
  const [tab, setTab] = useState<'log' | 'trends'>('log');

  useFocusEffect(useCallback(() => {
    Storage.get<JournalEntry[]>(KEYS.JOURNAL_ENTRIES).then(e => setEntries(e || []));
  }, []));

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === today);

  const saveEntry = async () => {
    const entry: JournalEntry = {
      id: `j_${Date.now()}`,
      date: today,
      weight: weight ? parseFloat(weight) : undefined,
      weight_unit: 'lbs',
      energy_level: energy || undefined,
      sleep_quality: sleepQuality || undefined,
      sleep_hours: sleepHours ? parseFloat(sleepHours) : undefined,
      mood: mood || undefined,
      gym_activity: gymType && gymDuration ? {
        type: gymType,
        duration_mins: parseInt(gymDuration),
        intensity: gymIntensity || 5,
      } : undefined,
      notes: notes || undefined,
    };
    const existing = entries.filter(e => e.date !== today);
    const updated = [entry, ...existing];
    await Storage.set(KEYS.JOURNAL_ENTRIES, updated);
    setEntries(updated);
    setShowLog(false);
    resetForm();
  };

  const resetForm = () => { setWeight(''); setEnergy(0); setSleepQuality(0); setSleepHours(''); setMood(''); setGymType(''); setGymDuration(''); setGymIntensity(0); setNotes(''); };

  const weightData = entries.slice(0, 7).reverse().map(e => e.weight || 0);
  const energyData = entries.slice(0, 7).reverse().map(e => e.energy_level || 0);

  const lastWeight = entries.find(e => e.weight)?.weight;
  const prevWeight = entries.filter(e => e.weight)[1]?.weight;
  const weightDelta = lastWeight && prevWeight ? lastWeight - prevWeight : null;

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Health Journal</Text>

        <View style={styles.tabsRow}>
          <TouchableOpacity testID="journal-tab-log" style={[styles.tabBtn, tab === 'log' && styles.tabBtnActive]} onPress={() => setTab('log')}>
            <Text style={[styles.tabBtnText, tab === 'log' && styles.tabBtnTextActive]}>Log & Entries</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="journal-tab-trends" style={[styles.tabBtn, tab === 'trends' && styles.tabBtnActive]} onPress={() => setTab('trends')}>
            <Text style={[styles.tabBtnText, tab === 'trends' && styles.tabBtnTextActive]}>Trends</Text>
          </TouchableOpacity>
        </View>

        {tab === 'log' ? (
          <>
            <TouchableOpacity testID="log-today-btn" style={styles.logBtn} onPress={() => { if (todayEntry) { setWeight(todayEntry.weight?.toString() || ''); setEnergy(todayEntry.energy_level || 0); setSleepQuality(todayEntry.sleep_quality || 0); setSleepHours(todayEntry.sleep_hours?.toString() || ''); setMood(todayEntry.mood || ''); setNotes(todayEntry.notes || ''); } setShowLog(true); }}>
              <MaterialCommunityIcons name="plus-circle" size={24} color={colors.primaryForeground} />
              <Text style={styles.logBtnText}>{todayEntry ? 'Update Today\'s Entry' : 'Log Today'}</Text>
            </TouchableOpacity>

            {lastWeight && (
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Latest Weight</Text>
                <View style={styles.snapshotRow}>
                  <Text style={styles.snapshotValue}>{lastWeight}</Text>
                  <Text style={styles.snapshotUnit}>lbs</Text>
                  {weightDelta !== null && (
                    <View style={[styles.deltaBadge, { backgroundColor: weightDelta <= 0 ? 'rgba(6,214,160,0.2)' : 'rgba(239,71,111,0.2)' }]}>
                      <Text style={[styles.deltaText, { color: weightDelta <= 0 ? colors.success : colors.error }]}>
                        {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Recent Entries</Text>
            {entries.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="book-open-page-variant" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No entries yet</Text>
                <Text style={styles.emptySubtext}>Start logging your health metrics today</Text>
              </View>
            ) : (
              entries.slice(0, 10).map(entry => (
                <View key={entry.id} style={styles.entryCard}>
                  <Text style={styles.entryDate}>{new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                  <View style={styles.entryMetrics}>
                    {entry.weight && <Text style={styles.entryMetric}>⚖️ {entry.weight} lbs</Text>}
                    {entry.energy_level && <Text style={styles.entryMetric}>⚡ Energy: {entry.energy_level}/10</Text>}
                    {entry.sleep_quality && <Text style={styles.entryMetric}>😴 Sleep: {entry.sleep_quality}/10</Text>}
                    {entry.sleep_hours && <Text style={styles.entryMetric}>🕐 {entry.sleep_hours}h sleep</Text>}
                    {entry.mood && <Text style={styles.entryMetric}>{MOODS.find(m => m.value === entry.mood)?.emoji} {entry.mood}</Text>}
                  </View>
                  {entry.notes && <Text style={styles.entryNotes}>{entry.notes}</Text>}
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>7-Day Trends</Text>
            {weightData.some(v => v > 0) && <MiniBarChart data={weightData} max={Math.max(...weightData) * 1.1} label="Weight (lbs)" colors={colors} />}
            {energyData.some(v => v > 0) && <MiniBarChart data={energyData} max={10} label="Energy Level" colors={colors} />}
            {!weightData.some(v => v > 0) && !energyData.some(v => v > 0) && (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="chart-line" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyText}>Not enough data for trends</Text>
                <Text style={styles.emptySubtext}>Log at least 2 entries to see trends</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showLog} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Log Entry — {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>

              <Text style={styles.fieldLabel}>Weight (lbs)</Text>
              <TextInput testID="journal-weight" style={styles.input} placeholder="e.g., 185" placeholderTextColor={colors.textTertiary} value={weight} onChangeText={setWeight} keyboardType="numeric" />

              <Text style={styles.fieldLabel}>Energy Level (1-10)</Text>
              <View style={styles.scaleRow}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <TouchableOpacity key={n} style={[styles.scaleBtn, energy === n && styles.scaleBtnActive]} onPress={() => setEnergy(n)}>
                    <Text style={[styles.scaleBtnText, energy === n && styles.scaleBtnTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Sleep Quality (1-10)</Text>
              <View style={styles.scaleRow}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <TouchableOpacity key={n} style={[styles.scaleBtn, sleepQuality === n && styles.scaleBtnActive]} onPress={() => setSleepQuality(n)}>
                    <Text style={[styles.scaleBtnText, sleepQuality === n && styles.scaleBtnTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Hours Slept</Text>
              <TextInput testID="journal-sleep-hours" style={styles.input} placeholder="e.g., 7.5" placeholderTextColor={colors.textTertiary} value={sleepHours} onChangeText={setSleepHours} keyboardType="numeric" />

              <Text style={styles.fieldLabel}>Mood</Text>
              <View style={styles.moodRow}>
                {MOODS.map(m => (
                  <TouchableOpacity key={m.value} style={[styles.moodBtn, mood === m.value && styles.moodBtnActive]} onPress={() => setMood(m.value)}>
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text style={[styles.moodLabel, mood === m.value && styles.moodLabelActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput testID="journal-notes" style={[styles.input, styles.notesInput]} placeholder="How are you feeling today?" placeholderTextColor={colors.textTertiary} value={notes} onChangeText={setNotes} multiline />

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowLog(false); resetForm(); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="journal-save" style={styles.saveBtn} onPress={saveEntry}>
                  <Text style={styles.saveBtnText}>Save Entry</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 120 },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  tabsRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  tabBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabBtnText: { ...typography.bodyBase, color: colors.textSecondary, fontWeight: '600' },
  tabBtnTextActive: { color: colors.primaryForeground },
  logBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, height: 56, borderRadius: 28, gap: 8, marginBottom: spacing.lg },
  logBtnText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '700' },
  snapshotCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  snapshotLabel: { ...typography.caption, color: colors.textTertiary },
  snapshotRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
  snapshotValue: { ...typography.display, color: colors.dosageHighlight, fontSize: 40 },
  snapshotUnit: { ...typography.bodyBase, color: colors.textSecondary },
  deltaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  deltaText: { ...typography.bodySm, fontWeight: '700' },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  emptyText: { ...typography.bodyLg, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { ...typography.bodySm, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
  entryCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  entryDate: { ...typography.caption, color: colors.accent },
  entryMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  entryMetric: { ...typography.bodySm, color: colors.textSecondary },
  entryNotes: { ...typography.bodySm, color: colors.textTertiary, marginTop: 8, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  modalTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.lg },
  fieldLabel: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.sm, marginTop: spacing.md },
  input: { height: 52, backgroundColor: colors.secondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: 16 },
  notesInput: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  scaleRow: { flexDirection: 'row', gap: 4 },
  scaleBtn: { width: 32, height: 40, borderRadius: 8, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  scaleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  scaleBtnText: { ...typography.bodySm, color: colors.textSecondary },
  scaleBtnTextActive: { color: colors.primaryForeground, fontWeight: '700' },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
  moodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  moodEmoji: { fontSize: 24 },
  moodLabel: { ...typography.caption, color: colors.textTertiary, fontSize: 9, marginTop: 2 },
  moodLabelActive: { color: colors.primaryForeground },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: spacing.xl },
  cancelBtn: { flex: 1, height: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { ...typography.bodyBase, color: colors.textSecondary },
  saveBtn: { flex: 1, height: 52, borderRadius: 26, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '700' },
});
