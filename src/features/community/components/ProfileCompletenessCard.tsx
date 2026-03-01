/**
 * PROFILE COMPLETENESS CARD
 * 
 * Shows the user's profile completion percentage with suggestions.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  User,
  Edit,
  Camera,
  LanguageSquare,
  Heart,
  Verify,
  Location,
  ArrowRight2,
} from 'iconsax-react-native';
import { colors, spacing, borderRadius } from '@/styles';

export interface ProfileSection {
  id: string;
  label: string;
  complete: boolean;
  weight: number;
  icon: any;
  action?: string;
}

export interface ProfileCompletenessData {
  score: number;
  sections: ProfileSection[];
  suggestions: string[];
}

interface ProfileCompletenessCardProps {
  data: ProfileCompletenessData;
  onSectionPress?: (sectionId: string) => void;
  onCompletePress?: () => void;
  variant?: 'full' | 'compact';
}

const DEFAULT_SECTIONS: ProfileSection[] = [
  { id: 'basicInfo', label: 'Basic Info', complete: false, weight: 20, icon: User },
  { id: 'bio', label: 'Bio', complete: false, weight: 15, icon: Edit },
  { id: 'languages', label: 'Languages', complete: false, weight: 15, icon: LanguageSquare },
  { id: 'travelStyle', label: 'Travel Style', complete: false, weight: 15, icon: Heart },
  { id: 'interests', label: 'Interests', complete: false, weight: 15, icon: Heart },
  { id: 'verification', label: 'Verification', complete: false, weight: 10, icon: Verify },
  { id: 'coverPhoto', label: 'Cover Photo', complete: false, weight: 5, icon: Camera },
  { id: 'homeLocation', label: 'Home Location', complete: false, weight: 5, icon: Location },
];

export default function ProfileCompletenessCard({
  data,
  onSectionPress,
  onCompletePress,
  variant = 'full',
}: ProfileCompletenessCardProps) {
  const isCompact = variant === 'compact';
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 50) return colors.warning;
    return colors.error;
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 70) return 'Great progress!';
    if (score >= 50) return 'Getting there';
    if (score >= 30) return 'Just started';
    return 'Let\'s begin!';
  };
  
  const incompleteSections = data.sections.filter(s => !s.complete);
  const scoreColor = getScoreColor(data.score);
  
  if (isCompact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onCompletePress}
        activeOpacity={0.7}
      >
        <View style={styles.compactProgress}>
          <View style={styles.progressCircle}>
            <Text style={[styles.progressText, { color: scoreColor }]}>
              {data.score}%
            </Text>
          </View>
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle}>Complete your profile</Text>
          <Text style={styles.compactSubtitle}>
            {incompleteSections.length} sections remaining
          </Text>
        </View>
        <ArrowRight2 size={20} color={colors.gray400} />
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Profile Completeness</Text>
          <Text style={[styles.label, { color: scoreColor }]}>
            {getScoreLabel(data.score)}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: scoreColor }]}>{data.score}%</Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${data.score}%`, backgroundColor: scoreColor }
          ]} 
        />
      </View>
      
      {/* Sections */}
      <View style={styles.sections}>
        {data.sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.sectionItem,
                section.complete && styles.sectionComplete,
              ]}
              onPress={() => onSectionPress?.(section.id)}
              activeOpacity={0.7}
              disabled={section.complete}
            >
              <View style={[
                styles.sectionIcon,
                section.complete && styles.sectionIconComplete,
              ]}>
                <IconComponent 
                  size={16} 
                  color={section.complete ? colors.success : colors.gray400} 
                  variant={section.complete ? 'Bold' : 'Linear'}
                />
              </View>
              <Text style={[
                styles.sectionLabel,
                section.complete && styles.sectionLabelComplete,
              ]}>
                {section.label}
              </Text>
              {section.complete && (
                <Verify size={14} color={colors.success} variant="Bold" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>💡 Tips to improve</Text>
          {data.suggestions.slice(0, 2).map((suggestion, index) => (
            <Text key={index} style={styles.suggestionText}>
              • {suggestion}
            </Text>
          ))}
        </View>
      )}
      
      {/* CTA Button */}
      {data.score < 100 && (
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onCompletePress}
          activeOpacity={0.7}
        >
          <Text style={styles.ctaText}>Complete Profile</Text>
          <ArrowRight2 size={18} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: 28,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.borderSubtle,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sections: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  sectionComplete: {
    backgroundColor: colors.success + '10',
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconComplete: {
    backgroundColor: colors.success + '20',
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionLabelComplete: {
    color: colors.success,
    fontWeight: '500',
  },
  suggestions: {
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  suggestionText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  compactProgress: {
    marginRight: spacing.md,
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  compactSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
