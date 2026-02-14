import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../src/context/ThemeContext';
import { typography, spacing } from '../../src/theme';
import { Storage, KEYS } from '../../src/utils/storage';
import { useFocusEffect } from 'expo-router';

interface TrackerItem {
  id: string;
  type: string;
  name: string;
  dosage_amount: number;
  dosage_unit: string;
  route: string;
  frequency: string;
  times_of_day: string[];
}

interface DoseLog {
  item_id: string;
  status: string;
  time: string;
}

const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Bedtime'];

function AdherenceRing({ taken, total, colors }: { taken: number; total: number; colors: any }) {
  const pct = total > 0 ? (taken / total) * 100 : 0;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={108} height={108}>
        <Circle cx={54} cy={54} r={r} stroke={colors.surface} strokeWidth={10} fill="none" />
        <Circle cx={54} cy={54} r={r} stroke={colors.accent} strokeWidth={10} fill="none"
          strokeDasharray={`${circ}`} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90, 54, 54)" />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ ...typography.h3, color: colors.accent }}>{Math.round(pct)}%</Text>
        <Text style={{ ...typography.caption, color: colors.textTertiary, fontSize: 10 }}>{taken}/{total}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<TrackerItem[]>([]);
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newUnit, setNewUnit] = useState('mcg');
  const [newRoute, setNewRoute] = useState('Subcutaneous');
  const [newFreq, setNewFreq] = useState('Daily');
  const [newTimes, setNewTimes] = useState<string[]>(['Morning']);

  const today = new Date().toISOString().split('T')[0];
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  const loadData = async () => {
    const savedItems = await Storage.get<TrackerItem[]>(KEYS.TRACKER_ITEMS);
    const savedLogs = await Storage.get<DoseLog[]>(KEYS.DOSE_LOGS);
    setItems(savedItems || []);
    setLogs((savedLogs || []).filter((l: any) => l.date === today));
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const todayDoses = items.flatMap(item => {
    if (item.frequency === 'As Needed') return [];
    return (item.times_of_day || ['Morning']).map(time => ({ ...item, time }));
  });

  const logDose = async (itemId: string, time: string, status: string) => {
    const newLog = { item_id: itemId, status, time, date: today };
    const allLogs = await Storage.get<any[]>(KEYS.DOSE_LOGS) || [];
    const filtered = allLogs.filter((l: any) => !(l.item_id === itemId && l.time === time && l.date === today));
    filtered.push(newLog);
    await Storage.set(KEYS.DOSE_LOGS, filtered);
    setLogs(filtered.filter((l: any) => l.date === today));
  };

  const addItem = async () => {
    if (!newName.trim()) return;
    const item: TrackerItem = {
      id: `item_${Date.now()}`,
      type: 'Peptide',
      name: newName,
      dosage_amount: parseFloat(newDosage) || 0,
      dosage_unit: newUnit,
      route: newRoute,
      frequency: newFreq,
      times_of_day: newTimes,
    };
    const updated = [...items, item];
    await Storage.set(KEYS.TRACKER_ITEMS, updated);
    setItems(updated);
    setShowAdd(false);
    setNewName(''); setNewDosage('');
  };

  const getDoseStatus = (itemId: string, time: string) => {
    const log = logs.find(l => l.item_id === itemId && l.time === time);
    return log?.status || 'pending';
  };

  const takenCount = todayDoses.filter(d => getDoseStatus(d.id, d.time) === 'taken').length;

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting} testID="home-greeting">{greeting}</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <AdherenceRing taken={takenCount} total={todayDoses.length} colors={colors} />
        </View>

        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {todayDoses.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-plus" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No doses scheduled</Text>
            <Text style={styles.emptySubtext}>Add medications from the Research tab or tap + below</Text>
          </View>
        ) : (
          todayDoses.map((dose, idx) => {
            const status = getDoseStatus(dose.id, dose.time);
            return (
              <View key={`${dose.id}-${dose.time}-${idx}`} style={[styles.doseCard, status === 'taken' && styles.doseCardDone]}>
                <View style={styles.doseInfo}>
                  <Text style={styles.doseName}>{dose.name}</Text>
                  <Text style={styles.doseDetail}>{dose.dosage_amount} {dose.dosage_unit} · {dose.route}</Text>
                  <View style={styles.timeChip}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textTertiary} />
                    <Text style={styles.timeText}>{dose.time}</Text>
                  </View>
                </View>
                <View style={styles.doseActions}>
                  {status === 'pending' ? (
                    <>
                      <TouchableOpacity testID={`dose-take-${idx}`} style={styles.takeBtn} onPress={() => logDose(dose.id, dose.time, 'taken')}>
                        <MaterialCommunityIcons name="check" size={22} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity testID={`dose-skip-${idx}`} style={styles.skipBtn} onPress={() => logDose(dose.id, dose.time, 'skipped')}>
                        <MaterialCommunityIcons name="close" size={22} color={colors.warning} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={[styles.statusBadge, status === 'taken' ? styles.takenBadge : styles.skippedBadge]}>
                      <Text style={[styles.statusText, { color: status === 'taken' ? colors.success : colors.warning }]}>{status === 'taken' ? 'Taken' : 'Skipped'}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity testID="home-add-btn" style={styles.fab} onPress={() => setShowAdd(true)}>
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Tracked Item</Text>
            <TextInput testID="add-item-name" style={styles.input} placeholder="Name (e.g., BPC-157)" placeholderTextColor={colors.textTertiary} value={newName} onChangeText={setNewName} />
            <TextInput testID="add-item-dosage" style={styles.input} placeholder="Dosage amount" placeholderTextColor={colors.textTertiary} value={newDosage} onChangeText={setNewDosage} keyboardType="numeric" />
            <Text style={styles.label}>Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {['mcg', 'mg', 'mL', 'IU', 'tablets'].map(u => (
                <TouchableOpacity key={u} style={[styles.chip, newUnit === u && styles.chipActive]} onPress={() => setNewUnit(u)}>
                  <Text style={[styles.chipText, newUnit === u && styles.chipTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Route</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {['Subcutaneous', 'Oral', 'Intramuscular', 'Nasal', 'Topical'].map(r => (
                <TouchableOpacity key={r} style={[styles.chip, newRoute === r && styles.chipActive]} onPress={() => setNewRoute(r)}>
                  <Text style={[styles.chipText, newRoute === r && styles.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Frequency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {['Daily', 'Twice Daily', 'Every Other Day', 'Weekly', 'As Needed'].map(f => (
                <TouchableOpacity key={f} style={[styles.chip, newFreq === f && styles.chipActive]} onPress={() => setNewFreq(f)}>
                  <Text style={[styles.chipText, newFreq === f && styles.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Time of Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {TIME_SLOTS.map(t => (
                <TouchableOpacity key={t} style={[styles.chip, newTimes.includes(t) && styles.chipActive]}
                  onPress={() => setNewTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>
                  <Text style={[styles.chipText, newTimes.includes(t) && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalBtns}>
              <TouchableOpacity testID="add-item-cancel" style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="add-item-save" style={styles.saveBtn} onPress={addItem}>
                <Text style={styles.saveBtnText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { ...typography.h1, color: colors.textPrimary },
  date: { ...typography.bodySm, color: colors.textSecondary, marginTop: 4 },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  emptyText: { ...typography.bodyLg, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { ...typography.bodySm, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
  doseCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  doseCardDone: { opacity: 0.6 },
  doseInfo: { flex: 1 },
  doseName: { ...typography.bodyLg, color: colors.textPrimary, fontWeight: '600' },
  doseDetail: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
  timeChip: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  timeText: { ...typography.caption, color: colors.textTertiary, textTransform: 'none', fontSize: 12 },
  doseActions: { flexDirection: 'row', gap: 8 },
  takeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center' },
  skipBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,209,102,0.15)', justifyContent: 'center', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  takenBadge: { backgroundColor: 'rgba(6,214,160,0.2)' },
  skippedBadge: { backgroundColor: 'rgba(255,209,102,0.2)' },
  statusText: { ...typography.bodySm, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 100, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '85%' },
  modalTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.lg },
  input: { height: 56, backgroundColor: colors.secondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: 16, marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.sm, marginTop: spacing.sm },
  chipRow: { flexDirection: 'row', marginBottom: spacing.sm, flexGrow: 0 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.secondary, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.bodySm, color: colors.textSecondary },
  chipTextActive: { color: colors.primaryForeground, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: spacing.lg },
  cancelBtn: { flex: 1, height: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { ...typography.bodyBase, color: colors.textSecondary },
  saveBtn: { flex: 1, height: 52, borderRadius: 26, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '700' },
});
