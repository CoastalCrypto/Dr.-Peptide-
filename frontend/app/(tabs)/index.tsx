import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../src/context/ThemeContext';
import { typography, spacing } from '../../src/theme';
import { Storage, KEYS } from '../../src/utils/storage';
import { recurringItemsApi } from '../../src/utils/api';
import { useFocusEffect } from 'expo-router';
import { ScheduleCalendar } from '../../src/components/ScheduleCalendar';
import { AddRecurringItemModal } from '../../src/components/AddRecurringItemModal';
import { InjectionSiteTracker } from '../../src/components/InjectionSiteTracker';
import { RecurringItem, RecurringDoseLog, DoseStatus, CATEGORY_COLORS, ItemCategory } from '../../src/types/recurring';

const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Bedtime'];

interface ScheduledDose {
  item: RecurringItem;
  time: string;
  status: DoseStatus;
  log?: RecurringDoseLog;
}

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
  const today = new Date().toISOString().split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState(today);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [doseLogs, setDoseLogs] = useState<RecurringDoseLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showInjectionTracker, setShowInjectionTracker] = useState(false);
  const [selectedDose, setSelectedDose] = useState<ScheduledDose | null>(null);
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<Record<string, { marked: boolean; dotColor: string; count: number }>>({});
  
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  const loadData = async () => {
    setLoading(true);
    try {
      // Try API first, fall back to local storage
      let items: RecurringItem[] = [];
      let logs: RecurringDoseLog[] = [];
      
      try {
        items = await recurringItemsApi.getAll();
        logs = await recurringItemsApi.getDoseLogs(selectedDate);
      } catch (apiErr) {
        console.log('API unavailable, using local storage');
        items = (await Storage.get<RecurringItem[]>(KEYS.RECURRING_ITEMS)) || [];
        const allLogs = (await Storage.get<RecurringDoseLog[]>(KEYS.DOSE_LOGS)) || [];
        logs = allLogs.filter(l => l.scheduled_date === selectedDate);
      }
      
      setRecurringItems(items);
      setDoseLogs(logs);
      
      // Build marked dates for calendar
      const marks: Record<string, { marked: boolean; dotColor: string; count: number }> = {};
      items.forEach(item => {
        // Simple marking - mark start date and future dates based on recurrence
        marks[item.start_date] = {
          marked: true,
          dotColor: CATEGORY_COLORS[item.category as ItemCategory] || colors.accent,
          count: (marks[item.start_date]?.count || 0) + 1,
        };
      });
      setMarkedDates(marks);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [selectedDate]));

  // Get scheduled doses for selected date
  const getScheduledDoses = (): ScheduledDose[] => {
    const scheduled: ScheduledDose[] = [];
    
    recurringItems.forEach(item => {
      if (!item.is_active) return;
      
      // Check if item is scheduled for selected date
      const startDate = new Date(item.start_date);
      const selected = new Date(selectedDate);
      
      if (selected < startDate) return;
      if (item.end_date && selected > new Date(item.end_date)) return;
      
      const daysDiff = Math.floor((selected.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      let isScheduled = false;
      
      switch (item.recurrence_type) {
        case 'daily':
          isScheduled = daysDiff % (item.recurrence_interval || 1) === 0;
          break;
        case 'weekly':
        case 'biweekly':
          const weekDay = (selected.getDay()); // 0=Sun
          if (item.recurrence_days.includes(weekDay)) {
            const weeksDiff = Math.floor(daysDiff / 7);
            isScheduled = item.recurrence_type === 'weekly' 
              ? weeksDiff % (item.recurrence_interval || 1) === 0
              : weeksDiff % 2 === 0;
          }
          break;
        case 'monthly':
          isScheduled = selected.getDate() === startDate.getDate() &&
            ((selected.getFullYear() - startDate.getFullYear()) * 12 + selected.getMonth() - startDate.getMonth()) % (item.recurrence_interval || 1) === 0;
          break;
        case 'custom':
          isScheduled = daysDiff % (item.recurrence_interval || 1) === 0;
          break;
      }
      
      if (isScheduled) {
        item.times_of_day.forEach(time => {
          const log = doseLogs.find(l => 
            l.recurring_item_id === item.item_id && 
            l.scheduled_date === selectedDate && 
            l.scheduled_time === time
          );
          scheduled.push({
            item,
            time,
            status: log?.status as DoseStatus || 'pending',
            log,
          });
        });
      }
    });
    
    // Sort by time slot order
    return scheduled.sort((a, b) => TIME_SLOTS.indexOf(a.time) - TIME_SLOTS.indexOf(b.time));
  };

  const scheduledDoses = getScheduledDoses();
  const takenCount = scheduledDoses.filter(d => d.status === 'taken').length;

  const handleLogDose = async (dose: ScheduledDose, status: DoseStatus, reason?: string) => {
    try {
      const logData = {
        recurring_item_id: dose.item.item_id,
        scheduled_date: selectedDate,
        scheduled_time: dose.time,
        status,
        reason,
        actual_time: status === 'delayed' ? new Date().toISOString() : undefined,
      };
      
      try {
        await recurringItemsApi.logDose(logData);
      } catch (apiErr) {
        // Save locally if API fails
        const allLogs = (await Storage.get<any[]>(KEYS.DOSE_LOGS)) || [];
        const filtered = allLogs.filter(l => 
          !(l.recurring_item_id === logData.recurring_item_id && 
            l.scheduled_date === logData.scheduled_date && 
            l.scheduled_time === logData.scheduled_time)
        );
        filtered.push({ ...logData, log_id: `local_${Date.now()}`, logged_at: new Date().toISOString() });
        await Storage.set(KEYS.DOSE_LOGS, filtered);
      }
      
      loadData();
    } catch (err) {
      console.error('Log dose error:', err);
      Alert.alert('Error', 'Failed to log dose');
    }
    setShowLogModal(false);
    setSelectedDose(null);
  };

  const openLogModal = (dose: ScheduledDose) => {
    setSelectedDose(dose);
    setShowLogModal(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this recurring item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await recurringItemsApi.delete(itemId);
              loadData();
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting} testID="home-greeting">{greeting}</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <AdherenceRing taken={takenCount} total={scheduledDoses.length} colors={colors} />
        </View>

        {/* Calendar Section */}
        <ScheduleCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          markedDates={markedDates}
        />

        {/* Schedule Section */}
        <View style={styles.scheduleHeader}>
          <Text style={styles.sectionTitle}>
            {selectedDate === today ? "Today's Schedule" : `Schedule for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </Text>
          <TouchableOpacity 
            style={styles.addBtn} 
            onPress={() => setShowAddModal(true)}
            testID="add-recurring-btn"
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.primaryForeground} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        ) : scheduledDoses.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-plus" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No doses scheduled</Text>
            <Text style={styles.emptySubtext}>Tap "Add" to create a recurring item</Text>
          </View>
        ) : (
          scheduledDoses.map((dose, idx) => {
            const categoryColor = CATEGORY_COLORS[dose.item.category as ItemCategory] || colors.accent;
            return (
              <TouchableOpacity
                key={`${dose.item.item_id}-${dose.time}-${idx}`}
                style={[styles.doseCard, dose.status !== 'pending' && styles.doseCardDone]}
                onPress={() => openLogModal(dose)}
                onLongPress={() => handleDeleteItem(dose.item.item_id)}
                testID={`dose-card-${idx}`}
              >
                <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
                <View style={styles.doseInfo}>
                  <Text style={styles.doseName}>{dose.item.name}</Text>
                  <Text style={styles.doseDetail}>
                    {dose.item.dosage_amount} {dose.item.dosage_unit} · {dose.item.route}
                  </Text>
                  <View style={styles.timeChip}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textTertiary} />
                    <Text style={styles.timeText}>{dose.time}</Text>
                  </View>
                </View>
                <View style={styles.doseActions}>
                  {dose.status === 'pending' ? (
                    <>
                      <TouchableOpacity
                        testID={`dose-take-${idx}`}
                        style={styles.takeBtn}
                        onPress={() => handleLogDose(dose, 'taken')}
                      >
                        <MaterialCommunityIcons name="check" size={22} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`dose-skip-${idx}`}
                        style={styles.skipBtn}
                        onPress={() => openLogModal(dose)}
                      >
                        <MaterialCommunityIcons name="dots-horizontal" size={22} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={[
                      styles.statusBadge,
                      dose.status === 'taken' ? styles.takenBadge :
                      dose.status === 'skipped' ? styles.skippedBadge :
                      styles.delayedBadge
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: dose.status === 'taken' ? colors.success : 
                          dose.status === 'skipped' ? colors.warning : 
                          colors.accent }
                      ]}>
                        {dose.status.charAt(0).toUpperCase() + dose.status.slice(1)}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* My Recurring Items Section */}
        {recurringItems.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>My Recurring Items</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScroll}>
              {recurringItems.filter(i => i.is_active).map((item) => (
                <TouchableOpacity
                  key={item.item_id}
                  style={styles.itemCard}
                  onLongPress={() => handleDeleteItem(item.item_id)}
                  testID={`recurring-item-${item.item_id}`}
                >
                  <View style={[styles.itemCategoryDot, { backgroundColor: CATEGORY_COLORS[item.category as ItemCategory] || colors.accent }]} />
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemDose}>{item.dosage_amount} {item.dosage_unit}</Text>
                  <Text style={styles.itemFreq}>{item.recurrence_type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
        
        {/* Injection Site Tracker Button */}
        <TouchableOpacity 
          testID="injection-tracker-btn"
          style={styles.injectionBtn} 
          onPress={() => setShowInjectionTracker(true)}
        >
          <MaterialCommunityIcons name="needle" size={22} color={colors.accent} />
          <Text style={styles.injectionBtnText}>Injection Site Tracker</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
        </TouchableOpacity>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        testID="home-fab"
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Recurring Item Modal */}
      <AddRecurringItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadData}
      />

      {/* Log Dose Modal */}
      <Modal visible={showLogModal} animationType="fade" transparent>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowLogModal(false)}
        >
          <View style={styles.logModal}>
            <Text style={styles.logModalTitle}>
              {selectedDose?.item.name} - {selectedDose?.time}
            </Text>
            <Text style={styles.logModalSubtitle}>
              {selectedDose?.item.dosage_amount} {selectedDose?.item.dosage_unit}
            </Text>
            
            <TouchableOpacity
              style={[styles.logOption, { backgroundColor: colors.success + '20' }]}
              onPress={() => selectedDose && handleLogDose(selectedDose, 'taken')}
              testID="log-taken"
            >
              <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
              <Text style={[styles.logOptionText, { color: colors.success }]}>Taken</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.logOption, { backgroundColor: colors.warning + '20' }]}
              onPress={() => selectedDose && handleLogDose(selectedDose, 'skipped', 'Skipped')}
              testID="log-skipped"
            >
              <MaterialCommunityIcons name="close-circle" size={24} color={colors.warning} />
              <Text style={[styles.logOptionText, { color: colors.warning }]}>Skipped</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.logOption, { backgroundColor: colors.accent + '20' }]}
              onPress={() => selectedDose && handleLogDose(selectedDose, 'delayed', 'Delayed')}
              testID="log-delayed"
            >
              <MaterialCommunityIcons name="clock-alert" size={24} color={colors.accent} />
              <Text style={[styles.logOptionText, { color: colors.accent }]}>Delayed</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Injection Site Tracker Modal */}
      <InjectionSiteTracker 
        visible={showInjectionTracker} 
        onClose={() => setShowInjectionTracker(false)} 
      />
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
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { ...typography.bodySm, color: colors.primaryForeground, fontWeight: '600' },
  loadingCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  loadingText: { ...typography.bodyBase, color: colors.textSecondary },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  emptyText: { ...typography.bodyLg, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { ...typography.bodySm, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
  doseCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  doseCardDone: { opacity: 0.7 },
  categoryIndicator: { width: 4, height: '100%', borderRadius: 2, marginRight: spacing.md, minHeight: 50 },
  doseInfo: { flex: 1 },
  doseName: { ...typography.bodyLg, color: colors.textPrimary, fontWeight: '600' },
  doseDetail: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
  timeChip: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  timeText: { ...typography.caption, color: colors.textTertiary, textTransform: 'none', fontSize: 12 },
  doseActions: { flexDirection: 'row', gap: 8 },
  takeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center' },
  skipBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  takenBadge: { backgroundColor: 'rgba(6,214,160,0.2)' },
  skippedBadge: { backgroundColor: 'rgba(255,209,102,0.2)' },
  delayedBadge: { backgroundColor: 'rgba(57,255,20,0.2)' },
  statusText: { ...typography.bodySm, fontWeight: '600' },
  itemsScroll: { marginTop: spacing.sm },
  itemCard: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginRight: spacing.sm, minWidth: 120, borderWidth: 1, borderColor: colors.border },
  itemCategoryDot: { width: 8, height: 8, borderRadius: 4, marginBottom: spacing.sm },
  itemName: { ...typography.bodySm, color: colors.textPrimary, fontWeight: '600' },
  itemDose: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  itemFreq: { ...typography.caption, color: colors.textTertiary, marginTop: 2, textTransform: 'capitalize' },
  injectionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: 12 },
  injectionBtnText: { ...typography.bodyBase, color: colors.textPrimary, flex: 1 },
  fab: { position: 'absolute', bottom: 100, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
  logModal: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, width: '85%', maxWidth: 320 },
  logModalTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  logModalSubtitle: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  logOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm },
  logOptionText: { ...typography.bodyBase, fontWeight: '600' },
});
