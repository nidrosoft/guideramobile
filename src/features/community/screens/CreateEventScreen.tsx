/**
 * CREATE EVENT SCREEN
 * 
 * Form to create a new event in a community.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Location,
  Gallery,
  Camera,
  Video,
  Global,
  People,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

type EventType = 'in_person' | 'virtual' | 'hybrid';

interface EventFormData {
  title: string;
  description: string;
  type: EventType;
  coverImage: string | null;
  date: Date;
  startTime: Date;
  endTime: Date;
  location: string;
  address: string;
  virtualLink: string;
  maxAttendees: string;
  tags: string[];
}

const EVENT_TYPES: { id: EventType; label: string; icon: any; description: string }[] = [
  { id: 'in_person', label: 'In Person', icon: Location, description: 'Meet at a physical location' },
  { id: 'virtual', label: 'Virtual', icon: Video, description: 'Online event via video call' },
  { id: 'hybrid', label: 'Hybrid', icon: Global, description: 'Both in-person and virtual' },
];

const POPULAR_TAGS = ['meetup', 'food', 'nightlife', 'hiking', 'photography', 'cultural', 'workshop', 'networking'];

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    type: 'in_person',
    coverImage: null,
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    startTime: new Date(),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
    location: '',
    address: '',
    virtualLink: '',
    maxAttendees: '',
    tags: [],
  });
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, coverImage: result.assets[0].uri }));
    }
  };
  
  const toggleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : prev.tags.length < 5 ? [...prev.tags, tag] : prev.tags,
    }));
  };
  
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Required', 'Please enter an event title');
      return;
    }
    
    if (formData.type !== 'virtual' && !formData.location.trim()) {
      Alert.alert('Required', 'Please enter a location');
      return;
    }
    
    if (formData.type !== 'in_person' && !formData.virtualLink.trim()) {
      Alert.alert('Required', 'Please enter a virtual meeting link');
      return;
    }
    
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Event Created! 🎉',
        'Your event has been created successfully.',
        [
          {
            text: 'View Event',
            onPress: () => router.back(),
          },
        ]
      );
    }, 1500);
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Create Event</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cover Image */}
        <TouchableOpacity style={styles.coverContainer} onPress={pickImage}>
          {formData.coverImage ? (
            <Image source={{ uri: formData.coverImage }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: tc.bgCard }]}>
              <Gallery size={32} color={tc.textTertiary} />
              <Text style={[styles.coverText, { color: tc.textTertiary }]}>Add Cover Photo</Text>
            </View>
          )}
          <View style={styles.coverBadge}>
            <Camera size={16} color={colors.white} />
          </View>
        </TouchableOpacity>
        
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: tc.textPrimary }]}>Event Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
            placeholder="e.g., Tokyo Food Tour Meetup"
            placeholderTextColor={tc.textTertiary}
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            maxLength={100}
          />
        </View>
        
        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: tc.textPrimary }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
            placeholder="Tell people what to expect..."
            placeholderTextColor={tc.textTertiary}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={4}
            maxLength={1000}
            textAlignVertical="top"
          />
        </View>
        
        {/* Event Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: tc.textPrimary }]}>Event Type</Text>
          <View style={styles.typeOptions}>
            {EVENT_TYPES.map(type => {
              const Icon = type.icon;
              const isSelected = formData.type === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typeOption, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }, isSelected && { borderColor: tc.primary, backgroundColor: tc.primary + '10' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFormData(prev => ({ ...prev, type: type.id }));
                  }}
                >
                  <Icon size={20} color={isSelected ? tc.primary : tc.textSecondary} />
                  <Text style={[styles.typeOptionText, { color: tc.textSecondary }, isSelected && { color: tc.primary }]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        {/* Date & Time */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: tc.textPrimary }]}>Date & Time</Text>
          
          <TouchableOpacity 
            style={[styles.dateTimeRow, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={tc.primary} />
            <Text style={[styles.dateTimeText, { color: tc.textPrimary }]}>{formatDate(formData.date)}</Text>
          </TouchableOpacity>
          
          <View style={styles.timeRow}>
            <TouchableOpacity 
              style={[styles.timeButton, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Clock size={18} color={colors.success} />
              <Text style={[styles.timeLabel, { color: tc.textSecondary }]}>Start</Text>
              <Text style={[styles.timeValue, { color: tc.textPrimary }]}>{formatTime(formData.startTime)}</Text>
            </TouchableOpacity>
            
            <Text style={[styles.timeSeparator, { color: tc.textSecondary }]}>to</Text>
            
            <TouchableOpacity 
              style={[styles.timeButton, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Clock size={18} color={colors.error} />
              <Text style={[styles.timeLabel, { color: tc.textSecondary }]}>End</Text>
              <Text style={[styles.timeValue, { color: tc.textPrimary }]}>{formatTime(formData.endTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Location (for in-person/hybrid) */}
        {formData.type !== 'virtual' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: tc.textPrimary }]}>Location *</Text>
            <View style={[styles.inputWithIcon, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              <Location size={20} color={tc.textTertiary} />
              <TextInput
                style={[styles.inputInner, { color: tc.textPrimary }]}
                placeholder="Venue name"
                placeholderTextColor={tc.textTertiary}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              />
            </View>
            <TextInput
              style={[styles.input, { marginTop: spacing.sm, backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, color: tc.textPrimary }]}
              placeholder="Full address"
              placeholderTextColor={tc.textTertiary}
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
            />
          </View>
        )}
        
        {/* Virtual Link (for virtual/hybrid) */}
        {formData.type !== 'in_person' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: tc.textPrimary }]}>Virtual Meeting Link *</Text>
            <View style={[styles.inputWithIcon, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              <Video size={20} color={tc.textTertiary} />
              <TextInput
                style={[styles.inputInner, { color: tc.textPrimary }]}
                placeholder="https://zoom.us/j/..."
                placeholderTextColor={tc.textTertiary}
                value={formData.virtualLink}
                onChangeText={(text) => setFormData(prev => ({ ...prev, virtualLink: text }))}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>
        )}
        
        {/* Max Attendees */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: tc.textPrimary }]}>Max Attendees (Optional)</Text>
          <View style={[styles.inputWithIcon, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <People size={20} color={tc.textTertiary} />
            <TextInput
              style={[styles.inputInner, { color: tc.textPrimary }]}
              placeholder="Leave empty for unlimited"
              placeholderTextColor={tc.textTertiary}
              value={formData.maxAttendees}
              onChangeText={(text) => setFormData(prev => ({ ...prev, maxAttendees: text.replace(/[^0-9]/g, '') }))}
              keyboardType="number-pad"
            />
          </View>
        </View>
        
        {/* Tags */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: tc.textPrimary }]}>Tags</Text>
          <View style={styles.tagsContainer}>
            {POPULAR_TAGS.map(tag => {
              const isSelected = formData.tags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }, isSelected && { borderColor: tc.primary, backgroundColor: tc.primary + '10' }]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagText, { color: tc.textSecondary }, isSelected && { color: tc.primary }]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.md, backgroundColor: tc.bgElevated, borderTopColor: tc.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setFormData(prev => ({ ...prev, date }));
          }}
        />
      )}
      
      {/* Start Time Picker */}
      {showStartTimePicker && (
        <DateTimePicker
          value={formData.startTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowStartTimePicker(false);
            if (date) setFormData(prev => ({ ...prev, startTime: date }));
          }}
        />
      )}
      
      {/* End Time Picker */}
      {showEndTimePicker && (
        <DateTimePicker
          value={formData.endTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowEndTimePicker(false);
            if (date) setFormData(prev => ({ ...prev, endTime: date }));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  // Cover Image
  coverContainer: {
    height: 160,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    marginTop: spacing.sm,
  },
  coverBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Inputs
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  inputInner: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  // Event Type
  typeOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  typeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.bgElevated0,
  },
  typeOptionTextSelected: {
    color: colors.primary,
  },
  // Date & Time
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  dateTimeText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  timeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  timeValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginLeft: 'auto',
  },
  timeSeparator: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tagSelected: {
    backgroundColor: colors.primary,
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  tagTextSelected: {
    color: colors.white,
  },
  // Footer
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
