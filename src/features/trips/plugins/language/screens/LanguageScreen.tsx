/**
 * LANGUAGE PLUGIN — MAIN SCREEN
 *
 * Displays AI-generated Language Survival Kit as a searchable,
 * filterable card deck organized by phrase categories.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  SearchNormal1,
  Star1,
  CloseCircle,
  LanguageSquare,
  Global,
} from 'iconsax-react-native';
import { spacing, typography, colors, borderRadius } from '@/styles';
import PluginEmptyState from '@/features/trips/components/PluginEmptyState';
import { useTheme } from '@/context/ThemeContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { languageService } from '@/services/language.service';
import {
  LanguageKit,
  LanguagePhrase,
  PhraseCategory,
  CATEGORY_TABS,
} from '../types/language.types';

// ─── Helpers ────────────────────────────────────────────

function penetrationColor(level: string, tc: any) {
  if (level === 'high') return tc.success;
  if (level === 'medium') return tc.warning;
  if (level === 'low') return tc.orange || '#F97316';
  return tc.error;
}

function priorityColor(priority: string, tc: any) {
  if (priority === 'critical') return tc.error;
  if (priority === 'high') return tc.warning;
  return tc.textTertiary;
}

// ─── Phrase Card ─────────────────────────────────────────

function PhraseCard({ phrase, themeColors, isDark, onToggleFav }: {
  phrase: LanguagePhrase; themeColors: any; isDark: boolean; onToggleFav: (id: string, v: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tc = themeColors;
  const isCritical = phrase.priority === 'critical';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => setExpanded(!expanded)}
      style={[s.card, {
        backgroundColor: tc.bgCard,
        borderColor: isCritical ? `${tc.error}35` : tc.borderSubtle,
      }]}
    >
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[s.cardEnglish, { color: tc.textPrimary }]}>{phrase.english}</Text>
          {phrase.showNativeInCard && phrase.native ? (
            <Text style={[s.cardNative, { color: tc.primary }]}>{phrase.native}</Text>
          ) : null}
          <Text style={[s.cardPhonetic, { color: tc.textSecondary }]}>{phrase.phonetic}</Text>
        </View>
        <TouchableOpacity onPress={() => onToggleFav(phrase.id, !phrase.isFavorited)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Star1 size={20} color={phrase.isFavorited ? '#F59E0B' : tc.textTertiary} variant={phrase.isFavorited ? 'Bold' : 'Linear'} />
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={[s.cardExpanded, { borderTopColor: tc.borderSubtle }]}>
          {phrase.native && !phrase.showNativeInCard ? (
            <View style={s.detailRow}>
              <Text style={[s.detailLabel, { color: tc.textTertiary }]}>Native</Text>
              <Text style={[s.detailValue, { color: tc.textPrimary }]}>{phrase.native}</Text>
            </View>
          ) : null}
          {phrase.romanized ? (
            <View style={s.detailRow}>
              <Text style={[s.detailLabel, { color: tc.textTertiary }]}>Romanized</Text>
              <Text style={[s.detailValue, { color: tc.textPrimary }]}>{phrase.romanized}</Text>
            </View>
          ) : null}
          {phrase.pronunciationNotes ? (
            <View style={s.detailRow}>
              <Text style={[s.detailLabel, { color: tc.textTertiary }]}>Pronunciation</Text>
              <Text style={[s.detailValue, { color: tc.textSecondary }]}>{phrase.pronunciationNotes}</Text>
            </View>
          ) : null}
          {phrase.toneMarks ? (
            <View style={s.detailRow}>
              <Text style={[s.detailLabel, { color: tc.textTertiary }]}>Tones</Text>
              <Text style={[s.detailValue, { color: tc.textSecondary }]}>{phrase.toneMarks}</Text>
            </View>
          ) : null}
          {phrase.genderVariant ? (
            <View style={s.detailRow}>
              <Text style={[s.detailLabel, { color: tc.textTertiary }]}>Gender</Text>
              <Text style={[s.detailValue, { color: tc.textSecondary }]}>
                ♂ {phrase.genderVariant.male}{'\n'}♀ {phrase.genderVariant.female}
              </Text>
            </View>
          ) : null}
          {phrase.contextNote ? (
            <View style={[s.contextBox, { backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB' }]}>
              <Text style={[s.contextText, { color: tc.textSecondary }]}>{phrase.contextNote}</Text>
            </View>
          ) : null}
          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: `${priorityColor(phrase.priority, tc)}15` }]}>
              <Text style={[s.badgeText, { color: priorityColor(phrase.priority, tc) }]}>{phrase.priority}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: `${tc.primary}15` }]}>
              <Text style={[s.badgeText, { color: tc.primary }]}>{phrase.formality}</Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Empty State ─────────────────────────────────────
// TODO: [PREMIUM] Empty state will show upgrade CTA once paywall is implemented
function EmptyState({ icon, title, subtitle, tc, ctaLabel, onCtaPress }: { icon: React.ReactNode; title: string; subtitle: string; tc: any; ctaLabel?: string; onCtaPress?: () => void }) {
  return (
    <View style={s.emptyContainer}>
      {icon}
      <Text style={[s.emptyTitle, { color: tc.textPrimary }]}>{title}</Text>
      <Text style={[s.emptySubtitle, { color: tc.textSecondary }]}>{subtitle}</Text>
      {ctaLabel && onCtaPress && (
        <TouchableOpacity style={[s.emptyCta, { backgroundColor: tc.primary }]} onPress={onCtaPress}>
          <Text style={s.emptyCtaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────

export default function LanguageScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { colors: tc, isDark } = useTheme();
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));

  const [kit, setKit] = useState<LanguageKit | null>(null);
  const [kits, setKits] = useState<LanguageKit[]>([]);
  const [phrases, setPhrases] = useState<LanguagePhrase[]>([]);
  const [activeCategory, setActiveCategory] = useState<PhraseCategory | 'favorites'>('emergency');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!tripId) return;
    try {
      setLoading(true);
      const allKits = await languageService.getKits(tripId);
      setKits(allKits);
      if (allKits.length > 0) {
        const activeKit = allKits[0];
        setKit(activeKit);
        const allPhrases = await languageService.getPhrases(activeKit.id);
        setPhrases(allPhrases);
      }
    } catch (err) {
      console.error('Failed to load language data:', err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleFav = useCallback(async (phraseId: string, isFav: boolean) => {
    setPhrases(prev => prev.map(p => p.id === phraseId ? { ...p, isFavorited: isFav } : p));
    try { await languageService.toggleFavorite(phraseId, isFav); } catch {}
  }, []);

  const handleSwitchKit = useCallback(async (newKit: LanguageKit) => {
    setKit(newKit);
    setLoading(true);
    try {
      const allPhrases = await languageService.getPhrases(newKit.id);
      setPhrases(allPhrases);
    } catch {} finally { setLoading(false); }
  }, []);

  const filteredPhrases = useMemo(() => {
    let result = phrases;
    if (activeCategory === 'favorites') {
      result = result.filter(p => p.isFavorited);
    } else {
      result = result.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.english.toLowerCase().includes(q) ||
        (p.native?.toLowerCase().includes(q)) ||
        (p.phonetic?.toLowerCase().includes(q))
      );
    }
    return result;
  }, [phrases, activeCategory, searchQuery]);

  const availableCategories = useMemo(() => {
    const cats = new Set(phrases.map(p => p.category));
    return CATEGORY_TABS.filter(t => cats.has(t.id));
  }, [phrases]);

  const hasFavorites = useMemo(() => phrases.some(p => p.isFavorited), [phrases]);

  // ─── Loading / Trip not found ─────────────────────────
  if (loading && !kit) {
    return (
      <SafeAreaView style={[s.safeArea, { backgroundColor: tc.bgPrimary }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={tc.primary} />
          <Text style={[s.loadingText, { color: tc.textSecondary }]}>Loading language kit...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={[s.safeArea, { backgroundColor: tc.bgPrimary }]}>
        <View style={s.loadingContainer}>
          <Text style={[s.loadingText, { color: tc.textSecondary }]}>Trip not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const destCity = trip.destination?.city || trip.title || 'Destination';

  if (!kit) {
    return (
      <PluginEmptyState
        headerTitle="Language Kit"
        icon={<LanguageSquare size={36} color={tc.info} variant="Bold" />}
        iconColor={tc.info}
        title="Lost in Translation? Us Too."
        subtitle={`Your phrase kit for ${destCity} hasn't been created yet. Tap "Generate Smart Plan" on your trip card and we'll generate 120+ survival phrases for your destination.`}
        ctaLabel="Go to Trip Card"
      />
    );
  }

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: tc.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: tc.bgPrimary, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: tc.textPrimary }]}>Language Kit</Text>
        <View style={[s.penetrationBadge, { backgroundColor: `${penetrationColor(kit.englishPenetration, tc)}15` }]}>
          <Text style={[s.penetrationText, { color: penetrationColor(kit.englishPenetration, tc) }]}>
            {kit.englishPenetration}
          </Text>
        </View>
      </View>

        <FlatList
          data={filteredPhrases}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PhraseCard phrase={item} themeColors={tc} isDark={isDark} onToggleFav={handleToggleFav} />
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2 }}
          ListHeaderComponent={
            <View style={{ marginHorizontal: -spacing.lg }}>
              {/* Multi-language switcher */}
              {kits.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.kitSwitcher} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
                  {kits.map(k => (
                    <TouchableOpacity
                      key={k.id}
                      style={[s.kitTab, { backgroundColor: k.id === kit.id ? tc.primary : 'transparent', borderColor: k.id === kit.id ? tc.primary : tc.borderSubtle }]}
                      onPress={() => handleSwitchKit(k)}
                    >
                      <Text style={[s.kitTabText, { color: k.id === kit.id ? '#FFF' : tc.textSecondary }]}>
                        {k.language}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Language context banner */}
              {kit.languageContext?.gender_note ? (
                <View style={[s.contextBanner, { backgroundColor: isDark ? '#1A2332' : '#EFF6FF', borderColor: `${tc.primary}30` }]}>
                  <Global size={16} color={tc.primary} />
                  <Text style={[s.contextBannerText, { color: tc.textSecondary }]} numberOfLines={2}>
                    {kit.languageContext.gender_note.split('\n')[0]}
                  </Text>
                </View>
              ) : null}

              {/* Search */}
              <View style={[s.searchContainer, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
                <SearchNormal1 size={18} color={tc.textTertiary} />
                <TextInput
                  style={[s.searchInput, { color: tc.textPrimary }]}
                  placeholder="Search phrases..."
                  placeholderTextColor={tc.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <CloseCircle size={18} color={tc.textTertiary} variant="Bold" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabScrollContent}>
                {hasFavorites && (
                  <TouchableOpacity
                    style={[s.catTab, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }, activeCategory === 'favorites' && { backgroundColor: tc.textPrimary, borderColor: tc.textPrimary }]}
                    onPress={() => setActiveCategory('favorites')}
                  >
                    <Text style={s.catTabIcon}>⭐</Text>
                    <Text style={[s.catTabText, { color: tc.textSecondary }, activeCategory === 'favorites' && { color: tc.bgPrimary }]}>Saved</Text>
                  </TouchableOpacity>
                )}
                {availableCategories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[s.catTab, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }, activeCategory === cat.id && { backgroundColor: tc.textPrimary, borderColor: tc.textPrimary }]}
                    onPress={() => setActiveCategory(cat.id)}
                  >
                    <Text style={s.catTabIcon}>{cat.icon}</Text>
                    <Text style={[s.catTabText, { color: tc.textSecondary }, activeCategory === cat.id && { color: tc.bgPrimary }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Emergency numbers block */}
              {activeCategory === 'emergency' && kit.emergencyNumbers && Object.keys(kit.emergencyNumbers).length > 0 && (
                <View style={[s.emergencyBlock, { backgroundColor: `${tc.error}10`, borderColor: `${tc.error}30` }]}>
                  <Text style={[s.emergencyTitle, { color: tc.error }]}>Emergency Numbers</Text>
                  <View style={s.emergencyGrid}>
                    {Object.entries(kit.emergencyNumbers).filter(([, v]) => v).map(([key, val]) => (
                      <View key={key} style={s.emergencyItem}>
                        <Text style={[s.emergencyLabel, { color: tc.textSecondary }]}>{key.replace(/_/g, ' ')}</Text>
                        <Text style={[s.emergencyNumber, { color: tc.error }]}>{val as string}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <SearchNormal1 size={40} color={tc.textTertiary} />
              <Text style={[s.emptyTitle, { color: tc.textPrimary }]}>{searchQuery ? 'No matches' : 'No phrases in this category'}</Text>
              <Text style={[s.emptySubtitle, { color: tc.textSecondary }]}>{searchQuery ? 'Try a different search term' : 'Phrases will appear once the kit is generated.'}</Text>
            </View>
          }
        />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { fontSize: typography.fontSize.base },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  headerPlaceholder: { width: 40 },
  penetrationBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  penetrationText: { fontSize: typography.fontSize.xs, fontWeight: '600', textTransform: 'capitalize' },

  // Kit switcher
  kitSwitcher: { maxHeight: 44, marginTop: spacing.sm },
  kitTab: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 8 },
  kitTabText: { fontSize: typography.fontSize.sm, fontWeight: '600' },

  // Context banner
  contextBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: spacing.lg, marginTop: spacing.sm, padding: spacing.sm, borderRadius: 12, borderWidth: 1 },
  contextBannerText: { flex: 1, fontSize: typography.fontSize.xs, lineHeight: 16 },

  // Search
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: typography.fontSize.base, padding: 0 },

  // Category tabs
  tabScroll: { marginTop: spacing.sm, marginBottom: spacing.xs },
  tabScrollContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  catTab: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1 },
  catTabIcon: { fontSize: 16 },
  catTabText: { fontSize: typography.fontSize.sm, fontWeight: '600' },

  // Emergency block
  emergencyBlock: { marginHorizontal: spacing.lg, marginTop: spacing.sm, padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  emergencyTitle: { fontSize: typography.fontSize.sm, fontWeight: '700', marginBottom: spacing.sm },
  emergencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  emergencyItem: { minWidth: 80 },
  emergencyLabel: { fontSize: typography.fontSize.xs, textTransform: 'capitalize' },
  emergencyNumber: { fontSize: typography.fontSize.lg, fontWeight: '700' },

  // Phrase card
  card: { padding: spacing.md, borderRadius: 12, borderWidth: 1, marginTop: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardEnglish: { fontSize: typography.fontSize.base, fontWeight: '600', marginBottom: 2 },
  cardNative: { fontSize: typography.fontSize.lg, fontWeight: '500', marginBottom: 2 },
  cardPhonetic: { fontSize: typography.fontSize.sm, fontStyle: 'italic' },
  cardExpanded: { borderTopWidth: 1, marginTop: spacing.sm, paddingTop: spacing.sm },
  detailRow: { flexDirection: 'row', marginBottom: 6 },
  detailLabel: { width: 90, fontSize: typography.fontSize.xs, fontWeight: '600' },
  detailValue: { flex: 1, fontSize: typography.fontSize.sm },
  contextBox: { padding: spacing.sm, borderRadius: 8, marginTop: 4, marginBottom: 4 },
  contextText: { fontSize: typography.fontSize.sm, lineHeight: 18 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: typography.fontSize.xs, fontWeight: '600', textTransform: 'capitalize' },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl * 2, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  emptySubtitle: { fontSize: typography.fontSize.sm, textAlign: 'center', marginTop: spacing.xs, lineHeight: 20 },
  emptyCta: { marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm + 2, borderRadius: 20 },
  emptyCtaText: { color: '#FFFFFF', fontSize: typography.fontSize.sm, fontWeight: '700' },
});
