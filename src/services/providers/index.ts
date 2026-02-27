/**
 * PROVIDER ADAPTERS INDEX
 * 
 * Central export for all provider adapters.
 */

// Base adapter
export * from './base-adapter';

// Flight provider adapters
export * from './amadeus-adapter';
export * from './duffel-adapter';
export * from './kiwi-adapter';

// Hotel provider adapters
export * from './expedia-adapter';

// Car provider adapters
export * from './cartrawler-adapter';

// Experience provider adapters
export * from './getyourguide-adapter';

// Initialize all adapters (imports register them)
import './amadeus-adapter';
import './duffel-adapter';
import './kiwi-adapter';
import './expedia-adapter';
import './cartrawler-adapter';
import './getyourguide-adapter';
