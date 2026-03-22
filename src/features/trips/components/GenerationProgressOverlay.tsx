/**
 * GENERATION PROGRESS OVERLAY
 *
 * Full-screen modal overlay shown during Smart Plan generation.
 * Displays real-time per-module progress with animated status indicators.
 * Each module transitions: waiting → generating → done/failed.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import {
  CalendarEdit,
  InfoCircle,
  Bag2,
  SecuritySafe,
  LanguageSquare,
  DocumentText,
  MagicStar,
  TickCircle,
  CloseCircle,
} from 'iconsax-react-native';
import { spacing, typography, colors as staticColors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ModuleStatus = 'waiting' | 'generating' | 'done' | 'failed';

export interface ModuleProgress {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
  status: ModuleStatus;
  detail?: string; // e.g. "7 day itinerary"
}

interface GenerationProgressOverlayProps {
  visible: boolean;
  modules: ModuleProgress[];
  destinationName?: string;
}

// Animated dots for "generating" status
function AnimatedDots({ color }: { color: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, easing: Easing.ease, useNativeDriver: true }),
        ]),
      );
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
  });

  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View
          key={i}
          style={[
            { width: 5, height: 5, borderRadius: 2.5, backgroundColor: color },
            dotStyle(d),
          ]}
        />
      ))}
    </View>
  );
}

// Pulsing glow for the currently-generating module icon
function PulsingIcon({ Icon, color, bgColor }: { Icon: React.ComponentType<any>; color: string; bgColor: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.moduleIcon,
        { backgroundColor: bgColor },
        {
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }],
        },
      ]}
    >
      <Icon size={20} color={color} variant="Bold" />
    </Animated.View>
  );
}

// Spinning star for the header
function SpinningStar({ color }: { color: string }) {
  const spin = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnim = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true }),
    );
    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    spinAnim.start();
    glowAnim.start();
    return () => { spinAnim.stop(); glowAnim.stop(); };
  }, []);

  return (
    <Animated.View
      style={{
        transform: [
          { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
        ],
        opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
      }}
    >
      <MagicStar size={40} color={color} variant="Bold" />
    </Animated.View>
  );
}

export default function GenerationProgressOverlay({
  visible,
  modules,
  destinationName,
}: GenerationProgressOverlayProps) {
  const { colors: tc } = useTheme();

  const doneCount = modules.filter(m => m.status === 'done').length;
  const failedCount = modules.filter(m => m.status === 'failed').length;
  const totalCount = modules.length;
  const completedCount = doneCount + failedCount;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const getStatusColor = (status: ModuleStatus) => {
    switch (status) {
      case 'done': return tc.success;
      case 'failed': return tc.error;
      case 'generating': return tc.primary;
      default: return tc.textTertiary;
    }
  };

  const getStatusText = (mod: ModuleProgress) => {
    switch (mod.status) {
      case 'done': return mod.detail || 'Done';
      case 'failed': return 'Failed';
      case 'generating': return 'Generating';
      default: return 'Waiting';
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
        <View style={styles.content}>
          {/* Header */}
          <View style={[styles.headerCircle, { backgroundColor: tc.primary + '20' }]}>
            <SpinningStar color={tc.primary} />
          </View>

          <Text style={[styles.title, { color: tc.white }]}>
            Building Your Trip Plan
          </Text>
          <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.6)' }]}>
            {destinationName
              ? `AI is crafting your personalized ${destinationName} experience`
              : 'AI is crafting your personalized trip experience'}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: tc.primary,
                    width: `${Math.round(progress * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: 'rgba(255,255,255,0.5)' }]}>
              {completedCount} of {totalCount} modules
            </Text>
          </View>

          {/* Module List */}
          <View style={styles.moduleList}>
            {modules.map((mod) => {
              const Icon = mod.icon;
              const statusColor = getStatusColor(mod.status);
              const isActive = mod.status === 'generating';

              return (
                <View
                  key={mod.key}
                  style={[
                    styles.moduleRow,
                    {
                      backgroundColor: isActive
                        ? tc.primary + '12'
                        : mod.status === 'done'
                        ? `${tc.success}08`
                        : 'rgba(255,255,255,0.03)',
                      borderColor: isActive
                        ? tc.primary + '30'
                        : mod.status === 'done'
                        ? `${tc.success}20`
                        : 'rgba(255,255,255,0.06)',
                    },
                  ]}
                >
                  {/* Icon */}
                  {isActive ? (
                    <PulsingIcon Icon={Icon} color={tc.primary} bgColor={tc.primary + '20'} />
                  ) : (
                    <View
                      style={[
                        styles.moduleIcon,
                        {
                          backgroundColor:
                            mod.status === 'done'
                              ? `${tc.success}15`
                              : mod.status === 'failed'
                              ? `${tc.error}15`
                              : 'rgba(255,255,255,0.06)',
                        },
                      ]}
                    >
                      <Icon
                        size={20}
                        color={
                          mod.status === 'done'
                            ? tc.success
                            : mod.status === 'failed'
                            ? tc.error
                            : 'rgba(255,255,255,0.25)'
                        }
                        variant="Bold"
                      />
                    </View>
                  )}

                  {/* Label */}
                  <Text
                    style={[
                      styles.moduleLabel,
                      {
                        color:
                          mod.status === 'waiting'
                            ? 'rgba(255,255,255,0.35)'
                            : tc.white,
                      },
                    ]}
                  >
                    {mod.label}
                  </Text>

                  {/* Status Indicator */}
                  <View style={styles.moduleStatus}>
                    {mod.status === 'generating' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.statusText, { color: tc.primary }]}>Generating</Text>
                        <AnimatedDots color={tc.primary} />
                      </View>
                    ) : mod.status === 'done' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[styles.statusText, { color: tc.success }]}>
                          {mod.detail || 'Done'}
                        </Text>
                        <TickCircle size={16} color={tc.success} variant="Bold" />
                      </View>
                    ) : mod.status === 'failed' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[styles.statusText, { color: tc.error }]}>Failed</Text>
                        <CloseCircle size={16} color={tc.error} variant="Bold" />
                      </View>
                    ) : (
                      <Text style={[styles.statusText, { color: 'rgba(255,255,255,0.2)' }]}>
                        Waiting
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Footer Hint */}
          <Text style={[styles.footerHint, { color: 'rgba(255,255,255,0.3)' }]}>
            This usually takes 30–60 seconds
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  headerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  moduleList: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  moduleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  moduleStatus: {
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerHint: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
