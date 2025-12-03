/**
 * ACCOUNT SECTION
 * 
 * Groups menu items with optional title.
 * Supports collapsible sections.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { ArrowDown2, ArrowUp2 } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { AccountSection as SectionType } from '../types/account.types';
import AccountMenuItem from './AccountMenuItem';

interface AccountSectionProps {
  section: SectionType;
}

export default function AccountSection({ section }: AccountSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(section.defaultCollapsed || false);
  
  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(!isCollapsed);
  };
  
  return (
    <View style={styles.container}>
      {/* Section header */}
      {section.title && (
        <TouchableOpacity
          style={styles.header}
          onPress={section.collapsible ? toggleCollapse : undefined}
          activeOpacity={section.collapsible ? 0.7 : 1}
          disabled={!section.collapsible}
        >
          <Text style={styles.title}>{section.title}</Text>
          {section.collapsible && (
            isCollapsed 
              ? <ArrowDown2 size={18} color={colors.gray500} variant="Linear" />
              : <ArrowUp2 size={18} color={colors.gray500} variant="Linear" />
          )}
        </TouchableOpacity>
      )}
      
      {/* Section items */}
      {!isCollapsed && (
        <View style={styles.itemsContainer}>
          {section.items.map((item, index) => (
            <AccountMenuItem
              key={item.id}
              item={item}
              isFirst={index === 0}
              isLast={index === section.items.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
