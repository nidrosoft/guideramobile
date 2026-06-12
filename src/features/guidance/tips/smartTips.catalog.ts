/**
 * Smart Tips catalog (spec §3.4). Each fires once, governed by the same
 * prompt cadence caps (counts toward 3/day).
 */
import type { SmartTip, TipId } from '../types';

const t = (id: string, kind: 'title' | 'body') => `guidance.tips.${id}.${kind}`;

export const SMART_TIPS: Record<TipId, SmartTip> = {
  'tip.savedItems': {
    id: 'tip.savedItems',
    anchorId: 'home.savedButton',
    titleKey: t('savedItems', 'title'),
    bodyKey: t('savedItems', 'body'),
  },
  'tip.inbox': {
    id: 'tip.inbox',
    anchorId: 'home.notifButton',
    titleKey: t('inbox', 'title'),
    bodyKey: t('inbox', 'body'),
  },
  'tip.tripReminder': {
    id: 'tip.tripReminder',
    anchorId: 'home.tripReminder',
    titleKey: t('tripReminder', 'title'),
    bodyKey: t('tripReminder', 'body'),
  },
  'tip.categoryPills': {
    id: 'tip.categoryPills',
    anchorId: 'home.categoryPills',
    titleKey: t('categoryPills', 'title'),
    bodyKey: t('categoryPills', 'body'),
  },
  'tip.sos': {
    id: 'tip.sos',
    anchorId: 'safety.sos',
    titleKey: t('sos', 'title'),
    bodyKey: t('sos', 'body'),
  },
  'tip.checkin': {
    id: 'tip.checkin',
    anchorId: 'safety.checkin',
    titleKey: t('checkin', 'title'),
    bodyKey: t('checkin', 'body'),
  },
  'tip.rewards': {
    id: 'tip.rewards',
    anchorId: 'account.rewards',
    titleKey: t('rewards', 'title'),
    bodyKey: t('rewards', 'body'),
  },
  'tip.aiVisionLive': {
    id: 'tip.aiVisionLive',
    anchorId: 'aivision.liveMode',
    titleKey: t('aiVisionLive', 'title'),
    bodyKey: t('aiVisionLive', 'body'),
  },
  'tip.dmGuides': {
    id: 'tip.dmGuides',
    anchorId: 'guide.message',
    titleKey: t('dmGuides', 'title'),
    bodyKey: t('dmGuides', 'body'),
  },
  'tip.expenseScan': {
    id: 'tip.expenseScan',
    anchorId: 'expenses.scanButton',
    titleKey: t('expenseScan', 'title'),
    bodyKey: t('expenseScan', 'body'),
  },
  'tip.becomeGuide': {
    id: 'tip.becomeGuide',
    anchorId: 'guides.become_guide',
    titleKey: t('becomeGuide', 'title'),
    bodyKey: t('becomeGuide', 'body'),
  },
  'tip.aiAssistant': {
    id: 'tip.aiAssistant',
    anchorId: 'ai.assistantInput',
    titleKey: t('aiAssistant', 'title'),
    bodyKey: t('aiAssistant', 'body'),
  },
  'tip.flightForm': {
    id: 'tip.flightForm',
    anchorId: 'booking.flightForm',
    titleKey: t('flightForm', 'title'),
    bodyKey: t('flightForm', 'body'),
  },
  'tip.hotelForm': {
    id: 'tip.hotelForm',
    anchorId: 'booking.hotelForm',
    titleKey: t('hotelForm', 'title'),
    bodyKey: t('hotelForm', 'body'),
  },
  'tip.carForm': {
    id: 'tip.carForm',
    anchorId: 'booking.carForm',
    titleKey: t('carForm', 'title'),
    bodyKey: t('carForm', 'body'),
  },
  'tip.packingModule': {
    id: 'tip.packingModule',
    anchorId: 'plugin.packing',
    titleKey: t('packingModule', 'title'),
    bodyKey: t('packingModule', 'body'),
  },
  'tip.expensesModule': {
    id: 'tip.expensesModule',
    anchorId: 'plugin.expenses',
    titleKey: t('expensesModule', 'title'),
    bodyKey: t('expensesModule', 'body'),
  },
  'tip.journalModule': {
    id: 'tip.journalModule',
    anchorId: 'plugin.journal',
    titleKey: t('journalModule', 'title'),
    bodyKey: t('journalModule', 'body'),
  },
  'tip.tripsEmpty': {
    id: 'tip.tripsEmpty',
    anchorId: 'trips.createButton',
    titleKey: t('tripsEmpty', 'title'),
    bodyKey: t('tripsEmpty', 'body'),
  },
  'tip.savedEmpty': {
    id: 'tip.savedEmpty',
    anchorId: 'saved.empty',
    titleKey: t('savedEmpty', 'title'),
    bodyKey: t('savedEmpty', 'body'),
  },
};
