/**
 * LIVE GENERATIVE CARDS
 *
 * Rich UI rendered inline in the Live transcript as Meena speaks (generative UI).
 * Dispatches on card.type:
 *   - 'places'   → LivePlaceCards (existing horizontal carousel)
 *   - 'landmark' → LandmarkCard   (image + summary + facts, e.g. Christ the Redeemer)
 *   - 'map'      → MiniMapCard    (interactive Mapbox mini-map)
 *   - 'info'     → InfoCard       (generic title + bullet points)
 *
 * Styled for the dark ambient Live screen using design tokens.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { Location, Routing, InfoCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '@/styles';
import type {
  LiveToolCard,
  LiveLandmarkCard,
  LiveMapCard,
  LiveInfoCard,
} from '../types/aiVision.types';
import LivePlaceCards from './LivePlaceCards';

// Mapbox is initialized globally in app/_layout.tsx. Guard for Expo Go / missing native module.
let MapboxGL: any = null;
let MAPBOX_AVAILABLE = false;
try {
  MapboxGL = require('@rnmapbox/maps').default;
  MAPBOX_AVAILABLE = true;
} catch {
  MAPBOX_AVAILABLE = false;
}

function openInMaps(lat?: number, lng?: number, label?: string) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  const query =
    lat != null && lng != null
      ? `${lat},${lng}`
      : encodeURIComponent(label || 'destination');
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(
    () => {}
  );
}

// ─── Landmark card ───────────────────────────────────────────

function LandmarkCard({ data }: { data: LiveLandmarkCard }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={data.lat != null ? 0.85 : 1}
      onPress={() => (data.lat != null ? openInMaps(data.lat, data.lng, data.name) : undefined)}
    >
      {data.imageUrl ? (
        <Image source={{ uri: data.imageUrl }} style={styles.landmarkImage} resizeMode="cover" />
      ) : null}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{data.name}</Text>
        {data.summary ? (
          <Text style={styles.cardSummary} numberOfLines={4}>{data.summary}</Text>
        ) : null}
        {data.facts && data.facts.length > 0 ? (
          <View style={styles.facts}>
            {data.facts.slice(0, 4).map((f, i) => (
              <View key={i} style={styles.factRow}>
                <View style={styles.factDot} />
                <Text style={styles.factText}>{f}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {data.lat != null ? (
          <Text style={styles.tapHint}>Tap to open in Maps</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── Interactive mini-map card ───────────────────────────────

function MiniMapCard({ data }: { data: LiveMapCard }) {
  const center: [number, number] = [data.lng, data.lat];
  const zoom = data.zoom ?? 14;

  if (!MAPBOX_AVAILABLE || !MapboxGL) {
    // Fallback when Mapbox native module isn't available.
    return (
      <TouchableOpacity
        style={[styles.card, styles.mapFallback]}
        activeOpacity={0.85}
        onPress={() => openInMaps(data.lat, data.lng, data.label)}
      >
        <Location size={20} color="#3FC39E" variant="Bold" />
        <Text style={styles.mapFallbackText}>{data.label || 'View location'}</Text>
        <Text style={styles.tapHint}>Tap to open in Maps</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, styles.mapCard]}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL?.Dark ?? 'mapbox://styles/mapbox/dark-v11'}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <MapboxGL.Camera centerCoordinate={center} zoomLevel={zoom} animationDuration={0} />
        <MapboxGL.PointAnnotation id="live-map-point" coordinate={center}>
          <View style={styles.pin}>
            <View style={styles.pinInner} />
          </View>
        </MapboxGL.PointAnnotation>
      </MapboxGL.MapView>

      <View style={styles.mapFooter}>
        <Text style={styles.mapLabel} numberOfLines={1}>{data.label || 'Location'}</Text>
        <TouchableOpacity
          style={styles.directionsBtn}
          activeOpacity={0.8}
          onPress={() => openInMaps(data.lat, data.lng, data.label)}
        >
          <Routing size={14} color="#0A0A0F" variant="Bold" />
          <Text style={styles.directionsText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Generic info card ───────────────────────────────────────

function InfoCard({ data }: { data: LiveInfoCard }) {
  return (
    <View style={styles.card}>
      {data.imageUrl ? (
        <Image source={{ uri: data.imageUrl }} style={styles.landmarkImage} resizeMode="cover" />
      ) : null}
      <View style={styles.cardBody}>
        <View style={styles.infoHeader}>
          <InfoCircle size={16} color="#3FC39E" variant="Bold" />
          <Text style={styles.cardTitle} numberOfLines={2}>{data.title}</Text>
        </View>
        <View style={styles.facts}>
          {data.points.slice(0, 6).map((p, i) => (
            <View key={i} style={styles.factRow}>
              <View style={styles.factDot} />
              <Text style={styles.factText}>{p}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Dispatcher ──────────────────────────────────────────────

export default function LiveCards({ card }: { card: LiveToolCard }) {
  switch (card.type) {
    case 'places':
      return <LivePlaceCards card={card} />;
    case 'landmark':
      return (
        <View style={styles.wrapper}>
          {card.title ? <Text style={styles.sectionTitle}>{card.title}</Text> : null}
          <LandmarkCard data={card.landmark} />
        </View>
      );
    case 'map':
      return (
        <View style={styles.wrapper}>
          {card.title ? <Text style={styles.sectionTitle}>{card.title}</Text> : null}
          <MiniMapCard data={card.map} />
        </View>
      );
    case 'info':
      return (
        <View style={styles.wrapper}>
          {card.title ? <Text style={styles.sectionTitle}>{card.title}</Text> : null}
          <InfoCard data={card.info} />
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  cardBody: {
    padding: spacing.md,
    gap: 8,
  },
  landmarkImage: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSummary: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.75)',
  },
  facts: {
    gap: 6,
    marginTop: 2,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  factDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3FC39E',
    marginTop: 7,
  },
  factText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  tapHint: {
    fontSize: 11,
    color: 'rgba(63,195,158,0.8)',
    marginTop: 4,
    fontWeight: '600',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Map
  mapCard: {
    padding: 0,
  },
  map: {
    width: '100%',
    height: 180,
  },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  mapLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#3FC39E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
  },
  directionsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0A0F',
  },
  mapFallback: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  mapFallbackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(63,195,158,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3FC39E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
