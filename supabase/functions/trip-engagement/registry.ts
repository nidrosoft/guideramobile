/**
 * Module registry for the Trip Engagement engine.
 *
 * This is the single place to wire up notification modules. To add a new
 * notification source (e.g. safety, deals, weather), implement a
 * `NotificationModule` in `modules/` and add it to the array below.
 */

import type { NotificationModule } from './types.ts';
import packing from './modules/packing.ts';
import documents from './modules/documents.ts';
import phrases from './modules/phrases.ts';
import cultural from './modules/cultural.ts';
import itinerary from './modules/itinerary.ts';
import budget from './modules/budget.ts';
import journal from './modules/journal.ts';

export const MODULES: NotificationModule[] = [
  packing,
  documents,
  phrases,
  cultural,
  itinerary,
  budget,
  journal,
];
