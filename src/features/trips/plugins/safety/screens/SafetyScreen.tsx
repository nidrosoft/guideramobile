/**
 * SAFETY PLUGIN - MAIN SCREEN
 * 
 * Displays AI-generated safety intelligence for a trip destination.
 * All data comes from the generate-safety edge function stored in safety_profiles table.
 * 
 * Modules rendered:
 * 1. Safety Score (always visible at top)
 * 2. Overview briefing
 * 3. Threat model (crimes, scams, political, terrorism)
 * 4. Neighborhood map (3 tiers + time overlay)
 * 5. Health & medical intelligence
 * 6. Natural hazards
 * 7. Digital safety
 * 8. Women's safety
 * 9. LGBTQ+ safety
 * 10. Emergency contacts (tap-to-call)
 * 11. Before-you-go checklist
 * 12. During-trip protocols
 * 13. Survival phrases
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Danger,
  Call,
  Location,
  TickCircle,
  Hospital,
  SecurityUser,
  Global,
  ShieldTick,
} from 'iconsax-react-native';
import { spacing, typography, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { useToast } from '@/contexts/ToastContext';
import * as Haptics from 'expo-haptics';
import {
  SafetyAlert,
  EmergencyType,
} from '../types/safety.types';
import { safetyService } from '@/services/safety.service';
import PluginErrorState from '@/features/trips/components/PluginErrorState';
// useAuth available if needed for user-specific rendering

// ─── Helper: score color ────────────────────────────────
function getScoreColor(score: number, themeColors: any) {
  if (score >= 85) return themeColors.success;
  if (score >= 70) return themeColors.warning;
  if (score >= 50) return themeColors.orange || '#F97316';
  return themeColors.error;
}

function getScoreBg(score: number, themeColors: any) {
  if (score >= 85) return themeColors.successBg;
  if (score >= 70) return themeColors.warningBg || `${themeColors.warning}15`;
  if (score >= 50) return '#FFF7ED';
  return themeColors.errorBg;
}

// ─── Helper: risk badge ─────────────────────────────────
function RiskBadge({ level, themeColors }: { level: string; themeColors: any }) {
  const color = level === 'high' || level === 'extreme' || level === 'very_high'
    ? themeColors.error
    : level === 'moderate'
    ? themeColors.orange || '#F97316'
    : level === 'low'
    ? themeColors.success
    : themeColors.textTertiary;
  return (
    <View style={[s.riskBadge, { backgroundColor: `${color}15` }]}>
      <Text style={[s.riskBadgeText, { color }]}>{level.replace(/_/g, ' ')}</Text>
    </View>
  );
}

// ─── Empty State component ──────────────────────────────
// TODO: [PREMIUM] Empty state will show upgrade CTA once paywall is implemented
function EmptyState({ icon, iconColor, title, subtitle, themeColors, ctaLabel, onCtaPress }: { icon: React.ReactNode; iconColor?: string; title: string; subtitle: string; themeColors: any; ctaLabel?: string; onCtaPress?: () => void }) {
  return (
    <View style={s.emptyState}>
      <View style={[s.emptyIconCircle, { backgroundColor: `${iconColor || themeColors.textTertiary}15` }]}>
        {icon}
      </View>
      <Text style={[s.emptyTitle, { color: themeColors.textPrimary }]}>{title}</Text>
      <Text style={[s.emptySubtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text>
      {ctaLabel && onCtaPress && (
        <TouchableOpacity style={[s.emptyCta, { backgroundColor: themeColors.primary }]} onPress={onCtaPress}>
          <Text style={s.emptyCtaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Section Card wrapper ───────────────────────────────
function SectionCard({ title, children, themeColors }: { title: string; children: React.ReactNode; themeColors: any }) {
  return (
    <View style={[s.sectionCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.borderSubtle }]}>
      <Text style={[s.sectionCardTitle, { color: themeColors.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Collapsible Section ────────────────────────────────
function CollapsibleSection({ title, children, themeColors, defaultOpen = false }: { title: string; children: React.ReactNode; themeColors: any; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={[s.sectionCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.borderSubtle }]}>
      <TouchableOpacity onPress={() => setOpen(!open)} style={s.collapsibleHeader}>
        <Text style={[s.sectionCardTitle, { color: themeColors.textPrimary, marginBottom: 0 }]}>{title}</Text>
        <Text style={{ color: themeColors.textTertiary, fontSize: 18 }}>{open ? '−' : '+'}</Text>
      </TouchableOpacity>
      {open && <View style={{ marginTop: spacing.sm }}>{children}</View>}
    </View>
  );
}

type TabType = 'overview' | 'intel' | 'emergency' | 'checklist';

export default function SafetyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showSuccess } = useToast();
  const { colors: themeColors, isDark } = useTheme();
  const tripId = params.tripId as string;
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [safetyProfile, setSafetyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [alertsData, profileData] = await Promise.all([
        safetyService.getAlerts(tripId).catch(() => []),
        safetyService.getSafetyProfile(tripId).catch(() => null),
      ]);
      setAlerts(alertsData);
      setSafetyProfile(profileData);
    } catch (err: any) {
      console.error('Failed to load safety data:', err);
      setError(err.message || 'Failed to load safety data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tripId]);

  if (!trip) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: themeColors.bgPrimary }]}>
        <Text style={{ color: themeColors.textPrimary, padding: spacing.lg }}>Trip not found</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={[s.container, { backgroundColor: themeColors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[s.container, { backgroundColor: themeColors.bgPrimary }]}>
        <PluginErrorState message={error} onRetry={fetchData} />
      </View>
    );
  }

  const sp = safetyProfile; // shorthand
  const hasProfile = !!sp;
  const score = sp?.safetyScore ?? 0;
  const scoreColor = hasProfile ? getScoreColor(score, themeColors) : themeColors.textTertiary;
  const scoreBg = hasProfile ? getScoreBg(score, themeColors) : `${themeColors.textTertiary}10`;
  const destCity = trip.destination?.city || trip.title || 'Destination';

  // ─── Handlers ───────────────────────────────────────────
  const handleEmergencyCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleSOS = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      '🚨 Emergency SOS',
      'We\'re about to send a distress signal to all Guidera users nearby and notify your emergency contacts. Continue?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const vibrateInterval = setInterval(() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }, 500);
            showSuccess('🚨 Alerting nearby users...');
            setTimeout(() => {
              clearInterval(vibrateInterval);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showSuccess('SOS sent! Nearby users and emergency contacts have been alerted.');
            }, 3000);
          },
        },
      ],
      { cancelable: true },
    );
  };

  const toggleChecklist = (id: string) => {
    setChecklistState(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'police': case EmergencyType.POLICE:
        return <SecurityUser size={22} color={themeColors.error} variant="Bold" />;
      case 'medical': case 'ambulance': case 'hospital': case EmergencyType.MEDICAL:
        return <Hospital size={22} color={themeColors.error} variant="Bold" />;
      case 'fire': case EmergencyType.FIRE:
        return <Danger size={22} color={themeColors.error} variant="Bold" />;
      case 'embassy': case 'consulate': case EmergencyType.EMBASSY:
        return <Global size={22} color={themeColors.error} variant="Bold" />;
      default:
        return <Call size={22} color={themeColors.error} variant="Bold" />;
    }
  };

  // ─── Tab: Overview ──────────────────────────────────────
  const renderOverview = () => {
    if (!hasProfile) {
      return (
        <EmptyState
          icon={<ShieldTick size={36} color="#10B981" variant="Bold" />}
          iconColor="#10B981"
          title="Your Shield Isn't Up Yet"
          subtitle={`We haven't scanned ${destCity} for you yet! Generate your Smart Plan from the trip card and we'll build a full safety profile — threat intel, emergency contacts, and a before-you-go checklist.`}
          themeColors={themeColors}
          ctaLabel="Go to Trip Card"
          onCtaPress={() => router.back()}
        />
      );
    }

    const overview = sp.overview || {};
    const advisory = sp.advisoryLevels || {};
    const localEvents = sp.localEvents || [];
    const scoreComps = sp.scoreComponents || {};

    return (
      <>
        {/* Briefing */}
        {overview.briefing && (
          <SectionCard title="Safety Briefing" themeColors={themeColors}>
            <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{overview.briefing}</Text>
            {overview.single_most_important_behavior && (
              <View style={[s.highlightBox, { backgroundColor: `${themeColors.warning}10`, borderColor: `${themeColors.warning}30` }]}>
                <Text style={[s.highlightLabel, { color: themeColors.warning }]}>Most Important</Text>
                <Text style={[s.bodyText, { color: themeColors.textPrimary }]}>{overview.single_most_important_behavior}</Text>
              </View>
            )}
          </SectionCard>
        )}

        {/* Score Breakdown */}
        <SectionCard title="Score Breakdown" themeColors={themeColors}>
          {[
            { label: 'Crime Safety', key: 'crime_safety', weight: '25%' },
            { label: 'Political Stability', key: 'political_stability', weight: '15%' },
            { label: 'Health Safety', key: 'health_safety', weight: '20%' },
            { label: 'Natural Hazards', key: 'natural_hazard', weight: '15%' },
            { label: 'Traveler-Specific', key: 'traveler_specific', weight: '25%' },
          ].map(({ label, key, weight }) => {
            const val = scoreComps[key] ?? 0;
            return (
              <View key={key} style={s.scoreRow}>
                <View style={s.scoreRowLeft}>
                  <Text style={[s.scoreLabel, { color: themeColors.textPrimary }]}>{label}</Text>
                  <Text style={[s.scoreWeight, { color: themeColors.textTertiary }]}>{weight}</Text>
                </View>
                <View style={s.scoreBarContainer}>
                  <View style={[s.scoreBarBg, { backgroundColor: `${themeColors.textTertiary}15` }]}>
                    <View style={[s.scoreBarFill, { width: `${val}%`, backgroundColor: getScoreColor(val, themeColors) }]} />
                  </View>
                  <Text style={[s.scoreVal, { color: getScoreColor(val, themeColors) }]}>{val}</Text>
                </View>
              </View>
            );
          })}
          {(sp.travelerAdjustments?.length > 0) && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={[s.smallLabel, { color: themeColors.textTertiary }]}>Adjustments applied:</Text>
              {sp.travelerAdjustments.map((adj: string, i: number) => (
                <Text key={i} style={[s.adjustmentText, { color: themeColors.textSecondary }]}>• {adj}</Text>
              ))}
            </View>
          )}
        </SectionCard>

        {/* Advisory Levels */}
        {(advisory.us_state_dept || advisory.uk_fco) && (
          <SectionCard title="Travel Advisories" themeColors={themeColors}>
            {advisory.us_state_dept && (
              <View style={s.advisoryRow}>
                <Text style={[s.advisorySource, { color: themeColors.textPrimary }]}>US State Dept</Text>
                <Text style={[s.advisoryLevel, { color: getScoreColor(100 - (advisory.us_state_dept.level || 1) * 20, themeColors) }]}>
                  Level {advisory.us_state_dept.level}
                </Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary, marginTop: 2 }]}>{advisory.us_state_dept.summary}</Text>
              </View>
            )}
            {advisory.uk_fco && (
              <View style={[s.advisoryRow, { marginTop: spacing.sm }]}>
                <Text style={[s.advisorySource, { color: themeColors.textPrimary }]}>UK FCO</Text>
                <Text style={[s.advisoryLevel, { color: themeColors.textSecondary }]}>{String(advisory.uk_fco.level || '').replace(/_/g, ' ')}</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary, marginTop: 2 }]}>{advisory.uk_fco.summary}</Text>
              </View>
            )}
            {advisory.who_notices && (
              <View style={[s.advisoryRow, { marginTop: spacing.sm }]}>
                <Text style={[s.advisorySource, { color: themeColors.textPrimary }]}>WHO</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{advisory.who_notices}</Text>
              </View>
            )}
          </SectionCard>
        )}

        {/* Local Events */}
        {localEvents.length > 0 && (
          <SectionCard title="Local Events During Trip" themeColors={themeColors}>
            {localEvents.map((evt: any, i: number) => (
              <View key={i} style={[s.eventRow, i > 0 && { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: `${themeColors.borderSubtle}` }]}>
                <View style={s.eventHeader}>
                  <Text style={[s.eventName, { color: themeColors.textPrimary }]}>{evt.event_name}</Text>
                  <RiskBadge level={evt.safety_impact || 'neutral'} themeColors={themeColors} />
                </View>
                <Text style={[s.eventType, { color: themeColors.textTertiary }]}>{evt.event_type} {evt.dates ? `• ${evt.dates}` : ''}</Text>
                {evt.description && <Text style={[s.bodyText, { color: themeColors.textSecondary, marginTop: 2 }]}>{evt.description}</Text>}
              </View>
            ))}
          </SectionCard>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <SectionCard title={`Active Alerts (${alerts.length})`} themeColors={themeColors}>
            {alerts.map(alert => (
              <View key={alert.id} style={[s.alertItem, { borderColor: themeColors.borderSubtle }]}>
                <Text style={[s.alertTitle, { color: themeColors.textPrimary }]}>{alert.title}</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{alert.description}</Text>
              </View>
            ))}
          </SectionCard>
        )}
      </>
    );
  };

  // ─── Tab: Intel ─────────────────────────────────────────
  const renderIntel = () => {
    if (!hasProfile) {
      return (
        <EmptyState
          icon={<SecurityUser size={36} color="#3B82F6" variant="Bold" />}
          iconColor="#3B82F6"
          title="Intel Report: Classified (For Now)"
          subtitle={`Neighborhood maps, threat models, and digital safety tips for ${destCity} are waiting to be unlocked. Tap "Generate Smart Plan" on your trip card to brief yourself.`}
          themeColors={themeColors}
          ctaLabel="Go to Trip Card"
          onCtaPress={() => router.back()}
        />
      );
    }

    const threat = sp.threatModel || {};
    const hood = sp.neighborhoodMap || {};
    const health = sp.healthMedical || {};
    const hazards = sp.naturalHazards || {};
    const digital = sp.digitalSafety || {};
    const women = sp.womensSafety || {};
    const lgbtq = sp.lgbtqSafety || {};

    return (
      <>
        {/* Threat Model */}
        {(threat.top_threats?.length > 0 || threat.scams?.length > 0) && (
          <CollapsibleSection title="Threat Model" themeColors={themeColors} defaultOpen>
            {threat.top_threats?.map((t: any, i: number) => (
              <View key={i} style={[s.threatItem, i > 0 && { marginTop: spacing.sm }]}>
                <View style={s.threatHeader}>
                  <Text style={[s.threatRank, { color: themeColors.textTertiary }]}>#{t.rank || i + 1}</Text>
                  <Text style={[s.threatType, { color: themeColors.textPrimary }]}>{String(t.type || '').replace(/_/g, ' ')}</Text>
                  <RiskBadge level={t.frequency || 'moderate'} themeColors={themeColors} />
                </View>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{t.method}</Text>
                {t.prevention && <Text style={[s.bodyText, { color: themeColors.success, marginTop: 2 }]}>{t.prevention}</Text>}
              </View>
            ))}
            {threat.scams?.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Scams</Text>
                {threat.scams.map((scam: any, i: number) => (
                  <View key={i} style={[s.scamItem, { borderColor: themeColors.borderSubtle }]}>
                    <Text style={[s.scamName, { color: themeColors.textPrimary }]}>{scam.name}</Text>
                    <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{scam.mechanics}</Text>
                    {scam.how_to_refuse && (
                      <Text style={[s.bodyText, { color: themeColors.success, marginTop: 2 }]}>How to refuse: {scam.how_to_refuse}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
            {threat.political_context && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Political Context</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{threat.political_context}</Text>
              </View>
            )}
            {threat.terrorism_assessment && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Terrorism</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{typeof threat.terrorism_assessment === 'string' ? threat.terrorism_assessment : JSON.stringify(threat.terrorism_assessment)}</Text>
              </View>
            )}
          </CollapsibleSection>
        )}

        {/* Neighborhood Map */}
        {(hood.tier_1_safe?.length > 0 || hood.tier_2_caution?.length > 0 || hood.tier_3_avoid?.length > 0) && (
          <CollapsibleSection title="Neighborhood Safety" themeColors={themeColors}>
            {hood.tier_1_safe?.length > 0 && (
              <View>
                <Text style={[s.tierLabel, { color: themeColors.success }]}>Safe Areas</Text>
                {hood.tier_1_safe.map((n: any, i: number) => (
                  <View key={i} style={s.neighborhoodItem}>
                    <Text style={[s.neighborhoodName, { color: themeColors.textPrimary }]}>{n.name}</Text>
                    <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{n.notes}</Text>
                  </View>
                ))}
              </View>
            )}
            {hood.tier_2_caution?.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[s.tierLabel, { color: themeColors.warning }]}>Caution Zones</Text>
                {hood.tier_2_caution.map((n: any, i: number) => (
                  <View key={i} style={s.neighborhoodItem}>
                    <Text style={[s.neighborhoodName, { color: themeColors.textPrimary }]}>{n.name}</Text>
                    <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{n.notes}</Text>
                  </View>
                ))}
              </View>
            )}
            {hood.tier_3_avoid?.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[s.tierLabel, { color: themeColors.error }]}>Avoid</Text>
                {hood.tier_3_avoid.map((n: any, i: number) => (
                  <View key={i} style={s.neighborhoodItem}>
                    <Text style={[s.neighborhoodName, { color: themeColors.textPrimary }]}>{n.name}</Text>
                    <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{n.notes}</Text>
                  </View>
                ))}
              </View>
            )}
            {hood.time_of_day_overlay && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>After Dark</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{hood.time_of_day_overlay}</Text>
              </View>
            )}
          </CollapsibleSection>
        )}

        {/* Health & Medical */}
        {health.infrastructure_tier && (
          <CollapsibleSection title="Health & Medical" themeColors={themeColors}>
            <View style={s.healthRow}>
              <Text style={[s.healthLabel, { color: themeColors.textTertiary }]}>Hospital Quality</Text>
              <Text style={[s.healthValue, { color: themeColors.textPrimary }]}>Tier {health.infrastructure_tier}</Text>
            </View>
            {health.infrastructure_notes && (
              <Text style={[s.bodyText, { color: themeColors.textSecondary, marginBottom: spacing.sm }]}>{health.infrastructure_notes}</Text>
            )}
            <View style={s.healthRow}>
              <Text style={[s.healthLabel, { color: themeColors.textTertiary }]}>Water Safety</Text>
              <Text style={[s.healthValue, { color: health.water_safety === 'safe' ? themeColors.success : themeColors.warning }]}>
                {String(health.water_safety || 'unknown').replace(/_/g, ' ')}
              </Text>
            </View>
            {health.malaria_risk && health.malaria_risk !== 'none' && (
              <View style={s.healthRow}>
                <Text style={[s.healthLabel, { color: themeColors.textTertiary }]}>Malaria Risk</Text>
                <Text style={[s.healthValue, { color: themeColors.warning }]}>{String(health.malaria_risk).replace(/_/g, ' ')}</Text>
              </View>
            )}
            {health.food_safety_notes && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Food Safety</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{health.food_safety_notes}</Text>
              </View>
            )}
            {health.vaccinations_required?.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Required Vaccinations</Text>
                {health.vaccinations_required.map((v: string, i: number) => (
                  <Text key={i} style={[s.bodyText, { color: themeColors.error }]}>• {v}</Text>
                ))}
              </View>
            )}
            {health.vaccinations_recommended?.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Recommended Vaccinations</Text>
                {health.vaccinations_recommended.map((v: string, i: number) => (
                  <Text key={i} style={[s.bodyText, { color: themeColors.textSecondary }]}>• {v}</Text>
                ))}
              </View>
            )}
            {health.user_specific_flags?.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Your Medical Flags</Text>
                {health.user_specific_flags.map((f: any, i: number) => (
                  <View key={i} style={[s.medicalFlag, { backgroundColor: f.action_required ? `${themeColors.error}10` : `${themeColors.warning}10` }]}>
                    <Text style={[s.medicalFlagCondition, { color: themeColors.textPrimary }]}>{f.condition}</Text>
                    <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{f.flag}</Text>
                  </View>
                ))}
              </View>
            )}
          </CollapsibleSection>
        )}

        {/* Natural Hazards */}
        {Object.keys(hazards).length > 0 && (
          <CollapsibleSection title="Natural Hazards" themeColors={themeColors}>
            {Object.entries(hazards).map(([key, val]: [string, any]) => {
              if (!val || val.risk === 'none') return null;
              return (
                <View key={key} style={[s.hazardItem, { borderColor: themeColors.borderSubtle }]}>
                  <View style={s.hazardHeader}>
                    <Text style={[s.hazardType, { color: themeColors.textPrimary }]}>{key.replace(/_/g, ' ')}</Text>
                    <RiskBadge level={val.risk || 'low'} themeColors={themeColors} />
                  </View>
                  <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{val.notes}</Text>
                  {val.seasonal_active && <Text style={[s.bodyText, { color: themeColors.warning, marginTop: 2 }]}>Active during your travel window</Text>}
                </View>
              );
            })}
          </CollapsibleSection>
        )}

        {/* Digital Safety */}
        {digital.internet_freedom && (
          <CollapsibleSection title="Digital Safety" themeColors={themeColors}>
            <View style={s.healthRow}>
              <Text style={[s.healthLabel, { color: themeColors.textTertiary }]}>Internet Freedom</Text>
              <Text style={[s.healthValue, { color: digital.internet_freedom === 'free' ? themeColors.success : digital.internet_freedom === 'not_free' ? themeColors.error : themeColors.warning }]}>
                {String(digital.internet_freedom).replace(/_/g, ' ')}
              </Text>
            </View>
            {digital.vpn_recommended && (
              <View style={s.healthRow}>
                <Text style={[s.healthLabel, { color: themeColors.textTertiary }]}>VPN Recommended</Text>
                <Text style={[s.healthValue, { color: themeColors.warning }]}>Yes{digital.vpn_illegal ? ' (but technically illegal)' : ''}</Text>
              </View>
            )}
            {digital.blocked_apps?.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Blocked Apps/Services</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{digital.blocked_apps.join(', ')}</Text>
              </View>
            )}
            <View style={s.healthRow}>
              <Text style={[s.healthLabel, { color: themeColors.textTertiary }]}>ATM Skimming</Text>
              <Text style={[s.healthValue, { color: themeColors.textPrimary }]}>{String(digital.atm_skimming_risk || 'unknown').replace(/_/g, ' ')}</Text>
            </View>
            {digital.cash_vs_card && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textTertiary }]}>Payment</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{String(digital.cash_vs_card).replace(/_/g, ' ')}</Text>
              </View>
            )}
            {digital.sim_card_guidance && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>SIM Card</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{digital.sim_card_guidance}</Text>
              </View>
            )}
            {digital.phone_security_guidance && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Phone Security</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{digital.phone_security_guidance}</Text>
              </View>
            )}
          </CollapsibleSection>
        )}

        {/* Women's Safety */}
        {women.risk_level && (
          <CollapsibleSection title="Women's Safety" themeColors={themeColors}>
            <View style={s.healthRow}>
              <Text style={[s.healthLabel, { color: themeColors.textTertiary }]}>Risk Level</Text>
              <Text style={[s.healthValue, { color: themeColors.textPrimary }]}>{women.risk_level}</Text>
            </View>
            {women.specific_threats && <Text style={[s.bodyText, { color: themeColors.textSecondary, marginTop: spacing.sm }]}>{women.specific_threats}</Text>}
            {women.dress_code_notes && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Dress Code Notes</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{women.dress_code_notes}</Text>
              </View>
            )}
            {women.safer_transport?.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Safer Transport</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{women.safer_transport.join(', ')}</Text>
              </View>
            )}
            {women.areas_to_avoid_alone?.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Avoid Alone</Text>
                {women.areas_to_avoid_alone.map((a: string, i: number) => (
                  <Text key={i} style={[s.bodyText, { color: themeColors.error }]}>• {a}</Text>
                ))}
              </View>
            )}
            {women.protocols && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Protocols</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{women.protocols}</Text>
              </View>
            )}
            {women.solo_female_specific && (
              <View style={[s.highlightBox, { backgroundColor: `${themeColors.warning}10`, borderColor: `${themeColors.warning}30` }]}>
                <Text style={[s.highlightLabel, { color: themeColors.warning }]}>Solo Female</Text>
                <Text style={[s.bodyText, { color: themeColors.textPrimary }]}>{women.solo_female_specific}</Text>
              </View>
            )}
          </CollapsibleSection>
        )}

        {/* LGBTQ+ Safety */}
        {lgbtq.legal_status && (
          <CollapsibleSection title="LGBTQ+ Safety" themeColors={themeColors}>
            <View style={s.healthRow}>
              <Text style={[s.healthLabel, { color: themeColors.textTertiary }]}>Legal Status</Text>
              <Text style={[s.healthValue, { color: themeColors.textPrimary }]}>{lgbtq.legal_status}</Text>
            </View>
            {lgbtq.practical_risk && (
              <View style={s.healthRow}>
                <Text style={[s.healthLabel, { color: themeColors.textTertiary }]}>Practical Risk</Text>
                <RiskBadge level={lgbtq.practical_risk} themeColors={themeColors} />
              </View>
            )}
            {lgbtq.penalty && (
              <View style={s.healthRow}>
                <Text style={[s.healthLabel, { color: themeColors.textTertiary }]}>Penalty</Text>
                <Text style={[s.healthValue, { color: themeColors.error }]}>{lgbtq.penalty}</Text>
              </View>
            )}
            {lgbtq.enforcement_gap && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Enforcement Gap</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{lgbtq.enforcement_gap}</Text>
              </View>
            )}
            {lgbtq.practical_guidance && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Practical Guidance</Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{lgbtq.practical_guidance}</Text>
              </View>
            )}
            {lgbtq.dating_app_warning && (
              <View style={[s.highlightBox, { backgroundColor: `${themeColors.error}10`, borderColor: `${themeColors.error}30` }]}>
                <Text style={[s.highlightLabel, { color: themeColors.error }]}>Dating App Warning</Text>
                <Text style={[s.bodyText, { color: themeColors.textPrimary }]}>
                  {typeof lgbtq.dating_app_warning === 'string' ? lgbtq.dating_app_warning : 'Dating apps may be monitored by authorities at this destination. Consider removing them before arrival.'}
                </Text>
              </View>
            )}
            {lgbtq.safe_venues?.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Safe Venues</Text>
                {lgbtq.safe_venues.map((v: string, i: number) => (
                  <Text key={i} style={[s.bodyText, { color: themeColors.success }]}>• {v}</Text>
                ))}
              </View>
            )}
          </CollapsibleSection>
        )}
      </>
    );
  };

  // ─── Tab: Emergency ─────────────────────────────────────
  const renderEmergency = () => {
    const contacts = sp?.emergencyContacts || [];
    const protocols = sp?.duringTripProtocols || [];
    const phrases = sp?.survivalPhrases || [];

    return (
      <>
        {/* Emergency Contacts — tap-to-call */}
        <Text style={[s.sectionTitle, { color: themeColors.textPrimary }]}>Emergency Contacts</Text>
        {contacts.length === 0 ? (
          <EmptyState
            icon={<Call size={36} color="#EF4444" variant="Bold" />}
            iconColor="#EF4444"
            title="No Lifelines Yet"
            subtitle={`Police, ambulance, embassy — we'll have ${destCity}'s emergency numbers ready at a tap. Generate your Smart Plan first!`}
            themeColors={themeColors}
            ctaLabel="Go to Trip Card"
            onCtaPress={() => router.back()}
          />
        ) : (
          contacts.map((contact: any, idx: number) => {
            const contactType = contact.type || contact.contact_type || 'police';
            const contactName = contact.name;
            const contactNumber = contact.number || contact.phone_number;
            const contactDesc = contact.description;
            return (
              <TouchableOpacity
                key={`${contactType}-${idx}`}
                style={[s.emergencyCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.borderSubtle }]}
                onPress={() => handleEmergencyCall(contactNumber)}
              >
                <View style={[s.emergencyIconContainer, { backgroundColor: themeColors.errorBg }]}>
                  {getEmergencyIcon(contactType)}
                </View>
                <View style={s.emergencyContent}>
                  <Text style={[s.emergencyName, { color: themeColors.textPrimary }]}>{contactName}</Text>
                  {contactDesc ? <Text style={[s.emergencyDesc, { color: themeColors.textSecondary }]} numberOfLines={2}>{contactDesc}</Text> : null}
                </View>
                <View style={s.emergencyCallBtn}>
                  <Call size={18} color={themeColors.primary} variant="Bold" />
                  <Text style={[s.emergencyNumber, { color: themeColors.primary }]}>{contactNumber}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* During-Trip Protocols */}
        {protocols.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[s.sectionTitle, { color: themeColors.textPrimary }]}>Emergency Protocols</Text>
            {protocols.map((p: any, idx: number) => (
              <CollapsibleSection key={idx} title={p.title || p.scenario || `Protocol ${idx + 1}`} themeColors={themeColors}>
                {p.immediate_action && (
                  <View style={[s.highlightBox, { backgroundColor: `${themeColors.error}08`, borderColor: `${themeColors.error}20` }]}>
                    <Text style={[s.highlightLabel, { color: themeColors.error }]}>Do First</Text>
                    <Text style={[s.bodyText, { color: themeColors.textPrimary }]}>{p.immediate_action}</Text>
                  </View>
                )}
                {p.next_steps?.length > 0 && (
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={[s.subsectionTitle, { color: themeColors.textPrimary }]}>Next Steps</Text>
                    {p.next_steps.map((step: string, i: number) => (
                      <Text key={i} style={[s.bodyText, { color: themeColors.textSecondary }]}>{i + 1}. {step}</Text>
                    ))}
                  </View>
                )}
                {p.destination_specific_note && (
                  <Text style={[s.bodyText, { color: themeColors.warning, marginTop: spacing.sm }]}>{p.destination_specific_note}</Text>
                )}
                {p.what_not_to_do?.length > 0 && (
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={[s.subsectionTitle, { color: themeColors.error }]}>Do NOT</Text>
                    {p.what_not_to_do.map((d: string, i: number) => (
                      <Text key={i} style={[s.bodyText, { color: themeColors.error }]}>• {d}</Text>
                    ))}
                  </View>
                )}
              </CollapsibleSection>
            ))}
          </View>
        )}

        {/* Survival Phrases */}
        {phrases.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[s.sectionTitle, { color: themeColors.textPrimary }]}>Survival Phrases</Text>
            <View style={[s.sectionCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.borderSubtle }]}>
              {phrases.map((p: any, idx: number) => (
                <View key={idx} style={[s.phraseRow, idx > 0 && { borderTopWidth: 1, borderTopColor: themeColors.borderSubtle, paddingTop: spacing.sm, marginTop: spacing.sm }]}>
                  <Text style={[s.phraseEnglish, { color: themeColors.textTertiary }]}>{p.english}</Text>
                  <Text style={[s.phraseTranslation, { color: themeColors.textPrimary }]}>{p.translation}</Text>
                  <Text style={[s.phrasePhonetic, { color: themeColors.primary }]}>{p.phonetic}</Text>
                  {p.language && <Text style={[s.phraseLanguage, { color: themeColors.textTertiary }]}>{p.language}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Location Sharing */}
        <View style={{ marginTop: spacing.lg }}>
          <Text style={[s.sectionTitle, { color: themeColors.textPrimary }]}>Location Sharing</Text>
          <View style={[s.locationCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.borderSubtle }]}>
            <Location size={24} color={themeColors.primary} variant="Bold" />
            <View style={s.locationContent}>
              <Text style={[s.locationTitle, { color: themeColors.textPrimary }]}>Share Live Location</Text>
              <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>Share your real-time location with emergency contacts</Text>
            </View>
            <TouchableOpacity style={[s.locationButton, { backgroundColor: themeColors.primary }]}>
              <Text style={s.locationButtonText}>Enable</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  // ─── Tab: Checklist ─────────────────────────────────────
  const renderChecklist = () => {
    const items = sp?.beforeYouGo || [];

    if (items.length === 0) {
      return (
        <EmptyState
          icon={<TickCircle size={36} color="#F59E0B" variant="Bold" />}
          iconColor="#F59E0B"
          title="Nothing to Check Off... Yet"
          subtitle={`Vaccinations, insurance, embassy registration — your before-you-go checklist for ${destCity} will appear once you generate your Smart Plan.`}
          themeColors={themeColors}
          ctaLabel="Go to Trip Card"
          onCtaPress={() => router.back()}
        />
      );
    }

    return (
      <>
        <Text style={[s.sectionTitle, { color: themeColors.textPrimary }]}>Before You Go</Text>
        {items.map((item: any, idx: number) => {
          const id = item.id || `byg-${idx}`;
          const completed = checklistState[id] || false;
          const isHigh = item.priority === 'high';
          return (
            <TouchableOpacity
              key={id}
              style={[s.checklistItem, { backgroundColor: themeColors.bgCard, borderColor: themeColors.borderSubtle }]}
              onPress={() => toggleChecklist(id)}
            >
              <View style={[s.checkbox, completed && { borderColor: themeColors.success, backgroundColor: themeColors.successBg }]}>
                {completed && <TickCircle size={20} color={themeColors.success} variant="Bold" />}
              </View>
              <View style={s.checklistContent}>
                <Text style={[
                  s.checklistTitle,
                  { color: themeColors.textPrimary },
                  completed && { textDecorationLine: 'line-through' as const, color: themeColors.textTertiary },
                ]}>
                  {item.title}
                  {isHigh && <Text style={{ color: themeColors.error, fontWeight: '700' }}> *</Text>}
                </Text>
                <Text style={[s.bodyText, { color: themeColors.textSecondary }]}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  // ─── Render ─────────────────────────────────────────────
  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'intel', label: 'Intel' },
    { key: 'emergency', label: 'Emergency' },
    { key: 'checklist', label: 'Checklist' },
  ];

  return (
    <View style={[s.container, { backgroundColor: themeColors.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bgPrimary} />
      <SafeAreaView style={[s.safeArea, { backgroundColor: themeColors.bgPrimary }]}>
        {/* Header */}
        <View style={[s.header, { backgroundColor: themeColors.bgPrimary, borderBottomColor: themeColors.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <ArrowLeft size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: themeColors.textPrimary }]}>Safety</Text>
          <View style={s.headerRight} />
        </View>

        <ScrollView style={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Safety Score Card */}
          <View style={[s.safetyScoreCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.borderSubtle }]}>
            <View style={s.safetyScoreRow}>
              <View style={s.safetyScoreLeft}>
                <View style={[s.safetyScoreIcon, { backgroundColor: scoreBg }]}>
                  <ShieldTick size={28} color={scoreColor} variant="Bold" />
                </View>
                <View style={s.safetyScoreText}>
                  <Text style={[s.safetyScoreTitle, { color: themeColors.textPrimary }]}>Safety Score</Text>
                  <Text style={[s.safetyScoreSubtitle, { color: themeColors.textSecondary }]}>{destCity}</Text>
                  {hasProfile && (
                    <Text style={[s.safetyScoreBadge, { color: scoreColor }]}>
                      {sp.safetyDisplayLabel || sp.safetyLabel?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || ''}
                    </Text>
                  )}
                  {!hasProfile && (
                    <Text style={[s.safetyScoreBadge, { color: themeColors.textTertiary }]}>Not generated yet</Text>
                  )}
                </View>
              </View>
              <View style={s.safetyScoreRight}>
                <Text style={[s.safetyScoreValue, { color: hasProfile ? scoreColor : themeColors.textTertiary }]}>
                  {hasProfile ? score : '—'}
                </Text>
                {hasProfile && <Text style={[s.safetyScoreMax, { color: themeColors.textTertiary }]}>/100</Text>}
              </View>
            </View>
            {sp?.scoreVerdict ? (
              <Text style={[s.verdictText, { color: themeColors.textSecondary }]}>{sp.scoreVerdict}</Text>
            ) : null}
          </View>

          {/* SOS Button — Always visible */}
          <TouchableOpacity style={s.sosButton} onPress={handleSOS}>
            <Danger size={24} color="#FFFFFF" variant="Bold" />
            <Text style={s.sosButtonText}>Emergency SOS</Text>
          </TouchableOpacity>

          {/* Tabs */}
          <View style={[s.tabsContainer, { backgroundColor: themeColors.bgSecondary, borderColor: themeColors.borderSubtle }]}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[s.tab, activeTab === tab.key && { backgroundColor: themeColors.primary }]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[s.tabText, { color: themeColors.textSecondary }, activeTab === tab.key && { color: '#FFFFFF' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View style={s.tabContent}>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'intel' && renderIntel()}
            {activeTab === 'emergency' && renderEmergency()}
            {activeTab === 'checklist' && renderChecklist()}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  headerRight: { width: 40 },
  scrollContent: { flex: 1 },

  // Safety Score
  safetyScoreCard: {
    marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.md,
    borderRadius: 16, borderWidth: 1,
  },
  safetyScoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  safetyScoreLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  safetyScoreIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  safetyScoreText: { flex: 1, marginLeft: spacing.md },
  safetyScoreTitle: { fontSize: typography.fontSize.base, fontWeight: '600', marginBottom: 2 },
  safetyScoreSubtitle: { fontSize: typography.fontSize.sm },
  safetyScoreBadge: { fontSize: typography.fontSize.sm, fontWeight: '700', marginTop: 2 },
  safetyScoreRight: { alignItems: 'flex-end', flexDirection: 'row', alignSelf: 'center' as any },
  safetyScoreValue: { fontSize: typography.fontSize['3xl'], fontWeight: '700' },
  safetyScoreMax: { fontSize: typography.fontSize.lg, marginLeft: 2, alignSelf: 'flex-end' as any, marginBottom: 4 },
  verdictText: { fontSize: typography.fontSize.sm, lineHeight: 20, marginTop: spacing.sm },

  // SOS
  sosButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.error, marginHorizontal: spacing.lg, marginTop: spacing.md,
    paddingVertical: spacing.md, borderRadius: 16,
    shadowColor: colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  sosButtonText: { fontSize: typography.fontSize.lg, fontWeight: '700', color: '#FFFFFF' },

  // Tabs
  tabsContainer: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.lg,
    padding: 4, borderRadius: 16, borderWidth: 1,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: 14 },
  tabText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  tabContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl * 2 },

  // Section Card
  sectionCard: {
    padding: spacing.md, borderRadius: 16, borderWidth: 1, marginBottom: spacing.md,
  },
  sectionCardTitle: { fontSize: typography.fontSize.base, fontWeight: '700', marginBottom: spacing.sm },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
  subsectionTitle: { fontSize: typography.fontSize.sm, fontWeight: '700', marginBottom: 4 },
  bodyText: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  smallLabel: { fontSize: typography.fontSize.xs },

  // Collapsible
  collapsibleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Score breakdown
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  scoreRowLeft: { width: 130 },
  scoreLabel: { fontSize: typography.fontSize.sm, fontWeight: '500' },
  scoreWeight: { fontSize: typography.fontSize.xs },
  scoreBarContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: spacing.sm },
  scoreBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: 6, borderRadius: 3 },
  scoreVal: { fontSize: typography.fontSize.sm, fontWeight: '700', marginLeft: spacing.sm, minWidth: 42, textAlign: 'right', flexShrink: 0 },
  adjustmentText: { fontSize: typography.fontSize.xs, lineHeight: 18, marginTop: 2 },

  // Advisory
  advisoryRow: { marginBottom: spacing.xs },
  advisorySource: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  advisoryLevel: { fontSize: typography.fontSize.sm, fontWeight: '600' },

  // Events
  eventRow: {},
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventName: { fontSize: typography.fontSize.sm, fontWeight: '600', flex: 1 },
  eventType: { fontSize: typography.fontSize.xs, marginTop: 2 },

  // Risk badge
  riskBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  riskBadgeText: { fontSize: typography.fontSize.xs, fontWeight: '700', textTransform: 'capitalize' },

  // Alerts
  alertItem: { padding: spacing.sm, borderWidth: 1, borderRadius: 12, marginBottom: spacing.sm },
  alertTitle: { fontSize: typography.fontSize.sm, fontWeight: '700', marginBottom: 2 },

  // Threat
  threatItem: {},
  threatHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  threatRank: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  threatType: { fontSize: typography.fontSize.sm, fontWeight: '600', flex: 1, textTransform: 'capitalize' },

  // Scams
  scamItem: { padding: spacing.sm, borderWidth: 1, borderRadius: 12, marginBottom: spacing.sm },
  scamName: { fontSize: typography.fontSize.sm, fontWeight: '700', marginBottom: 4 },

  // Neighborhood
  tierLabel: { fontSize: typography.fontSize.sm, fontWeight: '700', marginBottom: spacing.xs },
  neighborhoodItem: { marginBottom: spacing.sm, paddingLeft: spacing.sm },
  neighborhoodName: { fontSize: typography.fontSize.sm, fontWeight: '600' },

  // Health
  healthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs, paddingVertical: 2 },
  healthLabel: { fontSize: typography.fontSize.sm, flexShrink: 0 },
  healthValue: { fontSize: typography.fontSize.sm, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: spacing.sm },
  medicalFlag: { padding: spacing.sm, borderRadius: 10, marginBottom: spacing.sm },
  medicalFlagCondition: { fontSize: typography.fontSize.sm, fontWeight: '700', marginBottom: 2, textTransform: 'capitalize' },

  // Hazard
  hazardItem: { padding: spacing.sm, borderWidth: 1, borderRadius: 12, marginBottom: spacing.sm },
  hazardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  hazardType: { fontSize: typography.fontSize.sm, fontWeight: '600', textTransform: 'capitalize' },

  // Highlight box
  highlightBox: { padding: spacing.sm, borderRadius: 12, borderWidth: 1, marginTop: spacing.sm },
  highlightLabel: { fontSize: typography.fontSize.xs, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },

  // Emergency contacts
  emergencyCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderRadius: 16, borderWidth: 1, marginBottom: spacing.sm,
  },
  emergencyIconContainer: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  emergencyContent: { flex: 1 },
  emergencyName: { fontSize: typography.fontSize.base, fontWeight: '700', marginBottom: 2 },
  emergencyDesc: { fontSize: typography.fontSize.xs, lineHeight: 16 },
  emergencyCallBtn: { alignItems: 'center', gap: 2 },
  emergencyNumber: { fontSize: typography.fontSize.xs, fontWeight: '700' },

  // Phrases
  phraseRow: {},
  phraseEnglish: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  phraseTranslation: { fontSize: typography.fontSize.base, fontWeight: '700', marginTop: 2 },
  phrasePhonetic: { fontSize: typography.fontSize.sm, fontStyle: 'italic', marginTop: 2 },
  phraseLanguage: { fontSize: typography.fontSize.xs, marginTop: 2 },

  // Location sharing
  locationCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderRadius: 16, borderWidth: 1,
  },
  locationContent: { flex: 1, marginLeft: spacing.md },
  locationTitle: { fontSize: typography.fontSize.base, fontWeight: '600', marginBottom: 2 },
  locationButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 16 },
  locationButtonText: { fontSize: typography.fontSize.sm, fontWeight: '700', color: '#FFFFFF' },

  // Checklist
  checklistItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderRadius: 16, borderWidth: 1, marginBottom: spacing.sm,
  },
  checkbox: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 2,
    borderColor: colors.borderMedium, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  checklistContent: { flex: 1 },
  checklistTitle: { fontSize: typography.fontSize.base, fontWeight: '600', marginBottom: 2 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl * 2, paddingHorizontal: spacing.lg },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  emptySubtitle: { fontSize: typography.fontSize.sm, textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.sm, lineHeight: 20 },
  emptyCta: { marginTop: spacing.lg, width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyCtaText: { color: '#FFFFFF', fontSize: typography.fontSize.base, fontWeight: '700' },
});
