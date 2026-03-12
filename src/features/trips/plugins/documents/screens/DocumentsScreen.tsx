/**
 * DOCUMENTS PLUGIN - MAIN SCREEN
 *
 * Displays AI-generated document intelligence for trip preparation.
 * Sections: Critical Alerts, Document Groups (with checkboxes),
 * Insurance Analysis, Digital Backup, Border Entry Notes.
 *
 * Data from generate-documents edge function → document_checklists + document_items tables.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Linking,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Danger,
  TickCircle,
  InfoCircle,
  DocumentText,
  ArrowRight2,
  Refresh2,
  Warning2,
  CloseCircle,
  Clock,
  DollarCircle,
  Link21,
  Shield,
} from 'iconsax-react-native';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { useToast } from '@/contexts/ToastContext';
import * as Haptics from 'expo-haptics';
import {
  DocumentChecklist,
  DocumentItem,
  DocumentGroup,
  DocumentGroupId,
  CriticalAlert,
  DigitalBackupItem,
  BorderEntryNote,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  GROUP_META,
} from '../types/document.types';
import { documentService } from '@/services/document.service';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Status Icon Helper ─────────────────────────────────

function StatusIcon({ status, size = 18 }: { status: string; size?: number }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.not_started;
  switch (status) {
    case 'ok': return <TickCircle size={size} color={cfg.color} variant="Bold" />;
    case 'critical': return <CloseCircle size={size} color={cfg.color} variant="Bold" />;
    case 'warning': return <Warning2 size={size} color={cfg.color} variant="Bold" />;
    case 'action_required': return <Danger size={size} color={cfg.color} variant="Bold" />;
    case 'not_required': return <InfoCircle size={size} color={cfg.color} variant="Bold" />;
    default: return <InfoCircle size={size} color={cfg.color} variant="Linear" />;
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════

export default function DocumentsScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { colors: tc, isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const allTrips = useTripStore(s => s.trips);
  const trip = allTrips.find(t => t.id === tripId);

  // State
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [checklist, setChecklist] = useState<DocumentChecklist | null>(null);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | DocumentGroupId>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['alerts', 'documents']));

  const destCity = trip?.destination?.city || trip?.title || 'Trip';

  // ─── Data Loading ─────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!tripId) return;
    try {
      setLoading(true);
      const [cl, gr] = await Promise.all([
        documentService.getChecklist(tripId),
        documentService.getGroupedItems(tripId),
      ]);
      setChecklist(cl);
      setGroups(gr);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Generate / Regenerate ────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!tripId) return;
    try {
      setGenerating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await documentService.generateDocuments(tripId);
      if (result.success) {
        await loadData();
        showSuccess(`${result.totalDocuments} documents analyzed!`);
      }
    } catch (err: any) {
      console.error('Document generation failed:', err);
      showError(err.message || 'Failed to generate document checklist');
    } finally {
      setGenerating(false);
    }
  }, [tripId, loadData, showSuccess, showError]);

  // ─── Toggle Check ─────────────────────────────────────

  const handleToggleCheck = useCallback(async (item: DocumentItem) => {
    const newChecked = !item.isChecked;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update
    setGroups(prev => prev.map(g => ({
      ...g,
      items: g.items.map(i => i.id === item.id ? { ...i, isChecked: newChecked } : i),
      checkedCount: g.items.reduce((c, i) => c + (i.id === item.id ? (newChecked ? 1 : 0) : (i.isChecked ? 1 : 0)), 0),
    })));

    try {
      await documentService.toggleItemChecked(item.id, newChecked);
      await documentService.updateCheckedCount(tripId!);
    } catch {
      // Revert on error
      setGroups(prev => prev.map(g => ({
        ...g,
        items: g.items.map(i => i.id === item.id ? { ...i, isChecked: !newChecked } : i),
      })));
    }
  }, [tripId]);

  // ─── Expand/Collapse ─────────────────────────────────

  const toggleItem = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSection = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── Filtered Groups ─────────────────────────────────

  const filteredGroups = useMemo(() => {
    if (activeTab === 'all') return groups;
    return groups.filter(g => g.groupId === activeTab);
  }, [groups, activeTab]);

  // ─── Progress Stats ───────────────────────────────────

  const totalItems = groups.reduce((s, g) => s + g.totalCount, 0);
  const checkedItems = groups.reduce((s, g) => s + g.checkedCount, 0);
  const actionItems = groups.reduce((s, g) => s + g.actionRequiredCount, 0);
  const progressPct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  // ═══════════════════════════════════════════════════════
  // EMPTY STATE
  // ═══════════════════════════════════════════════════════

  if (!loading && !checklist) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.bgPrimary }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: tc.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ArrowLeft size={24} color={tc.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Documents</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Empty State */}
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: `${tc.info}12` }]}>
            <DocumentText size={48} color={tc.info} variant="Bold" />
          </View>
          <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>
            No Document Checklist Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: tc.textSecondary }]}>
            Generate a personalized document checklist for your{'\n'}
            {destCity} trip. We'll check passport validity,{'\n'}
            visa requirements, insurance gaps, and more.
          </Text>

          <View style={[styles.emptyFeatures, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
            {[
              { icon: '🛂', text: 'Passport & visa validity checks' },
              { icon: '🏥', text: 'Insurance gap analysis' },
              { icon: '📱', text: 'Digital backup protocol' },
              { icon: '🛃', text: 'Border entry intelligence' },
              { icon: '✅', text: 'Interactive preparation checklist' },
            ].map((f, i) => (
              <View key={i} style={styles.emptyFeatureRow}>
                <Text style={styles.emptyFeatureIcon}>{f.icon}</Text>
                <Text style={[styles.emptyFeatureText, { color: tc.textSecondary }]}>{f.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: tc.primary }]}
            onPress={handleGenerate}
            disabled={generating}
            activeOpacity={0.8}
          >
            {generating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <DocumentText size={20} color="#fff" variant="Bold" />
                <Text style={styles.generateBtnText}>Generate Document Checklist</Text>
              </>
            )}
          </TouchableOpacity>

          {generating && (
            <Text style={[styles.generatingHint, { color: tc.textTertiary }]}>
              Analyzing requirements for {destCity}...
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.bgPrimary }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { borderBottomColor: tc.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ArrowLeft size={24} color={tc.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Documents</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tc.primary} />
          <Text style={[styles.loadingText, { color: tc.textSecondary }]}>Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════
  // FULL STATE — DATA LOADED
  // ═══════════════════════════════════════════════════════

  const criticalAlerts = checklist?.criticalAlerts || [];
  const insurance = checklist?.insuranceAnalysis;
  const backupItems = checklist?.digitalBackupChecklist || [];
  const borderNotes = checklist?.borderEntryNotes || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ─── Header ─────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Documents</Text>
          <Text style={[styles.headerSubtitle, { color: tc.textTertiary }]}>{destCity}</Text>
        </View>
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={generating}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {generating ? (
            <ActivityIndicator size="small" color={tc.primary} />
          ) : (
            <Refresh2 size={22} color={tc.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Progress Card ──────────────────────────────── */}
        <View style={[styles.progressCard, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressTitle, { color: tc.textPrimary }]}>Preparation Progress</Text>
              <Text style={[styles.progressSubtitle, { color: tc.textSecondary }]}>
                {checkedItems}/{totalItems} documents ready
              </Text>
            </View>
            <View style={[styles.progressBadge, { backgroundColor: progressPct === 100 ? `${tc.success}15` : `${tc.primary}15` }]}>
              <Text style={[styles.progressPct, { color: progressPct === 100 ? tc.success : tc.primary }]}>{progressPct}%</Text>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: tc.bgSunken }]}>
            <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: progressPct === 100 ? tc.success : tc.primary }]} />
          </View>
          {actionItems > 0 && (
            <View style={styles.progressAlertRow}>
              <Danger size={14} color={tc.warning} variant="Bold" />
              <Text style={[styles.progressAlertText, { color: tc.warning }]}>
                {actionItems} item{actionItems !== 1 ? 's' : ''} need{actionItems === 1 ? 's' : ''} attention
              </Text>
            </View>
          )}
        </View>

        {/* ─── Critical Alerts ────────────────────────────── */}
        {criticalAlerts.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('alerts')} activeOpacity={0.7}>
              <View style={styles.sectionHeaderLeft}>
                <Danger size={20} color={tc.error} variant="Bold" />
                <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>
                  Critical Alerts ({criticalAlerts.length})
                </Text>
              </View>
              <ArrowRight2
                size={18}
                color={tc.textTertiary}
                style={{ transform: [{ rotate: expandedSections.has('alerts') ? '90deg' : '0deg' }] }}
              />
            </TouchableOpacity>
            {expandedSections.has('alerts') && criticalAlerts.map((alert: CriticalAlert, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.alertCard,
                  {
                    backgroundColor: alert.severity === 'critical' ? `${tc.error}08` : alert.severity === 'warning' ? `${tc.warning}08` : `${tc.info}08`,
                    borderColor: alert.severity === 'critical' ? `${tc.error}30` : alert.severity === 'warning' ? `${tc.warning}30` : `${tc.info}30`,
                  },
                ]}
              >
                <View style={styles.alertHeader}>
                  {alert.severity === 'critical' ? (
                    <CloseCircle size={18} color={tc.error} variant="Bold" />
                  ) : alert.severity === 'warning' ? (
                    <Warning2 size={18} color={tc.warning} variant="Bold" />
                  ) : (
                    <InfoCircle size={18} color={tc.info} variant="Bold" />
                  )}
                  <Text style={[styles.alertTitle, {
                    color: alert.severity === 'critical' ? tc.error : alert.severity === 'warning' ? tc.warning : tc.info,
                  }]}>
                    {alert.title}
                  </Text>
                </View>
                <Text style={[styles.alertDetail, { color: tc.textSecondary }]}>{alert.detail}</Text>
                {alert.action && (
                  <Text style={[styles.alertAction, { color: tc.textPrimary }]}>Action: {alert.action}</Text>
                )}
                {alert.deadline && (
                  <View style={styles.alertDeadlineRow}>
                    <Clock size={12} color={tc.textTertiary} />
                    <Text style={[styles.alertDeadline, { color: tc.textTertiary }]}>{alert.deadline}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─── Group Filter Tabs ──────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          style={styles.tabsScroll}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('all'); }}
          >
            <Text style={[styles.tabText, { color: activeTab === 'all' ? tc.primary : tc.textSecondary }]}>
              All ({totalItems})
            </Text>
          </TouchableOpacity>
          {groups.map(g => (
            <TouchableOpacity
              key={g.groupId}
              style={[styles.tab, activeTab === g.groupId && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(g.groupId); }}
            >
              <Text style={styles.tabIcon}>{g.icon}</Text>
              <Text style={[styles.tabText, { color: activeTab === g.groupId ? tc.primary : tc.textSecondary }]}>
                {GROUP_META[g.groupId]?.label || g.title}
              </Text>
              {g.actionRequiredCount > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: tc.warning }]}>
                  <Text style={styles.tabBadgeText}>{g.actionRequiredCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ─── Document Groups ────────────────────────────── */}
        <View style={styles.section}>
          {filteredGroups.map(group => (
            <View key={group.groupId} style={[styles.groupCard, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
              {/* Group Header */}
              <View style={styles.groupHeader}>
                <Text style={styles.groupIcon}>{group.icon}</Text>
                <View style={styles.groupHeaderContent}>
                  <Text style={[styles.groupTitle, { color: tc.textPrimary }]}>{group.title}</Text>
                  <Text style={[styles.groupCount, { color: tc.textTertiary }]}>
                    {group.checkedCount}/{group.totalCount} ready
                  </Text>
                </View>
                {group.actionRequiredCount > 0 && (
                  <View style={[styles.groupBadge, { backgroundColor: `${tc.warning}15` }]}>
                    <Danger size={12} color={tc.warning} variant="Bold" />
                    <Text style={[styles.groupBadgeText, { color: tc.warning }]}>{group.actionRequiredCount}</Text>
                  </View>
                )}
              </View>

              {/* Group Items */}
              {group.items.map(item => {
                const isExpanded = expandedItems.has(item.id);
                const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.not_started;
                const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;

                return (
                  <View key={item.id} style={[styles.itemRow, { borderTopColor: tc.borderSubtle }]}>
                    <View style={styles.itemMain}>
                      {/* Checkbox */}
                      <TouchableOpacity
                        style={[
                          styles.checkbox,
                          {
                            borderColor: item.isChecked ? tc.success : tc.borderSubtle,
                            backgroundColor: item.isChecked ? tc.success : 'transparent',
                          },
                        ]}
                        onPress={() => handleToggleCheck(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {item.isChecked && <TickCircle size={14} color="#fff" variant="Bold" />}
                      </TouchableOpacity>

                      {/* Content */}
                      <TouchableOpacity style={styles.itemContent} onPress={() => toggleItem(item.id)} activeOpacity={0.7}>
                        <View style={styles.itemTitleRow}>
                          <Text
                            style={[
                              styles.itemName,
                              { color: item.isChecked ? tc.textTertiary : tc.textPrimary },
                              item.isChecked && styles.itemNameChecked,
                            ]}
                            numberOfLines={isExpanded ? undefined : 1}
                          >
                            {item.name}
                          </Text>
                          <StatusIcon status={item.status} size={16} />
                        </View>

                        {/* Status + Priority badges */}
                        <View style={styles.itemBadges}>
                          <View style={[styles.statusBadge, { backgroundColor: `${statusCfg.color}12` }]}>
                            <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
                              {item.statusLabel || statusCfg.label}
                            </Text>
                          </View>
                          {(item.priority === 'critical' || item.priority === 'high') && (
                            <View style={[styles.priorityBadge, { backgroundColor: `${priorityCfg.color}12` }]}>
                              <Text style={[styles.priorityBadgeText, { color: priorityCfg.color }]}>
                                {priorityCfg.label}
                              </Text>
                            </View>
                          )}
                          {item.packReminder && (
                            <View style={[styles.packBadge, { backgroundColor: `${tc.info}12` }]}>
                              <Text style={[styles.packBadgeText, { color: tc.info }]}>Pack</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <View style={[styles.itemDetails, { backgroundColor: tc.bgSunken }]}>
                        {item.validityNote && (
                          <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: tc.textTertiary }]}>Validity</Text>
                            <Text style={[styles.detailValue, { color: tc.textPrimary }]}>{item.validityNote}</Text>
                          </View>
                        )}
                        {item.expiry && (
                          <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: tc.textTertiary }]}>Expiry</Text>
                            <Text style={[styles.detailValue, { color: tc.textPrimary }]}>{item.expiry}</Text>
                          </View>
                        )}
                        {item.processingTime && (
                          <View style={styles.detailRow}>
                            <Clock size={14} color={tc.textTertiary} />
                            <Text style={[styles.detailValue, { color: tc.textSecondary }]}>{item.processingTime}</Text>
                          </View>
                        )}
                        {item.cost && (
                          <View style={styles.detailRow}>
                            <DollarCircle size={14} color={tc.textTertiary} />
                            <Text style={[styles.detailValue, { color: tc.textSecondary }]}>{item.cost}</Text>
                          </View>
                        )}
                        {item.notes && (
                          <View style={styles.detailRow}>
                            <Text style={[styles.detailValue, { color: tc.textSecondary }]}>{item.notes}</Text>
                          </View>
                        )}
                        {item.url && (
                          <TouchableOpacity
                            style={[styles.linkBtn, { backgroundColor: `${tc.primary}10` }]}
                            onPress={() => Linking.openURL(item.url!)}
                          >
                            <Link21 size={14} color={tc.primary} />
                            <Text style={[styles.linkBtnText, { color: tc.primary }]}>Open Link</Text>
                          </TouchableOpacity>
                        )}
                        {item.deadlineDaysBeforeDeparture && (
                          <View style={[styles.deadlineBanner, { backgroundColor: `${tc.warning}08` }]}>
                            <Warning2 size={14} color={tc.warning} variant="Bold" />
                            <Text style={[styles.deadlineText, { color: tc.warning }]}>
                              Complete at least {item.deadlineDaysBeforeDeparture} days before departure
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* ─── Insurance Analysis ─────────────────────────── */}
        {insurance && insurance.overall_coverage_status && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('insurance')} activeOpacity={0.7}>
              <View style={styles.sectionHeaderLeft}>
                <Shield size={20} color={tc.info} variant="Bold" />
                <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Insurance Analysis</Text>
              </View>
              <View style={styles.sectionHeaderRight}>
                <View style={[styles.coverageBadge, {
                  backgroundColor: insurance.overall_coverage_status === 'adequate'
                    ? `${tc.success}15`
                    : insurance.overall_coverage_status === 'gaps_detected'
                    ? `${tc.warning}15`
                    : `${tc.error}15`,
                }]}>
                  <Text style={[styles.coverageBadgeText, {
                    color: insurance.overall_coverage_status === 'adequate'
                      ? tc.success
                      : insurance.overall_coverage_status === 'gaps_detected'
                      ? tc.warning
                      : tc.error,
                  }]}>
                    {insurance.overall_coverage_status === 'adequate' ? 'Adequate' :
                     insurance.overall_coverage_status === 'gaps_detected' ? 'Gaps Found' : 'No Coverage'}
                  </Text>
                </View>
                <ArrowRight2
                  size={18}
                  color={tc.textTertiary}
                  style={{ transform: [{ rotate: expandedSections.has('insurance') ? '90deg' : '0deg' }] }}
                />
              </View>
            </TouchableOpacity>

            {expandedSections.has('insurance') && (
              <View style={[styles.insuranceContent, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
                {/* Confirmed coverages */}
                {insurance.confirmed_coverages?.length > 0 && (
                  <View style={styles.insuranceBlock}>
                    <Text style={[styles.insuranceBlockTitle, { color: tc.success }]}>Confirmed Coverage</Text>
                    {insurance.confirmed_coverages.map((c: string, i: number) => (
                      <View key={i} style={styles.insuranceCoverageRow}>
                        <TickCircle size={14} color={tc.success} variant="Bold" />
                        <Text style={[styles.insuranceCoverageText, { color: tc.textSecondary }]}>{c}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Gaps */}
                {insurance.gaps?.length > 0 && (
                  <View style={styles.insuranceBlock}>
                    <Text style={[styles.insuranceBlockTitle, { color: tc.warning }]}>Coverage Gaps</Text>
                    {insurance.gaps.map((gap: any, i: number) => (
                      <View key={i} style={[styles.gapCard, { backgroundColor: tc.bgSunken, borderColor: tc.borderSubtle }]}>
                        <View style={styles.gapHeader}>
                          <Warning2 size={16} color={gap.severity === 'high' ? tc.error : tc.warning} variant="Bold" />
                          <Text style={[styles.gapTitle, { color: tc.textPrimary }]}>{gap.title}</Text>
                        </View>
                        <Text style={[styles.gapExplanation, { color: tc.textSecondary }]}>{gap.explanation}</Text>
                        {gap.what_you_need && (
                          <Text style={[styles.gapNeed, { color: tc.textPrimary }]}>Need: {gap.what_you_need}</Text>
                        )}
                        {gap.recommended_providers?.map((p: any, pi: number) => (
                          <TouchableOpacity
                            key={pi}
                            style={[styles.providerRow, { backgroundColor: `${tc.primary}06` }]}
                            onPress={() => p.url && Linking.openURL(p.url)}
                          >
                            <View>
                              <Text style={[styles.providerName, { color: tc.primary }]}>{p.name}</Text>
                              <Text style={[styles.providerInfo, { color: tc.textTertiary }]}>
                                {p.best_for} · ~{p.approx_cost}
                              </Text>
                            </View>
                            {p.url && <Link21 size={14} color={tc.primary} />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    ))}
                  </View>
                )}

                {/* Credit card note */}
                {insurance.credit_card_check_note && (
                  <View style={[styles.ccNote, { backgroundColor: `${tc.info}08` }]}>
                    <InfoCircle size={16} color={tc.info} variant="Bold" />
                    <Text style={[styles.ccNoteText, { color: tc.textSecondary }]}>
                      {insurance.credit_card_check_note}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ─── Digital Backup Checklist ───────────────────── */}
        {backupItems.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('backup')} activeOpacity={0.7}>
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionIcon}>📱</Text>
                <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>
                  Digital Backup ({backupItems.length})
                </Text>
              </View>
              <ArrowRight2
                size={18}
                color={tc.textTertiary}
                style={{ transform: [{ rotate: expandedSections.has('backup') ? '90deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {expandedSections.has('backup') && (
              <View style={[styles.backupContent, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
                {backupItems.map((item: DigitalBackupItem, idx: number) => (
                  <View key={idx} style={[styles.backupRow, idx > 0 && { borderTopColor: tc.borderSubtle, borderTopWidth: 1 }]}>
                    <View style={[styles.backupPriority, {
                      backgroundColor: item.priority === 1 ? `${tc.error}12` : `${tc.info}12`,
                    }]}>
                      <Text style={[styles.backupPriorityText, {
                        color: item.priority === 1 ? tc.error : tc.info,
                      }]}>P{item.priority}</Text>
                    </View>
                    <View style={styles.backupDetails}>
                      <Text style={[styles.backupItemText, { color: tc.textPrimary }]}>{item.item}</Text>
                      <View style={styles.backupMethods}>
                        {item.storage_methods?.map((m: string, mi: number) => (
                          <View key={mi} style={[styles.methodPill, { backgroundColor: tc.bgSunken }]}>
                            <Text style={[styles.methodText, { color: tc.textTertiary }]}>{m}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ─── Border Entry Notes ─────────────────────────── */}
        {borderNotes.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('border')} activeOpacity={0.7}>
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionIcon}>🛃</Text>
                <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>
                  Border Entry Notes
                </Text>
              </View>
              <ArrowRight2
                size={18}
                color={tc.textTertiary}
                style={{ transform: [{ rotate: expandedSections.has('border') ? '90deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {expandedSections.has('border') && borderNotes.map((note: BorderEntryNote, idx: number) => (
              <View key={idx} style={[styles.borderCard, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
                <View style={styles.borderHeader}>
                  <Text style={[styles.borderCountry, { color: tc.textPrimary }]}>{note.country}</Text>
                  <View style={[styles.entryTypeBadge, { backgroundColor: `${tc.primary}12` }]}>
                    <Text style={[styles.entryTypeText, { color: tc.primary }]}>{note.entry_type}</Text>
                  </View>
                </View>

                {note.bring_to_immigration?.length > 0 && (
                  <View style={styles.borderSection}>
                    <Text style={[styles.borderLabel, { color: tc.textTertiary }]}>Bring to Immigration</Text>
                    {note.bring_to_immigration.map((item: string, i: number) => (
                      <View key={i} style={styles.borderBullet}>
                        <Text style={[styles.bulletDot, { color: tc.primary }]}>•</Text>
                        <Text style={[styles.bulletText, { color: tc.textSecondary }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {note.common_questions?.length > 0 && (
                  <View style={styles.borderSection}>
                    <Text style={[styles.borderLabel, { color: tc.textTertiary }]}>Common Questions</Text>
                    {note.common_questions.map((q: string, i: number) => (
                      <View key={i} style={styles.borderBullet}>
                        <Text style={[styles.bulletDot, { color: tc.warning }]}>?</Text>
                        <Text style={[styles.bulletText, { color: tc.textSecondary }]}>{q}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {note.specific_notes && (
                  <View style={[styles.borderNote, { backgroundColor: `${tc.info}08` }]}>
                    <InfoCircle size={14} color={tc.info} />
                    <Text style={[styles.borderNoteText, { color: tc.textSecondary }]}>{note.specific_notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: spacing.xl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  headerSubtitle: { fontSize: typography.fontSize.xs, marginTop: 2 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { fontSize: typography.fontSize.sm },

  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyIconCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: typography.fontSize.xl, fontWeight: '700', marginBottom: spacing.sm, textAlign: 'center' as const },
  emptySubtitle: { fontSize: typography.fontSize.sm, textAlign: 'center' as const, lineHeight: 20, marginBottom: spacing.lg },
  emptyFeatures: {
    width: '100%', borderRadius: 16, padding: spacing.md, borderWidth: 1,
    marginBottom: spacing.lg, gap: spacing.sm,
  },
  emptyFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emptyFeatureIcon: { fontSize: 18 },
  emptyFeatureText: { fontSize: typography.fontSize.sm, flex: 1 },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: spacing.xl, borderRadius: 14, gap: spacing.sm,
    width: '100%',
  },
  generateBtnText: { fontSize: typography.fontSize.base, fontWeight: '700', color: '#fff' },
  generatingHint: { fontSize: typography.fontSize.xs, marginTop: spacing.sm },

  // Progress Card
  progressCard: {
    marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.md,
    borderRadius: 16, borderWidth: 1,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  progressTitle: { fontSize: typography.fontSize.base, fontWeight: '700' },
  progressSubtitle: { fontSize: typography.fontSize.xs, marginTop: 2 },
  progressBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 10 },
  progressPct: { fontSize: typography.fontSize.sm, fontWeight: '800' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' as const },
  progressFill: { height: '100%', borderRadius: 3 },
  progressAlertRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  progressAlertText: { fontSize: typography.fontSize.xs, fontWeight: '600' },

  // Section
  section: { marginTop: spacing.md },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sectionTitle: { fontSize: typography.fontSize.base, fontWeight: '700' },
  sectionIcon: { fontSize: 18 },

  // Alerts
  alertCard: { marginHorizontal: spacing.md, marginBottom: spacing.sm, padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  alertTitle: { fontSize: typography.fontSize.sm, fontWeight: '700', flex: 1 },
  alertDetail: { fontSize: typography.fontSize.sm, lineHeight: 20, marginBottom: 6 },
  alertAction: { fontSize: typography.fontSize.sm, fontWeight: '600', marginBottom: 4 },
  alertDeadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  alertDeadline: { fontSize: typography.fontSize.xs },

  // Tabs
  tabsScroll: { marginTop: spacing.sm },
  tabsContainer: { paddingHorizontal: spacing.md, gap: spacing.sm },
  tab: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'transparent', gap: 4,
  },
  tabIcon: { fontSize: 14 },
  tabText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  tabBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  // Group Card
  groupCard: { marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: 16, borderWidth: 1, overflow: 'hidden' as const },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm,
  },
  groupIcon: { fontSize: 24 },
  groupHeaderContent: { flex: 1 },
  groupTitle: { fontSize: typography.fontSize.base, fontWeight: '700' },
  groupCount: { fontSize: typography.fontSize.xs, marginTop: 2 },
  groupBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 8,
  },
  groupBadgeText: { fontSize: typography.fontSize.xs, fontWeight: '700' },

  // Item Row
  itemRow: { borderTopWidth: 1 },
  itemMain: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, gap: spacing.sm },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  itemContent: { flex: 1 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  itemName: { fontSize: typography.fontSize.sm, fontWeight: '600', flex: 1 },
  itemNameChecked: { textDecorationLine: 'line-through' as const, opacity: 0.6 },
  itemBadges: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' as const },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityBadgeText: { fontSize: 10, fontWeight: '700' },
  packBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  packBadgeText: { fontSize: 10, fontWeight: '700' },

  // Item Details
  itemDetails: { marginHorizontal: spacing.md, marginBottom: spacing.sm, padding: spacing.md, borderRadius: 10, gap: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailLabel: { fontSize: typography.fontSize.xs, fontWeight: '600', width: 60 },
  detailValue: { fontSize: typography.fontSize.sm, flex: 1 },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' as const,
  },
  linkBtnText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  deadlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6, padding: spacing.sm, borderRadius: 8,
  },
  deadlineText: { fontSize: typography.fontSize.xs, fontWeight: '600', flex: 1 },

  // Insurance
  coverageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  coverageBadgeText: { fontSize: typography.fontSize.xs, fontWeight: '700' },
  insuranceContent: { marginHorizontal: spacing.md, borderRadius: 16, borderWidth: 1, padding: spacing.md },
  insuranceBlock: { marginBottom: spacing.md },
  insuranceBlockTitle: { fontSize: typography.fontSize.sm, fontWeight: '700', marginBottom: spacing.sm },
  insuranceCoverageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  insuranceCoverageText: { fontSize: typography.fontSize.sm, flex: 1 },
  gapCard: { padding: spacing.sm, borderRadius: 10, borderWidth: 1, marginBottom: spacing.sm },
  gapHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  gapTitle: { fontSize: typography.fontSize.sm, fontWeight: '700', flex: 1 },
  gapExplanation: { fontSize: typography.fontSize.xs, lineHeight: 18, marginBottom: 6 },
  gapNeed: { fontSize: typography.fontSize.xs, fontWeight: '600', marginBottom: 6 },
  providerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.sm, borderRadius: 8, marginTop: 4,
  },
  providerName: { fontSize: typography.fontSize.sm, fontWeight: '600' },
  providerInfo: { fontSize: typography.fontSize.xs, marginTop: 2 },
  ccNote: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.sm, borderRadius: 10 },
  ccNoteText: { fontSize: typography.fontSize.xs, flex: 1, lineHeight: 18 },

  // Backup
  backupContent: { marginHorizontal: spacing.md, borderRadius: 16, borderWidth: 1, overflow: 'hidden' as const },
  backupRow: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, gap: spacing.sm },
  backupPriority: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 2 },
  backupPriorityText: { fontSize: 10, fontWeight: '800' },
  backupDetails: { flex: 1 },
  backupItemText: { fontSize: typography.fontSize.sm, fontWeight: '600', marginBottom: 6 },
  backupMethods: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' as const },
  methodPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  methodText: { fontSize: 10, fontWeight: '600' },

  // Border
  borderCard: { marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: 16, borderWidth: 1, padding: spacing.md },
  borderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  borderCountry: { fontSize: typography.fontSize.base, fontWeight: '700' },
  entryTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  entryTypeText: { fontSize: typography.fontSize.xs, fontWeight: '700' },
  borderSection: { marginBottom: spacing.sm },
  borderLabel: { fontSize: typography.fontSize.xs, fontWeight: '700', textTransform: 'uppercase' as const, marginBottom: 4, letterSpacing: 0.5 },
  borderBullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  bulletDot: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  bulletText: { fontSize: typography.fontSize.sm, flex: 1, lineHeight: 20 },
  borderNote: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.sm, borderRadius: 10, marginTop: 4 },
  borderNoteText: { fontSize: typography.fontSize.xs, flex: 1, lineHeight: 18 },
});
