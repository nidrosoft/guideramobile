/**
 * PROVIDER ADAPTERS INDEX
 *
 * Central export for all provider adapters.
 */

// Base adapter
export * from './base-adapter';

// Flight provider adapters
export * from './amadeus-adapter';
export * from './kiwi-adapter';

// Hotel provider adapters
export * from './expedia-adapter';

// Initialize all adapters (imports register them)
import './amadeus-adapter';
import './kiwi-adapter';
import './expedia-adapter';
