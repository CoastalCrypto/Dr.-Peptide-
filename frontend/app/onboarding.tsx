import { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, DISCLAIMER } from '../src/theme';
import { Storage, KEYS } from '../src/utils/storage';

const { width } = Dimensions.get('window');

const GOALS = ['Weight Loss', 'Recovery', 'Anti-Aging', 'Muscle Growth', 'General Health', 'Medication Management'];

const slides = [
  {
    icon: 'flask-round-bottom' as const,
    title: 'Precision Dosing',
    desc: 'Calculate peptide reconstitution with our medical-grade calculator. Never second-guess your doses again.',
  },
  {
    icon: 'book-search' as const,
    title: 'Research Database',
    desc: 'Access detailed profiles for 15+ peptides and common medications with dosage ranges, side effects, and protocols.',
  },
  {
    icon: 'heart-pulse' as const,
    title: 'Health Tracking',
    desc: 'Log your health metrics, track side effects, and monitor trends over time. Powered by AI insights.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const nextPage = () => {
    if (page < 3) {
      const next = page + 1;
      setPage(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    }
  };

  const finish = async () => {
    await Storage.set(KEYS.ONBOARDED, true);
    await Storage.set(KEYS.GOALS, selectedGoals);
    router.replace('/(tabs)');
  };

  const toggleGoal = (g: string) => {
    setSelectedGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        scrollEnabled={false} style={styles.scroll}>
        {/* Slides */}
        {slides.map((slide, i) => (
          <View key={i} style={[styles.page, { width }]}>
            <View style={styles.slideContent}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name={slide.icon} size={64} color={colors.accent} />
              </View>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDesc}>{slide.desc}</Text>
            </View>
          </View>
        ))}

        {/* Goals page */}
        <View style={[styles.page, { width }]}>
          <View style={styles.slideContent}>
            <Text style={styles.slideTitle}>What brings you here?</Text>
            <Text style={styles.slideDesc}>Select your goals to personalize your experience</Text>
            <View style={styles.goalsGrid}>
              {GOALS.map(g => (
                <TouchableOpacity key={g} testID={`goal-${g}`} style={[styles.goalChip, selectedGoals.includes(g) && styles.goalChipActive]} onPress={() => toggleGoal(g)}>
                  <Text style={[styles.goalText, selectedGoals.includes(g) && styles.goalTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[styles.dot, page === i && styles.dotActive]} />
          ))}
        </View>

        {page < 3 ? (
          <View style={styles.btnsRow}>
            <TouchableOpacity testID="onboarding-skip" style={styles.skipBtn} onPress={finish}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="onboarding-next" style={styles.nextBtn} onPress={nextPage}>
              <Text style={styles.nextText}>Next</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity testID="onboarding-start" style={styles.startBtn} onPress={finish}>
            <Text style={styles.startText}>Continue as Guest</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  page: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  slideContent: { alignItems: 'center', maxWidth: 340 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(76,201,240,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl },
  slideTitle: { ...typography.h1, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md },
  slideDesc: { ...typography.bodyLg, color: colors.textSecondary, textAlign: 'center', lineHeight: 28 },
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: spacing.xl },
  goalChip: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  goalChipActive: { backgroundColor: colors.primary, borderColor: colors.accent },
  goalText: { ...typography.bodyBase, color: colors.textSecondary },
  goalTextActive: { color: colors.primaryForeground, fontWeight: '700' },
  footer: { padding: spacing.lg, paddingBottom: spacing.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surface },
  dotActive: { backgroundColor: colors.accent, width: 24 },
  btnsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipBtn: { paddingVertical: 14, paddingHorizontal: 20 },
  skipText: { ...typography.bodyBase, color: colors.textTertiary },
  nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 28, gap: 8 },
  nextText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '700' },
  startBtn: { backgroundColor: colors.primary, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  startText: { ...typography.bodyLg, color: colors.primaryForeground, fontWeight: '700' },
  disclaimer: { ...typography.bodySm, color: colors.textTertiary, fontSize: 10, textAlign: 'center', marginTop: spacing.md, lineHeight: 14 },
});
