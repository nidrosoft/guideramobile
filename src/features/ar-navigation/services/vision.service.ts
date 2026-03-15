/**
 * VISION SERVICE
 *
 * Fully implemented Google Cloud Vision API.
 * Landmark detection, OCR text extraction, and object detection.
 * Uses the existing Google Maps API key (enable Vision API in Cloud Console).
 *
 * 🔑 Uses EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (enable Vision API in Google Cloud Console)
 */

// expo-file-system for base64 conversion
const ExpoFileSystem = require('expo-file-system');

export interface LandmarkResult {
  name: string;
  confidence: number;
  coordinates: { latitude: number; longitude: number } | null;
  boundingBox?: any;
}

export interface TextResult {
  fullText: string;
  blocks: { text: string; confidence?: number }[];
}

export interface ObjectResult {
  name: string;
  confidence: number;
}

export class VisionService {
  private apiKey: string;
  private baseUrl = 'https://vision.googleapis.com/v1/images:annotate';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 10;
  }

  /**
   * Convert a local image URI to base64 string
   */
  private async imageToBase64(imageUri: string): Promise<string | null> {
    try {
      const base64 = await ExpoFileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      return base64;
    } catch (e) {
      console.warn('Image to base64 error:', e);
      return null;
    }
  }

  /**
   * Make a Vision API request with specified features
   */
  private async annotate(base64Image: string, features: { type: string; maxResults?: number }[]): Promise<any> {
    const res = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64Image },
          features,
        }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn('Vision API error:', err);
      return null;
    }
    const data = await res.json();
    return data.responses?.[0] || null;
  }

  /**
   * Detect landmarks in an image
   */
  async detectLandmarks(imageUri: string): Promise<LandmarkResult[]> {
    if (!this.isConfigured) return [];
    try {
      const base64 = await this.imageToBase64(imageUri);
      if (!base64) return [];

      const response = await this.annotate(base64, [
        { type: 'LANDMARK_DETECTION', maxResults: 5 },
      ]);
      if (!response?.landmarkAnnotations) return [];

      return response.landmarkAnnotations.map((l: any) => ({
        name: l.description || 'Unknown Landmark',
        confidence: l.score || 0,
        coordinates: l.locations?.[0]?.latLng
          ? { latitude: l.locations[0].latLng.latitude, longitude: l.locations[0].latLng.longitude }
          : null,
        boundingBox: l.boundingPoly,
      }));
    } catch (e) {
      console.warn('Landmark detection error:', e);
      return [];
    }
  }

  /**
   * Detect and extract text from an image (OCR)
   * Used by Menu Translator plugin
   */
  async detectText(imageUri: string): Promise<TextResult | null> {
    if (!this.isConfigured) return null;
    try {
      const base64 = await this.imageToBase64(imageUri);
      if (!base64) return null;

      const response = await this.annotate(base64, [
        { type: 'TEXT_DETECTION', maxResults: 1 },
      ]);
      if (!response?.textAnnotations) return null;

      const fullText = response.textAnnotations[0]?.description || '';
      const blocks = response.textAnnotations.slice(1).map((t: any) => ({
        text: t.description || '',
        confidence: t.confidence,
      }));

      return { fullText, blocks };
    } catch (e) {
      console.warn('Text detection error:', e);
      return null;
    }
  }

  /**
   * Detect objects and labels in an image
   */
  async detectObjects(imageUri: string): Promise<ObjectResult[]> {
    if (!this.isConfigured) return [];
    try {
      const base64 = await this.imageToBase64(imageUri);
      if (!base64) return [];

      const response = await this.annotate(base64, [
        { type: 'LABEL_DETECTION', maxResults: 10 },
      ]);
      if (!response?.labelAnnotations) return [];

      return response.labelAnnotations.map((l: any) => ({
        name: l.description || 'Unknown',
        confidence: l.score || 0,
      }));
    } catch (e) {
      console.warn('Object detection error:', e);
      return [];
    }
  }
}

// Use the same Google API key — enable Vision API in Google Cloud Console
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
export const visionService = new VisionService(GOOGLE_API_KEY);
