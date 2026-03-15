/**
 * USE LANDMARK RECOGNITION HOOK
 *
 * Wired to real Google Cloud Vision API via visionService.
 * Also uses Mapbox reverse geocoding for location context.
 * No mock data — returns real results or shows "no landmark detected".
 */

import { useState } from 'react';
import { visionService } from '../../../services/vision.service';
import { mapboxService } from '../../../services/mapbox.service';

interface Landmark {
  name: string;
  description: string;
  location: string;
  confidence?: number;
  coordinates?: { latitude: number; longitude: number } | null;
  imageUrl?: string;
  facts?: string[];
}

export function useLandmarkRecognition() {
  const [isScanning, setIsScanning] = useState(false);
  const [landmark, setLandmark] = useState<Landmark | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanLandmark = async (imageUri?: string) => {
    if (!imageUri) {
      setError('No image provided. Point your camera at a landmark and try again.');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      if (!visionService.isConfigured) {
        setError('Vision API not configured. Enable Cloud Vision API in Google Cloud Console.');
        return;
      }

      // Call real Google Vision API
      const results = await visionService.detectLandmarks(imageUri);

      if (!results || results.length === 0) {
        // Try object detection as fallback
        const objects = await visionService.detectObjects(imageUri);
        if (objects.length > 0) {
          setLandmark({
            name: objects[0].name,
            description: `Detected: ${objects.map(o => o.name).join(', ')}`,
            location: 'Current location',
            confidence: objects[0].confidence,
          });
        } else {
          setError('No landmark detected. Try pointing your camera directly at a landmark or building.');
        }
        return;
      }

      // Use the top result
      const top = results[0];

      // Get location name via Mapbox reverse geocoding
      let locationName = 'Unknown location';
      if (top.coordinates) {
        const geo = await mapboxService.reverseGeocode(top.coordinates.latitude, top.coordinates.longitude);
        if (geo) locationName = geo.address || geo.name;
      }

      setLandmark({
        name: top.name,
        description: `Identified with ${Math.round((top.confidence || 0) * 100)}% confidence`,
        location: locationName,
        confidence: top.confidence,
        coordinates: top.coordinates,
      });

    } catch (err) {
      setError('Failed to recognize landmark. Check your connection and try again.');
      console.error('Landmark recognition error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const clearLandmark = () => {
    setLandmark(null);
    setError(null);
  };

  return {
    isScanning,
    landmark,
    error,
    scanLandmark,
    clearLandmark,
  };
}
