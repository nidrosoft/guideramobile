import { useState, useEffect } from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface TypingAnimationProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
  /** When false the animation and haptic feedback are paused */
  isActive?: boolean;
}

export default function TypingAnimation({
  phrases,
  typingSpeed = 80,
  deletingSpeed = 50,
  pauseTime = 800,
  isActive = true,
}: TypingAnimationProps) {
  const { colors } = useTheme();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const currentPhrase = phrases[currentPhraseIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < currentPhrase.length) {
          setCurrentText(currentPhrase.slice(0, currentText.length + 1));
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } else {
          // Finished typing, start deleting after pause
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
          if (Platform.OS === 'ios') {
            Haptics.selectionAsync();
          }
        } else {
          // Finished deleting, move to next phrase
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [isActive, currentText, isDeleting, currentPhraseIndex, phrases, typingSpeed, deletingSpeed, pauseTime]);

  return (
    <Text style={[styles.text, { color: colors.white }]}>
      {currentText}
      <Text style={styles.cursor}>|</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    lineHeight: typography.fontSize['2xl'] * 1.3,
  },
  cursor: {
    opacity: 0.7,
  },
});
