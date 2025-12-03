/**
 * MENU TRANSLATOR PLUGIN
 * 
 * AR plugin for translating menus and signs.
 * Uses OCR and translation APIs to convert text to user's language.
 */

import React, { useState } from 'react';
import { ARPlugin, ARContext } from '../../types/ar-plugin.types';
import { DocumentText } from 'iconsax-react-native';
import { colors } from '@/styles';
import MenuOverlay from './components/MenuOverlay';
import TranslationSheet from './components/TranslationSheet';
import BottomSheetInfo from '../../components/shared/BottomSheetInfo';
import { useMenuTranslation } from './hooks/useMenuTranslation';

// Plugin overlay component with state
function MenuTranslatorOverlay() {
  const {
    mode,
    isProcessing,
    isLiveFrozen,
    translation,
    captureAndTranslate,
    toggleLiveFrozen,
    changeMode,
    clearTranslation,
  } = useMenuTranslation();

  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const handleCapture = async () => {
    await captureAndTranslate();
    setShowBottomSheet(true);
  };

  const handleCloseSheet = () => {
    setShowBottomSheet(false);
    clearTranslation();
  };

  const handleSave = () => {
    // TODO: Implement save to database
    console.log('Save translation:', translation);
  };

  // Auto-show bottom sheet when translation is available
  React.useEffect(() => {
    if (translation && mode === 'live') {
      setShowBottomSheet(true);
    }
  }, [translation, mode]);

  return (
    <>
      <MenuOverlay
        mode={mode}
        isLiveFrozen={isLiveFrozen}
        isProcessing={isProcessing}
        onModeChange={changeMode}
        onCapture={handleCapture}
        onToggleLive={toggleLiveFrozen}
      />

      {translation && (
        <BottomSheetInfo
          visible={showBottomSheet}
          title="Translation"
          onClose={handleCloseSheet}
        >
          <TranslationSheet translation={translation} onSave={handleSave} />
        </BottomSheetInfo>
      )}
    </>
  );
}

export const menuTranslatorPlugin: ARPlugin = {
  id: 'menu-translator',
  name: 'Menu Translator',
  icon: <DocumentText size={24} color={colors.primary} variant="Bold" />,
  description: 'Translate menus and signs in real-time',
  
  requiresCamera: true,
  requiresLocation: false,
  requiresInternet: true,
  
  renderOverlay: (context: ARContext) => {
    return <MenuTranslatorOverlay />;
  },
  
  onActivate: () => {
    console.log('Menu Translator activated');
  },
  
  onDeactivate: () => {
    console.log('Menu Translator deactivated');
  },
};

export default menuTranslatorPlugin;
