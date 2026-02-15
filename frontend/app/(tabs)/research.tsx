import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, FlatList, Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { typography, spacing } from '../../src/theme';
import { peptides as bundledPeptides, GOAL_CATEGORIES, Peptide } from '../../src/data/peptides';
import { medications as bundledMeds, Medication } from '../../src/data/medications';
import { Storage, KEYS } from '../../src/utils/storage';
import { api } from '../../src/utils/api';

type Tab = 'peptides' | 'medications';
type AddType = 'peptide' | 'medication' | null;

const ROUTE_OPTIONS = ['Subcutaneous', 'Intramuscular', 'Oral', 'Nasal', 'Topical', 'IV', 'Sublingual'];

export default function ResearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('peptides');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [customPeptides, setCustomPeptides] = useState<Peptide[]>([]);
  const [customMeds, setCustomMeds] = useState<Medication[]>([]);
  const [showAdd, setShowAdd] = useState<AddType>(null);
  
  // AI Web Search state
  const [showWebSearch, setShowWebSearch] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearchResult, setWebSearchResult] = useState<string | null>(null);
  const [webSearchLoading, setWebSearchLoading] = useState(false);
  
  // Comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Custom peptide form
  const [cpName, setCpName] = useState('');
  const [cpAliases, setCpAliases] = useState('');
  const [cpCategories, setCpCategories] = useState<string[]>([]);
  const [cpDesc, setCpDesc] = useState('');
  const [cpMechanism, setCpMechanism] = useState('');
  const [cpDoseLow, setCpDoseLow] = useState('');
  const [cpDoseMod, setCpDoseMod] = useState('');
  const [cpDoseHigh, setCpDoseHigh] = useState('');
  const [cpFrequency, setCpFrequency] = useState('');
  const [cpCycle, setCpCycle] = useState('');
  const [cpRoutes, setCpRoutes] = useState<string[]>(['Subcutaneous']);
  const [cpSideEffects, setCpSideEffects] = useState('');
  const [cpContra, setCpContra] = useState('');
  const [cpStorage, setCpStorage] = useState('');
  const [cpVialMg, setCpVialMg] = useState('');
  const [cpDoseMcg, setCpDoseMcg] = useState('');
  const [cpBacWater, setCpBacWater] = useState('');

  // Custom medication form
  const [cmGeneric, setCmGeneric] = useState('');
  const [cmBrands, setCmBrands] = useState('');
  const [cmClass, setCmClass] = useState('');
  const [cmUses, setCmUses] = useState('');
  const [cmDosage, setCmDosage] = useState('');
  const [cmSideEffects, setCmSideEffects] = useState('');
  const [cmContra, setCmContra] = useState('');
  const [cmInteractions, setCmInteractions] = useState('');
  const [cmTiming, setCmTiming] = useState('');

  useFocusEffect(useCallback(() => {
    Storage.get<Peptide[]>(KEYS.CUSTOM_PEPTIDES).then(p => setCustomPeptides(p || []));
    Storage.get<Medication[]>(KEYS.CUSTOM_MEDS).then(m => setCustomMeds(m || []));
  }, []));

  const allPeptides = [...bundledPeptides, ...customPeptides];
  const allMeds = [...bundledMeds, ...customMeds];

  const filteredPeptides = allPeptides.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.aliases.some(a => a.toLowerCase().includes(search.toLowerCase())) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || p.categories.includes(activeCategory);
    return matchSearch && matchCat;
  });

  const filteredMeds = allMeds.filter(m => {
    const s = search.toLowerCase();
    return !search || m.genericName.toLowerCase().includes(s) ||
      m.brandNames.some(b => b.toLowerCase().includes(s)) ||
      m.drugClass.toLowerCase().includes(s);
  });

  // AI Web Search function
  const performWebSearch = async () => {
    if (!webSearchQuery.trim()) {
      Alert.alert('Enter Search', 'Please enter a peptide or medication name to search.');
      return;
    }
    
    setWebSearchLoading(true);
    setWebSearchResult(null);
    
    try {
      const response = await api.post('/api/ai/web-search', {
        query: webSearchQuery,
        search_type: activeTab === 'peptides' ? 'peptide' : 'medication'
      });
      setWebSearchResult(response.result);
    } catch (error: any) {
      console.error('Web search error:', error);
      Alert.alert('Search Error', error.message || 'Failed to perform web search. Please try again.');
    } finally {
      setWebSearchLoading(false);
    }
  };

  const openWebSearch = () => {
    setWebSearchQuery(search);
    setWebSearchResult(null);
    setShowWebSearch(true);
  };

  const resetPeptideForm = () => {
    setCpName(''); setCpAliases(''); setCpCategories([]); setCpDesc(''); setCpMechanism('');
    setCpDoseLow(''); setCpDoseMod(''); setCpDoseHigh(''); setCpFrequency(''); setCpCycle('');
    setCpRoutes(['Subcutaneous']); setCpSideEffects(''); setCpContra(''); setCpStorage('');
    setCpVialMg(''); setCpDoseMcg(''); setCpBacWater('');
  };

  const resetMedForm = () => {
    setCmGeneric(''); setCmBrands(''); setCmClass(''); setCmUses(''); setCmDosage('');
    setCmSideEffects(''); setCmContra(''); setCmInteractions(''); setCmTiming('');
  };

  const savePeptide = async () => {
    if (!cpName.trim()) { Alert.alert('Required', 'Please enter a peptide name.'); return; }
    const newPeptide: Peptide = {
      id: `custom_${Date.now()}`,
      name: cpName.trim(),
      aliases: cpAliases.split(',').map(a => a.trim()).filter(Boolean),
      categories: cpCategories.length > 0 ? cpCategories : ['Other'],
      description: cpDesc || `Custom peptide: ${cpName}`,
      mechanism: cpMechanism || 'Not specified',
      dosage: { low: cpDoseLow || 'Not specified', moderate: cpDoseMod || 'Not specified', higher: cpDoseHigh || 'Not specified' },
      frequency: cpFrequency || 'As directed',
      cycleLength: cpCycle || 'As directed',
      routes: cpRoutes,
      protocols: [],
      sideEffects: { common: cpSideEffects.split(',').map(s => s.trim()).filter(Boolean), uncommon: [], rare: [] },
      contraindications: cpContra.split(',').map(c => c.trim()).filter(Boolean),
      storage: cpStorage || 'Consult provider for storage instructions.',
      vialSizes: cpVialMg ? [parseFloat(cpVialMg)] : [],
      defaultVialMg: parseFloat(cpVialMg) || 5,
      defaultDoseMcg: parseFloat(cpDoseMcg) || 250,
      defaultBacWaterMl: parseFloat(cpBacWater) || 2,
      isCustom: true,
    };
    const updated = [...customPeptides, newPeptide];
    await Storage.set(KEYS.CUSTOM_PEPTIDES, updated);
    setCustomPeptides(updated);
    setShowAdd(null);
    resetPeptideForm();
  };

  const saveMedication = async () => {
    if (!cmGeneric.trim()) { Alert.alert('Required', 'Please enter a medication name.'); return; }
    const newMed: Medication = {
      id: `custom_${Date.now()}`,
      genericName: cmGeneric.trim(),
      brandNames: cmBrands.split(',').map(b => b.trim()).filter(Boolean),
      drugClass: cmClass || 'Not classified',
      uses: cmUses.split(',').map(u => u.trim()).filter(Boolean),
      standardDosage: cmDosage || 'Consult provider',
      sideEffects: cmSideEffects.split(',').map(s => s.trim()).filter(Boolean),
      contraindications: cmContra.split(',').map(c => c.trim()).filter(Boolean),
      interactions: cmInteractions.split(',').map(i => i.trim()).filter(Boolean),
      timing: cmTiming || 'As directed by provider',
      isCustom: true,
    };
    const updated = [...customMeds, newMed];
    await Storage.set(KEYS.CUSTOM_MEDS, updated);
    setCustomMeds(updated);
    setShowAdd(null);
    resetMedForm();
  };

  const deleteCustomItem = async (id: string, type: 'peptide' | 'medication') => {
    Alert.alert('Delete Custom Entry', 'Are you sure you want to remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        if (type === 'peptide') {
          const updated = customPeptides.filter(p => p.id !== id);
          await Storage.set(KEYS.CUSTOM_PEPTIDES, updated);
          setCustomPeptides(updated);
        } else {
          const updated = customMeds.filter(m => m.id !== id);
          await Storage.set(KEYS.CUSTOM_MEDS, updated);
          setCustomMeds(updated);
        }
      }},
    ]);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Research</Text>
          <TouchableOpacity testID="add-custom-btn" style={styles.addBtn} onPress={() => setShowAdd(activeTab === 'peptides' ? 'peptide' : 'medication')}>
            <MaterialCommunityIcons name="plus" size={20} color={colors.primaryForeground} />
            <Text style={styles.addBtnText}>Add Custom</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.textTertiary} />
          <TextInput testID="research-search" style={styles.searchInput} placeholder="Search peptides, medications..."
            placeholderTextColor={colors.textTertiary} value={search} onChangeText={setSearch} />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* AI Web Search Button */}
        <TouchableOpacity testID="ai-search-btn" style={styles.aiSearchBtn} onPress={openWebSearch}>
          <MaterialCommunityIcons name="brain" size={20} color={colors.primaryForeground} />
          <Text style={styles.aiSearchBtnText}>AI Web Search</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
        
        {/* Compare Button */}
        {activeTab === 'peptides' && (
          <View style={styles.compareRow}>
            <TouchableOpacity 
              testID="compare-toggle-btn" 
              style={[styles.compareBtn, compareMode && styles.compareBtnActive]} 
              onPress={() => { setCompareMode(!compareMode); setSelectedForCompare([]); }}
            >
              <MaterialCommunityIcons name="compare" size={18} color={compareMode ? colors.primaryForeground : colors.accent} />
              <Text style={[styles.compareBtnText, compareMode && styles.compareBtnTextActive]}>
                {compareMode ? 'Cancel Compare' : 'Compare Peptides'}
              </Text>
            </TouchableOpacity>
            {selectedForCompare.length >= 2 && (
              <TouchableOpacity 
                testID="view-compare-btn"
                style={styles.viewCompareBtn} 
                onPress={() => setShowCompareModal(true)}
              >
                <Text style={styles.viewCompareBtnText}>Compare ({selectedForCompare.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.tabs}>
          <TouchableOpacity testID="tab-peptides" style={[styles.tab, activeTab === 'peptides' && styles.tabActive]} onPress={() => setActiveTab('peptides')}>
            <Text style={[styles.tabText, activeTab === 'peptides' && styles.tabTextActive]}>Peptides ({filteredPeptides.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="tab-medications" style={[styles.tab, activeTab === 'medications' && styles.tabActive]} onPress={() => setActiveTab('medications')}>
            <Text style={[styles.tabText, activeTab === 'medications' && styles.tabTextActive]}>Medications ({filteredMeds.length})</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'peptides' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
            <TouchableOpacity style={[styles.catChip, !activeCategory && styles.catChipActive]} onPress={() => setActiveCategory(null)}>
              <Text style={[styles.catChipText, !activeCategory && styles.catChipTextActive]}>All</Text>
            </TouchableOpacity>
            {GOAL_CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} style={[styles.catChip, activeCategory === cat && styles.catChipActive]} onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}>
                <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeTab === 'peptides' ? (
          <FlatList
            data={filteredPeptides}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const isSelected = selectedForCompare.includes(item.id);
              return (
                <TouchableOpacity 
                  testID={`peptide-${item.id}`} 
                  style={[styles.card, compareMode && isSelected && styles.cardSelected]} 
                  onPress={() => {
                    if (compareMode) {
                      if (isSelected) {
                        setSelectedForCompare(prev => prev.filter(id => id !== item.id));
                      } else if (selectedForCompare.length < 3) {
                        setSelectedForCompare(prev => [...prev, item.id]);
                      }
                    } else {
                      router.push(`/peptide/${item.id}`);
                    }
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardNameRow}>
                      {compareMode && (
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected && <MaterialCommunityIcons name="check" size={14} color={colors.primaryForeground} />}
                        </View>
                      )}
                      <Text style={styles.cardName}>{item.name}</Text>
                      {item.isCustom && <View style={styles.customBadge}><Text style={styles.customBadgeText}>Custom</Text></View>}
                    </View>
                    <View style={styles.cardActions}>
                      {item.isCustom && !compareMode && (
                        <TouchableOpacity testID={`delete-${item.id}`} onPress={() => deleteCustomItem(item.id, 'peptide')} style={styles.deleteBtn}>
                          <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                      )}
                      {!compareMode && <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />}
                    </View>
                  </View>
                  <View style={styles.cardTags}>
                    {item.categories.map(cat => (
                      <View key={cat} style={styles.tag}>
                        <Text style={styles.tagText}>{cat}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.metaText}>{item.routes.join(' · ')}</Text>
                  <Text style={styles.metaText}>{item.frequency}</Text>
                </View>
              </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="flask-empty" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No peptides found</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={filteredMeds}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardNameRow}>
                    <View>
                      <Text style={styles.cardName}>{item.genericName}</Text>
                      <Text style={styles.brandText}>{item.brandNames.join(', ')}</Text>
                    </View>
                    {item.isCustom && <View style={styles.customBadge}><Text style={styles.customBadgeText}>Custom</Text></View>}
                  </View>
                  {item.isCustom && (
                    <TouchableOpacity testID={`delete-med-${item.id}`} onPress={() => deleteCustomItem(item.id, 'medication')} style={styles.deleteBtn}>
                      <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.drugClass}</Text>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.uses.join(' · ')}</Text>
                <Text style={styles.dosageInfo}>Standard: {item.standardDosage}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="pill" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No medications found</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Compare Peptides Modal */}
      <Modal visible={showCompareModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.compareModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Compare Peptides</Text>
              <TouchableOpacity onPress={() => setShowCompareModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.compareContent}>
              {/* Header row */}
              <View style={styles.compareRow}>
                <Text style={[styles.compareLabel, styles.compareLabelFirst]}>Attribute</Text>
                {selectedForCompare.map(id => {
                  const p = [...PEPTIDES, ...customPeptides].find(p => p.id === id);
                  return <Text key={id} style={styles.compareHeader}>{p?.name || 'Unknown'}</Text>;
                })}
              </View>
              
              {/* Categories */}
              <View style={styles.compareRow}>
                <Text style={styles.compareLabel}>Goals</Text>
                {selectedForCompare.map(id => {
                  const p = [...PEPTIDES, ...customPeptides].find(p => p.id === id);
                  return <Text key={id} style={styles.compareValue}>{p?.categories.join(', ') || '-'}</Text>;
                })}
              </View>
              
              {/* Routes */}
              <View style={styles.compareRow}>
                <Text style={styles.compareLabel}>Routes</Text>
                {selectedForCompare.map(id => {
                  const p = [...PEPTIDES, ...customPeptides].find(p => p.id === id);
                  return <Text key={id} style={styles.compareValue}>{p?.routes.join(', ') || '-'}</Text>;
                })}
              </View>
              
              {/* Frequency */}
              <View style={styles.compareRow}>
                <Text style={styles.compareLabel}>Frequency</Text>
                {selectedForCompare.map(id => {
                  const p = [...PEPTIDES, ...customPeptides].find(p => p.id === id);
                  return <Text key={id} style={styles.compareValue}>{p?.frequency || '-'}</Text>;
                })}
              </View>
              
              {/* Dosage Range */}
              <View style={styles.compareRow}>
                <Text style={styles.compareLabel}>Dosage Range</Text>
                {selectedForCompare.map(id => {
                  const p = [...PEPTIDES, ...customPeptides].find(p => p.id === id);
                  return <Text key={id} style={styles.compareValue}>{p?.dosageRange || '-'}</Text>;
                })}
              </View>
              
              {/* Half Life */}
              <View style={styles.compareRow}>
                <Text style={styles.compareLabel}>Half Life</Text>
                {selectedForCompare.map(id => {
                  const p = [...PEPTIDES, ...customPeptides].find(p => p.id === id);
                  return <Text key={id} style={styles.compareValue}>{p?.halfLife || '-'}</Text>;
                })}
              </View>
              
              {/* Description */}
              <View style={styles.compareRowDesc}>
                <Text style={styles.compareLabel}>Description</Text>
                {selectedForCompare.map(id => {
                  const p = [...PEPTIDES, ...customPeptides].find(p => p.id === id);
                  return <Text key={id} style={styles.compareDesc}>{p?.description || '-'}</Text>;
                })}
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              testID="close-compare-btn"
              style={styles.closeCompareBtn} 
              onPress={() => { setShowCompareModal(false); setCompareMode(false); setSelectedForCompare([]); }}
            >
              <Text style={styles.closeCompareBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Web Search Modal */}
      <Modal visible={showWebSearch} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
          <View style={styles.modalOverlay}>
            <View style={styles.webSearchModal}>
              <View style={styles.modalHeader}>
                <View style={styles.aiHeaderRow}>
                  <MaterialCommunityIcons name="brain" size={24} color={colors.accent} />
                  <Text style={styles.modalTitle}>AI Research</Text>
                </View>
                <TouchableOpacity onPress={() => setShowWebSearch(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.aiHint}>Search for detailed information about any {activeTab === 'peptides' ? 'peptide' : 'medication'}</Text>
              
              <View style={styles.aiSearchInputRow}>
                <TextInput
                  testID="ai-search-input"
                  style={styles.aiSearchInput}
                  placeholder={`Enter ${activeTab === 'peptides' ? 'peptide' : 'medication'} name...`}
                  placeholderTextColor={colors.textTertiary}
                  value={webSearchQuery}
                  onChangeText={setWebSearchQuery}
                  onSubmitEditing={performWebSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity 
                  testID="ai-search-submit"
                  style={[styles.aiSubmitBtn, webSearchLoading && styles.aiSubmitBtnDisabled]}
                  onPress={performWebSearch}
                  disabled={webSearchLoading}
                >
                  {webSearchLoading ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <MaterialCommunityIcons name="magnify" size={24} color={colors.primaryForeground} />
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.aiResultsScroll} contentContainerStyle={styles.aiResultsContent}>
                {webSearchLoading && (
                  <View style={styles.aiLoadingBox}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text style={styles.aiLoadingText}>Researching {webSearchQuery}...</Text>
                    <Text style={styles.aiLoadingSubtext}>This may take a few seconds</Text>
                  </View>
                )}
                
                {webSearchResult && (
                  <View style={styles.aiResultBox}>
                    <View style={styles.aiResultHeader}>
                      <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
                      <Text style={styles.aiResultTitle}>Research Results</Text>
                    </View>
                    <Text style={styles.aiResultText}>{webSearchResult}</Text>
                    <View style={styles.aiDisclaimer}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.warning} />
                      <Text style={styles.aiDisclaimerText}>
                        This is AI-generated educational content. Always consult a healthcare provider.
                      </Text>
                    </View>
                  </View>
                )}
                
                {!webSearchLoading && !webSearchResult && (
                  <View style={styles.aiEmptyState}>
                    <MaterialCommunityIcons name="flask-outline" size={48} color={colors.textTertiary} />
                    <Text style={styles.aiEmptyText}>Enter a search term above</Text>
                    <Text style={styles.aiEmptySubtext}>Get comprehensive AI-powered research on any {activeTab === 'peptides' ? 'peptide' : 'medication'}</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Custom Peptide Modal */}
      <Modal visible={showAdd === 'peptide'} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Custom Peptide</Text>
                <TouchableOpacity onPress={() => { setShowAdd(null); resetPeptideForm(); }}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Name *</Text>
              <TextInput testID="custom-peptide-name" style={styles.input} placeholder="e.g., My Custom Peptide" placeholderTextColor={colors.textTertiary} value={cpName} onChangeText={setCpName} />

              <Text style={styles.fieldLabel}>Aliases (comma separated)</Text>
              <TextInput style={styles.input} placeholder="e.g., Alias 1, Alias 2" placeholderTextColor={colors.textTertiary} value={cpAliases} onChangeText={setCpAliases} />

              <Text style={styles.fieldLabel}>Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {GOAL_CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.formChip, cpCategories.includes(cat) && styles.formChipActive]}
                    onPress={() => setCpCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}>
                    <Text style={[styles.formChipText, cpCategories.includes(cat) && styles.formChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={[styles.input, styles.multiInput]} placeholder="What does this peptide do?" placeholderTextColor={colors.textTertiary} value={cpDesc} onChangeText={setCpDesc} multiline />

              <Text style={styles.fieldLabel}>Mechanism of Action</Text>
              <TextInput style={[styles.input, styles.multiInput]} placeholder="How does it work?" placeholderTextColor={colors.textTertiary} value={cpMechanism} onChangeText={setCpMechanism} multiline />

              <Text style={styles.fieldLabel}>Dosage — Low</Text>
              <TextInput style={styles.input} placeholder="e.g., 100-250 mcg/day" placeholderTextColor={colors.textTertiary} value={cpDoseLow} onChangeText={setCpDoseLow} />
              <Text style={styles.fieldLabel}>Dosage — Moderate</Text>
              <TextInput style={styles.input} placeholder="e.g., 250-500 mcg/day" placeholderTextColor={colors.textTertiary} value={cpDoseMod} onChangeText={setCpDoseMod} />
              <Text style={styles.fieldLabel}>Dosage — Higher</Text>
              <TextInput style={styles.input} placeholder="e.g., 500-1000 mcg/day" placeholderTextColor={colors.textTertiary} value={cpDoseHigh} onChangeText={setCpDoseHigh} />

              <Text style={styles.fieldLabel}>Frequency</Text>
              <TextInput style={styles.input} placeholder="e.g., Once daily, 2x/week" placeholderTextColor={colors.textTertiary} value={cpFrequency} onChangeText={setCpFrequency} />

              <Text style={styles.fieldLabel}>Cycle Length</Text>
              <TextInput style={styles.input} placeholder="e.g., 4-12 weeks" placeholderTextColor={colors.textTertiary} value={cpCycle} onChangeText={setCpCycle} />

              <Text style={styles.fieldLabel}>Administration Routes</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {ROUTE_OPTIONS.map(r => (
                  <TouchableOpacity key={r} style={[styles.formChip, cpRoutes.includes(r) && styles.formChipActive]}
                    onPress={() => setCpRoutes(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])}>
                    <Text style={[styles.formChipText, cpRoutes.includes(r) && styles.formChipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Common Side Effects (comma separated)</Text>
              <TextInput style={styles.input} placeholder="e.g., Nausea, Headache, Injection site redness" placeholderTextColor={colors.textTertiary} value={cpSideEffects} onChangeText={setCpSideEffects} />

              <Text style={styles.fieldLabel}>Contraindications (comma separated)</Text>
              <TextInput style={styles.input} placeholder="e.g., Pregnancy, Active cancer" placeholderTextColor={colors.textTertiary} value={cpContra} onChangeText={setCpContra} />

              <Text style={styles.fieldLabel}>Storage Instructions</Text>
              <TextInput style={styles.input} placeholder="e.g., Refrigerate at 2-8°C" placeholderTextColor={colors.textTertiary} value={cpStorage} onChangeText={setCpStorage} />

              <Text style={styles.sectionHeader}>Calculator Defaults</Text>

              <Text style={styles.fieldLabel}>Default Vial Size (mg)</Text>
              <TextInput style={styles.input} placeholder="e.g., 5" placeholderTextColor={colors.textTertiary} value={cpVialMg} onChangeText={setCpVialMg} keyboardType="numeric" />

              <Text style={styles.fieldLabel}>Default Dose (mcg)</Text>
              <TextInput style={styles.input} placeholder="e.g., 250" placeholderTextColor={colors.textTertiary} value={cpDoseMcg} onChangeText={setCpDoseMcg} keyboardType="numeric" />

              <Text style={styles.fieldLabel}>Default BAC Water (mL)</Text>
              <TextInput style={styles.input} placeholder="e.g., 2" placeholderTextColor={colors.textTertiary} value={cpBacWater} onChangeText={setCpBacWater} keyboardType="numeric" />

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAdd(null); resetPeptideForm(); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="save-custom-peptide" style={styles.saveBtn} onPress={savePeptide}>
                  <Text style={styles.saveBtnText}>Save Peptide</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Custom Medication Modal */}
      <Modal visible={showAdd === 'medication'} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Custom Medication</Text>
                <TouchableOpacity onPress={() => { setShowAdd(null); resetMedForm(); }}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Generic Name *</Text>
              <TextInput testID="custom-med-name" style={styles.input} placeholder="e.g., Amoxicillin" placeholderTextColor={colors.textTertiary} value={cmGeneric} onChangeText={setCmGeneric} />

              <Text style={styles.fieldLabel}>Brand Names (comma separated)</Text>
              <TextInput style={styles.input} placeholder="e.g., Amoxil, Trimox" placeholderTextColor={colors.textTertiary} value={cmBrands} onChangeText={setCmBrands} />

              <Text style={styles.fieldLabel}>Drug Class</Text>
              <TextInput style={styles.input} placeholder="e.g., Antibiotic (Penicillin)" placeholderTextColor={colors.textTertiary} value={cmClass} onChangeText={setCmClass} />

              <Text style={styles.fieldLabel}>Uses (comma separated)</Text>
              <TextInput style={[styles.input, styles.multiInput]} placeholder="e.g., Bacterial infections, Sinusitis" placeholderTextColor={colors.textTertiary} value={cmUses} onChangeText={setCmUses} multiline />

              <Text style={styles.fieldLabel}>Standard Dosage</Text>
              <TextInput style={[styles.input, styles.multiInput]} placeholder="e.g., 500 mg 3x/day for 7-10 days" placeholderTextColor={colors.textTertiary} value={cmDosage} onChangeText={setCmDosage} multiline />

              <Text style={styles.fieldLabel}>Side Effects (comma separated)</Text>
              <TextInput style={styles.input} placeholder="e.g., Nausea, Diarrhea, Rash" placeholderTextColor={colors.textTertiary} value={cmSideEffects} onChangeText={setCmSideEffects} />

              <Text style={styles.fieldLabel}>Contraindications (comma separated)</Text>
              <TextInput style={styles.input} placeholder="e.g., Penicillin allergy" placeholderTextColor={colors.textTertiary} value={cmContra} onChangeText={setCmContra} />

              <Text style={styles.fieldLabel}>Drug Interactions (comma separated)</Text>
              <TextInput style={styles.input} placeholder="e.g., Warfarin, Methotrexate" placeholderTextColor={colors.textTertiary} value={cmInteractions} onChangeText={setCmInteractions} />

              <Text style={styles.fieldLabel}>Timing / Food Instructions</Text>
              <TextInput style={[styles.input, styles.multiInput]} placeholder="e.g., Take with or without food" placeholderTextColor={colors.textTertiary} value={cmTiming} onChangeText={setCmTiming} multiline />

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAdd(null); resetMedForm(); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="save-custom-med" style={styles.saveBtn} onPress={saveMedication}>
                  <Text style={styles.saveBtnText}>Save Medication</Text>
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
  flex1: { flex: 1 },
  container: { flex: 1, padding: spacing.lg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.h1, color: colors.textPrimary },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6 },
  addBtnText: { ...typography.bodySm, color: colors.primaryForeground, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: spacing.md, height: 52, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, gap: 8 },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 16 },
  aiSearchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, marginBottom: spacing.md, gap: 8 },
  aiSearchBtnText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '700' },
  tabs: { flexDirection: 'row', marginBottom: spacing.md, gap: 8 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { ...typography.bodyBase, color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.primaryForeground },
  catRow: { marginBottom: spacing.md, flexGrow: 0, maxHeight: 44 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  catChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  catChipText: { ...typography.bodySm, color: colors.textSecondary },
  catChipTextActive: { color: colors.secondary, fontWeight: '700' },
  list: { paddingBottom: 120 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardName: { ...typography.h3, color: colors.textPrimary },
  customBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(76,201,240,0.2)' },
  customBadgeText: { ...typography.caption, color: colors.accent, fontSize: 9 },
  deleteBtn: { padding: 4 },
  brandText: { ...typography.bodySm, color: colors.textTertiary },
  cardTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(46,117,182,0.2)' },
  tagText: { ...typography.caption, color: colors.primary, fontSize: 10, textTransform: 'none' },
  cardDesc: { ...typography.bodySm, color: colors.textSecondary, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
  dosageInfo: { ...typography.bodySm, color: colors.accent },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { ...typography.bodyLg, color: colors.textTertiary, marginTop: spacing.md },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  modalContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  fieldLabel: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.xs, marginTop: spacing.md },
  sectionHeader: { ...typography.h3, color: colors.accent, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: { height: 48, backgroundColor: colors.secondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: 15 },
  multiInput: { height: 72, textAlignVertical: 'top', paddingTop: 12 },
  chipScroll: { flexGrow: 0, marginBottom: spacing.xs },
  formChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.secondary, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  formChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  formChipText: { ...typography.bodySm, color: colors.textSecondary },
  formChipTextActive: { color: colors.primaryForeground, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: spacing.xl },
  cancelBtn: { flex: 1, height: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { ...typography.bodyBase, color: colors.textSecondary },
  saveBtn: { flex: 1, height: 52, borderRadius: 26, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '700' },
  // AI Web Search Modal styles
  webSearchModal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', padding: spacing.lg },
  aiHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiHint: { ...typography.bodySm, color: colors.textTertiary, marginBottom: spacing.md },
  aiSearchInputRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  aiSearchInput: { flex: 1, height: 52, backgroundColor: colors.secondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: 16 },
  aiSubmitBtn: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  aiSubmitBtnDisabled: { opacity: 0.6 },
  aiResultsScroll: { flex: 1 },
  aiResultsContent: { paddingBottom: spacing.lg },
  aiLoadingBox: { alignItems: 'center', paddingVertical: spacing.xxl },
  aiLoadingText: { ...typography.bodyLg, color: colors.textPrimary, marginTop: spacing.md },
  aiLoadingSubtext: { ...typography.bodySm, color: colors.textTertiary, marginTop: spacing.xs },
  aiResultBox: { backgroundColor: colors.secondary, borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  aiResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  aiResultTitle: { ...typography.h3, color: colors.textPrimary },
  aiResultText: { ...typography.bodyBase, color: colors.textSecondary, lineHeight: 24 },
  aiDisclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  aiDisclaimerText: { ...typography.bodySm, color: colors.warning, flex: 1, lineHeight: 18 },
  aiEmptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  aiEmptyText: { ...typography.bodyLg, color: colors.textSecondary, marginTop: spacing.md },
  aiEmptySubtext: { ...typography.bodySm, color: colors.textTertiary, marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: spacing.lg },
  // Compare mode styles
  compareRow: { flexDirection: 'row', marginBottom: spacing.md, paddingHorizontal: spacing.sm },
  viewCompareBtn: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  viewCompareBtnText: { ...typography.bodySm, color: colors.primaryForeground, fontWeight: '700' },
  compareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent },
  compareBtnActive: { backgroundColor: colors.accent },
  compareBtnText: { ...typography.bodySm, color: colors.accent },
  compareBtnTextActive: { color: colors.primaryForeground },
  cardSelected: { borderColor: colors.accent, borderWidth: 2, backgroundColor: 'rgba(76,201,240,0.1)' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  // Compare modal styles
  compareModal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', padding: spacing.lg },
  compareContent: { flex: 1 },
  compareLabel: { ...typography.caption, color: colors.textTertiary, width: 90 },
  compareLabelFirst: { fontWeight: '700' },
  compareHeader: { ...typography.bodySm, color: colors.accent, fontWeight: '700', flex: 1, textAlign: 'center' },
  compareValue: { ...typography.bodySm, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  compareRowDesc: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  compareDesc: { ...typography.bodySm, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  closeCompareBtn: { backgroundColor: colors.primary, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  closeCompareBtnText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '700' },
});
