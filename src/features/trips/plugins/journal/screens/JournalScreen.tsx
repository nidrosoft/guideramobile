import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
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
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { JournalEntry, BlockType, LayoutType } from '../types/journal.types';
import CreateEntryBottomSheet from '../components/CreateEntryBottomSheet';

// Mock journal entries
const MOCK_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: '1',
    tripId: '1',
    title: 'Journal for Trip to Sakura City - Japan',
    date: new Date('2024-06-17'),
    layout: 'mixed' as any,
    blocks: [
      {
        id: 'b1',
        position: 0,
        size: 'large' as any,
        content: {
          type: BlockType.MAP,
          data: {
            latitude: 35.6762,
            longitude: 139.6503,
            locationName: 'Tokyo, Japan',
          },
        },
      },
      {
        id: 'b2',
        position: 1,
        size: 'small' as any,
        content: {
          type: BlockType.AUDIO,
          data: {
            uri: 'audio.mp3',
            duration: 84,
          },
        },
      },
      {
        id: 'b3',
        position: 2,
        size: 'small' as any,
        content: {
          type: BlockType.GALLERY,
          data: {
            images: [
              { uri: 'https://picsum.photos/200/200?random=1' },
              { uri: 'https://picsum.photos/200/200?random=2' },
            ],
          },
        },
      },
      {
        id: 'b4',
        position: 3,
        size: 'wide' as any,
        content: {
          type: BlockType.TEXT,
          data: {
            text: 'After a long flight, I finally arrived in Tokyo! Navigating the busy airport was surprisingly smooth, and the efficiency of Japanese transport systems lived up to the hype. My first stop was my hotel in Shibuya—just a short walk from the iconic Shibuya Crossing. Watching the organized chaos of people crossing was mesmerizing. I ended the eve...',
            wordCount: 450,
          },
        },
      },
    ],
    wordCount: 450,
    createdAt: new Date('2024-06-17'),
    updatedAt: new Date('2024-06-17'),
  },
  {
    id: '2',
    tripId: '1',
    title: 'Exploring the Streets of Shibuya',
    date: new Date('2024-06-18'),
    layout: 'grid' as any,
    blocks: [
      {
        id: 'b5',
        position: 0,
        size: 'large' as any,
        content: {
          type: BlockType.IMAGE,
          data: {
            uri: 'https://picsum.photos/400/300?random=3',
            caption: 'Shibuya Crossing at night',
          },
        },
      },
      {
        id: 'b6',
        position: 1,
        size: 'large' as any,
        content: {
          type: BlockType.TEXT,
          data: {
            text: 'The neon lights of Shibuya are absolutely breathtaking at night. Every corner tells a story...',
            wordCount: 320,
          },
        },
      },
    ],
    wordCount: 320,
    createdAt: new Date('2024-06-18'),
    updatedAt: new Date('2024-06-18'),
  },
];

export default function JournalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = params.tripId as string;
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));
  
  const [entries, setEntries] = useState<JournalEntry[]>(MOCK_JOURNAL_ENTRIES);
  const [createEntryVisible, setCreateEntryVisible] = useState(false);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Trip not found</Text>
      </SafeAreaView>
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

  const handleCreateEntry = (title: string, layout: LayoutType) => {
    // TODO: Navigate to entry editor
    console.log('Create entry:', title, layout);
    router.push(`/journal/${tripId}/editor?title=${encodeURIComponent(title)}&layout=${layout}`);
  };

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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.gray900} variant="Linear" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Journal</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setCreateEntryVisible(true)}
          >
            <Add size={24} color={colors.primary} variant="Bold" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.progressIconContainer}>
                <Book1 size={24} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressTitle}>Keep Your Memories Alive</Text>
                <Text style={styles.progressSubtitle}>
                  You have {totalEntries} journal {totalEntries === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formattedWords}</Text>
                <Text style={styles.statLabel}>words written</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalEntries}</Text>
                <Text style={styles.statLabel}>{totalEntries === 1 ? 'entry' : 'entries'}</Text>
              </View>
            </View>
          </View>

          {/* Journal Entries */}
          <View style={styles.entriesSection}>
            <Text style={styles.sectionTitle}>Your Journal Memo</Text>
            
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
                  style={styles.entryCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    // TODO: Navigate to entry detail
                    console.log('Open entry', entry.id);
                  }}
                >
                  {/* Entry Header */}
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{entry.title}</Text>
                    <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
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
                            <View style={styles.textBlock}>
                              <DocumentText size={24} color={colors.gray400} variant="Bold" />
                              <Text style={styles.textBlockPreview} numberOfLines={3}>
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
                        <DocumentText size={16} color="#3B82F6" variant="Bold" />
                        <Text style={styles.iconBadgeText}>{entry.wordCount} words</Text>
                      </View>
                      
                      {photoCount > 0 && (
                        <View style={styles.iconBadge}>
                          <Gallery size={16} color="#10B981" variant="Bold" />
                          <Text style={styles.iconBadgeText}>{photoCount} {photoCount === 1 ? 'photo' : 'photos'}</Text>
                        </View>
                      )}

                      {hasAudio && (
                        <View style={styles.iconBadge}>
                          <Microphone2 size={16} color="#8B5CF6" variant="Bold" />
                          <Text style={styles.iconBadgeText}>Audio</Text>
                        </View>
                      )}

                      {hasMap && (
                        <View style={styles.iconBadge}>
                          <Location size={16} color="#EF4444" variant="Bold" />
                          <Text style={styles.iconBadgeText}>Location</Text>
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
            style={styles.addEntryButton}
            onPress={() => setCreateEntryVisible(true)}
            activeOpacity={0.7}
          >
            <Add size={24} color={colors.primary} variant="Bold" />
            <Text style={styles.addEntryText}>Add New Entry</Text>
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
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
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
    color: colors.gray900,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  progressCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: `${colors.primary}15`,
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
    color: colors.gray900,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
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
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray200,
  },
  entriesSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  entryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  entryHeader: {
    padding: spacing.md,
  },
  entryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  entryDate: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  contentBlock: {
    backgroundColor: colors.gray100,
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
    color: colors.white,
    textAlign: 'center',
  },
  audioBlock: {
    flex: 1,
    backgroundColor: `${colors.primary}15`,
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
    backgroundColor: colors.white,
    padding: spacing.md,
    justifyContent: 'flex-start',
  },
  textBlockPreview: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
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
    color: colors.gray600,
  },
  addEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: `${colors.primary}30`,
    borderStyle: 'dashed',
  },
  addEntryText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
});
