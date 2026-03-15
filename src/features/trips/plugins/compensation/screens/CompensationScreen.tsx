import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Add,
  Airplane,
  DollarCircle,
  TickCircle,
  Clock,
  Warning2,
  PercentageCircle,
  Copy,
  ExportSquare,
  Shield,
  ShieldTick,
  MagicStar,
  ArrowRight2,
} from 'iconsax-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import {
  Claim,
  ClaimStatus,
  ClaimType,
  ClaimStats,
  ClaimTypeInfo,
  RightsCard,
  CLAIM_STATUS_CONFIG,
  REGULATION_INFO,
  Regulation,
} from '../types/compensation.types';
import { useToast } from '@/contexts/ToastContext';
import AddClaimBottomSheet from '../components/AddClaimBottomSheet';
import { compensationService } from '@/services/compensation.service';
import { useAuth } from '@/context/AuthContext';
import PluginEmptyState from '@/features/trips/components/PluginEmptyState';
import PluginErrorState from '@/features/trips/components/PluginErrorState';

type TabId = 'overview' | 'active' | 'resolved';
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'active', label: 'Active' },
  { id: 'resolved', label: 'Resolved' },
];

const CLAIM_TYPES: ClaimTypeInfo[] = [
  { id: ClaimType.FLIGHT_DELAY, name: 'Flight Delay', icon: 'airplane', color: '#F59E0B', emoji: '⏰', description: 'Delayed flight compensation' },
  { id: ClaimType.FLIGHT_CANCELLATION, name: 'Flight Cancellation', icon: 'airplane', color: '#EF4444', emoji: '❌', description: 'Cancelled flight compensation' },
  { id: ClaimType.OVERBOOKING, name: 'Overbooking', icon: 'airplane', color: '#8B5CF6', emoji: '🎫', description: 'Denied boarding compensation' },
  { id: ClaimType.DENIED_BOARDING, name: 'Denied Boarding', icon: 'airplane', color: '#DC2626', emoji: '🚫', description: 'Involuntary denied boarding' },
  { id: ClaimType.MISSED_CONNECTION, name: 'Missed Connection', icon: 'airplane', color: '#F97316', emoji: '🔗', description: 'Missed connecting flight' },
  { id: ClaimType.DOWNGRADE, name: 'Downgrade', icon: 'airplane', color: '#A855F7', emoji: '⬇️', description: 'Involuntary class downgrade' },
  { id: ClaimType.LOST_BAGGAGE, name: 'Lost Baggage', icon: 'bag', color: '#EC4899', emoji: '🧳', description: 'Lost luggage compensation' },
  { id: ClaimType.DAMAGED_BAGGAGE, name: 'Damaged Baggage', icon: 'bag', color: '#F97316', emoji: '💼', description: 'Damaged luggage compensation' },
  { id: ClaimType.HOTEL_ISSUE, name: 'Hotel Issue', icon: 'building', color: '#06B6D4', emoji: '🏨', description: 'Hotel-related compensation' },
  { id: ClaimType.OTHER, name: 'Other', icon: 'more', color: '#6B7280', emoji: '📋', description: 'Other compensation claims' },
];

const ACTIVE_STATUSES = ['potential', 'analyzing', 'ready_to_file', 'submitted', 'filed', 'acknowledged', 'under_review', 'escalated'];
const RESOLVED_STATUSES = ['completed', 'paid', 'approved', 'denied', 'rejected', 'not_eligible', 'expired'];

export default function CompensationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const { profile } = useAuth();
  const tripId = params.tripId as string;
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));

  const [claims, setClaims] = useState<Claim[]>([]);
  const [rightsCards, setRightsCards] = useState<RightsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [addClaimVisible, setAddClaimVisible] = useState(false);
  const [analyzingClaimId, setAnalyzingClaimId] = useState<string | null>(null);
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [claimsData, cardsData] = await Promise.all([
        compensationService.getClaims(tripId),
        compensationService.getRightsCards(tripId),
      ]);
      setClaims(claimsData);
      setRightsCards(cardsData);
    } catch (err: any) {
      console.error('Failed to load compensation data:', err);
      setFetchError(err.message || 'Failed to load compensation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tripId]);

  const stats: ClaimStats = useMemo(() => {
    const pot = claims.filter(c => c.status === 'potential');
    const ana = claims.filter(c => c.status === 'analyzing');
    const rtf = claims.filter(c => c.status === 'ready_to_file');
    const act = claims.filter(c => ACTIVE_STATUSES.includes(c.status) && !['potential', 'analyzing', 'ready_to_file'].includes(c.status));
    const comp = claims.filter(c => ['completed', 'paid', 'approved'].includes(c.status));
    const den = claims.filter(c => ['denied', 'rejected', 'not_eligible'].includes(c.status));
    const allAct = [...pot, ...ana, ...rtf, ...act];
    const totalPot = allAct.reduce((s, c) => s + c.estimatedAmount, 0);
    const totalComp = comp.reduce((s, c) => s + (c.actualAmount ?? c.estimatedAmount), 0);
    const withAmt = claims.filter(c => c.estimatedAmount > 0);
    const avgAmt = withAmt.length > 0 ? withAmt.reduce((s, c) => s + c.estimatedAmount, 0) / withAmt.length : 0;
    const totalRes = comp.length + den.length;
    return {
      totalClaims: claims.length, potentialClaims: pot.length, analyzingClaims: ana.length,
      readyToFileClaims: rtf.length, activeClaims: act.length, completedClaims: comp.length,
      deniedClaims: den.length, totalPotentialAmount: totalPot, totalCompletedAmount: totalComp,
      averageClaimAmount: Math.round(avgAmt * 100) / 100,
      successRate: totalRes > 0 ? Math.round((comp.length / totalRes) * 100) : 0,
    };
  }, [claims]);

  const handleAnalyze = useCallback(async (claimId: string) => {
    setAnalyzingClaimId(claimId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await compensationService.analyzeCompensation(claimId);
      const updated = await compensationService.getClaim(claimId);
      if (updated) setClaims(prev => prev.map(c => c.id === claimId ? updated : c));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess(`Analysis complete! ${result.verdict} (${result.confidence}%)`);
      setExpandedClaimId(claimId);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(err.message || 'Analysis failed');
    } finally { setAnalyzingClaimId(null); }
  }, [showSuccess, showError]);

  const handleCopyLetter = useCallback(async (claim: Claim) => {
    if (!claim.claimLetterBody) return;
    await Clipboard.setStringAsync(claim.claimLetterBody);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess('Letter copied!');
  }, [showSuccess]);

  const fmtCur = (amount: number, cur?: string) => {
    const sym = cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : cur === 'CAD' ? 'C$' : '$';
    return `${sym}${amount.toLocaleString()}`;
  };
  const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const typeInfo = (t: ClaimType) => CLAIM_TYPES.find(x => x.id === t) || CLAIM_TYPES[CLAIM_TYPES.length - 1];
  const verdictStyle = (v?: string) => {
    switch (v) {
      case 'eligible': return { bg: '#10B98115', clr: '#10B981', lbl: 'Eligible' };
      case 'likely_eligible': return { bg: '#3B82F615', clr: '#3B82F6', lbl: 'Likely Eligible' };
      case 'unlikely_eligible': return { bg: '#F59E0B15', clr: '#F59E0B', lbl: 'Unlikely' };
      case 'not_eligible': return { bg: '#EF444415', clr: '#EF4444', lbl: 'Not Eligible' };
      default: return { bg: '#6B728015', clr: '#6B7280', lbl: 'Pending' };
    }
  };

  if (!trip) return <SafeAreaView style={[styles.ctr, { backgroundColor: colors.bgPrimary }]}><Text style={{ color: colors.textPrimary }}>Trip not found</Text></SafeAreaView>;
  if (loading) return <View style={[styles.ctr, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (fetchError) return <View style={[styles.ctr, { backgroundColor: colors.bgPrimary }]}><PluginErrorState message={fetchError} onRetry={fetchData} /></View>;

  if (claims.length === 0 && rightsCards.length === 0) {
    return (
      <>
        <PluginEmptyState
          headerTitle="Compensation"
          icon={<ShieldTick size={36} color="#8B5CF6" variant="Bold" />}
          iconColor="#8B5CF6"
          title="No Claims Yet"
          subtitle="Flight delayed? Baggage lost? Add a compensation claim and our AI will analyze your rights, draft a claim letter, and guide you through the process."
          ctaLabel="Add Claim"
          onCtaPress={() => setAddClaimVisible(true)}
          headerRight={
            <TouchableOpacity
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.primary}12`, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setAddClaimVisible(true)}
            >
              <Add size={24} color={colors.primary} variant="Bold" />
            </TouchableOpacity>
          }
        />
        <AddClaimBottomSheet
          visible={addClaimVisible}
          onClose={() => setAddClaimVisible(false)}
          onSubmit={async (claimData) => {
            try {
              const newClaim = await compensationService.createClaim(tripId, profile?.id ?? '', {
                type: claimData.type,
                provider: claimData.provider,
                flightNumber: claimData.flightNumber,
                bookingReference: claimData.bookingReference,
                incidentDate: claimData.date instanceof Date ? claimData.date.toISOString() : claimData.date,
                estimatedAmount: claimData.estimatedAmount,
                currency: claimData.currency || 'USD',
                description: claimData.description,
                reason: claimData.reason,
              });
              setClaims(prev => [newClaim, ...prev]);
              showSuccess('Claim added!');
              setAddClaimVisible(false);
            } catch (err: any) { console.error('Failed to create claim:', err); showError(err.message || 'Failed to create claim'); }
          }}
        />
      </>
    );
  }

  const activeClaims = claims.filter(c => ACTIVE_STATUSES.includes(c.status));
  const resolvedClaims = claims.filter(c => RESOLVED_STATUSES.includes(c.status));
  const displayClaims = activeTab === 'active' ? activeClaims : activeTab === 'resolved' ? resolvedClaims : claims;

  // ── Render Claim Card ──────────────────
  const renderClaim = (claim: Claim) => {
    const ti = typeInfo(claim.type);
    const sc = CLAIM_STATUS_CONFIG[claim.status] || { label: claim.status, color: '#6B7280' };
    const isAna = analyzingClaimId === claim.id;
    const isExp = expandedClaimId === claim.id;
    const hasAI = !!claim.aiAnalysis;
    const vs = verdictStyle(claim.aiAnalysis?.eligibility?.verdict);
    const isRes = RESOLVED_STATUSES.includes(claim.status);
    const isPaid = ['paid', 'completed', 'approved'].includes(claim.status);

    return (
      <TouchableOpacity key={claim.id} style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
        activeOpacity={0.7} onPress={() => setExpandedClaimId(isExp ? null : claim.id)}>
        {isRes && (
          <View style={[styles.resBanner, { backgroundColor: isPaid ? '#10B981' : '#EF4444' }]}>
            <Text style={styles.resBannerTxt}>{isPaid ? 'Successfully Claimed' : sc.label}</Text>
          </View>
        )}
        {/* Header */}
        <View style={styles.cardHdr}>
          <View style={styles.cardHdrLeft}>
            <Text style={{ fontSize: 20 }}>{ti.emoji}</Text>
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text style={[styles.cardType, { color: colors.textPrimary }]}>{ti.name}</Text>
              <Text style={[styles.cardProv, { color: colors.textSecondary }]}>{claim.provider}{claim.flightNumber ? ` · ${claim.flightNumber}` : ''}</Text>
            </View>
          </View>
          <View style={[styles.stsBadge, { backgroundColor: `${sc.color}15` }]}>
            <Text style={[styles.stsBadgeTxt, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>
        {/* Amount row */}
        <View style={styles.amtRow}>
          <View>
            <Text style={[styles.amtLbl, { color: colors.textSecondary }]}>Estimated</Text>
            <Text style={[styles.amtVal, { color: colors.textPrimary }]}>{fmtCur(claim.estimatedAmount, claim.currency)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.amtLbl, { color: colors.textSecondary }]}>Date</Text>
            <Text style={[styles.dateVal, { color: colors.textPrimary }]}>{fmtDate(claim.date)}</Text>
          </View>
        </View>
        {/* AI Confidence */}
        {hasAI && claim.aiConfidence != null && (
          <View style={styles.confSec}>
            <View style={styles.confHdr}>
              <Text style={[styles.confLbl, { color: colors.textSecondary }]}>AI Confidence</Text>
              <Text style={[styles.confVal, { color: vs.clr }]}>{claim.aiConfidence}%</Text>
            </View>
            <View style={[styles.confBar, { backgroundColor: colors.bgSecondary }]}>
              <View style={[styles.confFill, { width: `${Math.min(claim.aiConfidence, 100)}%`, backgroundColor: vs.clr }]} />
            </View>
            <View style={[styles.vBadge, { backgroundColor: vs.bg }]}>
              <Text style={[styles.vTxt, { color: vs.clr }]}>{vs.lbl}</Text>
            </View>
          </View>
        )}
        {/* Regulation badge */}
        {claim.applicableRegulation && claim.applicableRegulation !== 'NONE' && (
          <View style={[styles.regRow, { borderTopColor: colors.borderSubtle }]}>
            <Shield size={16} color={colors.purple} variant="Bold" />
            <Text style={[styles.regTxt, { color: colors.textSecondary }]}>
              {REGULATION_INFO[claim.applicableRegulation as Regulation]?.name || claim.applicableRegulation}
            </Text>
          </View>
        )}
        {/* Analyze button */}
        {!hasAI && !isRes && (
          <TouchableOpacity style={[styles.anaBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleAnalyze(claim.id)} disabled={isAna}>
            {isAna ? <ActivityIndicator size="small" color="#FFF" /> : (
              <><MagicStar size={18} color="#FFF" variant="Bold" /><Text style={styles.anaBtnTxt}>Analyze with AI</Text></>
            )}
          </TouchableOpacity>
        )}
        {/* Expanded analysis */}
        {isExp && hasAI && (
          <View style={[styles.expSec, { borderTopColor: colors.borderSubtle }]}>
            {claim.aiAnalysis?.eligibility?.reasoning && (
              <View style={styles.expBlk}>
                <Text style={[styles.expTitle, { color: colors.textPrimary }]}>Eligibility Analysis</Text>
                <Text style={[styles.expText, { color: colors.textSecondary }]}>{claim.aiAnalysis.eligibility.reasoning}</Text>
                {claim.aiAnalysis.eligibility.caveats?.map((cv: string, i: number) => (
                  <Text key={i} style={[styles.cavTxt, { color: '#F59E0B' }]}>⚠️ {cv}</Text>
                ))}
              </View>
            )}
            {claim.aiAnalysis?.compensation && (
              <View style={styles.expBlk}>
                <Text style={[styles.expTitle, { color: colors.textPrimary }]}>Compensation</Text>
                <Text style={[styles.expText, { color: colors.textSecondary }]}>{claim.aiAnalysis.compensation.calculation}</Text>
                <View style={[styles.compBox, { backgroundColor: `${colors.primary}10` }]}>
                  <Text style={[styles.compAmt, { color: colors.primary }]}>
                    {fmtCur(claim.aiAnalysis.compensation.totalAmount, claim.aiAnalysis.compensation.currency)}
                  </Text>
                  <Text style={[styles.compNote, { color: colors.textSecondary }]}>
                    {claim.aiAnalysis.compensation.numberOfPassengers} pax × {fmtCur(claim.aiAnalysis.compensation.amountPerPassenger, claim.aiAnalysis.compensation.currency)}
                  </Text>
                </View>
              </View>
            )}
            {claim.gateProtocol && claim.gateProtocol.length > 0 && (
              <View style={styles.expBlk}>
                <Text style={[styles.expTitle, { color: colors.textPrimary }]}>Gate Protocol</Text>
                {claim.gateProtocol.map((step: any, i: number) => (
                  <View key={i} style={styles.protoStep}>
                    <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                      <Text style={styles.stepNumTxt}>{step.step}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stepAct, { color: colors.textPrimary }]}>{step.action}</Text>
                      <Text style={[styles.stepRsn, { color: colors.textTertiary }]}>{step.reason}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            {claim.claimLetterBody && (
              <View style={styles.expBlk}>
                <View style={styles.ltrHdr}>
                  <Text style={[styles.expTitle, { color: colors.textPrimary }]}>Claim Letter</Text>
                  <TouchableOpacity onPress={() => handleCopyLetter(claim)} style={styles.cpBtn}>
                    <Copy size={16} color={colors.primary} /><Text style={[styles.cpBtnTxt, { color: colors.primary }]}>Copy</Text>
                  </TouchableOpacity>
                </View>
                {claim.claimLetterSubject && <Text style={[styles.ltrSubj, { color: colors.textPrimary }]}>Subject: {claim.claimLetterSubject}</Text>}
                <View style={[styles.ltrBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.ltrBody, { color: colors.textSecondary }]} numberOfLines={8}>{claim.claimLetterBody}</Text>
                </View>
              </View>
            )}
            {claim.filingOptions && claim.filingOptions.length > 0 && (
              <View style={styles.expBlk}>
                <Text style={[styles.expTitle, { color: colors.textPrimary }]}>Filing Options</Text>
                {claim.filingOptions.map((opt: any, i: number) => (
                  <TouchableOpacity key={i} style={[styles.fileOpt, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}
                    onPress={() => opt.url && Linking.openURL(opt.url)} disabled={!opt.url}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.fileOptHdr}>
                        <Text style={[styles.fileOptName, { color: colors.textPrimary }]}>{opt.rank}. {opt.name}</Text>
                        {opt.recommended && (
                          <View style={[styles.recBadge, { backgroundColor: `${colors.primary}15` }]}>
                            <Text style={[styles.recTxt, { color: colors.primary }]}>Recommended</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.fileOptMeta, { color: colors.textTertiary }]}>{opt.costToPassenger || opt.cost_to_passenger} · {opt.typicalResponseTime || opt.typical_response_time}</Text>
                    </View>
                    {opt.url && <ExportSquare size={16} color={colors.textTertiary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {claim.claimDeadline?.deadlineDate && (
              <View style={[styles.dlCard, {
                backgroundColor: claim.claimDeadline.urgency === 'critical' ? '#EF444415' : claim.claimDeadline.urgency === 'high' ? '#F59E0B15' : `${colors.primary}10`,
              }]}>
                <Clock size={16} color={claim.claimDeadline.urgency === 'critical' ? '#EF4444' : claim.claimDeadline.urgency === 'high' ? '#F59E0B' : colors.primary} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={[styles.dlTxt, { color: colors.textPrimary }]}>Deadline: {claim.claimDeadline.deadlineDate}</Text>
                  <Text style={[styles.dlNote, { color: colors.textSecondary }]}>{claim.claimDeadline.note}</Text>
                </View>
              </View>
            )}
          </View>
        )}
        {hasAI && (
          <View style={[styles.expInd, { borderTopColor: colors.borderSubtle }]}>
            <Text style={[styles.expIndTxt, { color: colors.textTertiary }]}>{isExp ? 'Tap to collapse' : 'Tap to view analysis'}</Text>
            <ArrowRight2 size={14} color={colors.textTertiary} style={{ transform: [{ rotate: isExp ? '90deg' : '0deg' }] }} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ── Render Rights Card ──────────────────
  const renderRightsCard = (card: RightsCard) => {
    const regInfo = REGULATION_INFO[card.applicableRegulation as Regulation] || REGULATION_INFO.NONE;
    return (
      <View key={card.id} style={[styles.rCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
        <View style={styles.rCardHdr}>
          <View style={[styles.regBdg, { backgroundColor: `${colors.purple}15` }]}>
            <Text style={{ fontSize: 14 }}>{regInfo.flag}</Text>
            <Text style={[styles.regBdgTxt, { color: colors.purple }]}>{card.applicableRegulation}</Text>
          </View>
          {card.maxCompensationAmount != null && (
            <Text style={[styles.rMaxAmt, { color: colors.textPrimary }]}>Up to {fmtCur(card.maxCompensationAmount, card.compensationCurrency)}</Text>
          )}
        </View>
        <Text style={[styles.rRoute, { color: colors.textPrimary }]}>{card.departureAirport || '???'} → {card.arrivalAirport || '???'}</Text>
        <Text style={[styles.rFlight, { color: colors.textSecondary }]}>{card.airlineName || card.flightNumber || 'Unknown'}{card.departureDate ? ` · ${card.departureDate}` : ''}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.ctr, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgPrimary} />
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
        {/* Header */}
        <View style={[styles.hdr, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color={colors.textPrimary} /></TouchableOpacity>
          <Text style={[styles.hdrTitle, { color: colors.textPrimary }]}>Compensation Tracker</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: `${colors.primary}12` }]} onPress={() => setAddClaimVisible(true)}>
            <Add size={24} color={colors.primary} variant="Bold" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Summary Stats */}
          <View style={[styles.sumCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
            <View style={styles.sumRow}>
              <View style={styles.sumItem}>
                <DollarCircle size={20} color={colors.primary} variant="Bold" />
                <Text style={[styles.sumVal, { color: colors.textPrimary }]}>{fmtCur(stats.totalPotentialAmount)}</Text>
                <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Potential</Text>
              </View>
              <View style={[styles.sumDiv, { backgroundColor: colors.borderSubtle }]} />
              <View style={styles.sumItem}>
                <TickCircle size={20} color="#10B981" variant="Bold" />
                <Text style={[styles.sumVal, { color: colors.textPrimary }]}>{fmtCur(stats.totalCompletedAmount)}</Text>
                <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Recovered</Text>
              </View>
              <View style={[styles.sumDiv, { backgroundColor: colors.borderSubtle }]} />
              <View style={styles.sumItem}>
                <PercentageCircle size={20} color={colors.purple} variant="Bold" />
                <Text style={[styles.sumVal, { color: colors.textPrimary }]}>{stats.successRate}%</Text>
                <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Success</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={[styles.tabs, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
            {TABS.map(tab => (
              <TouchableOpacity key={tab.id} style={[styles.tab, activeTab === tab.id && { backgroundColor: colors.primary }]}
                onPress={() => setActiveTab(tab.id)}>
                <Text style={[styles.tabTxt, { color: activeTab === tab.id ? '#FFF' : colors.textSecondary }]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Rights Cards (overview only) */}
          {activeTab === 'overview' && rightsCards.length > 0 && (
            <View style={styles.sec}>
              <Text style={[styles.secTitle, { color: colors.textPrimary }]}>Your Flight Rights</Text>
              {rightsCards.map(renderRightsCard)}
            </View>
          )}

          {/* Claims */}
          <View style={styles.sec}>
            <Text style={[styles.secTitle, { color: colors.textPrimary }]}>
              {activeTab === 'active' ? 'Active Claims' : activeTab === 'resolved' ? 'Resolved Claims' : 'All Claims'}
              {' '}({displayClaims.length})
            </Text>
            {displayClaims.length === 0 ? (
              <View style={styles.empty}>
                <Warning2 size={48} color={colors.textTertiary} variant="Bulk" />
                <Text style={[styles.emptyTxt, { color: colors.textPrimary }]}>
                  {activeTab === 'overview' ? 'No claims yet' : activeTab === 'active' ? 'No active claims' : 'No resolved claims'}
                </Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Tap + to add a compensation claim for any travel disruption
                </Text>
              </View>
            ) : (
              displayClaims.map(renderClaim)
            )}
          </View>

          <View style={{ height: spacing.xl * 2 }} />
        </ScrollView>

        <AddClaimBottomSheet
          visible={addClaimVisible}
          onClose={() => setAddClaimVisible(false)}
          onSubmit={async (claimData) => {
            try {
              const newClaim = await compensationService.createClaim(tripId, profile?.id ?? '', {
                type: claimData.type,
                provider: claimData.provider,
                flightNumber: claimData.flightNumber,
                bookingReference: claimData.bookingReference,
                incidentDate: claimData.date instanceof Date ? claimData.date.toISOString() : claimData.date,
                estimatedAmount: claimData.estimatedAmount,
                currency: claimData.currency || 'USD',
                description: claimData.description,
                reason: claimData.reason,
              });
              setClaims(prev => [newClaim, ...prev]);
              showSuccess('Claim added!');
              setAddClaimVisible(false);
            } catch (err: any) { console.error('Failed to create claim:', err); showError(err.message || 'Failed to create claim'); }
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  ctr: { flex: 1 },
  safe: { flex: 1 },
  hdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hdrTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  // Summary
  sumCard: { marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.md, borderRadius: borderRadius['2xl'], borderWidth: 1 },
  sumRow: { flexDirection: 'row', alignItems: 'center' },
  sumItem: { flex: 1, alignItems: 'center', gap: 4 },
  sumVal: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  sumLbl: { fontSize: typography.fontSize.xs },
  sumDiv: { width: 1, height: 40 },
  // Tabs
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: 4, borderRadius: 12, borderWidth: 1 },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: 8 },
  tabTxt: { fontSize: typography.fontSize.sm, fontWeight: '600' },
  // Section
  sec: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  secTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
  // Rights Card
  rCard: { padding: spacing.md, borderRadius: borderRadius['2xl'], borderWidth: 1, marginBottom: spacing.md },
  rCardHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  regBdg: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full, gap: 4 },
  regBdgTxt: { fontSize: typography.fontSize.xs, fontWeight: '700' },
  rMaxAmt: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  rRoute: { fontSize: typography.fontSize.base, fontWeight: '600', marginBottom: 2 },
  rFlight: { fontSize: typography.fontSize.sm },
  // Claim Card
  card: { borderRadius: borderRadius['2xl'], borderWidth: 1, marginBottom: spacing.md, overflow: 'hidden' },
  resBanner: { paddingVertical: spacing.sm, alignItems: 'center' },
  resBannerTxt: { fontSize: typography.fontSize.sm, fontWeight: '700', color: '#FFF' },
  cardHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, paddingBottom: 0 },
  cardHdrLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardType: { fontSize: typography.fontSize.base, fontWeight: '600' },
  cardProv: { fontSize: typography.fontSize.sm },
  stsBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  stsBadgeTxt: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  amtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: spacing.md, paddingTop: spacing.md },
  amtLbl: { fontSize: typography.fontSize.xs, marginBottom: 2 },
  amtVal: { fontSize: typography.fontSize['2xl'], fontWeight: '700' },
  dateVal: { fontSize: typography.fontSize.sm, fontWeight: '600' },
  // Confidence
  confSec: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  confHdr: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  confLbl: { fontSize: typography.fontSize.xs },
  confVal: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  confBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.sm },
  confFill: { height: '100%', borderRadius: 3 },
  vBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  vTxt: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  // Regulation
  regRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, marginTop: spacing.md },
  regTxt: { fontSize: typography.fontSize.sm },
  // Analyze
  anaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.md, paddingVertical: 12, borderRadius: borderRadius.lg },
  anaBtnTxt: { fontSize: typography.fontSize.sm, fontWeight: '600', color: '#FFF' },
  // Expanded
  expSec: { borderTopWidth: 1, marginTop: spacing.md, paddingTop: spacing.md },
  expBlk: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  expTitle: { fontSize: typography.fontSize.base, fontWeight: '700', marginBottom: 6 },
  expText: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  cavTxt: { fontSize: typography.fontSize.sm, marginTop: 4 },
  compBox: { padding: spacing.md, borderRadius: borderRadius.lg, marginTop: spacing.sm, alignItems: 'center' },
  compAmt: { fontSize: typography.fontSize['2xl'], fontWeight: '700' },
  compNote: { fontSize: typography.fontSize.xs, marginTop: 2 },
  protoStep: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNumTxt: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  stepAct: { fontSize: typography.fontSize.sm, fontWeight: '600' },
  stepRsn: { fontSize: typography.fontSize.xs, marginTop: 2 },
  ltrHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cpBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cpBtnTxt: { fontSize: typography.fontSize.sm, fontWeight: '600' },
  ltrSubj: { fontSize: typography.fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  ltrBox: { padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1 },
  ltrBody: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  fileOpt: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.sm },
  fileOptHdr: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  fileOptName: { fontSize: typography.fontSize.sm, fontWeight: '600' },
  fileOptMeta: { fontSize: typography.fontSize.xs },
  recBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.full },
  recTxt: { fontSize: 10, fontWeight: '600' },
  dlCard: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, borderRadius: borderRadius.lg, marginHorizontal: spacing.md, marginBottom: spacing.md },
  dlTxt: { fontSize: typography.fontSize.sm, fontWeight: '600' },
  dlNote: { fontSize: typography.fontSize.xs, marginTop: 2 },
  expInd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: spacing.sm, borderTopWidth: 1, marginTop: spacing.sm },
  expIndTxt: { fontSize: typography.fontSize.xs },
  // Empty
  empty: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  emptyTxt: { fontSize: typography.fontSize.lg, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.sm },
  emptySub: { fontSize: typography.fontSize.sm, textAlign: 'center', paddingHorizontal: spacing.lg },
});
