import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Modal, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { typography, spacing } from '../../src/theme';
import { Storage, KEYS } from '../../src/utils/storage';
import { useFocusEffect } from 'expo-router';
import { CartesianChart, Bar, Line } from 'victory-native';

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

const MOOD_VALUES: Record<string, number> = { great: 5, good: 4, okay: 3, low: 2, bad: 1 };

// Simplified Victory Native Chart Component
function VictoryTrendChart({ 
  data, 
  label, 
  colors, 
  chartColor,
  chartType = 'bar',
  unit = ''
}: { 
  data: { day: string; dayLabel: string; value: number }[];
  label: string;
  colors: any;
  chartColor: string;
  chartType?: 'bar' | 'line';
  unit?: string;
}) {
  const chartWidth = Dimensions.get('window').width - spacing.lg * 2 - spacing.md * 2;
  
  if (!data.length || data.every(d => d.value === 0)) return null;
  
  const latestValue = data[data.length - 1]?.value || 0;
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
        <Text style={{ ...typography.caption, color: colors.textTertiary }}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={{ ...typography.bodyLg, color: chartColor, fontWeight: '700' }}>
            {latestValue.toFixed(label.includes('Weight') ? 1 : 0)}
          </Text>
          {unit && <Text style={{ ...typography.bodySm, color: colors.textTertiary }}>{unit}</Text>}
        </View>
      </View>
      <View style={{ height: 120 }}>
        <CartesianChart
          data={data}
          xKey="day"
          yKeys={["value"]}
          domainPadding={{ left: 20, right: 20, top: 20, bottom: 10 }}
          axisOptions={{
            tickCount: { x: 7, y: 4 },
            labelColor: colors.textTertiary,
            lineColor: colors.border,
            formatXLabel: (val: string) => data.find(d => d.day === val)?.dayLabel || '',
            formatYLabel: (val: number) => String(Math.round(val)),
          }}
        >
          {({ points, chartBounds }: any) => (
            <>
              {chartType === 'bar' ? (
                <Bar
                  points={points.value}
                  chartBounds={chartBounds}
                  color={chartColor}
                  roundedCorners={{ topLeft: 4, topRight: 4 }}
                  barWidth={Math.min(24, (chartWidth - 40) / data.length - 4)}
                />
              ) : (
                <Line
                  points={points.value}
                  color={chartColor}
                  strokeWidth={2.5}
                  curveType="natural"
                  connectMissingData={true}
                />
              )}
            </>
          )}
        </CartesianChart>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 }}>
        {data.map((d, i) => (
          <Text key={i} style={{ ...typography.caption, color: colors.textTertiary, fontSize: 9 }}>{d.dayLabel}</Text>
        ))}
      </View>
    </View>
  );
}

// Fallback simple bar chart for web or when Skia fails
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

  // Prepare chart data for Victory Native
  const chartEntries = useMemo(() => {
    return entries.slice(0, 7).reverse().map((e, i) => {
      const date = new Date(e.date + 'T12:00:00');
      return {
        day: String(i),
        dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2),
        weight: e.weight || 0,
        energy: e.energy_level || 0,
        sleep: e.sleep_quality || 0,
        sleepHours: e.sleep_hours || 0,
        mood: MOOD_VALUES[e.mood || ''] || 0,
        gym: e.gym_activity?.duration_mins || 0,
      };
    });
  }, [entries]);

  const hasWeightData = chartEntries.some(d => d.weight > 0);
  const hasEnergyData = chartEntries.some(d => d.energy > 0);
  const hasSleepData = chartEntries.some(d => d.sleep > 0);
  const hasSleepHoursData = chartEntries.some(d => d.sleepHours > 0);
  const hasMoodData = chartEntries.some(d => d.mood > 0);
  const hasGymData = chartEntries.some(d => d.gym > 0);
  const hasAnyData = hasWeightData || hasEnergyData || hasSleepData || hasMoodData || hasGymData;

  // Use fallback on web
  const useVictoryCharts = Platform.OS !== 'web';
  
  const weightDataSimple = entries.slice(0, 7).reverse().map(e => e.weight || 0);
  const energyDataSimple = entries.slice(0, 7).reverse().map(e => e.energy_level || 0);
  const gymDataSimple = entries.slice(0, 7).reverse().map(e => e.gym_activity?.duration_mins || 0);

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
            <TouchableOpacity testID="log-today-btn" style={styles.logBtn} onPress={() => { if (todayEntry) { setWeight(todayEntry.weight?.toString() || ''); setEnergy(todayEntry.energy_level || 0); setSleepQuality(todayEntry.sleep_quality || 0); setSleepHours(todayEntry.sleep_hours?.toString() || ''); setMood(todayEntry.mood || ''); setGymType(todayEntry.gym_activity?.type || ''); setGymDuration(todayEntry.gym_activity?.duration_mins?.toString() || ''); setGymIntensity(todayEntry.gym_activity?.intensity || 0); setNotes(todayEntry.notes || ''); } setShowLog(true); }}>
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
                    {entry.gym_activity && <Text style={styles.entryMetric}>💪 {WORKOUT_TYPES.find(w => w.value === entry.gym_activity?.type)?.label || entry.gym_activity.type}: {entry.gym_activity.duration_mins}min</Text>}
                  </View>
                  {entry.notes && <Text style={styles.entryNotes}>{entry.notes}</Text>}
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>7-Day Trends</Text>
            
            {useVictoryCharts ? (
              // Victory Native Charts (native platforms)
              <>
                {hasWeightData && (
                  <VictoryTrendChart
                    data={chartEntries.map(e => ({ day: e.day, dayLabel: e.dayLabel, value: e.weight }))}
                    label="Weight"
                    colors={colors}
                    chartColor="#FF6B6B"
                    chartType="line"
                    unit="lbs"
                  />
                )}
                {hasEnergyData && (
                  <VictoryTrendChart
                    data={chartEntries.map(e => ({ day: e.day, dayLabel: e.dayLabel, value: e.energy }))}
                    label="Energy Level"
                    colors={colors}
                    chartColor="#FFD166"
                    chartType="bar"
                    unit="/10"
                  />
                )}
                {hasSleepData && (
                  <VictoryTrendChart
                    data={chartEntries.map(e => ({ day: e.day, dayLabel: e.dayLabel, value: e.sleep }))}
                    label="Sleep Quality"
                    colors={colors}
                    chartColor="#6C63FF"
                    chartType="bar"
                    unit="/10"
                  />
                )}
                {hasSleepHoursData && (
                  <VictoryTrendChart
                    data={chartEntries.map(e => ({ day: e.day, dayLabel: e.dayLabel, value: e.sleepHours }))}
                    label="Sleep Duration"
                    colors={colors}
                    chartColor="#4ECDC4"
                    chartType="line"
                    unit="hrs"
                  />
                )}
                {hasMoodData && (
                  <VictoryTrendChart
                    data={chartEntries.map(e => ({ day: e.day, dayLabel: e.dayLabel, value: e.mood }))}
                    label="Mood"
                    colors={colors}
                    chartColor="#06D6A0"
                    chartType="bar"
                    unit="/5"
                  />
                )}
                {hasGymData && (
                  <VictoryTrendChart
                    data={chartEntries.map(e => ({ day: e.day, dayLabel: e.dayLabel, value: e.gym }))}
                    label="Gym Activity"
                    colors={colors}
                    chartColor={colors.accent}
                    chartType="bar"
                    unit="mins"
                  />
                )}
              </>
                    chartColor={colors.accent}
                    chartType="bar"
                    unit="mins"
                  />
                )}
              </>
            ) : (
              // Fallback simple bar charts (web)
              <>
                {weightDataSimple.some(v => v > 0) && <MiniBarChart data={weightDataSimple} max={Math.max(...weightDataSimple) * 1.1} label="Weight (lbs)" colors={colors} />}
                {energyDataSimple.some(v => v > 0) && <MiniBarChart data={energyDataSimple} max={10} label="Energy Level" colors={colors} />}
                {gymDataSimple.some(v => v > 0) && <MiniBarChart data={gymDataSimple} max={Math.max(...gymDataSimple, 60)} label="Gym Activity (mins)" colors={colors} />}
              </>
            )}
            
            {!hasAnyData && (
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

              <Text style={styles.fieldLabel}>Gym Activity</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workoutScroll}>
                <View style={styles.workoutRow}>
                  {WORKOUT_TYPES.map(w => (
                    <TouchableOpacity 
                      key={w.value} 
                      testID={`workout-${w.value}`}
                      style={[styles.workoutBtn, gymType === w.value && styles.workoutBtnActive]} 
                      onPress={() => setGymType(gymType === w.value ? '' : w.value)}
                    >
                      <MaterialCommunityIcons name={w.icon as any} size={24} color={gymType === w.value ? colors.primaryForeground : colors.textSecondary} />
                      <Text style={[styles.workoutLabel, gymType === w.value && styles.workoutLabelActive]}>{w.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              
              {gymType !== '' && (
                <>
                  <View style={styles.gymInputRow}>
                    <View style={styles.gymInputGroup}>
                      <Text style={styles.gymInputLabel}>Duration (mins)</Text>
                      <TextInput 
                        testID="journal-gym-duration"
                        style={styles.gymInput} 
                        placeholder="45" 
                        placeholderTextColor={colors.textTertiary} 
                        value={gymDuration} 
                        onChangeText={setGymDuration} 
                        keyboardType="numeric" 
                      />
                    </View>
                    <View style={styles.gymInputGroup}>
                      <Text style={styles.gymInputLabel}>Intensity (1-10)</Text>
                      <View style={styles.intensityRow}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <TouchableOpacity 
                            key={n} 
                            style={[styles.intensityBtn, gymIntensity === n && styles.intensityBtnActive]} 
                            onPress={() => setGymIntensity(n)}
                          >
                            <Text style={[styles.intensityText, gymIntensity === n && styles.intensityTextActive]}>{n}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </>
              )}

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
  workoutScroll: { marginBottom: spacing.sm },
  workoutRow: { flexDirection: 'row', gap: 10 },
  workoutBtn: { width: 72, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
  workoutBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  workoutLabel: { ...typography.caption, color: colors.textTertiary, fontSize: 10, marginTop: 6 },
  workoutLabelActive: { color: colors.primaryForeground },
  gymInputRow: { marginTop: spacing.sm },
  gymInputGroup: { marginBottom: spacing.sm },
  gymInputLabel: { ...typography.caption, color: colors.textTertiary, marginBottom: 6 },
  gymInput: { height: 48, backgroundColor: colors.secondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: 16 },
  intensityRow: { flexDirection: 'row', gap: 4 },
  intensityBtn: { width: 28, height: 36, borderRadius: 8, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  intensityBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  intensityText: { ...typography.bodySm, color: colors.textSecondary, fontSize: 12 },
  intensityTextActive: { color: colors.primaryForeground, fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: spacing.xl },
  cancelBtn: { flex: 1, height: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { ...typography.bodyBase, color: colors.textSecondary },
  saveBtn: { flex: 1, height: 52, borderRadius: 26, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '700' },
});
