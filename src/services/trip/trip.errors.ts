/**
 * TRIP ERRORS
 * Custom error classes for trip operations
 */

export class TripError extends Error {
  code: string;
  
  constructor(code: string, message: string) {
    super(message);
    this.name = 'TripError';
    this.code = code;
  }
}

export class TripNotFoundError extends TripError {
  tripId: string;
  
  constructor(tripId: string) {
    super('TRIP_NOT_FOUND', `Trip not found: ${tripId}`);
    this.name = 'TripNotFoundError';
    this.tripId = tripId;
  }
}

export class TripAccessDeniedError extends TripError {
  tripId: string;
  userId: string;
  action?: string;
  
  constructor(tripId: string, userId: string, action?: string) {
    super(
      'TRIP_ACCESS_DENIED',
      action
        ? `User ${userId} does not have permission to ${action} trip ${tripId}`
        : `User ${userId} does not have access to trip ${tripId}`
    );
    this.name = 'TripAccessDeniedError';
    this.tripId = tripId;
    this.userId = userId;
    this.action = action;
  }
}

export class TripValidationError extends TripError {
  errors: string[];
  
  constructor(errors: string[]) {
    super('TRIP_VALIDATION_ERROR', `Validation failed: ${errors.join(', ')}`);
    this.name = 'TripValidationError';
    this.errors = errors;
  }
}

export class TripTransitionError extends TripError {
  tripId: string;
  fromStatus: string;
  toStatus: string;
  
  constructor(tripId: string, fromStatus: string, toStatus: string, reason?: string) {
    super(
      'TRIP_TRANSITION_ERROR',
      reason || `Cannot transition trip ${tripId} from ${fromStatus} to ${toStatus}`
    );
    this.name = 'TripTransitionError';
    this.tripId = tripId;
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
  }
}

export class TripInvitationError extends TripError {
  constructor(code: string, message: string) {
    super(code, message);
    this.name = 'TripInvitationError';
  }
}

export class TripImportError extends TripError {
  importId?: string;
  
  constructor(code: string, message: string, importId?: string) {
    super(code, message);
    this.name = 'TripImportError';
    this.importId = importId;
  }
}
