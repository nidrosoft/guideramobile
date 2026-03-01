/**
 * PARTNER INVITE CARD
 *
 * CTA banner inviting users to join the Guidera Partner Program.
 * Replaces the old "Become a Guide" card with a broader partner pitch.
 * Shows on the Guides tab for non-partner users.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Briefcase, ArrowRight2, ShieldTick } from 'iconsax-react-native';
import { colors } from '@/styles';

interface PartnerInviteCardProps {
  onPress: () => void;
}

export default function PartnerInviteCard({ onPress }: PartnerInviteCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <LinearGradient
        colors={[colors.primary, colors.primaryGradient, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.iconContainer}>
          <Briefcase size={28} color={colors.white} variant="Bold" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Turn your skills into income</Text>
          <Text style={styles.subtitle}>
            Join the Guidera Partner Program — list your property, offer rides, guide tours, or any local service. Totally free, keep 100% of your earnings.
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <ShieldTick size={14} color="rgba(255,255,255,0.8)" variant="Bold" />
            <Text style={styles.featureText}>Get verified</Text>
          </View>
          <View style={styles.featureItem}>
            <ShieldTick size={14} color="rgba(255,255,255,0.8)" variant="Bold" />
            <Text style={styles.featureText}>Build reputation</Text>
          </View>
          <View style={styles.featureItem}>
            <ShieldTick size={14} color="rgba(255,255,255,0.8)" variant="Bold" />
            <Text style={styles.featureText}>Help travelers</Text>
          </View>
        </View>

        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>Learn More</Text>
          <View style={styles.ctaArrow}>
            <ArrowRight2 size={16} color={colors.primary} variant="Bold" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  textContainer: {
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  features: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  ctaArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
