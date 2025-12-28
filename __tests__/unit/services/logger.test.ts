/**
 * Logger Service Tests
 */

import { logger } from '@/services/logging';

describe('Logger Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('log levels', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message');
      expect(console.debug).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logger.info('Info message');
      expect(console.info).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('Error message');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('log with data', () => {
    it('should log messages with additional data', () => {
      const data = { userId: '123', action: 'login' };
      logger.info('User action', data);
      expect(console.info).toHaveBeenCalled();
    });

    it('should log messages with context', () => {
      logger.info('Screen loaded', null, { screen: 'Home', feature: 'booking' });
      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('error logging', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error');
      logger.error('An error occurred', error);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle non-Error objects', () => {
      logger.error('An error occurred', { code: 'ERR_001' });
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('performance timing', () => {
    it('should start and end timer', () => {
      logger.startTimer('test-operation');
      const duration = logger.endTimer('test-operation');
      
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(console.debug).toHaveBeenCalled();
    });

    it('should return null for non-existent timer', () => {
      const duration = logger.endTimer('non-existent');
      
      expect(duration).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('screen and action logging', () => {
    it('should log screen views', () => {
      logger.logScreenView('HomeScreen', { tab: 'explore' });
      expect(console.info).toHaveBeenCalled();
    });

    it('should log user actions', () => {
      logger.logAction('button_click', { buttonId: 'submit' });
      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('global context', () => {
    it('should set and use global context', () => {
      logger.setGlobalContext({ userId: 'user-123' });
      logger.info('Test message');
      
      expect(console.info).toHaveBeenCalled();
    });

    it('should clear global context', () => {
      logger.setGlobalContext({ userId: 'user-123' });
      logger.clearGlobalContext();
      logger.info('Test message');
      
      expect(console.info).toHaveBeenCalled();
    });
  });
});
