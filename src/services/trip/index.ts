/**
 * TRIP SERVICE INDEX
 * Public exports for the Trip Planning System
 */

// Types
export * from './trip.types';

// Errors
export * from './trip.errors';

// Utils
export * from './trip.utils';

// Repository
export { TripRepository } from './trip-repository';

// Services
export { TripCoreService } from './trip-core.service';
export { TripLifecycleService } from './trip-lifecycle.service';
export { TripCollaborationService } from './trip-collaboration.service';
export { TripImportService } from './trip-import.service';

// Re-export main functions for convenience
export {
  createTrip,
  createTripFromBooking,
  getTrip,
  updateTrip,
  deleteTrip,
  getUserTrips,
  getTripsByCategory,
  linkBookingToTrip,
  unlinkBookingFromTrip,
  addActivity,
  updateActivity,
  deleteActivity,
  buildItinerary,
  checkAccess,
  enableShareLink,
  disableShareLink,
  joinViaShareLink,
} from './trip-core.service';

export {
  transitionTo,
  confirmTrip,
  cancelTrip,
  archiveTrip,
  processAutomaticTransitions,
} from './trip-lifecycle.service';

export {
  inviteTraveler,
  acceptInvitation,
  declineInvitation,
  revokeInvitation,
  resendInvitation,
  getPendingInvitations,
  getUserPendingInvitations,
  updateTravelerRole,
  removeTraveler,
  leaveTrip,
  transferOwnership,
} from './trip-collaboration.service';

export {
  getImportEmail,
  processIncomingEmail,
  submitManualEntry,
  processScan,
  initiateOAuthConnection,
  handleOAuthCallback,
  syncLinkedAccount,
  disconnectLinkedAccount,
  getLinkedAccounts,
  processImport,
  submitImportCorrections,
  getUserImports,
} from './trip-import.service';
