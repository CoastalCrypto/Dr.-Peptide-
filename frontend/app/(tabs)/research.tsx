import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../src/theme';
import { peptides, GOAL_CATEGORIES } from '../../src/data/peptides';
import { medications } from '../../src/data/medications';

type Tab = 'peptides' | 'medications';

export default function ResearchScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('peptides');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredPeptides = peptides.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.aliases.some(a => a.toLowerCase().includes(search.toLowerCase())) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || p.categories.includes(activeCategory);
    return matchSearch && matchCat;
  });

  const filteredMeds = medications.filter(m => {
    const s = search.toLowerCase();
    return !search || m.genericName.toLowerCase().includes(s) ||
      m.brandNames.some(b => b.toLowerCase().includes(s)) ||
      m.drugClass.toLowerCase().includes(s);
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Research</Text>

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
            renderItem={({ item }) => (
              <TouchableOpacity testID={`peptide-${item.id}`} style={styles.card} onPress={() => router.push(`/peptide/${item.id}`)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
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
            )}
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
                  <View>
                    <Text style={styles.cardName}>{item.genericName}</Text>
                    <Text style={styles.brandText}>{item.brandNames.join(', ')}</Text>
                  </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: spacing.md, height: 52, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, gap: 8 },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 16 },
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
  cardName: { ...typography.h3, color: colors.textPrimary },
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
});
