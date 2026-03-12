import { supabase } from '@/lib/supabase/client';

export interface ItineraryDay {
  id: string;
  tripId: string;
  dayNumber: number;
  date: string;
  title?: string;
  theme?: string;
  dayType?: string;
  neighborhoodFocus?: string;
  dayOfWeek?: string;
  location?: string;
  hotel?: string;
  notes?: string;
  weather?: Record<string, any>;
  estimatedCost?: number;
  currency?: string;
  logistics?: Record<string, any>;
  warnings?: string[];
  activities: ItineraryActivity[];
}

export interface ItineraryActivity {
  id: string;
  dayId: string;
  bookingId?: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  location?: { name?: string; address?: string; lat?: number; lng?: number };
  cost?: { amount?: number; currency?: string };
  icon?: string;
  color?: string;
  imageUrl?: string;
  bookingRequired?: boolean;
  bookingUrl?: string;
  tips?: string[];
  position: number;
}

export interface GenerationStatus {
  itinerary?: 'idle' | 'generating' | 'ready' | 'failed';
  itinerary_generated_at?: string;
  itinerary_model?: string;
  itinerary_summary?: any;
  error?: string;
  started_at?: string;
  failed_at?: string;
}

class PlannerService {
  async generateItinerary(tripId: string): Promise<{
    success: boolean;
    daysGenerated?: number;
    activitiesGenerated?: number;
    error?: string;
  }> {
    const { data, error } = await supabase.functions.invoke('generate-itinerary', {
      body: { tripId },
    });

    if (error) throw new Error(`Generation failed: ${error.message}`);
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async getGenerationStatus(tripId: string): Promise<GenerationStatus> {
    const { data, error } = await supabase
      .from('trips')
      .select('generation_status')
      .eq('id', tripId)
      .single();

    if (error) return { itinerary: 'idle' };
    return (data?.generation_status as GenerationStatus) || { itinerary: 'idle' };
  }

  async clearItinerary(tripId: string): Promise<void> {
    const { data: existingDays } = await supabase
      .from('itinerary_days')
      .select('id')
      .eq('trip_id', tripId);

    if (existingDays && existingDays.length > 0) {
      const dayIds = existingDays.map((d: any) => d.id);
      await supabase.from('itinerary_activities').delete().in('day_id', dayIds);
      await supabase.from('itinerary_days').delete().eq('trip_id', tripId);
    }

    await supabase
      .from('trips')
      .update({ generation_status: { itinerary: 'idle' } })
      .eq('id', tripId);
  }

  async getDays(tripId: string): Promise<ItineraryDay[]> {
    const { data, error } = await supabase
      .from('itinerary_days')
      .select(`
        *,
        activities:itinerary_activities(*)
      `)
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true });

    if (error) throw error;

    return (data || []).map(day => ({
      id: day.id,
      tripId: day.trip_id,
      dayNumber: day.day_number,
      date: day.date,
      title: day.title,
      theme: day.theme,
      dayType: day.day_type,
      neighborhoodFocus: day.neighborhood_focus,
      dayOfWeek: day.day_of_week,
      location: day.location,
      hotel: day.hotel,
      notes: day.notes,
      weather: day.weather,
      estimatedCost: day.estimated_cost ? Number(day.estimated_cost) : undefined,
      currency: day.currency,
      logistics: day.logistics,
      warnings: day.warnings,
      activities: (day.activities || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map(this.mapActivity),
    }));
  }

  async addActivity(
    dayId: string,
    data: {
      type?: string;
      title: string;
      subtitle?: string;
      description?: string;
      startTime: string;
      endTime?: string;
      location?: { name?: string; address?: string };
      icon?: string;
      color?: string;
      position: number;
    },
  ): Promise<ItineraryActivity> {
    const { data: activity, error } = await supabase
      .from('itinerary_activities')
      .insert({
        day_id: dayId,
        type: data.type || 'activity',
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        start_time: data.startTime,
        end_time: data.endTime,
        location: data.location || null,
        icon: data.icon || 'location',
        color: data.color,
        position: data.position,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapActivity(activity);
  }

  async updateActivity(
    activityId: string,
    updates: Partial<{
      title: string;
      subtitle: string;
      description: string;
      startTime: string;
      endTime: string;
      location: Record<string, any>;
      icon: string;
      color: string;
      position: number;
    }>,
  ): Promise<ItineraryActivity> {
    const dbUpdates: Record<string, any> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.subtitle !== undefined) dbUpdates.subtitle = updates.subtitle;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.position !== undefined) dbUpdates.position = updates.position;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('itinerary_activities')
      .update(dbUpdates)
      .eq('id', activityId)
      .select()
      .single();

    if (error) throw error;
    return this.mapActivity(data);
  }

  async deleteActivity(activityId: string): Promise<void> {
    const { error } = await supabase
      .from('itinerary_activities')
      .delete()
      .eq('id', activityId);

    if (error) throw error;
  }

  private mapActivity = (row: any): ItineraryActivity => ({
    id: row.id,
    dayId: row.day_id,
    bookingId: row.booking_id,
    type: row.type,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    location: row.location,
    cost: row.cost,
    icon: row.icon,
    color: row.color,
    imageUrl: row.image_url,
    bookingRequired: row.booking_required,
    bookingUrl: row.booking_url,
    tips: row.tips,
    position: row.position,
  });
}

export const plannerService = new PlannerService();
