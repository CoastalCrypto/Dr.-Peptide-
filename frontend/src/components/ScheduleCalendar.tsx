import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../theme';
import { DAYS_OF_WEEK } from '../types/recurring';

type CalendarView = 'week' | 'month';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  markedDates?: Record<string, { marked?: boolean; dotColor?: string; count?: number }>;
}

const getWeekDates = (date: Date): Date[] => {
  const day = date.getDay();
  const diff = date.getDate() - day;
  const weekStart = new Date(date);
  weekStart.setDate(diff);
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
};

const getMonthDates = (date: Date): (Date | null)[][] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = Array(startPadding).fill(null);
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    currentWeek.push(new Date(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export function ScheduleCalendar({ selectedDate, onSelectDate, markedDates = {} }: CalendarProps) {
  const { colors } = useTheme();
  const [view, setView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate || new Date()));
  
  const today = formatDate(new Date());
  
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const monthDates = useMemo(() => getMonthDates(currentDate), [currentDate]);
  
  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };
  
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    const todayDate = new Date();
    setCurrentDate(todayDate);
    onSelectDate(formatDate(todayDate));
  };
  
  const styles = createStyles(colors);
  
  const renderDayCell = (date: Date | null, isWeekView = false) => {
    if (!date) {
      return <View key={Math.random()} style={[styles.dayCell, isWeekView && styles.weekDayCell]} />;
    }
    
    const dateStr = formatDate(date);
    const isSelected = dateStr === selectedDate;
    const isToday = dateStr === today;
    const mark = markedDates[dateStr];
    
    return (
      <TouchableOpacity
        key={dateStr}
        style={[
          styles.dayCell,
          isWeekView && styles.weekDayCell,
          isSelected && styles.selectedDay,
          isToday && !isSelected && styles.todayDay,
        ]}
        onPress={() => onSelectDate(dateStr)}
        testID={`calendar-day-${dateStr}`}
      >
        {isWeekView && (
          <Text style={[styles.dayName, isSelected && styles.selectedText]}>
            {DAYS_OF_WEEK[date.getDay()].short}
          </Text>
        )}
        <Text style={[
          styles.dayNumber,
          isWeekView && styles.weekDayNumber,
          isSelected && styles.selectedText,
          isToday && !isSelected && styles.todayText,
        ]}>
          {date.getDate()}
        </Text>
        {mark?.marked && (
          <View style={[styles.dot, { backgroundColor: mark.dotColor || colors.accent }]}>
            {mark.count && mark.count > 0 && (
              <Text style={styles.dotCount}>{mark.count > 9 ? '9+' : mark.count}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekRange = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  
  return (
    <View style={styles.container}>
      {/* View Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'week' && styles.toggleActive]}
            onPress={() => setView('week')}
            testID="calendar-view-week"
          >
            <Text style={[styles.toggleText, view === 'week' && styles.toggleTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'month' && styles.toggleActive]}
            onPress={() => setView('month')}
            testID="calendar-view-month"
          >
            <Text style={[styles.toggleText, view === 'month' && styles.toggleTextActive]}>Month</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.todayBtn} onPress={goToToday} testID="calendar-today-btn">
          <Text style={styles.todayBtnText}>Today</Text>
        </TouchableOpacity>
      </View>
      
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => view === 'week' ? navigateWeek(-1) : navigateMonth(-1)}
          style={styles.navBtn}
          testID="calendar-prev"
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{view === 'week' ? weekRange : monthName}</Text>
        <TouchableOpacity
          onPress={() => view === 'week' ? navigateWeek(1) : navigateMonth(1)}
          style={styles.navBtn}
          testID="calendar-next"
        >
          <MaterialCommunityIcons name="chevron-right" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      {/* Calendar Grid */}
      {view === 'week' ? (
        <View style={styles.weekRow}>
          {weekDates.map((date) => renderDayCell(date, true))}
        </View>
      ) : (
        <View style={styles.monthContainer}>
          {/* Day Headers */}
          <View style={styles.dayHeaderRow}>
            {DAYS_OF_WEEK.map((day) => (
              <Text key={day.id} style={styles.dayHeaderText}>{day.short}</Text>
            ))}
          </View>
          {/* Month Grid */}
          {monthDates.map((week, weekIdx) => (
            <View key={weekIdx} style={styles.monthWeekRow}>
              {week.map((date, dayIdx) => renderDayCell(date, false))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 4,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: colors.primaryForeground,
    fontWeight: '600',
  },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  todayBtnText: {
    ...typography.bodySm,
    color: colors.accent,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navBtn: {
    padding: 4,
  },
  headerTitle: {
    ...typography.bodyLg,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayCell: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
    minWidth: 44,
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 36,
    minHeight: 36,
  },
  selectedDay: {
    backgroundColor: colors.primary,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  dayName: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 10,
    marginBottom: 4,
  },
  dayNumber: {
    ...typography.bodySm,
    color: colors.textPrimary,
  },
  weekDayNumber: {
    ...typography.bodyLg,
    fontWeight: '600',
  },
  selectedText: {
    color: colors.primaryForeground,
  },
  todayText: {
    color: colors.accent,
    fontWeight: '700',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCount: {
    fontSize: 10,
    color: '#000',
    fontWeight: '700',
  },
  monthContainer: {
    marginTop: spacing.sm,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  dayHeaderText: {
    ...typography.caption,
    color: colors.textTertiary,
    width: 36,
    textAlign: 'center',
    fontSize: 11,
  },
  monthWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
});
