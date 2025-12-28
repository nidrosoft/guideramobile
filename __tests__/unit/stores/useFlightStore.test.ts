/**
 * Flight Store Tests
 */

import { useFlightStore } from '@/features/booking/stores/useFlightStore';
import { act } from '@testing-library/react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('useFlightStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useFlightStore.getState().reset();
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useFlightStore.getState();
      
      expect(state.currentStep).toBe('search');
      expect(state.searchResults).toEqual([]);
      expect(state.filteredResults).toEqual([]);
      expect(state.isSearching).toBe(false);
      expect(state.selectedOutboundFlight).toBeNull();
      expect(state.selectedReturnFlight).toBeNull();
      expect(state.bookingConfirmed).toBe(false);
    });

    it('should have default search params', () => {
      const { searchParams } = useFlightStore.getState();
      
      expect(searchParams.tripType).toBeDefined();
      expect(searchParams.origin).toBeNull();
      expect(searchParams.destination).toBeNull();
      expect(searchParams.passengers).toBeDefined();
    });
  });

  describe('navigation', () => {
    it('should update current step', () => {
      act(() => {
        useFlightStore.getState().setCurrentStep('results');
      });
      
      expect(useFlightStore.getState().currentStep).toBe('results');
    });
  });

  describe('search params', () => {
    it('should update search params', () => {
      const origin = { 
        id: '1',
        code: 'JFK', 
        name: 'New York JFK', 
        city: 'New York', 
        country: 'USA',
        countryCode: 'US',
        type: 'airport',
        timezone: 'America/New_York',
      } as any;
      
      act(() => {
        useFlightStore.getState().setSearchParams({ origin });
      });
      
      expect(useFlightStore.getState().searchParams.origin).toEqual(origin);
    });

    it('should swap locations', () => {
      const origin = { 
        id: '1',
        code: 'JFK', 
        name: 'New York JFK', 
        city: 'New York', 
        country: 'USA',
        countryCode: 'US',
        type: 'airport',
        timezone: 'America/New_York',
      } as any;
      const destination = { 
        id: '2',
        code: 'LAX', 
        name: 'Los Angeles', 
        city: 'Los Angeles', 
        country: 'USA',
        countryCode: 'US',
        type: 'airport',
        timezone: 'America/Los_Angeles',
      } as any;
      
      act(() => {
        useFlightStore.getState().setSearchParams({ origin, destination });
      });
      
      act(() => {
        useFlightStore.getState().swapLocations();
      });
      
      const state = useFlightStore.getState();
      expect(state.searchParams.origin).toEqual(destination);
      expect(state.searchParams.destination).toEqual(origin);
    });

    it('should set trip type and clear return date for one-way', () => {
      act(() => {
        useFlightStore.getState().setSearchParams({ returnDate: new Date() });
      });
      
      act(() => {
        useFlightStore.getState().setTripType('one-way');
      });
      
      const state = useFlightStore.getState();
      expect(state.searchParams.tripType).toBe('one-way');
      expect(state.searchParams.returnDate).toBeNull();
    });

    it('should set cabin class', () => {
      act(() => {
        useFlightStore.getState().setCabinClass('business');
      });
      
      expect(useFlightStore.getState().searchParams.cabinClass).toBe('business');
    });
  });

  describe('search state', () => {
    it('should set searching state', () => {
      act(() => {
        useFlightStore.getState().setSearching(true);
      });
      
      expect(useFlightStore.getState().isSearching).toBe(true);
    });

    it('should set search error', () => {
      act(() => {
        useFlightStore.getState().setSearchError('Network error');
      });
      
      expect(useFlightStore.getState().searchError).toBe('Network error');
    });

    it('should set search results', () => {
      const mockFlights = [
        { id: '1', price: { amount: 100, currency: 'USD' } },
        { id: '2', price: { amount: 200, currency: 'USD' } },
      ] as any;
      
      act(() => {
        useFlightStore.getState().setSearchResults(mockFlights);
      });
      
      expect(useFlightStore.getState().searchResults).toHaveLength(2);
      expect(useFlightStore.getState().filteredResults).toHaveLength(2);
    });
  });

  describe('flight selection', () => {
    it('should select outbound flight', () => {
      const mockFlight = { id: '1', price: { amount: 100, currency: 'USD' } } as any;
      
      act(() => {
        useFlightStore.getState().selectOutboundFlight(mockFlight);
      });
      
      expect(useFlightStore.getState().selectedOutboundFlight).toEqual(mockFlight);
    });

    it('should select return flight', () => {
      const mockFlight = { id: '2', price: { amount: 150, currency: 'USD' } } as any;
      
      act(() => {
        useFlightStore.getState().selectReturnFlight(mockFlight);
      });
      
      expect(useFlightStore.getState().selectedReturnFlight).toEqual(mockFlight);
    });

    it('should clear selected flight', () => {
      const mockFlight = { id: '1' } as any;
      
      act(() => {
        useFlightStore.getState().selectOutboundFlight(mockFlight);
      });
      
      act(() => {
        useFlightStore.getState().selectOutboundFlight(null);
      });
      
      expect(useFlightStore.getState().selectedOutboundFlight).toBeNull();
    });
  });

  describe('extras', () => {
    it('should add baggage', () => {
      const baggage = { id: 'bag1', name: 'Extra Bag', price: 30 } as any;
      
      act(() => {
        useFlightStore.getState().addBaggage(baggage);
      });
      
      expect(useFlightStore.getState().extras.baggage).toHaveLength(1);
      expect(useFlightStore.getState().extras.baggage[0]).toEqual(baggage);
    });

    it('should remove baggage', () => {
      const baggage = { id: 'bag1', name: 'Extra Bag', price: 30 } as any;
      
      act(() => {
        useFlightStore.getState().addBaggage(baggage);
      });
      
      act(() => {
        useFlightStore.getState().removeBaggage('bag1');
      });
      
      expect(useFlightStore.getState().extras.baggage).toHaveLength(0);
    });

    it('should set priority boarding', () => {
      act(() => {
        useFlightStore.getState().setPriorityBoarding(true);
      });
      
      expect(useFlightStore.getState().extras.priorityBoarding).toBe(true);
    });

    it('should set lounge access', () => {
      act(() => {
        useFlightStore.getState().setLoungeAccess(true);
      });
      
      expect(useFlightStore.getState().extras.loungeAccess).toBe(true);
    });
  });

  describe('travelers', () => {
    it('should set travelers', () => {
      const travelers = [
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'Jane', lastName: 'Doe' },
      ] as any;
      
      act(() => {
        useFlightStore.getState().setTravelers(travelers);
      });
      
      expect(useFlightStore.getState().travelers).toHaveLength(2);
    });

    it('should update traveler', () => {
      const travelers = [{ id: '1', firstName: 'John', lastName: 'Doe' }] as any;
      
      act(() => {
        useFlightStore.getState().setTravelers(travelers);
      });
      
      act(() => {
        useFlightStore.getState().updateTraveler(0, { firstName: 'Johnny' });
      });
      
      expect(useFlightStore.getState().travelers[0].firstName).toBe('Johnny');
    });

    it('should set contact info', () => {
      const contactInfo = { email: 'test@example.com', phone: '1234567890' } as any;
      
      act(() => {
        useFlightStore.getState().setContactInfo(contactInfo);
      });
      
      expect(useFlightStore.getState().contactInfo).toEqual(contactInfo);
    });
  });

  describe('booking', () => {
    it('should set booking reference', () => {
      act(() => {
        useFlightStore.getState().setBookingReference('ABC123');
      });
      
      expect(useFlightStore.getState().bookingReference).toBe('ABC123');
    });

    it('should set booking confirmed', () => {
      act(() => {
        useFlightStore.getState().setBookingConfirmed(true);
      });
      
      expect(useFlightStore.getState().bookingConfirmed).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset entire store', () => {
      // Set some state
      act(() => {
        useFlightStore.getState().setCurrentStep('checkout');
        useFlightStore.getState().setSearching(true);
        useFlightStore.getState().setBookingConfirmed(true);
      });
      
      // Reset
      act(() => {
        useFlightStore.getState().reset();
      });
      
      const state = useFlightStore.getState();
      expect(state.currentStep).toBe('search');
      expect(state.isSearching).toBe(false);
      expect(state.bookingConfirmed).toBe(false);
    });

    it('should reset search only', () => {
      const mockFlights = [{ id: '1' }] as any;
      
      act(() => {
        useFlightStore.getState().setSearchResults(mockFlights);
        useFlightStore.getState().selectOutboundFlight(mockFlights[0]);
        useFlightStore.getState().setBookingReference('ABC123');
      });
      
      act(() => {
        useFlightStore.getState().resetSearch();
      });
      
      const state = useFlightStore.getState();
      expect(state.searchResults).toHaveLength(0);
      expect(state.selectedOutboundFlight).toBeNull();
      // Booking reference should remain
      expect(state.bookingReference).toBe('ABC123');
    });
  });

  describe('filters and sort', () => {
    it('should set filters', () => {
      act(() => {
        useFlightStore.getState().setFilters({ stops: [0, 1] });
      });
      
      expect(useFlightStore.getState().filters.stops).toEqual([0, 1]);
    });

    it('should reset filters', () => {
      act(() => {
        useFlightStore.getState().setFilters({ stops: [0, 1] });
      });
      
      act(() => {
        useFlightStore.getState().resetFilters();
      });
      
      expect(useFlightStore.getState().filters.stops).toEqual([]);
    });

    it('should set sort option', () => {
      act(() => {
        useFlightStore.getState().setSortBy('price_low');
      });
      
      expect(useFlightStore.getState().sortBy).toBe('price_low');
    });
  });
});
