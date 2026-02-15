import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';
import { typography, spacing, DISCLAIMER } from '../../src/theme';
import { Storage, KEYS } from '../../src/utils/storage';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { RecurringItem, DAYS_OF_WEEK } from '../../src/types/recurring';

const SYRINGE_OPTIONS = [
  { label: '0.3 mL (30u)', ml: 0.3, units: 30 },
  { label: '0.5 mL (50u)', ml: 0.5, units: 50 },
  { label: '1.0 mL (100u)', ml: 1.0, units: 100 },
];
const VIAL_OPTIONS = [1, 2, 5, 10, 15, 20, 50];
const WATER_OPTIONS = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 5.0];
const DOSE_OPTIONS = [
  { label: '50 mcg', mcg: 50 }, { label: '100 mcg', mcg: 100 }, { label: '250 mcg', mcg: 250 },
  { label: '500 mcg', mcg: 500 }, { label: '1 mg', mcg: 1000 }, { label: '2 mg', mcg: 2000 },
  { label: '2.5 mg', mcg: 2500 }, { label: '5 mg', mcg: 5000 }, { label: '7.5 mg', mcg: 7500 },
  { label: '10 mg', mcg: 10000 }, { label: '12.5 mg', mcg: 12500 }, { label: '15 mg', mcg: 15000 },
];

interface Preset {
  id: string;
  name: string;
  syringeIdx: number;
  vialMg: number;
  bacWaterMl: number;
  doseMcg: number;
}

function SyringeVisual({ fillPct, units, unitsToDraw, colors }: { fillPct: number; units: number; unitsToDraw: number; colors: any }) {
  const fillHeight = useSharedValue(0);
  useEffect(() => { fillHeight.value = withTiming(Math.min(fillPct, 100), { duration: 400 }); }, [fillPct]);
  const animStyle = useAnimatedStyle(() => ({ height: `${fillHeight.value}%` }));
  const ticks = Array.from({ length: 5 }, (_, i) => ((i + 1) / 5) * units);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xl, gap: spacing.xl }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 48, height: 200, backgroundColor: colors.surfaceHighlight, borderRadius: 8, borderWidth: 2, borderColor: colors.border, overflow: 'hidden', justifyContent: 'flex-end', position: 'relative' }}>
          {ticks.map((tick, i) => (
            <View key={i} style={{ position: 'absolute', left: -36, bottom: `${((i + 1) / 5) * 100}%`, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 8, height: 1, backgroundColor: colors.border }} />
              <Text style={{ ...typography.caption, color: colors.textTertiary, fontSize: 10, marginLeft: 2, textTransform: 'none' }}>{tick}u</Text>
            </View>
          ))}
          <Animated.View style={[{ width: '100%', backgroundColor: colors.accent, borderTopLeftRadius: 2, borderTopRightRadius: 2, opacity: 0.8 }, animStyle]} />
        </View>
        <View style={{ width: 4, height: 24, backgroundColor: colors.textTertiary, borderRadius: 2, marginTop: -1 }} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ ...typography.caption, color: colors.textTertiary }}>Draw to</Text>
        <Text testID="units-to-draw" style={{ ...typography.display, color: colors.dosageHighlight, fontSize: 56 }}>{unitsToDraw.toFixed(1)}</Text>
        <Text style={{ ...typography.bodyBase, color: colors.textSecondary }}>units</Text>
      </View>
    </View>
  );
}

export default function CalculatorScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ vialMg?: string; doseMcg?: string; bacWaterMl?: string }>();
  const [syringeIdx, setSyringeIdx] = useState(2);
  const [vialMg, setVialMg] = useState(10);
  const [bacWaterMl, setBacWaterMl] = useState(2);
  const [doseMcg, setDoseMcg] = useState(250);
  const [customVial, setCustomVial] = useState('');
  const [customWater, setCustomWater] = useState('');
  const [customDose, setCustomDose] = useState('');
  const [showCustomModal, setShowCustomModal] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  useEffect(() => {
    if (params.vialMg) setVialMg(parseFloat(params.vialMg));
    if (params.doseMcg) setDoseMcg(parseFloat(params.doseMcg));
    if (params.bacWaterMl) setBacWaterMl(parseFloat(params.bacWaterMl));
  }, [params.vialMg, params.doseMcg, params.bacWaterMl]);

  useFocusEffect(useCallback(() => {
    Storage.get<Preset[]>(KEYS.CALCULATOR_PRESETS).then(p => setPresets(p || []));
  }, []));

  const syringe = SYRINGE_OPTIONS[syringeIdx];
  const concMcgPerMl = bacWaterMl > 0 ? (vialMg * 1000) / bacWaterMl : 0;
  const concMcgPerUnit = bacWaterMl > 0 ? (vialMg * 1000) / (bacWaterMl * syringe.units) : 0;
  const unitsToDraw = concMcgPerUnit > 0 ? doseMcg / concMcgPerUnit : 0;
  const mlToDraw = concMcgPerMl > 0 ? doseMcg / concMcgPerMl : 0;
  const totalDoses = doseMcg > 0 ? (vialMg * 1000) / doseMcg : 0;
  const fillPct = syringe.units > 0 ? (unitsToDraw / syringe.units) * 100 : 0;
  const exceedsSyringe = unitsToDraw > syringe.units;

  const savePreset = async () => {
    if (!presetName.trim()) return;
    const preset: Preset = { id: `p_${Date.now()}`, name: presetName, syringeIdx, vialMg, bacWaterMl, doseMcg };
    const updated = [...presets, preset];
    await Storage.set(KEYS.CALCULATOR_PRESETS, updated);
    setPresets(updated);
    setShowSavePreset(false);
    setPresetName('');
  };

  const loadPreset = (p: Preset) => {
    setSyringeIdx(p.syringeIdx);
    setVialMg(p.vialMg);
    setBacWaterMl(p.bacWaterMl);
    setDoseMcg(p.doseMcg);
  };

  const applyCustom = () => {
    if (showCustomModal === 'vial' && customVial) setVialMg(parseFloat(customVial));
    if (showCustomModal === 'water' && customWater) setBacWaterMl(parseFloat(customWater));
    if (showCustomModal === 'dose' && customDose) setDoseMcg(parseFloat(customDose) * (parseFloat(customDose) < 100 ? 1000 : 1));
    setShowCustomModal(null);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Peptide Calculator</Text>

        {presets.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
            {presets.map(p => (
              <TouchableOpacity key={p.id} style={styles.presetChip} onPress={() => loadPreset(p)}>
                <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.accent} />
                <Text style={styles.presetChipText}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Syringe Size</Text>
        <View style={styles.optionsRow}>
          {SYRINGE_OPTIONS.map((s, i) => (
            <TouchableOpacity key={i} testID={`syringe-${i}`} style={[styles.optionBtn, syringeIdx === i && styles.optionBtnActive]} onPress={() => setSyringeIdx(i)}>
              <Text style={[styles.optionText, syringeIdx === i && styles.optionTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Vial Amount (mg)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.optionsRow}>
            {VIAL_OPTIONS.map(v => (
              <TouchableOpacity key={v} testID={`vial-${v}`} style={[styles.optionBtn, vialMg === v && styles.optionBtnActive]} onPress={() => setVialMg(v)}>
                <Text style={[styles.optionText, vialMg === v && styles.optionTextActive]}>{v} mg</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.optionBtn} onPress={() => setShowCustomModal('vial')}>
              <Text style={styles.optionText}>Custom</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Text style={styles.label}>BAC Water Added (mL)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.optionsRow}>
            {WATER_OPTIONS.map(w => (
              <TouchableOpacity key={w} testID={`water-${w}`} style={[styles.optionBtn, bacWaterMl === w && styles.optionBtnActive]} onPress={() => setBacWaterMl(w)}>
                <Text style={[styles.optionText, bacWaterMl === w && styles.optionTextActive]}>{w} mL</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.optionBtn} onPress={() => setShowCustomModal('water')}>
              <Text style={styles.optionText}>Custom</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Text style={styles.label}>Desired Dose</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.optionsRow}>
            {DOSE_OPTIONS.map(d => (
              <TouchableOpacity key={d.mcg} testID={`dose-${d.mcg}`} style={[styles.optionBtn, doseMcg === d.mcg && styles.optionBtnActive]} onPress={() => setDoseMcg(d.mcg)}>
                <Text style={[styles.optionText, doseMcg === d.mcg && styles.optionTextActive]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.optionBtn} onPress={() => setShowCustomModal('dose')}>
              <Text style={styles.optionText}>Custom</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {exceedsSyringe && (
          <View style={styles.warningBanner}>
            <MaterialCommunityIcons name="alert" size={20} color={colors.error} />
            <Text style={styles.warningText}>Draw volume exceeds syringe capacity! Use a larger syringe or reduce dose.</Text>
          </View>
        )}

        <SyringeVisual fillPct={fillPct} units={syringe.units} unitsToDraw={unitsToDraw} colors={colors} />

        <View style={styles.resultsGrid}>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Units to Draw</Text>
            <Text testID="calc-units" style={styles.resultValue}>{unitsToDraw.toFixed(1)}</Text>
            <Text style={styles.resultUnit}>units</Text>
          </View>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Volume to Draw</Text>
            <Text testID="calc-ml" style={styles.resultValue}>{mlToDraw.toFixed(3)}</Text>
            <Text style={styles.resultUnit}>mL</Text>
          </View>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Concentration</Text>
            <Text style={styles.resultValue}>{concMcgPerUnit.toFixed(1)}</Text>
            <Text style={styles.resultUnit}>mcg/unit</Text>
          </View>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Doses Per Vial</Text>
            <Text style={styles.resultValue}>{Math.floor(totalDoses)}</Text>
            <Text style={styles.resultUnit}>injections</Text>
          </View>
        </View>

        <TouchableOpacity testID="save-preset-btn" style={styles.savePresetBtn} onPress={() => setShowSavePreset(true)}>
          <MaterialCommunityIcons name="content-save" size={20} color={colors.primaryForeground} />
          <Text style={styles.savePresetText}>Save as Preset</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
      </ScrollView>

      <Modal visible={showCustomModal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Custom {showCustomModal === 'vial' ? 'Vial Amount (mg)' : showCustomModal === 'water' ? 'BAC Water (mL)' : 'Dose (mcg or mg)'}</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholderTextColor={colors.textTertiary}
              placeholder={showCustomModal === 'dose' ? 'Enter value in mcg' : 'Enter value'}
              value={showCustomModal === 'vial' ? customVial : showCustomModal === 'water' ? customWater : customDose}
              onChangeText={showCustomModal === 'vial' ? setCustomVial : showCustomModal === 'water' ? setCustomWater : setCustomDose} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCustomModal(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyCustom}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSavePreset} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Save Preset</Text>
            <TextInput testID="preset-name-input" style={styles.input} placeholder="e.g., My BPC-157 Protocol" placeholderTextColor={colors.textTertiary} value={presetName} onChangeText={setPresetName} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSavePreset(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="save-preset-confirm" style={styles.applyBtn} onPress={savePreset}>
                <Text style={styles.applyBtnText}>Save</Text>
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
  content: { padding: spacing.lg, paddingBottom: 120 },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  presetsRow: { marginBottom: spacing.md, flexGrow: 0 },
  presetChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, gap: 6, borderWidth: 1, borderColor: colors.border },
  presetChipText: { ...typography.bodySm, color: colors.accent },
  label: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.sm, marginTop: spacing.md },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, minHeight: 48, justifyContent: 'center' },
  optionBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { ...typography.bodySm, color: colors.textSecondary },
  optionTextActive: { color: colors.primaryForeground, fontWeight: '700' },
  warningBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,71,111,0.15)', padding: spacing.md, borderRadius: 12, marginTop: spacing.md, gap: 8 },
  warningText: { ...typography.bodySm, color: colors.error, flex: 1 },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.lg },
  resultCard: { width: '47%', backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  resultLabel: { ...typography.caption, color: colors.textTertiary },
  resultValue: { ...typography.h1, color: colors.dosageHighlight, marginVertical: 4 },
  resultUnit: { ...typography.bodySm, color: colors.textSecondary },
  savePresetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, height: 56, borderRadius: 28, gap: 8, marginBottom: spacing.lg },
  savePresetText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '700' },
  disclaimer: { ...typography.bodySm, color: colors.textTertiary, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  modal: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg },
  modalTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  input: { height: 56, backgroundColor: colors.secondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: 18, marginBottom: spacing.md },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { ...typography.bodyBase, color: colors.textSecondary },
  applyBtn: { flex: 1, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  applyBtnText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '700' },
});
