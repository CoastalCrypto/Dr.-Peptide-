import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../theme';
import {
  RecurringItem,
  RecurrenceType,
  ItemCategory,
  DAYS_OF_WEEK,
  RECURRENCE_OPTIONS,
  CATEGORY_COLORS,
  TIME_SLOTS,
} from '../types/recurring';
import { recurringItemsApi } from '../utils/api';
import { NotificationServiceV2 } from '../services/notificationsV2';
import { SwipeableModal } from './SwipeableModal';

interface AddRecurringItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: RecurringItem; // For editing existing items
}

const UNITS = ['mcg', 'mg', 'mL', 'IU', 'tablets', 'capsules'];
const ROUTES = ['Subcutaneous', 'Oral', 'Intramuscular', 'Nasal', 'Topical', 'Sublingual'];
const CATEGORIES: { id: ItemCategory; label: string; icon: string }[] = [
  { id: 'peptide', label: 'Peptide', icon: 'needle' },
  { id: 'supplement', label: 'Supplement', icon: 'pill' },
  { id: 'medication', label: 'Medication', icon: 'medical-bag' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal' },
];

export function AddRecurringItemModal({ visible, onClose, onSuccess, editItem }: AddRecurringItemModalProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState(editItem?.name || '');
  const [dosage, setDosage] = useState(editItem?.dosage_amount?.toString() || '');
  const [unit, setUnit] = useState(editItem?.dosage_unit || 'mcg');
  const [route, setRoute] = useState(editItem?.route || 'Subcutaneous');
  const [category, setCategory] = useState<ItemCategory>(editItem?.category as ItemCategory || 'peptide');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(editItem?.recurrence_type || 'daily');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(editItem?.recurrence_days || [1, 3, 5]); // Mon, Wed, Fri
  const [customInterval, setCustomInterval] = useState(editItem?.recurrence_interval?.toString() || '1');
  const [times, setTimes] = useState<string[]>(editItem?.times_of_day || ['Morning']);
  const [notes, setNotes] = useState(editItem?.notes || '');
  const [reminderEnabled, setReminderEnabled] = useState(editItem?.reminder_enabled || false);
  
  const today = new Date().toISOString().split('T')[0];
  
  const resetForm = () => {
    setName('');
    setDosage('');
    setUnit('mcg');
    setRoute('Subcutaneous');
    setCategory('peptide');
    setRecurrenceType('daily');
    setRecurrenceDays([1, 3, 5]);
    setCustomInterval('1');
    setTimes(['Morning']);
    setNotes('');
    setReminderEnabled(false);
  };
  
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!dosage || parseFloat(dosage) <= 0) {
      Alert.alert('Error', 'Please enter a valid dosage');
      return;
    }
    if (times.length === 0) {
      Alert.alert('Error', 'Please select at least one time of day');
      return;
    }
    if ((recurrenceType === 'weekly' || recurrenceType === 'biweekly') && recurrenceDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day of the week');
      return;
    }
    
    setLoading(true);
    try {
      const itemData = {
        name: name.trim(),
        type: category.charAt(0).toUpperCase() + category.slice(1),
        dosage_amount: parseFloat(dosage),
        dosage_unit: unit,
        route,
        recurrence_type: recurrenceType,
        recurrence_days: recurrenceDays,
        recurrence_interval: parseInt(customInterval) || 1,
        times_of_day: times,
        start_date: today,
        notes: notes.trim() || undefined,
        category,
        reminder_enabled: reminderEnabled,
      };
      
      let savedItem;
      if (editItem) {
        savedItem = await recurringItemsApi.update(editItem.item_id, itemData);
        // Cancel existing notifications for this item before scheduling new ones
        if (editItem.item_id) {
          await NotificationServiceV2.cancelDoseReminders(editItem.item_id);
        }
      } else {
        savedItem = await recurringItemsApi.create(itemData);
      }
      
      // Schedule dose reminders if enabled and we have an item_id
      const itemId = savedItem?.item_id || editItem?.item_id;
      if (reminderEnabled && itemId) {
        // Get the days to schedule based on recurrence type
        let scheduleDays = [0, 1, 2, 3, 4, 5, 6]; // All days for daily
        if (recurrenceType === 'weekly' || recurrenceType === 'biweekly') {
          scheduleDays = recurrenceDays;
        }
        
        await NotificationServiceV2.scheduleDoseReminder(
          itemId,
          name.trim(),
          times,
          scheduleDays
        );
      }
      
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleDay = (dayId: number) => {
    setRecurrenceDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };
  
  const toggleTime = (time: string) => {
    setTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };
  
  const styles = createStyles(colors);
  
  return (
    <SwipeableModal visible={visible} onClose={onClose} closeOnBackdropPress={false}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>{editItem ? 'Edit' : 'Add'} Recurring Item</Text>
          <TouchableOpacity onPress={onClose} testID="modal-close">
            <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Name Input */}
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., BPC-157, Vitamin D"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            testID="recurring-name-input"
          />
            
            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    category === cat.id && { backgroundColor: CATEGORY_COLORS[cat.id] + '30', borderColor: CATEGORY_COLORS[cat.id] },
                  ]}
                  onPress={() => setCategory(cat.id)}
                  testID={`category-${cat.id}`}
                >
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={18}
                    color={category === cat.id ? CATEGORY_COLORS[cat.id] : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat.id && { color: CATEGORY_COLORS[cat.id] },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Dosage */}
            <Text style={styles.label}>Dosage *</Text>
            <View style={styles.dosageRow}>
              <TextInput
                style={[styles.input, styles.dosageInput]}
                placeholder="250"
                placeholderTextColor={colors.textTertiary}
                value={dosage}
                onChangeText={setDosage}
                keyboardType="numeric"
                testID="recurring-dosage-input"
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.chip, unit === u && styles.chipActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Route */}
            <Text style={styles.label}>Route</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {ROUTES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, route === r && styles.chipActive]}
                  onPress={() => setRoute(r)}
                >
                  <Text style={[styles.chipText, route === r && styles.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Recurrence Type */}
            <Text style={styles.label}>Recurrence *</Text>
            <View style={styles.recurrenceGrid}>
              {RECURRENCE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.recurrenceCard,
                    recurrenceType === opt.id && styles.recurrenceCardActive,
                  ]}
                  onPress={() => setRecurrenceType(opt.id as RecurrenceType)}
                  testID={`recurrence-${opt.id}`}
                >
                  <Text
                    style={[
                      styles.recurrenceLabel,
                      recurrenceType === opt.id && styles.recurrenceTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    style={[
                      styles.recurrenceDesc,
                      recurrenceType === opt.id && styles.recurrenceDescActive,
                    ]}
                  >
                    {opt.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Day Selection (for weekly/biweekly) */}
            {(recurrenceType === 'weekly' || recurrenceType === 'biweekly') && (
              <>
                <Text style={styles.label}>Days of Week *</Text>
                <View style={styles.daysRow}>
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day.id}
                      style={[
                        styles.dayChip,
                        recurrenceDays.includes(day.id) && styles.dayChipActive,
                      ]}
                      onPress={() => toggleDay(day.id)}
                      testID={`day-${day.short.toLowerCase()}`}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          recurrenceDays.includes(day.id) && styles.dayChipTextActive,
                        ]}
                      >
                        {day.short}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            
            {/* Custom Interval */}
            {recurrenceType === 'custom' && (
              <>
                <Text style={styles.label}>Repeat Every X Days</Text>
                <TextInput
                  style={[styles.input, styles.intervalInput]}
                  placeholder="3"
                  placeholderTextColor={colors.textTertiary}
                  value={customInterval}
                  onChangeText={setCustomInterval}
                  keyboardType="numeric"
                  testID="custom-interval-input"
                />
              </>
            )}
            
            {/* Time of Day */}
            <Text style={styles.label}>Time of Day *</Text>
            <View style={styles.timesRow}>
              {TIME_SLOTS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeChip, times.includes(time) && styles.timeChipActive]}
                  onPress={() => toggleTime(time)}
                  testID={`time-${time.toLowerCase()}`}
                >
                  <MaterialCommunityIcons
                    name={
                      time === 'Morning'
                        ? 'weather-sunny'
                        : time === 'Afternoon'
                        ? 'white-balance-sunny'
                        : time === 'Evening'
                        ? 'weather-sunset'
                        : 'weather-night'
                    }
                    size={18}
                    color={times.includes(time) ? colors.primaryForeground : colors.textSecondary}
                  />
                  <Text style={[styles.timeChipText, times.includes(time) && styles.timeChipTextActive]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Notes */}
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add any notes or reminders..."
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              testID="recurring-notes-input"
            />
            
            {/* Reminder Toggle */}
            <View style={styles.reminderRow}>
              <View>
                <Text style={styles.reminderLabel}>Enable Reminders</Text>
                <Text style={styles.reminderDesc}>Get notified at scheduled times</Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={reminderEnabled ? colors.primaryForeground : colors.textTertiary}
                testID="reminder-switch"
              />
            </View>
          </ScrollView>
          
          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} testID="modal-cancel">
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            testID="modal-save"
          >
            <Text style={styles.saveBtnText}>{loading ? 'Saving...' : editItem ? 'Update' : 'Add Item'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SwipeableModal>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    modal: {
      backgroundColor: colors.surface,
      maxHeight: '92%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    content: {
      padding: spacing.lg,
    },
    label: {
      ...typography.caption,
      color: colors.textTertiary,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    input: {
      height: 52,
      backgroundColor: colors.secondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      color: colors.textPrimary,
      fontSize: 16,
    },
    categoryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondary,
    },
    categoryText: {
      ...typography.bodySm,
      color: colors.textSecondary,
    },
    dosageRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    dosageInput: {
      width: 100,
    },
    unitScroll: {
      flex: 1,
    },
    chipRow: {
      flexDirection: 'row',
      flexGrow: 0,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: colors.secondary,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      ...typography.bodySm,
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.primaryForeground,
      fontWeight: '600',
    },
    recurrenceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    recurrenceCard: {
      width: '48%',
      padding: spacing.sm,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondary,
    },
    recurrenceCardActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    recurrenceLabel: {
      ...typography.bodySm,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    recurrenceTextActive: {
      color: colors.primary,
    },
    recurrenceDesc: {
      ...typography.caption,
      color: colors.textTertiary,
      fontSize: 10,
      marginTop: 2,
    },
    recurrenceDescActive: {
      color: colors.primary,
    },
    daysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayChip: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    dayChipText: {
      ...typography.bodySm,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    dayChipTextActive: {
      color: '#000',
    },
    intervalInput: {
      width: 120,
    },
    timesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    timeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timeChipText: {
      ...typography.bodySm,
      color: colors.textSecondary,
    },
    timeChipTextActive: {
      color: colors.primaryForeground,
      fontWeight: '600',
    },
    notesInput: {
      height: 80,
      textAlignVertical: 'top',
      paddingTop: spacing.sm,
    },
    reminderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    reminderLabel: {
      ...typography.bodyBase,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    reminderDesc: {
      ...typography.bodySm,
      color: colors.textTertiary,
      marginTop: 2,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelBtn: {
      flex: 1,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelBtnText: {
      ...typography.bodyBase,
      color: colors.textSecondary,
    },
    saveBtn: {
      flex: 1,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveBtnDisabled: {
      opacity: 0.6,
    },
    saveBtnText: {
      ...typography.bodyBase,
      color: colors.primaryForeground,
      fontWeight: '700',
    },
  });
