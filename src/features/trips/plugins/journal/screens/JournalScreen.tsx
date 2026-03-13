import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Add,
  Book1,
  DocumentText,
  Gallery,
  Microphone2,
  Location,
} from 'iconsax-react-native';
import { spacing, typography, borderRadius, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { JournalEntry, BlockType, LayoutType } from '../types/journal.types';
import CreateEntryBottomSheet from '../components/CreateEntryBottomSheet';
import { journalService } from '@/services/journal.service';
import { useAuth } from '@/context/AuthContext';
import PluginEmptyState from '@/features/trips/components/PluginEmptyState';

export default function JournalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = params.tripId as string;
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [createEntryVisible, setCreateEntryVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const data = await journalService.getEntries(tripId);
        if (mounted) setEntries(data);
      } catch (err) {
        console.error('Failed to load journal entries:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchEntries();
    return () => { mounted = false; };
  }, [tripId]);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Trip not found</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalEntries = entries.length;
  const totalWords = entries.reduce((sum, entry) => sum + entry.wordCount, 0);
  const formattedWords = totalWords >= 1000 
    ? `${(totalWords / 1000).toFixed(1)}k` 
    : totalWords.toString();

  const getContentTypeIcons = (entry: JournalEntry) => {
    const types = new Set<BlockType>();
    entry.blocks.forEach(block => {
      if (block.content) {
        types.add(block.content.type);
      }
    });
    return Array.from(types);
  };

  const getContentTypeCount = (entry: JournalEntry, type: BlockType) => {
    return entry.blocks.filter(block => block.content?.type === type).length;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const handleCreateEntry = async (title: string, layout: LayoutType) => {
    try {
      const entry = await journalService.createEntry(tripId, profile?.id ?? '', {
        title,
        date: new Date().toISOString(),
        layout,
      });
      setEntries(prev => [entry, ...prev]);
      router.push(`/journal/${tripId}/editor?entryId=${entry.id}&title=${encodeURIComponent(title)}&layout=${layout}`);
    } catch (err) {
      console.error('Failed to create journal entry:', err);
      router.push(`/journal/${tripId}/editor?title=${encodeURIComponent(title)}&layout=${layout}`);
    }
  };

  if (entries.length === 0) {
    return (
      <>
        <PluginEmptyState
          headerTitle="Journal"
          icon={<Book1 size={36} color={colors.primary} variant="Bold" />}
          iconColor={colors.primary}
          title="Your Story Starts Here"
          subtitle="Capture your travel memories day by day — photos, voice notes, thoughts, and moments. Your trip story, beautifully preserved."
          ctaLabel="Add New Entry"
          onCtaPress={() => setCreateEntryVisible(true)}
          headerRight={
            <TouchableOpacity
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.primary}12`, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setCreateEntryVisible(true)}
            >
              <Add size={24} color={colors.primary} variant="Bold" />
            </TouchableOpacity>
          }
        />
        <CreateEntryBottomSheet
          visible={createEntryVisible}
          onClose={() => setCreateEntryVisible(false)}
          onCreate={handleCreateEntry}
        />
      </>
    );
  }

  const getPreviewImage = (entry: JournalEntry) => {
    const imageBlock = entry.blocks.find(
      block => block.content?.type === BlockType.IMAGE
    );
    if (imageBlock?.content?.type === BlockType.IMAGE) {
      return imageBlock.content.data.uri;
    }

    const galleryBlock = entry.blocks.find(
      block => block.content?.type === BlockType.GALLERY
    );
    if (galleryBlock?.content?.type === BlockType.GALLERY) {
      return galleryBlock.content.data.images[0]?.uri;
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgPrimary} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.textPrimary} variant="Linear" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Journal</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setCreateEntryVisible(true)}
          >
            <Add size={24} color={colors.primary} variant="Bold" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Card */}
          <View style={[styles.progressCard, { backgroundColor: colors.bgCard }]}>
            <View style={styles.progressHeader}>
              <View style={styles.progressIconContainer}>
                <Book1 size={24} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.progressTextContainer}>
                <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>Keep Your Memories Alive</Text>
                <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                  You have {totalEntries} journal {totalEntries === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{formattedWords}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>words written</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{totalEntries}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{totalEntries === 1 ? 'entry' : 'entries'}</Text>
              </View>
            </View>
          </View>

          {/* Journal Entries */}
          <View style={styles.entriesSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Journal Memo</Text>
            
            {entries.map(entry => {
              const previewImage = getPreviewImage(entry);
              const contentTypes = getContentTypeIcons(entry);
              const photoCount = getContentTypeCount(entry, BlockType.IMAGE) + 
                                getContentTypeCount(entry, BlockType.GALLERY);
              const hasAudio = contentTypes.includes(BlockType.AUDIO);
              const hasMap = contentTypes.includes(BlockType.MAP);

              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.entryCard, { backgroundColor: colors.bgCard }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push(`/journal/${tripId}/editor?entryId=${entry.id}&title=${encodeURIComponent(entry.title)}&layout=${entry.layout}`);
                  }}
                >
                  {/* Entry Header */}
                  <View style={styles.entryHeader}>
                    <Text style={[styles.entryTitle, { color: colors.textPrimary }]}>{entry.title}</Text>
                    <Text style={[styles.entryDate, { color: colors.textTertiary }]}>{formatDate(entry.date)}</Text>
                  </View>

                  {/* Content Grid - Show actual blocks */}
                  <View style={styles.contentGrid}>
                    {entry.blocks.slice(0, 4).map((block, index) => {
                      if (!block.content) return null;

                      return (
                        <View
                          key={block.id}
                          style={[
                            styles.contentBlock,
                            block.size === 'large' && styles.contentBlockLarge,
                            block.size === 'small' && styles.contentBlockSmall,
                            block.size === 'wide' && styles.contentBlockWide,
                          ]}
                        >
                          {/* Map Block */}
                          {block.content.type === BlockType.MAP && (
                            <View style={styles.mapBlock}>
                              <MapView
                                style={styles.mapView}
                                initialRegion={{
                                  latitude: block.content.data.latitude,
                                  longitude: block.content.data.longitude,
                                  latitudeDelta: 0.05,
                                  longitudeDelta: 0.05,
                                }}
                                scrollEnabled={false}
                                zoomEnabled={false}
                                pitchEnabled={false}
                                rotateEnabled={false}
                              >
                                <Marker
                                  coordinate={{
                                    latitude: block.content.data.latitude,
                                    longitude: block.content.data.longitude,
                                  }}
                                />
                              </MapView>
                            </View>
                          )}

                          {/* Audio Block */}
                          {block.content.type === BlockType.AUDIO && (
                            <View style={styles.audioBlock}>
                              <View style={styles.audioPlayButton}>
                                <Microphone2 size={24} color={colors.white} variant="Bold" />
                              </View>
                              <Text style={styles.audioDuration}>
                                {Math.floor(block.content.data.duration / 60)}:
                                {(block.content.data.duration % 60).toString().padStart(2, '0')}
                              </Text>
                            </View>
                          )}

                          {/* Image Block */}
                          {block.content.type === BlockType.IMAGE && (
                            <Image
                              source={{ uri: block.content.data.uri }}
                              style={styles.imageBlock}
                              resizeMode="cover"
                            />
                          )}

                          {/* Gallery Block */}
                          {block.content.type === BlockType.GALLERY && (
                            <View style={styles.galleryBlock}>
                              {block.content.data.images.slice(0, 2).map((img, idx) => (
                                <Image
                                  key={idx}
                                  source={{ uri: img.uri }}
                                  style={styles.galleryImage}
                                  resizeMode="cover"
                                />
                              ))}
                            </View>
                          )}

                          {/* Text Block */}
                          {block.content.type === BlockType.TEXT && (
                            <View style={[styles.textBlock, { backgroundColor: colors.bgCard }]}>
                              <DocumentText size={24} color={colors.textTertiary} variant="Bold" />
                              <Text style={[styles.textBlockPreview, { color: colors.textSecondary }]} numberOfLines={3}>
                                {block.content.data.text}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Entry Footer */}
                  <View style={styles.entryFooter}>
                    <View style={styles.contentIcons}>
                      <View style={styles.iconBadge}>
                        <DocumentText size={16} color={colors.info} variant="Bold" />
                        <Text style={[styles.iconBadgeText, { color: colors.textSecondary }]}>{entry.wordCount} words</Text>
                      </View>
                      
                      {photoCount > 0 && (
                        <View style={styles.iconBadge}>
                          <Gallery size={16} color={colors.success} variant="Bold" />
                          <Text style={[styles.iconBadgeText, { color: colors.textSecondary }]}>{photoCount} {photoCount === 1 ? 'photo' : 'photos'}</Text>
                        </View>
                      )}

                      {hasAudio && (
                        <View style={styles.iconBadge}>
                          <Microphone2 size={16} color={colors.purple} variant="Bold" />
                          <Text style={[styles.iconBadgeText, { color: colors.textSecondary }]}>Audio</Text>
                        </View>
                      )}

                      {hasMap && (
                        <View style={styles.iconBadge}>
                          <Location size={16} color={colors.error} variant="Bold" />
                          <Text style={[styles.iconBadgeText, { color: colors.textSecondary }]}>Location</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add Entry Button */}
          <TouchableOpacity
            style={[styles.addEntryButton, { backgroundColor: colors.bgCard, borderColor: colors.primaryBorderSubtle }]}
            onPress={() => setCreateEntryVisible(true)}
            activeOpacity={0.7}
          >
            <Add size={24} color={colors.primary} variant="Bold" />
            <Text style={[styles.addEntryText, { color: colors.primary }]}>Add New Entry</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Create Entry Bottom Sheet */}
        <CreateEntryBottomSheet
          visible={createEntryVisible}
          onClose={() => setCreateEntryVisible(false)}
          onCreate={handleCreateEntry}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(63, 195, 158, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  progressCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(63, 195, 158, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  progressTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  entriesSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  entryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  entryHeader: {
    padding: spacing.md,
  },
  entryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  entryDate: {
    fontSize: typography.fontSize.sm,
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  contentBlock: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  contentBlockLarge: {
    flex: 1,
    minWidth: '48%',
    height: 140,
  },
  contentBlockSmall: {
    width: '48%',
    height: 140,
  },
  contentBlockWide: {
    width: '100%',
    height: 100,
  },
  mapBlock: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  blockLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  audioBlock: {
    flex: 1,
    backgroundColor: 'rgba(63, 195, 158, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  audioPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  audioDuration: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  imageBlock: {
    width: '100%',
    height: '100%',
  },
  galleryBlock: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  galleryImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  textBlock: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'flex-start',
  },
  textBlockPreview: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  entryFooter: {
    padding: spacing.md,
  },
  contentIcons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBadgeText: {
    fontSize: typography.fontSize.xs,
  },
  addEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addEntryText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
