/**
 * Shared types for the Trip Engagement drip engine.
 *
 * The engine is plugin-based: every content area (packing, documents, phrases,
 * itinerary, etc.) is implemented as a self-contained `NotificationModule`.
 * To add a new notification source later, drop a new module file in `modules/`
 * and register it in `registry.ts` — nothing else needs to change.
 */

export type Phase = 'before' | 'during' | 'after';

// deno-lint-ignore no-explicit-any
export type SupabaseClient = any;

export interface TripContext {
  trip: Record<string, unknown> & {
    id: string;
    user_id: string;
    title: string | null;
    start_date: string | null;
    end_date: string | null;
    destination_timezone: string | null;
    primary_destination_name: string | null;
    primary_destination_country: string | null;
    budget_total: number | null;
    budget_currency: string | null;
    expense_summary: Record<string, unknown> | null;
    notifications_enabled: boolean | null;
  };
  userId: string;
  phase: Phase;
  /** Whole days from today (user-local) until trip start. Negative once started. */
  daysUntilStart: number;
  /** 1-based day index within the trip while `during`. 0 otherwise. */
  tripDayNumber: number;
  /** Whole days since the trip ended. 0 or negative before/while traveling. */
  daysAfterEnd: number;
  /** Total trip length in days. */
  tripDayCount: number;
  /** User-local hour 0-23 used for the send window. */
  localHour: number;
  /** User-local calendar day, YYYY-MM-DD. */
  localDate: string;
  timezone: string;
  destinationName: string;
  countryName: string;
  /** How many engagement sends each module already produced today. */
  sentTodayByModule: Record<string, number>;
  /** Total engagement sends for this trip today. */
  sentTodayTotal: number;
  /** Every `module:content_ref` ever sent for this trip (dedup guard). */
  alreadySent: Set<string>;
}

export interface Candidate {
  /** Stable handle unique within (trip, module); used for dedup. */
  contentRef: string;
  title: string;
  body: string;
  /** Alert priority 1-10. Engagement content is intentionally low (3-4). */
  priority: number;
  actionUrl: string;
  icon?: string;
  context?: Record<string, unknown>;
  /** Higher = more important to surface first within its module. */
  weight: number;
}

export interface NotificationModule {
  /** Stable module key, also stored in the dedup ledger. */
  key: string;
  /** Preference category code (checked by send-notification dispatcher). */
  categoryCode: string;
  /** Alert type code stored on the alert. */
  alertTypeCode: string;
  /** Phases in which this module is allowed to emit. */
  phases: Phase[];
  /**
   * When true, the AI copywriter (Phase 3) may rewrite the selected
   * candidate's title/body to feel personal. Leave false for purely factual
   * content (documents, budget summaries) where templates are best.
   */
  personalize?: boolean;
  /**
   * Max sends per user-local day for this module in the current phase.
   * Return 0 to stay silent (e.g. outside its active window).
   */
  quota(ctx: TripContext): number;
  /**
   * Return ranked candidates (best first). Must already exclude items in
   * `ctx.alreadySent`. The engine picks at most one per run.
   */
  selectCandidates(ctx: TripContext, supabase: SupabaseClient): Promise<Candidate[]>;
}

/** Per-phase ceiling on total engagement notifications per trip per day. */
export const PHASE_DAILY_CAP: Record<Phase, number> = {
  before: 6,
  during: 3,
  after: 2,
};

/** User-local send window (inclusive start, exclusive end), 24h clock. */
export const SEND_WINDOW = { startHour: 9, endHour: 21 };

/** Low priority shared by all engagement content so it respects quiet hours. */
export const ENGAGEMENT_BASE_PRIORITY = 3;
