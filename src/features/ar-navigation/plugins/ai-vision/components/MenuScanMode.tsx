/**
 * MENU SCAN MODE
 *
 * Photo → Gemini vision → structured menu extraction → item selection.
 * Renders a beautiful categorized menu UI with checkboxes.
 * Selected items flow into Order Builder mode.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  SectionList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  Camera,
  Gallery,
  Add,
  Minus,
  ArrowLeft2,
  Receipt21,
  TickCircle,
  Warning2,
  MessageQuestion,
} from 'iconsax-react-native';
import LanguagePicker from './LanguagePicker';
import { extractMenu } from '../services/gemini.service';
import type { MenuItem, MenuCategory } from '../types/aiVision.types';

const ExpoFileSystem = require('expo-file-system');

interface MenuScanModeProps {
  userLanguage: string;
  onLanguageChange: (lang: string) => void;
  onBuildOrder: (items: MenuItem[]) => void;
  onClose?: () => void;
  initialBase64?: string; // from snapshot mode bridge
}

const MAX_PAGES = 3;

export default function MenuScanMode({
  userLanguage,
  onLanguageChange,
  onBuildOrder,
  initialBase64,
}: MenuScanModeProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);
  const [showCamera, setShowCamera] = useState(!initialBase64);
  const [capturedPages, setCapturedPages] = useState<{ uri: string; base64: string }[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPage, setProcessingPage] = useState(0); // which page # is being processed
  const [error, setError] = useState<string | null>(null);

  // Process on initial base64 if provided (bridge from snapshot)
  React.useEffect(() => {
    if (initialBase64) {
      processMenuPages([{ uri: '', base64: initialBase64 }]);
    }
  }, [initialBase64]);

  /**
   * Process one or more menu page images — extracts items from each,
   * merges results, and deduplicates overlapping items.
   */
  const processMenuPages = useCallback(
    async (pages: { uri: string; base64: string }[]) => {
      setShowCamera(false);
      setIsProcessing(true);
      setError(null);

      try {
        let allItems: MenuItem[] = [...menuItems]; // keep existing items when adding pages
        const existingNames = new Set(allItems.map(i => i.nameOriginal.toLowerCase().trim()));

        for (let i = 0; i < pages.length; i++) {
          setProcessingPage(i + 1);
          const items = await extractMenu(pages[i].base64, userLanguage);

          // Deduplicate: skip items whose original name already exists
          for (const item of items) {
            const key = item.nameOriginal.toLowerCase().trim();
            if (!existingNames.has(key)) {
              existingNames.add(key);
              allItems.push(item);
            }
          }
        }

        if (allItems.length === 0) {
          setError('No menu items found. Try with clearer photos.');
          return;
        }
        setMenuItems(allItems);
      } catch (e: any) {
        setError(e?.message || 'Could not read menu. Please try again.');
        if (__DEV__) console.warn('[MenuScanMode] Extract error:', e);
      } finally {
        setIsProcessing(false);
        setProcessingPage(0);
      }
    },
    [userLanguage, menuItems],
  );

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        imageType: 'jpg',
      });
      if (photo?.base64) {
        const newPage = { uri: photo.uri || '', base64: photo.base64 };
        setCapturedPages(prev => [...prev, newPage]);
        processMenuPages([newPage]);
      }
    } catch (e) {
      if (__DEV__) console.warn('[MenuScanMode] Capture error:', e);
    }
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PAGES,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newPages: { uri: string; base64: string }[] = [];
      for (const asset of result.assets) {
        try {
          const b64 = await ExpoFileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
          newPages.push({ uri: asset.uri, base64: b64 });
        } catch {}
      }
      if (newPages.length > 0) {
        setCapturedPages(prev => [...prev, ...newPages]);
        processMenuPages(newPages);
      }
    }
  };

  // Add another page (return to camera but keep existing menu items)
  const handleAddPage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCamera(true);
    setError(null);
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCapturedPages([]);
    setMenuItems([]);
    setError(null);
    setShowCamera(true);
  };

  const toggleItem = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              isSelected: !item.isSelected,
              quantity: item.isSelected ? 0 : 1,
            }
          : item,
      ),
    );
  };

  const updateItemQuantity = (id: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const newQty = Math.max(0, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          isSelected: newQty > 0,
        };
      }),
    );
  };

  const selectedItems = menuItems.filter(i => i.isSelected);
  const totalSelected = selectedItems.reduce((sum, i) => sum + i.quantity, 0);

  // Group items by category
  const sections = React.useMemo(() => {
    const catMap = new Map<string, MenuItem[]>();
    for (const item of menuItems) {
      const existing = catMap.get(item.category) || [];
      existing.push(item);
      catMap.set(item.category, existing);
    }
    return Array.from(catMap.entries()).map(([title, data]) => ({ title, data }));
  }, [menuItems]);

  const canAddMore = capturedPages.length < MAX_PAGES;
  const pageCount = capturedPages.length;

  // ── Camera View ───────────────────────────────────────────
  if (showCamera) {
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />

        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <View style={styles.modeLabel}>
            <Receipt21 size={16} color="#EC4899" variant="Bold" />
            <Text style={styles.modeLabelText}>
              {pageCount > 0 ? `Page ${pageCount + 1} of ${MAX_PAGES}` : 'Scan Menu'}
            </Text>
          </View>
          <LanguagePicker selectedLanguage={userLanguage} onSelect={onLanguageChange} />
        </View>

        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          <Text style={styles.frameHint}>
            {pageCount > 0 ? 'Capture another page of the menu' : 'Capture the full menu'}
          </Text>
        </View>

        {/* Thumbnail strip of already captured pages */}
        {pageCount > 0 && (
          <View style={styles.thumbnailStrip}>
            {capturedPages.map((page, idx) => (
              <View key={idx} style={styles.thumbnailWrapper}>
                {page.uri ? (
                  <Image source={{ uri: page.uri }} style={styles.thumbnail} />
                ) : (
                  <View style={[styles.thumbnail, { backgroundColor: 'rgba(236,72,153,0.2)', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#EC4899', fontSize: 12, fontWeight: '700' }}>{idx + 1}</Text>
                  </View>
                )}
              </View>
            ))}
            {/* "Done" button to go back to results */}
            <TouchableOpacity
              style={styles.donePagesBtn}
              onPress={() => { setShowCamera(false); }}
              activeOpacity={0.7}
            >
              <TickCircle size={18} color="#3FC39E" variant="Bold" />
              <Text style={styles.donePagesText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.captureRow}>
          <TouchableOpacity style={styles.galleryBtn} onPress={handlePickImage} activeOpacity={0.7}>
            <Gallery size={24} color="#FFFFFF" variant="Bold" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} activeOpacity={0.8}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <View style={{ width: 48 }} />
        </View>
      </View>
    );
  }

  // ── Menu Results ─────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.menuHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={handleReset} activeOpacity={0.7}>
          <ArrowLeft2 size={20} color="#FFFFFF" variant="Bold" />
          <Text style={styles.backText}>New Scan</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {pageCount > 0 && (
            <View style={styles.pageCountBadge}>
              <Text style={styles.pageCountText}>{pageCount} page{pageCount > 1 ? 's' : ''}</Text>
            </View>
          )}
          {canAddMore && !isProcessing && menuItems.length > 0 && (
            <TouchableOpacity style={styles.addPageBtn} onPress={handleAddPage} activeOpacity={0.7}>
              <Camera size={16} color="#EC4899" variant="Bold" />
              <Text style={styles.addPageText}>Add Page</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading */}
      {isProcessing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#EC4899" size="large" />
          <Text style={styles.loadingText}>
            {processingPage > 0 ? `Reading page ${processingPage}...` : 'Reading menu...'}
          </Text>
          <Text style={styles.loadingSubtext}>Extracting items and translating</Text>
        </View>
      )}

      {/* Error */}
      {error && !isProcessing && (
        <View style={styles.errorContainer}>
          <Warning2 size={40} color="#EF4444" variant="Bold" />
          <Text style={styles.errorTitle}>Could Not Read Menu</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleReset} activeOpacity={0.7}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu items */}
      {sections.length > 0 && (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          style={styles.menuList}
          contentContainerStyle={styles.menuListContent}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length} items</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.menuItem, item.isSelected && styles.menuItemSelected]}
              onPress={() => toggleItem(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemHeader}>
                  <Text style={styles.menuItemName}>{item.nameTranslated}</Text>
                  <Text style={styles.menuItemPrice}>{item.price}</Text>
                </View>
                <Text style={styles.menuItemOriginal}>{item.nameOriginal}</Text>
                {item.description ? (
                  <Text style={styles.menuItemDesc}>{item.description}</Text>
                ) : null}
                {item.dietaryFlags.length > 0 && (
                  <View style={styles.flagsRow}>
                    {item.dietaryFlags.map((flag, i) => (
                      <View key={i} style={styles.flagPill}>
                        <Text style={styles.flagText}>{flag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Selection / quantity controls */}
              {item.isSelected ? (
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateItemQuantity(item.id, -1)}
                  >
                    <Minus size={16} color="#FFFFFF" variant="Bold" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateItemQuantity(item.id, 1)}
                  >
                    <Add size={16} color="#FFFFFF" variant="Bold" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.addCircle}>
                  <Add size={18} color="rgba(255,255,255,0.5)" variant="Linear" />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Build Order sticky button */}
      {totalSelected > 0 && (
        <TouchableOpacity
          style={styles.buildOrderBtn}
          onPress={() => onBuildOrder(selectedItems)}
          activeOpacity={0.8}
        >
          <Text style={styles.buildOrderText}>
            Build My Order ({totalSelected} item{totalSelected > 1 ? 's' : ''})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const { width: _menuScreenW } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  camera: { flex: 1 },
  topBar: {
    position: 'absolute', top: 56, left: 60, right: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 100,
  },
  modeLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  modeLabelText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  scanFrame: {
    position: 'absolute', top: '25%', alignSelf: 'center', width: Math.min(300, _menuScreenW * 0.8), height: Math.min(260, _menuScreenW * 0.7),
    justifyContent: 'center', alignItems: 'center',
  },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#EC4899' },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  frameHint: {
    fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 8, overflow: 'hidden',
  },
  captureRow: {
    position: 'absolute', bottom: 100, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40, zIndex: 100,
  },
  galleryBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  captureBtn: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },
  captureBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF' },
  // ── Menu Results ──
  menuHeader: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  loadingText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  loadingSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  errorContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 32,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  errorText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#3FC39E', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8,
  },
  retryText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  menuList: { flex: 1 },
  menuListContent: { paddingBottom: 120, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#111', paddingVertical: 12, paddingTop: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  sectionCount: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  menuItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  menuItemSelected: {
    backgroundColor: 'rgba(236,72,153,0.08)', borderColor: 'rgba(236,72,153,0.25)',
  },
  menuItemContent: { flex: 1 },
  menuItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  menuItemName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', flex: 1, marginRight: 8 },
  menuItemPrice: { fontSize: 14, fontWeight: '700', color: '#EC4899' },
  menuItemOriginal: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
  menuItemDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 19, marginBottom: 6 },
  flagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  flagPill: {
    backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  flagText: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  qtyControls: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center',
  },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(236,72,153,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  qtyText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', minWidth: 20, textAlign: 'center' },
  addCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center',
  },
  buildOrderBtn: {
    position: 'absolute', bottom: 100, left: 16, right: 16,
    backgroundColor: '#EC4899', borderRadius: 18, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#EC4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 8,
  },
  buildOrderText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  // Multi-photo thumbnail strip
  thumbnailStrip: {
    position: 'absolute', bottom: 190, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 100,
  },
  thumbnailWrapper: {
    borderWidth: 2, borderColor: '#EC4899', borderRadius: 8, overflow: 'hidden',
  },
  thumbnail: {
    width: 44, height: 44, borderRadius: 6,
  },
  donePagesBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(63,195,158,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14,
  },
  donePagesText: { fontSize: 13, fontWeight: '600', color: '#3FC39E' },
  addPageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(236,72,153,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(236,72,153,0.3)',
  },
  addPageText: { fontSize: 13, fontWeight: '600', color: '#EC4899' },
  pageCountBadge: {
    backgroundColor: 'rgba(236,72,153,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  pageCountText: { fontSize: 12, fontWeight: '600', color: '#EC4899' },
});
