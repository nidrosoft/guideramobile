import { View, Text, StyleSheet } from 'react-native';
import { InfoCircle, TickCircle, Warning2, Routing } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { getIcon } from '../../config/icons';
import { Badge } from '../badges/Badge';
import { resolveSectionConfig } from '../../config/sections.config';
import { ProvidersSection } from './ProvidersSection';
import { CommunitySection } from './CommunitySection';
import type { GuideContent, GuideSection, JourneyGuide, SectionType } from '../../types';

function SectionShell({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        {accent ? <View style={[styles.accentDot, { backgroundColor: accent }]} /> : null}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Bullets({ items, icon }: { items: string[]; icon?: 'tick' | 'warn' | 'info' }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((it, i) => (
        <View key={i} style={styles.bulletRow}>
          {icon === 'warn' ? (
            <Warning2 size={16} color="#D9893D" variant="Bold" style={styles.bulletIcon} />
          ) : icon === 'info' ? (
            <InfoCircle size={16} color={colors.primary} variant="Bold" style={styles.bulletIcon} />
          ) : (
            <TickCircle size={16} color={colors.primary} variant="Bold" style={styles.bulletIcon} />
          )}
          <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

function renderSection(section: GuideSection, accent: string, key: string) {
  switch (section.type) {
    case 'things_to_know':
      return <SectionShell key={key} title={section.title} accent={accent}><Bullets items={section.items} icon="info" /></SectionShell>;
    case 'why_here':
      return <SectionShell key={key} title={section.title} accent={accent}><BodyText text={section.body} /></SectionShell>;
    case 'costs':
      return <SectionShell key={key} title={section.title} accent={accent}><CostTable rows={section.rows} note={section.note} /></SectionShell>;
    case 'process':
      return <SectionShell key={key} title={section.title} accent={accent}><Steps steps={section.steps} accent={accent} /></SectionShell>;
    case 'logistics':
      return <SectionShell key={key} title={section.title} accent={accent}><Bullets items={section.items} icon="info" /></SectionShell>;
    case 'top_destinations':
      return <SectionShell key={key} title={section.title} accent={accent}><TopDestinations places={section.places} /></SectionShell>;
    case 'risks':
      return <SectionShell key={key} title={section.title} accent={accent}><Bullets items={section.items} icon="warn" /></SectionShell>;
    case 'aftercare':
      return (
        <SectionShell key={key} title={section.title} accent={accent}>
          {section.isNew ? <View style={styles.newRow}><Badge variant="NEW" /></View> : null}
          <Bullets items={section.items} icon="tick" />
        </SectionShell>
      );
    case 'legal':
      return <SectionShell key={key} title={section.title} accent={accent}><Bullets items={section.items} icon="info" /></SectionShell>;
    case 'faq':
      return <SectionShell key={key} title={section.title} accent={accent}><Faqs faqs={section.faqs} /></SectionShell>;
    default:
      return null;
  }
}

function BodyText({ text }: { text: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{text}</Text>;
}

function CostTable({ rows, note }: { rows: Array<{ item: string; abroad: string; home: string }>; note?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.table, { borderColor: colors.borderSubtle }]}>
      <View style={[styles.tableHead, { backgroundColor: colors.bgCard }]}>
        <Text style={[styles.thItem, { color: colors.textSecondary }]}>Item</Text>
        <Text style={[styles.thCell, { color: colors.textSecondary }]}>Abroad</Text>
        <Text style={[styles.thCell, { color: colors.textSecondary }]}>Home</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[styles.tr, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.tdItem, { color: colors.textPrimary }]}>{r.item}</Text>
          <Text style={[styles.tdCell, { color: colors.primary }]}>{r.abroad}</Text>
          <Text style={[styles.tdCell, { color: colors.textSecondary }]}>{r.home}</Text>
        </View>
      ))}
      {note ? <Text style={[styles.note, { color: colors.textSecondary }]}>{note}</Text> : null}
    </View>
  );
}

function Steps({ steps, accent }: { steps: string[]; accent: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {steps.map((s, i) => (
        <View key={i} style={styles.stepRow}>
          <View style={[styles.stepNum, { backgroundColor: `${accent}1F` }]}>
            <Text style={[styles.stepNumText, { color: accent }]}>{i + 1}</Text>
          </View>
          <Text style={[styles.bulletText, { color: colors.textSecondary, flex: 1 }]}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

function TopDestinations({ places }: { places: Array<{ name: string; note: string }> }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {places.map((p, i) => (
        <View key={i} style={[styles.placeRow, { borderColor: colors.borderSubtle }]}>
          <Routing size={16} color={colors.primary} variant="Bold" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.placeName, { color: colors.textPrimary }]}>{p.name}</Text>
            <Text style={[styles.placeNote, { color: colors.textSecondary }]}>{p.note}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Faqs({ faqs }: { faqs: Array<{ q: string; a: string }> }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      {faqs.map((f, i) => (
        <View key={i} style={{ gap: 4 }}>
          <Text style={[styles.faqQ, { color: colors.textPrimary }]}>{f.q}</Text>
          <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{f.a}</Text>
        </View>
      ))}
    </View>
  );
}

export function GuideHeader({ guide, accent }: { guide: JourneyGuide; accent: string }) {
  const { colors } = useTheme();
  const content = guide.content;
  return (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <Text style={styles.headerFlag}>{guide.flagEmoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerCountry, { color: colors.textPrimary }]}>{guide.countryName}</Text>
          {content.hero?.focus || guide.focus ? (
            <Text style={[styles.headerFocus, { color: accent }]}>{content.hero?.focus ?? guide.focus}</Text>
          ) : null}
        </View>
        {guide.isCurated ? <Badge variant="CURATED" /> : <Badge variant="AI" />}
      </View>
      {content.hero?.hook ? (
        <Text style={[styles.hook, { color: colors.textSecondary }]}>{content.hero.hook}</Text>
      ) : null}
      {content.hero?.fitTags?.length ? (
        <View style={styles.fitTags}>
          {content.hero.fitTags.map((t) => (
            <View key={t} style={[styles.fitTag, { backgroundColor: `${accent}14`, borderColor: `${accent}33` }]}>
              <Text style={[styles.fitTagText, { color: accent }]}>{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function QuickFacts({ content }: { content: GuideContent }) {
  const { colors } = useTheme();
  if (!content.quickFacts?.length) return null;
  return (
    <View style={styles.quickGrid}>
      {content.quickFacts.map((qf, i) => {
        const Icon = getIcon(qf.icon);
        return (
          <View key={i} style={[styles.quickCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
            <Icon size={18} color={colors.primary} variant="Bold" />
            <Text style={[styles.quickValue, { color: colors.textPrimary }]} numberOfLines={1}>{qf.value}</Text>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]} numberOfLines={1}>{qf.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Renders the body in the category's configured section order, injecting the
 *  client-owned providers/community blocks at their slots (spec §6.4). */
export function GuideBody({ guide, accent }: { guide: JourneyGuide; accent: string }) {
  const cfg = resolveSectionConfig(guide.categorySlug);
  const byType = new Map<SectionType, GuideSection>();
  for (const s of guide.content.sections ?? []) byType.set(s.type, s);

  const order: SectionType[] = cfg.order;
  return (
    <View>
      {order.map((type, idx) => {
        const key = `${type}-${idx}`;
        if (type === 'quick_facts') return null; // rendered above the body
        if (type === 'providers') return <ProvidersSection key={key} guide={guide} accent={accent} />;
        if (type === 'community') return <CommunitySection key={key} guide={guide} accent={accent} />;
        const section = byType.get(type);
        if (!section) return null;
        return renderSection(section, accent, key);
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.lg },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerFlag: { fontSize: 40 },
  headerCountry: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
  headerFocus: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginTop: 2 },
  hook: { fontSize: typography.fontSize.base, lineHeight: 22 },
  fitTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fitTag: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full, borderWidth: 1 },
  fitTagText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  quickCard: { width: '47%', flexGrow: 1, borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md, gap: 4 },
  quickValue: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  quickLabel: { fontSize: typography.fontSize.xs },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl, gap: spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  accentDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  newRow: { flexDirection: 'row' },

  bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bulletIcon: { marginTop: 1 },
  bulletText: { fontSize: typography.fontSize.sm, lineHeight: 20, flex: 1 },
  bodyText: { fontSize: typography.fontSize.base, lineHeight: 23 },

  table: { borderWidth: 1, borderRadius: borderRadius.lg, overflow: 'hidden' },
  tableHead: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  thItem: { flex: 1.4, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  thCell: { flex: 1, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, textAlign: 'right' },
  tr: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1 },
  tdItem: { flex: 1.4, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  tdCell: { flex: 1, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, textAlign: 'right' },
  note: { fontSize: typography.fontSize.xs, padding: spacing.md, fontStyle: 'italic' },

  stepRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },

  placeRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md },
  placeName: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
  placeNote: { fontSize: typography.fontSize.xs, marginTop: 2 },

  faqQ: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
});
