/**
 * SAFETY INTELLIGENCE SERVICE
 *
 * Orchestrates parallel queries to TravelRisk, GDACS, State Dept, and CrimeoMeter.
 * Combines results into a single SafetyZoneResult with risk level + alerts.
 * Used by geofencing triggers and the Safety Alerts map UI.
 */

import { travelRiskAPI } from './apis/travel-risk.api';
import { gdacsAPI } from './apis/gdacs.api';
import { stateDeptAPI } from './apis/state-dept.api';
import { crimeoMeterAPI } from './apis/crimeometer.api';
import {
  SafetyZoneResult,
  SafetyAlert,
  SafetyLevel,
  scoreToLevel,
} from './types/safety.types';
import { mapboxService } from '@/features/ar-navigation/services/mapbox.service';

const ONE_MILE_KM = 1.609;

class SafetyIntelligenceService {
  /**
   * Get comprehensive safety assessment for a location.
   * Queries all available APIs in parallel, combines scores.
   */
  async getRiskForLocation(
    latitude: number,
    longitude: number,
    radiusMiles: number = 1
  ): Promise<SafetyZoneResult> {
    // Reverse geocode to get country code
    let countryCode = '';
    let countryName = '';
    try {
      const geo = await mapboxService.reverseGeocode(latitude, longitude);
      if (geo?.address) {
        // Extract country from address (last part usually)
        const parts = geo.address.split(', ');
        countryName = parts[parts.length - 1] || '';
      }
    } catch {}

    // Query all APIs in parallel
    const [travelRisk, disasters, advisory, crime] = await Promise.allSettled([
      travelRiskAPI.isConfigured
        ? travelRiskAPI.getRiskByCoordinates(latitude, longitude)
        : Promise.resolve(null),
      gdacsAPI.getActiveDisasters(latitude, longitude, radiusMiles * ONE_MILE_KM * 10),
      countryCode
        ? stateDeptAPI.getAdvisory(countryCode)
        : stateDeptAPI.getAllAdvisories().then(all => {
            // Try to match by country name
            const match = all.find(a =>
              countryName.toLowerCase().includes(a.countryName.toLowerCase()) ||
              a.countryName.toLowerCase().includes(countryName.toLowerCase())
            );
            return match || null;
          }),
      crimeoMeterAPI.isConfigured
        ? crimeoMeterAPI.getCrimeData(latitude, longitude, radiusMiles)
        : Promise.resolve(null),
    ]);

    // Extract results (handle rejected promises gracefully)
    const travelRiskData = travelRisk.status === 'fulfilled' ? travelRisk.value : null;
    const disasterData = disasters.status === 'fulfilled' ? disasters.value : [];
    const advisoryData = advisory.status === 'fulfilled' ? advisory.value : null;
    const crimeData = crime.status === 'fulfilled' ? crime.value : null;

    // Build alerts list
    const alerts: SafetyAlert[] = [];

    // TravelRisk alerts
    if (travelRiskData?.advisories) {
      travelRiskData.advisories.forEach(a => {
        alerts.push({
          id: `tr-${Date.now()}-${Math.random()}`,
          type: mapTravelRiskType(a.type),
          level: mapSeverityToLevel(a.severity),
          title: `${a.type} Alert`,
          description: a.description,
          source: 'TravelRisk API',
          coordinates: a.coordinates ? { latitude: a.coordinates.lat, longitude: a.coordinates.lng } : undefined,
          timestamp: new Date(),
        });
      });
    }

    // GDACS disaster alerts
    disasterData.forEach(d => {
      alerts.push({
        id: `gdacs-${d.id}`,
        type: 'disaster',
        level: mapGDACSLevel(d.severity),
        title: d.title,
        description: d.description,
        source: 'GDACS / UN',
        coordinates: d.coordinates,
        timestamp: d.date,
        metadata: { magnitude: d.magnitude, disasterType: d.type },
      });
    });

    // State Dept advisory
    if (advisoryData && advisoryData.level >= 3) {
      alerts.push({
        id: `state-${advisoryData.countryCode}`,
        type: 'advisory',
        level: advisoryData.level >= 4 ? 'critical' : 'high',
        title: `${advisoryData.countryName}: ${advisoryData.levelDescription}`,
        description: `US State Department Level ${advisoryData.level} advisory for ${advisoryData.countryName}`,
        source: 'US State Dept',
        timestamp: new Date(advisoryData.lastUpdated || Date.now()),
        countryCode: advisoryData.countryCode,
      });
    }

    // Crime alerts (only if score is significant)
    if (crimeData && crimeData.crimeScore > 40) {
      alerts.push({
        id: `crime-${Date.now()}`,
        type: 'crime',
        level: crimeData.crimeScore > 70 ? 'high' : 'caution',
        title: `${crimeData.totalIncidents} crime incidents nearby`,
        description: `${crimeData.totalIncidents} incidents reported within ${radiusMiles} mile in the last 30 days`,
        source: 'CrimeoMeter',
        coordinates: { latitude, longitude },
        timestamp: new Date(),
        metadata: { crimeScore: crimeData.crimeScore, incidents: crimeData.incidents.slice(0, 5) },
      });
    }

    // Calculate combined score (0-100)
    let score = 0;
    if (travelRiskData) score += (travelRiskData.riskLevel / 5) * 30; // max 30 points
    if (disasterData.length > 0) score += Math.min(30, disasterData.length * 15); // max 30 points
    if (advisoryData) score += ((advisoryData.level - 1) / 3) * 20; // max 20 points
    if (crimeData) score += (crimeData.crimeScore / 100) * 20; // max 20 points
    score = Math.min(100, Math.round(score));

    const level = scoreToLevel(score);

    // Generate summary
    const summary = this.generateSummary(level, alerts, countryName);

    return {
      level,
      score,
      countryAdvisoryLevel: advisoryData?.level,
      travelRiskScore: travelRiskData?.riskLevel,
      crimeScore: crimeData?.crimeScore,
      alerts,
      summary,
      countryCode: advisoryData?.countryCode || countryCode,
      countryName: advisoryData?.countryName || countryName,
    };
  }

  private generateSummary(level: SafetyLevel, alerts: SafetyAlert[], location: string): string {
    const loc = location || 'this area';
    switch (level) {
      case 'safe':
        return `No safety alerts in ${loc}. Stay aware of your surroundings.`;
      case 'caution':
        return `Exercise caution in ${loc}. ${alerts.length} alert${alerts.length !== 1 ? 's' : ''} detected.`;
      case 'high':
        return `High risk area. ${alerts.length} active alert${alerts.length !== 1 ? 's' : ''} in ${loc}. Stay vigilant.`;
      case 'critical':
        return `Critical danger in ${loc}. ${alerts.length} urgent alert${alerts.length !== 1 ? 's' : ''}. Consider leaving the area.`;
    }
  }
}

function mapTravelRiskType(type: string): SafetyAlert['type'] {
  const lower = type.toLowerCase();
  if (lower.includes('disaster') || lower.includes('quake') || lower.includes('flood')) return 'disaster';
  if (lower.includes('crime') || lower.includes('theft')) return 'crime';
  if (lower.includes('health') || lower.includes('disease')) return 'health';
  if (lower.includes('unrest') || lower.includes('conflict') || lower.includes('terror')) return 'unrest';
  return 'advisory';
}

function mapSeverityToLevel(severity: string): SafetyLevel {
  const lower = severity.toLowerCase();
  if (lower === 'critical' || lower === 'extreme') return 'critical';
  if (lower === 'high' || lower === 'severe') return 'high';
  if (lower === 'medium' || lower === 'moderate') return 'caution';
  return 'safe';
}

function mapGDACSLevel(alertLevel: string): SafetyLevel {
  switch (alertLevel?.toLowerCase()) {
    case 'red': return 'critical';
    case 'orange': return 'high';
    case 'green': return 'caution';
    default: return 'safe';
  }
}

export const safetyIntelligenceService = new SafetyIntelligenceService();
