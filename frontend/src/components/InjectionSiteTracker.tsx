import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { typography, spacing } from '../../src/theme';
import { Storage, KEYS } from '../../src/utils/storage';

interface InjectionSite {
  id: string;
  name: string;
  location: 'left' | 'right' | 'center';
  area: string;
}

interface InjectionLog {
  id: string;
  siteId: string;
  date: string;
  itemName?: string;
  notes?: string;
}

const INJECTION_SITES: InjectionSite[] = [
  { id: 'abdomen_left', name: 'Abdomen Left', location: 'left', area: 'abdomen' },
  { id: 'abdomen_right', name: 'Abdomen Right', location: 'right', area: 'abdomen' },
  { id: 'thigh_left_outer', name: 'Left Outer Thigh', location: 'left', area: 'thigh' },
  { id: 'thigh_right_outer', name: 'Right Outer Thigh', location: 'right', area: 'thigh' },
  { id: 'thigh_left_front', name: 'Left Front Thigh', location: 'left', area: 'thigh' },
  { id: 'thigh_right_front', name: 'Right Front Thigh', location: 'right', area: 'thigh' },
  { id: 'arm_left', name: 'Left Upper Arm', location: 'left', area: 'arm' },
  { id: 'arm_right', name: 'Right Upper Arm', location: 'right', area: 'arm' },
  { id: 'glute_left', name: 'Left Glute', location: 'left', area: 'glute' },
  { id: 'glute_right', name: 'Right Glute', location: 'right', area: 'glute' },
];

const REST_DAYS = 3; // Days to wait before reusing a site

export function InjectionSiteTracker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const [logs, setLogs] = useState<InjectionLog[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    Storage.get<InjectionLog[]>(KEYS.INJECTION_SITES).then(l => setLogs(l || []));
  }, []));

  const getSiteStatus = (siteId: string): 'available' | 'recent' | 'resting' => {
    const siteLogs = logs.filter(l => l.siteId === siteId);
    if (siteLogs.length === 0) return 'available';
    
    const lastLog = siteLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const daysSince = Math.floor((Date.now() - new Date(lastLog.date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince < 1) return 'recent';
    if (daysSince < REST_DAYS) return 'resting';
    return 'available';
  };

  const getRecommendedSite = (): InjectionSite | null => {
    // Find sites that are available (not used in REST_DAYS)
    const availableSites = INJECTION_SITES.filter(site => getSiteStatus(site.id) === 'available');
    
    if (availableSites.length === 0) {
      // If no available sites, find the one with oldest last use
      const sitesWithLogs = INJECTION_SITES.map(site => {
        const siteLogs = logs.filter(l => l.siteId === site.id);
        const lastUse = siteLogs.length > 0 
          ? Math.max(...siteLogs.map(l => new Date(l.date).getTime()))
          : 0;
        return { site, lastUse };
      });
      sitesWithLogs.sort((a, b) => a.lastUse - b.lastUse);
      return sitesWithLogs[0]?.site || null;
    }
    
    // Prefer alternating left/right
    const lastLog = logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const lastSite = lastLog ? INJECTION_SITES.find(s => s.id === lastLog.siteId) : null;
    
    if (lastSite) {
      const oppositeLocation = lastSite.location === 'left' ? 'right' : 'left';
      const oppositeSites = availableSites.filter(s => s.location === oppositeLocation);
      if (oppositeSites.length > 0) {
        return oppositeSites[0];
      }
    }
    
    return availableSites[0];
  };

  const logInjection = async (siteId: string) => {
    const newLog: InjectionLog = {
      id: `inj_${Date.now()}`,
      siteId,
      date: new Date().toISOString(),
    };
    const updated = [newLog, ...logs];
    await Storage.set(KEYS.INJECTION_SITES, updated);
    setLogs(updated);
    setSelectedSite(null);
    Alert.alert('Logged', `Injection site logged: ${INJECTION_SITES.find(s => s.id === siteId)?.name}`);
  };

  const getStatusColor = (status: 'available' | 'recent' | 'resting') => {
    switch (status) {
      case 'available': return colors.success;
      case 'recent': return colors.error;
      case 'resting': return colors.warning;
    }
  };

  const recommended = getRecommendedSite();
  const styles = createStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Injection Site Tracker</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {recommended && (
            <View style={styles.recommendedCard}>
              <View style={styles.recommendedIcon}>
                <MaterialCommunityIcons name="star" size={24} color={colors.primaryForeground} />
              </View>
              <View style={styles.recommendedInfo}>
                <Text style={styles.recommendedLabel}>Recommended Next Site</Text>
                <Text style={styles.recommendedName}>{recommended.name}</Text>
              </View>
              <TouchableOpacity 
                testID="use-recommended-btn"
                style={styles.useBtn} 
                onPress={() => logInjection(recommended.id)}
              >
                <Text style={styles.useBtnText}>Use</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionLabel}>All Sites</Text>
          <ScrollView style={styles.sitesList} contentContainerStyle={styles.sitesContent}>
            {INJECTION_SITES.map(site => {
              const status = getSiteStatus(site.id);
              const siteLogs = logs.filter(l => l.siteId === site.id);
              const lastLog = siteLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
              
              return (
                <TouchableOpacity 
                  key={site.id}
                  testID={`site-${site.id}`}
                  style={styles.siteCard}
                  onPress={() => status === 'available' ? logInjection(site.id) : Alert.alert('Site Resting', 'This site needs more rest time before reuse.')}
                >
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                  <View style={styles.siteInfo}>
                    <Text style={styles.siteName}>{site.name}</Text>
                    <Text style={styles.siteArea}>{site.area.charAt(0).toUpperCase() + site.area.slice(1)}</Text>
                  </View>
                  <View style={styles.siteStatus}>
                    {lastLog ? (
                      <Text style={styles.lastUsed}>
                        Last: {new Date(lastLog.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    ) : (
                      <Text style={styles.neverUsed}>Never used</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.legendText}>Resting</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <Text style={styles.legendText}>Recent</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.textPrimary },
  recommendedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, borderRadius: 16, padding: spacing.md, marginBottom: spacing.lg },
  recommendedIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  recommendedInfo: { flex: 1, marginLeft: 12 },
  recommendedLabel: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  recommendedName: { ...typography.h3, color: colors.primaryForeground },
  useBtn: { backgroundColor: colors.primaryForeground, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  useBtnText: { ...typography.bodySm, color: colors.accent, fontWeight: '700' },
  sectionLabel: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.sm },
  sitesList: { flex: 1 },
  sitesContent: { paddingBottom: spacing.md },
  siteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.secondary, borderRadius: 12, padding: spacing.md, marginBottom: 8 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  siteInfo: { flex: 1 },
  siteName: { ...typography.bodyBase, color: colors.textPrimary },
  siteArea: { ...typography.caption, color: colors.textTertiary },
  siteStatus: {},
  lastUsed: { ...typography.bodySm, color: colors.textSecondary },
  neverUsed: { ...typography.bodySm, color: colors.success },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...typography.caption, color: colors.textTertiary },
});

export default InjectionSiteTracker;
