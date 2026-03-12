import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  Alert,
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
  Camera,
  Stop,
} from 'iconsax-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { BlockType, BlockSize, ContentBlock, LayoutType } from '../types/journal.types';
import { useToast } from '@/contexts/ToastContext';
import * as Haptics from 'expo-haptics';
import { journalService } from '@/services/journal.service';

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
  const { colors: tc } = useTheme();
  const params = useLocalSearchParams();
  const { showSuccess } = useToast();
  
  const tripId = params.tripId as string;
  const entryId = params.entryId as string | undefined;
  const title = params.title as string || 'Untitled Entry';
  const layout = (params.layout as LayoutType) || LayoutType.MIXED;

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
  const [loading, setLoading] = useState(!!entryId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entryId) return;
    let mounted = true;
    const loadEntry = async () => {
      try {
        setLoading(true);
        const entry = await journalService.getEntry(entryId);
        if (entry && mounted) {
          setEntryTitle(entry.title);
          if (entry.blocks.length > 0) {
            setBlocks(entry.blocks);
          }
        }
      } catch (err) {
        console.error('Failed to load journal entry:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadEntry();
    return () => { mounted = false; };
  }, [entryId]);

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

  const handleAddImage = async () => {
    if (!selectedBlockId) return;
    setAddContentVisible(false);

    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required.'); return; }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
          if (!result.canceled && result.assets[0]) {
            setBlocks(blocks.map(block =>
              block.id === selectedBlockId
                ? { ...block, content: { type: BlockType.IMAGE, data: { uri: result.assets[0].uri } } }
                : block
            ));
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Photo library access is required.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
          if (!result.canceled && result.assets[0]) {
            setBlocks(blocks.map(block =>
              block.id === selectedBlockId
                ? { ...block, content: { type: BlockType.IMAGE, data: { uri: result.assets[0].uri } } }
                : block
            ));
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAddGallery = async () => {
    if (!selectedBlockId) return;
    setAddContentVisible(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Photo library access is required.'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const images = result.assets.map(a => ({ uri: a.uri }));
      setBlocks(blocks.map(block =>
        block.id === selectedBlockId
          ? { ...block, content: { type: BlockType.GALLERY, data: { images } } }
          : block
      ));
    }
  };

  const handleAddMap = async () => {
    if (!selectedBlockId) return;
    setAddContentVisible(false);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Location access is required to pin your position.'); return; }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      const locationName = geo
        ? [geo.name, geo.city, geo.country].filter(Boolean).join(', ')
        : `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;

      setBlocks(blocks.map(block =>
        block.id === selectedBlockId
          ? {
              ...block,
              content: {
                type: BlockType.MAP,
                data: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  locationName,
                },
              },
            }
          : block
      ));
      showSuccess(`Pinned: ${locationName}`);
    } catch (err) {
      console.error('Location error:', err);
      Alert.alert('Location Error', 'Could not get your current location. Please try again.');
    }
  };

  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartRef = useRef<number>(0);

  const handleAddAudio = async () => {
    if (!selectedBlockId) return;
    setAddContentVisible(false);

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Microphone access is required for voice notes.'); return; }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      recordingStartRef.current = Date.now();
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showSuccess('Recording... Tap stop when done');
    } catch (err) {
      console.error('Audio recording error:', err);
      Alert.alert('Recording Error', 'Could not start recording. Please try again.');
    }
  };

  const handleStopRecording = async () => {
    if (!recordingRef.current || !selectedBlockId) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingRef.current.getURI();
      const durationSec = Math.round((Date.now() - recordingStartRef.current) / 1000);
      recordingRef.current = null;
      setIsRecording(false);

      if (uri) {
        setBlocks(blocks.map(block =>
          block.id === selectedBlockId
            ? { ...block, content: { type: BlockType.AUDIO, data: { uri, duration: durationSec } } }
            : block
        ));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess(`Voice note saved (${durationSec}s)`);
      }
    } catch (err) {
      console.error('Stop recording error:', err);
      setIsRecording(false);
    }
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

  const handleSave = async () => {
    if (!entryId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess('Journal entry saved!');
      router.back();
      return;
    }
    try {
      setSaving(true);
      const blocksToSave = blocks
        .filter(b => b.content !== null)
        .map(b => ({
          type: b.content!.type,
          content: b.content,
          position: b.position,
          size: b.size,
        }));
      await journalService.saveBlocks(entryId, blocksToSave);

      const wordCount = blocks
        .filter(b => b.content?.type === BlockType.TEXT)
        .reduce((sum, b) => {
          const text: string = (b.content!.data as any).text || '';
          return sum + text.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
        }, 0);

      await journalService.updateEntry(entryId, { title: entryTitle, word_count: wordCount });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess('Journal entry saved!');
      router.back();
    } catch (err) {
      console.error('Failed to save journal entry:', err);
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
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
                          <Microphone2 size={28} color={colors.purple} variant="Bold" />
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

        {/* Stop Recording FAB */}
        {isRecording && (
          <TouchableOpacity
            style={styles.stopRecordingFab}
            onPress={handleStopRecording}
            activeOpacity={0.8}
          >
            <View style={styles.stopRecordingInner}>
              <View style={styles.stopIcon} />
              <Text style={styles.stopRecordingText}>Stop Recording</Text>
            </View>
          </TouchableOpacity>
        )}

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
                  <View style={[styles.contentOptionIcon, { backgroundColor: colors.infoBg }]}>
                    <DocumentText size={28} color={colors.info} variant="Bold" />
                  </View>
                  <Text style={styles.contentOptionText}>Text</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contentOption} onPress={handleAddImage}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: colors.successBg }]}>
                    <Gallery size={28} color={colors.success} variant="Bold" />
                  </View>
                  <Text style={styles.contentOptionText}>Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contentOption} onPress={handleAddGallery}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: colors.successBg }]}>
                    <Gallery size={28} color={colors.success} variant="Bold" />
                  </View>
                  <Text style={styles.contentOptionText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contentOption} onPress={handleAddMap}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: colors.errorBg }]}>
                    <LocationIcon size={28} color={colors.error} variant="Bold" />
                  </View>
                  <Text style={styles.contentOptionText}>Location</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contentOption} onPress={handleAddAudio}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: `${colors.purple}15` }]}>
                    <Microphone2 size={28} color={colors.purple} variant="Bold" />
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
    backgroundColor: colors.bgElevated,
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
    backgroundColor: colors.bgElevated,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
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
    backgroundColor: colors.bgElevated,
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
    backgroundColor: colors.bgElevated,
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
    backgroundColor: colors.bgElevated,
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
    backgroundColor: colors.bgElevated,
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
  stopRecordingFab: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 100,
  },
  stopRecordingInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 32,
    gap: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stopIcon: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  stopRecordingText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
});
