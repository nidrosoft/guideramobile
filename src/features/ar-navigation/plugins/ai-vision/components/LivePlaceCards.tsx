/**
 * LIVE PLACE CARDS
 *
 * Generative-UI component rendered in the Live transcript when Meena calls
 * the `find_nearby_places` tool. Shows a horizontal carousel of place cards.
 * Tapping a card opens it in the native maps app.
 *
 * Styled for the dark ambient Live screen (glass cards) using design tokens.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Star1, Location, Clock } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius, typography } from '@/styles';
import type { LiveToolCard, LivePlaceCard } from '../types/aiVision.types';

interface LivePlaceCardsProps {
  card: LiveToolCard;
}

function formatDistance(m?: number): string | null {
  if (m == null) return null;
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

function priceDollars(level?: number): string | null {
  if (level == null || level < 0) return null;
  return '$'.repeat(Math.max(1, Math.min(4, level + 1)));
}

function openInMaps(place: LivePlaceCard) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  const query =
    place.lat != null && place.lng != null
      ? `${place.lat},${place.lng}`
      : encodeURIComponent(place.name);
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(
    () => {}
  );
}

export default function LivePlaceCards({ card }: LivePlaceCardsProps) {
  if (card?.type !== 'places' || !card.places?.length) return null;

  return (
    <View style={styles.wrapper}>
      {card.title ? <Text style={styles.title}>{card.title}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {card.places.map((place) => {
          const distance = formatDistance(place.distanceMeters);
          const price = priceDollars(place.priceLevel);
          return (
            <TouchableOpacity
              key={place.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => openInMaps(place)}
            >
              <Text style={styles.name} numberOfLines={1}>
                {place.name}
              </Text>

              {place.category ? (
                <Text style={styles.category} numberOfLines={1}>
                  {place.category}
                </Text>
              ) : null}

              <View style={styles.metaRow}>
                {place.rating != null && (
                  <View style={styles.metaItem}>
                    <Star1 size={13} color="#FBBF24" variant="Bold" />
                    <Text style={styles.metaText}>
                      {place.rating.toFixed(1)}
                      {place.reviewCount ? ` (${place.reviewCount})` : ''}
                    </Text>
                  </View>
                )}
                {price ? <Text style={styles.price}>{price}</Text> : null}
              </View>

              <View style={styles.footerRow}>
                {distance ? (
                  <View style={styles.metaItem}>
                    <Location size={13} color="rgba(255,255,255,0.6)" variant="Bold" />
                    <Text style={styles.footerText}>{distance}</Text>
                  </View>
                ) : <View />}

                {place.openNow != null && (
                  <View style={styles.metaItem}>
                    <Clock
                      size={13}
                      color={place.openNow ? '#3FC39E' : '#EF4444'}
                      variant="Bold"
                    />
                    <Text
                      style={[
                        styles.footerText,
                        { color: place.openNow ? '#3FC39E' : '#EF4444' },
                      ]}
                    >
                      {place.openNow ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.tapHint}>Tap to open in Maps</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    alignSelf: 'stretch',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.sm,
  },
  row: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  card: {
    width: 200,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: spacing.md,
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  category: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  price: {
    fontSize: 12,
    color: '#3FC39E',
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 11,
    color: 'rgba(63,195,158,0.8)',
    marginTop: 4,
    fontWeight: '600',
  },
});
