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
  ArrowLeft2,
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
import * as FileSystem from 'expo-file-system';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { colors, spacing, typography } from '@/styles';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Profile } from '@/types/auth.types';
import { invokeEdgeFn } from '@/utils/retry';
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
  const { colors: tc, isDark } = useTheme();
  const params = useLocalSearchParams();
  const { showSuccess, showError } = useToast();
  const { profile: authProfile } = useAuth();
  
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
          if (status !== 'granted') { showError('Camera access is required. Please enable it in Settings.'); return; }
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
          if (status !== 'granted') { showError('Photo library access is required. Please enable it in Settings.'); return; }
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
    if (status !== 'granted') { showError('Photo library access is required. Please enable it in Settings.'); return; }

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
      if (status !== 'granted') { showError('Location access is required to pin your position.'); return; }

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
      showError('Could not get your current location. Please try again.');
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
      if (status !== 'granted') { showError('Microphone access is required for voice notes.'); return; }

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
      showError('Could not start recording. Please try again.');
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

  // ── Audio Playback ──────────────────────────
  const [playingBlockId, setPlayingBlockId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const handlePlayPause = async (blockId: string, uri: string) => {
    try {
      // If already playing this block, toggle pause/resume
      if (playingBlockId === blockId && soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await soundRef.current.pauseAsync();
          setPlayingBlockId(null);
          return;
        } else if (status.isLoaded) {
          await soundRef.current.playAsync();
          setPlayingBlockId(blockId);
          return;
        }
      }

      // Stop any existing playback
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingBlockId(null);
            sound.unloadAsync();
            soundRef.current = null;
          }
        },
      );
      soundRef.current = sound;
      setPlayingBlockId(blockId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.error('Playback error:', err);
      showError('Could not play this voice note.');
      setPlayingBlockId(null);
    }
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // ── Transcription ──────────────────────────
  const [transcribingBlockId, setTranscribingBlockId] = useState<string | null>(null);

  const handleTranscribe = async (blockId: string, uri: string) => {
    setTranscribingBlockId(blockId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });

      const { data, error } = await invokeEdgeFn(supabase, 'transcribe-audio', { audioBase64: base64, mimeType: 'audio/m4a' }, 'slow');

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const transcription = data.transcription || '';

      // Update block with transcription
      setBlocks(prev => prev.map(block =>
        block.id === blockId && block.content?.type === BlockType.AUDIO
          ? { ...block, content: { type: BlockType.AUDIO, data: { ...(block.content.data as any), transcription } } }
          : block
      ));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess('Transcription complete!');
    } catch (err: any) {
      console.error('Transcription error:', err);
      showError(err.message || 'Could not transcribe audio.');
    } finally {
      setTranscribingBlockId(null);
    }
  };

  const handleRemoveContent = (blockId: string) => {
    // Stop playback if removing the playing block
    if (playingBlockId === blockId && soundRef.current) {
      soundRef.current.unloadAsync();
      soundRef.current = null;
      setPlayingBlockId(null);
    }
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
      // New entry — create it first, then save blocks
      try {
        setSaving(true);
        const newEntry = await journalService.createEntry(tripId, authProfile?.id ?? '', {
          title: entryTitle || 'Untitled Entry',
          date: new Date().toISOString(),
          layout: 'mixed',
        });
        if (newEntry?.id) {
          const blocksToSave = blocks
            .filter(b => b.content !== null)
            .map(b => ({
              type: b.content!.type,
              content: b.content,
              position: b.position,
              size: b.size,
            }));
          if (blocksToSave.length > 0) {
            await journalService.saveBlocks(newEntry.id, blocksToSave);
          }
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess('Journal entry saved!');
        router.back();
      } catch (err) {
        if (__DEV__) console.warn('Failed to create journal entry:', err);
        showError('Failed to save entry. Please try again.');
      } finally {
        setSaving(false);
      }
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

      // Transaction-safe: RPC handles delete + insert + word count in one atomic operation
      await journalService.saveBlocks(entryId, blocksToSave);

      // Update title separately (only metadata, not block data)
      if (entryTitle !== title) {
        await journalService.updateEntry(entryId, { title: entryTitle });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess('Journal entry saved!');
      router.back();
    } catch (err: any) {
      if (__DEV__) console.warn('Failed to save journal entry:', err);
      showError('Failed to save entry. Please try again.');
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: tc.bgPrimary }]}>
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tc.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={tc.bgPrimary} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bgPrimary }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: tc.bgPrimary, borderBottomColor: tc.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tc.bgCard }]}>
            <ArrowLeft2 size={24} color={tc.textPrimary} variant="Linear" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Edit Entry</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            <Text style={[styles.saveButtonText, { color: tc.primary }]}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={[styles.titleSection, { backgroundColor: tc.bgCard }]}>
            <TextInput
              style={[styles.titleInput, { color: tc.textPrimary }]}
              placeholder="Entry title..."
              placeholderTextColor={tc.textTertiary}
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
                    style={[styles.emptyBlock, { backgroundColor: tc.bgCard, borderColor: `${tc.primary}30` }]}
                    onPress={() => handleAddContent(block.id)}
                    activeOpacity={0.7}
                  >
                    <Add size={32} color={tc.primary} variant="Bold" />
                    <Text style={[styles.emptyBlockText, { color: tc.primary }]}>Add Content</Text>
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
                        style={[styles.textBlockInput, { backgroundColor: tc.bgCard, color: tc.textPrimary }]}
                        placeholder="Write your thoughts..."
                        placeholderTextColor={tc.textTertiary}
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
                      <View style={[styles.audioContent, { backgroundColor: `${tc.primary}10` }]}>
                        {/* Play/Pause */}
                        <TouchableOpacity
                          style={[styles.audioPlayButton, { backgroundColor: tc.primary }]}
                          onPress={() => handlePlayPause(block.id, (block.content!.data as any).uri)}
                          activeOpacity={0.7}
                        >
                          {playingBlockId === block.id ? (
                            <Stop size={24} color="#FFF" variant="Bold" />
                          ) : (
                            <Microphone2 size={24} color="#FFF" variant="Bold" />
                          )}
                        </TouchableOpacity>
                        <Text style={[styles.audioDuration, { color: tc.textPrimary }]}>
                          {playingBlockId === block.id ? 'Playing...' : (
                            `${Math.floor((block.content.data as any).duration / 60)}:${((block.content.data as any).duration % 60).toString().padStart(2, '0')}`
                          )}
                        </Text>
                        {/* Transcribe button */}
                        <TouchableOpacity
                          style={[styles.transcribeBtn, { backgroundColor: `${tc.primary}12`, borderColor: `${tc.primary}30` }]}
                          onPress={() => handleTranscribe(block.id, (block.content!.data as any).uri)}
                          disabled={transcribingBlockId === block.id}
                          activeOpacity={0.7}
                        >
                          {transcribingBlockId === block.id ? (
                            <ActivityIndicator size="small" color={tc.info || tc.primary} />
                          ) : (
                            <Text style={[styles.transcribeText, { color: tc.info || tc.primary }]}>
                              {(block.content.data as any).transcription ? 'Re-transcribe' : 'Transcribe'}
                            </Text>
                          )}
                        </TouchableOpacity>
                        {/* Transcription text */}
                        {(block.content.data as any).transcription && (
                          <Text style={[styles.transcriptionText, { color: tc.textSecondary }]} numberOfLines={3}>
                            {(block.content.data as any).transcription}
                          </Text>
                        )}
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
            <View style={[styles.sheetContent, { backgroundColor: tc.bgCard }]}>
              <View style={[styles.sheetHandle, { backgroundColor: tc.borderSubtle }]} />
              <Text style={[styles.sheetTitle, { color: tc.textPrimary }]}>Add Content</Text>
              
              <View style={styles.contentOptions}>
                <TouchableOpacity style={styles.contentOption} onPress={handleAddText}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: `${tc.info || tc.primary}15` }]}>
                    <DocumentText size={28} color={tc.info || tc.primary} variant="Bold" />
                  </View>
                  <Text style={[styles.contentOptionText, { color: tc.textSecondary }]}>Text</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contentOption} onPress={handleAddImage}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: `${tc.success}15` }]}>
                    <Gallery size={28} color={tc.success} variant="Bold" />
                  </View>
                  <Text style={[styles.contentOptionText, { color: tc.textSecondary }]}>Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contentOption} onPress={handleAddGallery}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: `${tc.success}15` }]}>
                    <Gallery size={28} color={tc.success} variant="Bold" />
                  </View>
                  <Text style={[styles.contentOptionText, { color: tc.textSecondary }]}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contentOption} onPress={handleAddMap}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: `${tc.error}15` }]}>
                    <LocationIcon size={28} color={tc.error} variant="Bold" />
                  </View>
                  <Text style={[styles.contentOptionText, { color: tc.textSecondary }]}>Location</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contentOption} onPress={handleAddAudio}>
                  <View style={[styles.contentOptionIcon, { backgroundColor: `${tc.purple}15` }]}>
                    <Microphone2 size={28} color={tc.purple} variant="Bold" />
                  </View>
                  <Text style={[styles.contentOptionText, { color: tc.textSecondary }]}>Audio</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: 4,
  },
  audioPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioDuration: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  transcribeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  transcribeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transcriptionText: {
    fontSize: typography.fontSize.xs,
    paddingHorizontal: spacing.xs,
    textAlign: 'center',
    lineHeight: 16,
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
