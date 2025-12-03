import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import {
  ArrowLeft,
  Add,
  DocumentText,
  Gallery,
  Microphone2,
  Location as LocationIcon,
  Trash,
} from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { BlockType, BlockSize, ContentBlock, LayoutType } from '../types/journal.types';
import { useToast } from '@/contexts/ToastContext';
import * as Haptics from 'expo-haptics';

// Layout templates
const LAYOUT_TEMPLATES: Record<LayoutType, { size: BlockSize; position: number }[]> = {
  [LayoutType.MIXED]: [
    { size: BlockSize.LARGE, position: 0 },
    { size: BlockSize.SMALL, position: 1 },
    { size: BlockSize.SMALL, position: 2 },
    { size: BlockSize.WIDE, position: 3 },
  ],
  [LayoutType.GRID]: [
    { size: BlockSize.LARGE, position: 0 },
    { size: BlockSize.LARGE, position: 1 },
    { size: BlockSize.WIDE, position: 2 },
  ],
  [LayoutType.HERO]: [
    { size: BlockSize.HERO, position: 0 },
  ],
};

export default function EntryEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showSuccess } = useToast();
  
  const tripId = params.tripId as string;
  const title = params.title as string || 'Untitled Entry';
  const layout = (params.layout as LayoutType) || LayoutType.MIXED;

  // Initialize blocks based on layout
  const initialBlocks: ContentBlock[] = LAYOUT_TEMPLATES[layout].map((template, index) => ({
    id: `block-${index}`,
    position: template.position,
    size: template.size,
    content: null,
  }));

  const [entryTitle, setEntryTitle] = useState(title);
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [addContentVisible, setAddContentVisible] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const handleAddContent = (blockId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBlockId(blockId);
    setAddContentVisible(true);
  };

  const handleAddText = () => {
    if (!selectedBlockId) return;
    
    setBlocks(blocks.map(block =>
      block.id === selectedBlockId
        ? {
            ...block,
            content: {
              type: BlockType.TEXT,
              data: { text: '', wordCount: 0 },
            },
          }
        : block
    ));
    setAddContentVisible(false);
  };

  const handleAddImage = () => {
    if (!selectedBlockId) return;
    
    // Mock image - in real app, use image picker
    setBlocks(blocks.map(block =>
      block.id === selectedBlockId
        ? {
            ...block,
            content: {
              type: BlockType.IMAGE,
              data: { uri: 'https://picsum.photos/400/300?random=' + Date.now() },
            },
          }
        : block
    ));
    setAddContentVisible(false);
  };

  const handleAddGallery = () => {
    if (!selectedBlockId) return;
    
    // Mock gallery - in real app, use image picker
    setBlocks(blocks.map(block =>
      block.id === selectedBlockId
        ? {
            ...block,
            content: {
              type: BlockType.GALLERY,
              data: {
                images: [
                  { uri: 'https://picsum.photos/200/200?random=' + Date.now() },
                  { uri: 'https://picsum.photos/200/200?random=' + (Date.now() + 1) },
                ],
              },
            },
          }
        : block
    ));
    setAddContentVisible(false);
  };

  const handleAddMap = () => {
    if (!selectedBlockId) return;
    
    // Mock location - in real app, use location picker
    setBlocks(blocks.map(block =>
      block.id === selectedBlockId
        ? {
            ...block,
            content: {
              type: BlockType.MAP,
              data: {
                latitude: 35.6762,
                longitude: 139.6503,
                locationName: 'Tokyo, Japan',
              },
            },
          }
        : block
    ));
    setAddContentVisible(false);
  };

  const handleAddAudio = () => {
    if (!selectedBlockId) return;
    
    // Mock audio - in real app, use audio recorder
    setBlocks(blocks.map(block =>
      block.id === selectedBlockId
        ? {
            ...block,
            content: {
              type: BlockType.AUDIO,
              data: { uri: 'audio.mp3', duration: 84 },
            },
          }
        : block
    ));
    setAddContentVisible(false);
  };

  const handleRemoveContent = (blockId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBlocks(blocks.map(block =>
      block.id === blockId ? { ...block, content: null } : block
    ));
  };

  const handleUpdateText = (blockId: string, text: string) => {
    setBlocks(blocks.map(block =>
      block.id === blockId && block.content?.type === BlockType.TEXT
        ? {
            ...block,
            content: {
              type: BlockType.TEXT,
              data: {
                text,
                wordCount: text.trim().split(/\s+/).filter(w => w.length > 0).length,
              },
            },
          }
        : block
    ));
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess('Journal entry saved!');
    router.back();
  };

  const getBlockStyle = (size: BlockSize) => {
    switch (size) {
      case BlockSize.LARGE:
        return styles.blockLarge;
      case BlockSize.SMALL:
        return styles.blockSmall;
      case BlockSize.WIDE:
        return styles.blockWide;
      case BlockSize.HERO:
        return styles.blockHero;
      default:
        return styles.blockLarge;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.gray900} variant="Linear" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Entry</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.titleSection}>
            <TextInput
              style={styles.titleInput}
              placeholder="Entry title..."
              placeholderTextColor={colors.gray400}
              value={entryTitle}
              onChangeText={setEntryTitle}
            />
          </View>

          {/* Content Blocks */}
          <View style={styles.blocksGrid}>
            {blocks.map(block => (
              <View key={block.id} style={[styles.block, getBlockStyle(block.size)]}>
                {!block.content ? (
                  // Empty block - show add button
                  <TouchableOpacity
                    style={styles.emptyBlock}
                    onPress={() => handleAddContent(block.id)}
                    activeOpacity={0.7}
                  >
                    <Add size={32} color={colors.primary} variant="Bold" />
                    <Text style={styles.emptyBlockText}>Add Content</Text>
                  </TouchableOpacity>
                ) : (
                  // Filled block - show content
                  <View style={styles.filledBlock}>
                    {/* Remove button */}
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveContent(block.id)}
                    >
                      <Trash size={20} color={colors.white} variant="Bold" />
                    </TouchableOpacity>

                    {/* Text Block */}
                    {block.content.type === BlockType.TEXT && (
                      <TextInput
                        style={styles.textBlockInput}
                        placeholder="Write your thoughts..."
                        placeholderTextColor={colors.gray400}
                        value={block.content.data.text}
                        onChangeText={(text) => handleUpdateText(block.id, text)}
                        multiline
                        textAlignVertical="top"
                      />
                    )}

                    {/* Image Block */}
                    {block.content.type === BlockType.IMAGE && (
                      <Image
                        source={{ uri: block.content.data.uri }}
                        style={styles.imageContent}
                        resizeMode="cover"
                      />
                    )}

                    {/* Gallery Block */}
                    {block.content.type === BlockType.GALLERY && (
                      <View style={styles.galleryContent}>
                        {block.content.data.images.map((img, idx) => (
                          <Image
                            key={idx}
                            source={{ uri: img.uri }}
                            style={styles.galleryImage}
                            resizeMode="cover"
                          />
                        ))}
                      </View>
                    )}

                    {/* Map Block */}
                    {block.content.type === BlockType.MAP && (
                      <MapView
                        style={styles.mapContent}
                        initialRegion={{
                          latitude: block.content.data.latitude,
                          longitude: block.content.data.longitude,
                          latitudeDelta: 0.05,
                          longitudeDelta: 0.05,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                      >
                        <Marker
                          coordinate={{
                            latitude: block.content.data.latitude,
                            longitude: block.content.data.longitude,
                          }}
                        />
                      </MapView>
                    )}

                    {/* Audio Block */}
                    {block.content.type === BlockType.AUDIO && (
                      <View style={styles.audioContent}>
                        <View style={styles.audioPlayButton}>
                          <Microphone2 size={24} color={colors.white} variant="Bold" />
                        </View>
                        <Text style={styles.audioDuration}>
                          {Math.floor(block.content.data.duration / 60)}:
                          {(block.content.data.duration % 60).toString().padStart(2, '0')}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Add Content Bottom Sheet */}
        {addContentVisible && (
          <View style={styles.bottomSheet}>
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={() => setAddContentVisible(false)}
            />
            <View style={styles.sheetContent}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Add Content</Text>
              
              <View style={styles.contentOptions}>
                <TouchableOpacity style={styles.contentOption} onPress={handleAddText}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: '#3B82F615' }]}>
                    <DocumentText size={28} color="#3B82F6" variant="Bold" />
                  </View>
                  <Text style={styles.contentOptionText}>Text</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contentOption} onPress={handleAddImage}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: '#10B98115' }]}>
                    <Gallery size={28} color="#10B981" variant="Bold" />
                  </View>
                  <Text style={styles.contentOptionText}>Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contentOption} onPress={handleAddGallery}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: '#10B98115' }]}>
                    <Gallery size={28} color="#10B981" variant="Bold" />
                  </View>
                  <Text style={styles.contentOptionText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contentOption} onPress={handleAddMap}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: '#EF444415' }]}>
                    <LocationIcon size={28} color="#EF4444" variant="Bold" />
                  </View>
                  <Text style={styles.contentOptionText}>Location</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contentOption} onPress={handleAddAudio}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: '#8B5CF615' }]}>
                    <Microphone2 size={28} color="#8B5CF6" variant="Bold" />
                  </View>
                  <Text style={styles.contentOptionText}>Audio</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray900,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  titleSection: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  titleInput: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
    fontStyle: 'italic',
  },
  blocksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  block: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  blockLarge: {
    flex: 1,
    minWidth: '48%',
    height: 140,
  },
  blockSmall: {
    width: '48%',
    height: 140,
  },
  blockWide: {
    width: '100%',
    height: 100,
  },
  blockHero: {
    width: '100%',
    height: 300,
  },
  emptyBlock: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: `${colors.primary}30`,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBlockText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  filledBlock: {
    flex: 1,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  textBlockInput: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.gray900,
    textAlignVertical: 'top',
  },
  imageContent: {
    width: '100%',
    height: '100%',
  },
  galleryContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  galleryImage: {
    flex: 1,
    height: '100%',
  },
  mapContent: {
    width: '100%',
    height: '100%',
  },
  audioContent: {
    flex: 1,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
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
  bottomSheet: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: spacing.xl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  contentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  contentOption: {
    alignItems: 'center',
    width: '18%',
  },
  contentOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  contentOptionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.gray700,
    textAlign: 'center',
  },
});
