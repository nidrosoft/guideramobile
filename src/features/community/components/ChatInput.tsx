/**
 * CHAT INPUT COMPONENT
 * 
 * Input component for sending messages with media support.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
  Platform,
  Alert,
  Image,
} from 'react-native';
import {
  Send2,
  Camera,
  Gallery,
  Microphone2,
  CloseCircle,
  Happyemoji,
  Paperclip2,
  Location,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface MediaAttachment {
  type: 'image' | 'video' | 'location';
  uri?: string;
  location?: { lat: number; lng: number; name: string };
}

interface ChatInputProps {
  onSend: (message: string, attachments?: MediaAttachment[]) => void;
  placeholder?: string;
  disabled?: boolean;
  isPremium?: boolean;
}

export default function ChatInput({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
  isPremium = true,
}: ChatInputProps) {
  const { colors: tc } = useTheme();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const attachMenuAnim = useRef(new Animated.Value(0)).current;
  
  const toggleAttachMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = showAttachMenu ? 0 : 1;
    Animated.spring(attachMenuAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
    }).start();
    setShowAttachMenu(!showAttachMenu);
    
    if (!showAttachMenu) {
      Keyboard.dismiss();
    }
  };
  
  const handleSend = () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Upgrade to Premium to send messages.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {} },
        ]
      );
      return;
    }
    
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0 && attachments.length === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSend(trimmedMessage, attachments.length > 0 ? attachments : undefined);
    setMessage('');
    setAttachments([]);
    setShowAttachMenu(false);
    Animated.timing(attachMenuAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  };
  
  const pickImage = async (useCamera: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAttachMenu(false);
    Animated.timing(attachMenuAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    };
    
    let result;
    if (useCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow camera access to take photos.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        ...options,
        allowsMultipleSelection: true,
        selectionLimit: 5 - attachments.length,
      });
    }
    
    if (!result.canceled && result.assets) {
      const newAttachments: MediaAttachment[] = result.assets.map(asset => ({
        type: asset.type === 'video' ? 'video' : 'image',
        uri: asset.uri,
      }));
      setAttachments(prev => [...prev, ...newAttachments].slice(0, 5));
    }
  };
  
  const shareLocation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAttachMenu(false);
    Animated.timing(attachMenuAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    
    // In real app, get actual location
    const mockLocation: MediaAttachment = {
      type: 'location',
      location: {
        lat: 35.6762,
        lng: 139.6503,
        name: 'Shibuya, Tokyo',
      },
    };
    setAttachments(prev => [...prev, mockLocation].slice(0, 5));
  };
  
  const removeAttachment = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const canSend = message.trim().length > 0 || attachments.length > 0;
  
  const attachMenuTranslateY = attachMenuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });
  
  const attachMenuOpacity = attachMenuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  return (
    <View style={[styles.container, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <View style={styles.attachmentsPreview}>
          {attachments.map((attachment, index) => (
            <View key={index} style={styles.attachmentItem}>
              {attachment.type === 'location' ? (
                <View style={styles.locationPreview}>
                  <Location size={24} color={tc.primary} />
                  <Text style={[styles.locationText, { color: tc.primary }]} numberOfLines={1}>
                    {attachment.location?.name}
                  </Text>
                </View>
              ) : (
                <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
              )}
              <TouchableOpacity
                style={styles.removeAttachment}
                onPress={() => removeAttachment(index)}
              >
                <CloseCircle size={20} color={colors.white} variant="Bold" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      {/* Attach Menu */}
      <Animated.View 
        style={[
          styles.attachMenu,
          {
            backgroundColor: tc.bgElevated,
            borderTopColor: tc.borderSubtle,
            transform: [{ translateY: attachMenuTranslateY }],
            opacity: attachMenuOpacity,
          },
        ]}
        pointerEvents={showAttachMenu ? 'auto' : 'none'}
      >
        <TouchableOpacity style={styles.attachOption} onPress={() => pickImage(true)}>
          <View style={[styles.attachOptionIcon, { backgroundColor: tc.primary + '15' }]}>
            <Camera size={24} color={tc.primary} />
          </View>
          <Text style={[styles.attachOptionText, { color: tc.textSecondary }]}>Camera</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.attachOption} onPress={() => pickImage(false)}>
          <View style={[styles.attachOptionIcon, { backgroundColor: tc.success + '15' }]}>
            <Gallery size={24} color={tc.success} />
          </View>
          <Text style={[styles.attachOptionText, { color: tc.textSecondary }]}>Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.attachOption} onPress={shareLocation}>
          <View style={[styles.attachOptionIcon, { backgroundColor: tc.warning + '15' }]}>
            <Location size={24} color={tc.warning} />
          </View>
          <Text style={[styles.attachOptionText, { color: tc.textSecondary }]}>Location</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Input Row */}
      <View style={styles.inputRow}>
        {/* Attach Button */}
        <TouchableOpacity
          style={[styles.iconButton, showAttachMenu && { backgroundColor: tc.primary + '15', borderRadius: 22 }]}
          onPress={toggleAttachMenu}
          disabled={disabled}
        >
          <Paperclip2 
            size={22} 
            color={showAttachMenu ? tc.primary : tc.textSecondary} 
            style={{ transform: [{ rotate: showAttachMenu ? '45deg' : '0deg' }] }}
          />
        </TouchableOpacity>
        
        {/* Text Input */}
        <View style={[styles.inputContainer, { backgroundColor: tc.bgCard }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: tc.textPrimary }]}
            placeholder={placeholder}
            placeholderTextColor={tc.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={2000}
            editable={!disabled}
            onFocus={() => {
              if (showAttachMenu) {
                setShowAttachMenu(false);
                Animated.timing(attachMenuAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
              }
            }}
          />
          
          {/* Emoji Button */}
          <TouchableOpacity style={styles.emojiButton}>
            <Happyemoji size={22} color={tc.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Send/Voice Button */}
        {canSend ? (
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: tc.primary }, !isPremium && { backgroundColor: tc.borderSubtle }]}
            onPress={handleSend}
            disabled={disabled}
          >
            <Send2 size={22} color={'#FFFFFF'} variant="Bold" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.voiceButton}
            onPressIn={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsRecording(true);
            }}
            onPressOut={() => {
              setIsRecording(false);
              // Handle voice message
            }}
            disabled={disabled}
          >
            <Microphone2 
              size={22} 
              color={isRecording ? tc.error : tc.textSecondary} 
              variant={isRecording ? 'Bold' : 'Outline'}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording... Release to send</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  attachmentsPreview: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  attachmentItem: {
    position: 'relative',
  },
  attachmentImage: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
  },
  locationPreview: {
    width: 120,
    height: 72,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  removeAttachment: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.error,
    borderRadius: 10,
  },
  attachMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  attachOption: {
    alignItems: 'center',
  },
  attachOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  attachOptionText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: colors.primary + '15',
    borderRadius: 22,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.borderSubtle,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 0,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 0 : spacing.sm,
    maxHeight: 100,
  },
  emojiButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  voiceButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.error + '10',
    gap: spacing.sm,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  recordingText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
});
