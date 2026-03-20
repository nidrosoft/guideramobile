import { supabase } from '@/lib/supabase/client';
import { invokeWithRetry } from '@/utils/retry';
import {
  Claim,
  ClaimStats,
  RightsCard,
  CompensationAnalysis,
} from '@/features/trips/plugins/compensation/types/compensation.types';

// ─── DB → Model Mappers ─────────────────────────────────

function claimFromDb(row: any): Claim {
  return {
    id: row.id,
    tripId: row.trip_id,
    bookingId: row.booking_id ?? undefined,
    rightsCardId: row.rights_card_id ?? undefined,
    type: row.type,
    status: row.status,
    provider: row.provider,
    flightNumber: row.flight_number ?? undefined,
    bookingReference: row.booking_reference ?? '',
    date: new Date(row.incident_date),
    disruptionType: row.disruption_type ?? undefined,
    delayMinutes: row.delay_minutes ?? undefined,
    cancellationReason: row.cancellation_reason ?? undefined,
    applicableRegulation: row.applicable_regulation ?? undefined,
    estimatedAmount: parseFloat(row.estimated_amount || '0'),
    currency: row.currency || 'USD',
    description: row.description || '',
    reason: row.reason || '',
    aiAnalysis: row.ai_analysis && Object.keys(row.ai_analysis).length > 0
      ? row.ai_analysis as CompensationAnalysis
      : undefined,
    aiConfidence: row.ai_confidence != null ? parseFloat(row.ai_confidence) : undefined,
    policyDetails: row.policy_details ?? undefined,
    eligibilityNotes: row.eligibility_notes ?? undefined,
    claimLetterSubject: row.claim_letter_subject ?? undefined,
    claimLetterBody: row.claim_letter_body ?? undefined,
    claimLetterNotes: row.claim_letter_notes ?? undefined,
    filingOptions: row.filing_options ?? undefined,
    gateProtocol: row.gate_protocol ?? undefined,
    airlineIntel: row.airline_intel ?? undefined,
    claimDeadline: row.claim_deadline ?? undefined,
    submittedDate: row.submitted_at ? new Date(row.submitted_at) : undefined,
    completedDate: row.completed_at ? new Date(row.completed_at) : undefined,
    analyzedAt: row.analyzed_at ? new Date(row.analyzed_at) : undefined,
    actualAmount: row.actual_amount != null ? parseFloat(row.actual_amount) : undefined,
    generatedBy: row.generated_by ?? undefined,
    documents: row.document_urls ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rightsCardFromDb(row: any): RightsCard {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    bookingId: row.booking_id ?? undefined,
    flightNumber: row.flight_number ?? undefined,
    airlineName: row.airline_name ?? undefined,
    airlineIata: row.airline_iata ?? undefined,
    departureAirport: row.departure_airport ?? undefined,
    arrivalAirport: row.arrival_airport ?? undefined,
    departureCountry: row.departure_country ?? undefined,
    arrivalCountry: row.arrival_country ?? undefined,
    departureDate: row.departure_date ?? undefined,
    scheduledDeparture: row.scheduled_departure ?? undefined,
    scheduledArrival: row.scheduled_arrival ?? undefined,
    distanceKm: row.distance_km ?? undefined,
    cabinClass: row.cabin_class ?? undefined,
    applicableRegulation: row.applicable_regulation || 'NONE',
    regulationDetails: row.regulation_details || {},
    maxCompensationAmount: row.max_compensation_amount != null
      ? parseFloat(row.max_compensation_amount) : undefined,
    compensationCurrency: row.compensation_currency || 'EUR',
    distanceTier: row.distance_tier ?? undefined,
    monitoringStatus: row.monitoring_status || 'dormant',
    lastCheckedAt: row.last_checked_at ?? undefined,
    disruptionDetected: row.disruption_detected || false,
    claimId: row.claim_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Service ────────────────────────────────────────────

class CompensationService {

  // ── Rights Cards ────────────────────────────────────────

  async getRightsCards(tripId: string): Promise<RightsCard[]> {
    const { data, error } = await supabase
      .from('compensation_rights_cards')
      .select('*')
      .eq('trip_id', tripId)
      .order('departure_date', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(rightsCardFromDb);
  }

  async createRightsCard(
    tripId: string,
    userId: string,
    input: {
      bookingId?: string;
      flightNumber?: string;
      airlineName?: string;
      airlineIata?: string;
      departureAirport?: string;
      arrivalAirport?: string;
      departureCountry?: string;
      arrivalCountry?: string;
      departureDate?: string;
      scheduledDeparture?: string;
      scheduledArrival?: string;
      distanceKm?: number;
      cabinClass?: string;
      applicableRegulation: string;
      regulationDetails: any;
      maxCompensationAmount?: number;
      compensationCurrency?: string;
      distanceTier?: string;
    },
  ): Promise<RightsCard> {
    const { data, error } = await supabase
      .from('compensation_rights_cards')
      .insert({
        trip_id: tripId,
        user_id: userId,
        booking_id: input.bookingId ?? null,
        flight_number: input.flightNumber ?? null,
        airline_name: input.airlineName ?? null,
        airline_iata: input.airlineIata ?? null,
        departure_airport: input.departureAirport ?? null,
        arrival_airport: input.arrivalAirport ?? null,
        departure_country: input.departureCountry ?? null,
        arrival_country: input.arrivalCountry ?? null,
        departure_date: input.departureDate ?? null,
        scheduled_departure: input.scheduledDeparture ?? null,
        scheduled_arrival: input.scheduledArrival ?? null,
        distance_km: input.distanceKm ?? null,
        cabin_class: input.cabinClass ?? null,
        applicable_regulation: input.applicableRegulation,
        regulation_details: input.regulationDetails,
        max_compensation_amount: input.maxCompensationAmount ?? null,
        compensation_currency: input.compensationCurrency || 'EUR',
        distance_tier: input.distanceTier ?? null,
        monitoring_status: 'dormant',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rightsCardFromDb(data);
  }

  // ── Claims CRUD ─────────────────────────────────────────

  async getClaims(tripId: string, limit = 200): Promise<Claim[]> {
    const { data, error } = await supabase
      .from('compensation_claims')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []).map(claimFromDb);
  }

  async getClaim(claimId: string): Promise<Claim | null> {
    const { data, error } = await supabase
      .from('compensation_claims')
      .select('*')
      .eq('id', claimId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data ? claimFromDb(data) : null;
  }

  async createClaim(
    tripId: string,
    userId: string,
    input: {
      type: string;
      provider: string;
      flightNumber?: string;
      bookingReference?: string;
      incidentDate: string;
      estimatedAmount: number;
      currency: string;
      description: string;
      reason: string;
      disruptionType?: string;
      delayMinutes?: number;
      cancellationReason?: string;
      rightsCardId?: string;
    },
  ): Promise<Claim> {
    const { data, error } = await supabase
      .from('compensation_claims')
      .insert({
        trip_id: tripId,
        user_id: userId,
        type: input.type,
        status: 'potential',
        provider: input.provider,
        flight_number: input.flightNumber ?? null,
        booking_reference: input.bookingReference ?? '',
        incident_date: input.incidentDate,
        estimated_amount: input.estimatedAmount,
        currency: input.currency,
        description: input.description,
        reason: input.reason,
        disruption_type: input.disruptionType ?? null,
        delay_minutes: input.delayMinutes ?? null,
        cancellation_reason: input.cancellationReason ?? null,
        rights_card_id: input.rightsCardId ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return claimFromDb(data);
  }

  async updateClaim(
    claimId: string,
    updates: Partial<Record<string, any>>,
  ): Promise<Claim> {
    const fieldMap: Record<string, string> = {
      tripId: 'trip_id',
      userId: 'user_id',
      bookingId: 'booking_id',
      rightsCardId: 'rights_card_id',
      flightNumber: 'flight_number',
      bookingReference: 'booking_reference',
      incidentDate: 'incident_date',
      estimatedAmount: 'estimated_amount',
      actualAmount: 'actual_amount',
      aiConfidence: 'ai_confidence',
      eligibilityNotes: 'eligibility_notes',
      policyDetails: 'policy_details',
      documentUrls: 'document_urls',
      submittedDate: 'submitted_at',
      completedDate: 'completed_at',
      disruptionType: 'disruption_type',
      delayMinutes: 'delay_minutes',
      cancellationReason: 'cancellation_reason',
      applicableRegulation: 'applicable_regulation',
      claimLetterSubject: 'claim_letter_subject',
      claimLetterBody: 'claim_letter_body',
      claimLetterNotes: 'claim_letter_notes',
      filingOptions: 'filing_options',
      gateProtocol: 'gate_protocol',
      airlineIntel: 'airline_intel',
      claimDeadline: 'claim_deadline',
      aiAnalysis: 'ai_analysis',
    };

    const dbUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      dbUpdates[fieldMap[key] ?? key] = value;
    }
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('compensation_claims')
      .update(dbUpdates)
      .eq('id', claimId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return claimFromDb(data);
  }

  async deleteClaim(claimId: string): Promise<void> {
    const { error } = await supabase
      .from('compensation_claims')
      .delete()
      .eq('id', claimId);

    if (error) throw new Error(error.message);
  }

  // ── AI Analysis ─────────────────────────────────────────

  async analyzeCompensation(claimId: string): Promise<{
    success: boolean;
    verdict?: string;
    confidence?: number;
    estimatedAmount?: number;
    currency?: string;
    regulation?: string;
    modelUsed?: string;
    error?: string;
  }> {
    const data = await invokeWithRetry(supabase, 'generate-compensation', { claimId }, 'fast');
    if (data?.error) throw new Error(data.error);
    return data;
  }

  // ── Claim Lifecycle ─────────────────────────────────────

  async submitClaim(claimId: string): Promise<Claim> {
    const { data, error } = await supabase
      .from('compensation_claims')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return claimFromDb(data);
  }

  async markFiled(claimId: string): Promise<Claim> {
    const { data, error } = await supabase
      .from('compensation_claims')
      .update({
        status: 'filed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return claimFromDb(data);
  }

  async markDenied(claimId: string, notes?: string): Promise<Claim> {
    const { data, error } = await supabase
      .from('compensation_claims')
      .update({
        status: 'denied',
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return claimFromDb(data);
  }

  async markPaid(claimId: string, actualAmount: number): Promise<Claim> {
    const { data, error } = await supabase
      .from('compensation_claims')
      .update({
        status: 'paid',
        actual_amount: actualAmount,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return claimFromDb(data);
  }

  async escalateClaim(claimId: string): Promise<Claim> {
    const { data, error } = await supabase
      .from('compensation_claims')
      .update({
        status: 'escalated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return claimFromDb(data);
  }

  // ── Stats ───────────────────────────────────────────────

  async getStats(tripId: string): Promise<ClaimStats> {
    const { data, error } = await supabase
      .from('compensation_claims')
      .select('*')
      .eq('trip_id', tripId);

    if (error) throw new Error(error.message);

    const claims = (data ?? []).map(claimFromDb);
    const potential = claims.filter((c) => c.status === 'potential');
    const analyzing = claims.filter((c) => c.status === 'analyzing');
    const readyToFile = claims.filter((c) => c.status === 'ready_to_file');
    const active = claims.filter((c) =>
      ['active', 'submitted', 'filed', 'acknowledged', 'under_review'].includes(c.status),
    );
    const completed = claims.filter((c) =>
      ['completed', 'paid', 'approved'].includes(c.status),
    );
    const denied = claims.filter((c) =>
      ['denied', 'rejected', 'not_eligible'].includes(c.status),
    );

    const totalPotentialAmount = [...potential, ...analyzing, ...readyToFile, ...active].reduce(
      (sum, c) => sum + c.estimatedAmount, 0,
    );
    const totalCompletedAmount = completed.reduce(
      (sum, c) => sum + (c.actualAmount ?? c.estimatedAmount), 0,
    );

    const claimsWithAmount = claims.filter((c) => c.estimatedAmount > 0);
    const averageClaimAmount =
      claimsWithAmount.length > 0
        ? claimsWithAmount.reduce((sum, c) => sum + c.estimatedAmount, 0) / claimsWithAmount.length
        : 0;

    const totalResolved = completed.length + denied.length;
    const successRate =
      totalResolved > 0
        ? Math.round((completed.length / totalResolved) * 100)
        : 0;

    return {
      totalClaims: claims.length,
      potentialClaims: potential.length,
      analyzingClaims: analyzing.length,
      readyToFileClaims: readyToFile.length,
      activeClaims: active.length,
      completedClaims: completed.length,
      deniedClaims: denied.length,
      totalPotentialAmount,
      totalCompletedAmount,
      averageClaimAmount: Math.round(averageClaimAmount * 100) / 100,
      successRate,
    };
  }

  // ── Utilities ───────────────────────────────────────────

  async clearClaims(tripId: string): Promise<void> {
    const { error: claimsErr } = await supabase
      .from('compensation_claims')
      .delete()
      .eq('trip_id', tripId);
    if (claimsErr) throw new Error(claimsErr.message);

    const { error: cardsErr } = await supabase
      .from('compensation_rights_cards')
      .delete()
      .eq('trip_id', tripId);
    if (cardsErr) throw new Error(cardsErr.message);
  }
}

export const compensationService = new CompensationService();
export default compensationService;
