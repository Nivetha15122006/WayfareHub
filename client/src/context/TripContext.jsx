import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const [trips, setTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [balances, setBalances] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all user trips
  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/trips');
      setTrips(res.data.data || []);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch trips';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single trip with full data
  const fetchTripDetails = useCallback(async (tripId) => {
    setLoading(true);
    setError(null);
    try {
      const [tripRes, expensesRes, settlementsRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/expenses/trip/${tripId}`),
        api.get(`/expenses/trip/${tripId}/settlements`),
      ]);

      const tripData = tripRes.data.data;
      setCurrentTrip(tripData);
      setItinerary(tripData.itinerary || []);
      setExpenses(expensesRes.data.data?.expenses || []);
      setAnalytics(expensesRes.data.data?.analytics || null);
      setSettlements(settlementsRes.data.data?.settlements || []);
      setBalances(settlementsRes.data.data?.balances || []);

      return tripData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load trip details';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create Trip
  const createNewTrip = async (tripData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/trips', tripData);
      const newTrip = res.data.data;
      setTrips((prev) => [newTrip, ...prev]);
      return { success: true, data: newTrip };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create trip';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Update Trip
  const updateExistingTrip = async (tripId, tripData) => {
    try {
      const res = await api.put(`/trips/${tripId}`, tripData);
      const updated = res.data.data;
      setCurrentTrip(updated);
      setTrips((prev) => prev.map((t) => (t._id === tripId ? updated : t)));
      return { success: true, data: updated };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update trip';
      return { success: false, error: msg };
    }
  };

  // Delete Trip
  const deleteExistingTrip = async (tripId) => {
    try {
      await api.delete(`/trips/${tripId}`);
      setTrips((prev) => prev.filter((t) => t._id !== tripId));
      if (currentTrip?._id === tripId) {
        setCurrentTrip(null);
      }
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete trip';
      return { success: false, error: msg };
    }
  };

  // Add Member
  const inviteMember = async (tripId, email) => {
    try {
      const res = await api.post(`/trips/${tripId}/members`, { email });
      const updated = res.data.data;
      setCurrentTrip(updated);
      setTrips((prev) => prev.map((t) => (t._id === tripId ? updated : t)));
      return { success: true, message: res.data.message, data: updated };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add member';
      return { success: false, error: msg };
    }
  };

  // Remove Member
  const removeTripMember = async (tripId, userId) => {
    try {
      const res = await api.delete(`/trips/${tripId}/members/${userId}`);
      const updated = res.data.data;
      setCurrentTrip(updated);
      setTrips((prev) => prev.map((t) => (t._id === tripId ? updated : t)));
      return { success: true, data: updated };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove member';
      return { success: false, error: msg };
    }
  };

  // Itinerary Stop Operations
  const addItineraryItem = async (tripId, stopData) => {
    try {
      const res = await api.post(`/trips/${tripId}/itinerary`, stopData);
      setItinerary(res.data.itinerary);
      if (currentTrip) {
        setCurrentTrip((prev) => ({ ...prev, itinerary: res.data.itinerary }));
      }
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add stop';
      return { success: false, error: msg };
    }
  };

  const updateItineraryItem = async (tripId, stopId, stopData) => {
    try {
      const res = await api.put(`/trips/${tripId}/itinerary/${stopId}`, stopData);
      setItinerary(res.data.itinerary);
      if (currentTrip) {
        setCurrentTrip((prev) => ({ ...prev, itinerary: res.data.itinerary }));
      }
      return { success: true, data: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update stop';
      return { success: false, error: msg };
    }
  };

  const deleteItineraryItem = async (tripId, stopId) => {
    try {
      const res = await api.delete(`/trips/${tripId}/itinerary/${stopId}`);
      setItinerary(res.data.itinerary);
      if (currentTrip) {
        setCurrentTrip((prev) => ({ ...prev, itinerary: res.data.itinerary }));
      }
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete stop';
      return { success: false, error: msg };
    }
  };

  // Expense Operations
  const createTripExpense = async (expenseData) => {
    try {
      const res = await api.post('/expenses', expenseData);
      const newExp = res.data.data;
      setExpenses((prev) => [newExp, ...prev]);

      // Refresh settlements and analytics
      if (expenseData.trip) {
        const [settlementsRes, expensesRes] = await Promise.all([
          api.get(`/expenses/trip/${expenseData.trip}/settlements`),
          api.get(`/expenses/trip/${expenseData.trip}`),
        ]);
        setSettlements(settlementsRes.data.data?.settlements || []);
        setBalances(settlementsRes.data.data?.balances || []);
        setAnalytics(expensesRes.data.data?.analytics || null);
      }

      return { success: true, data: newExp };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create expense';
      return { success: false, error: msg };
    }
  };

  const updateTripExpense = async (expenseId, expenseData) => {
    try {
      const res = await api.put(`/expenses/${expenseId}`, expenseData);
      const updated = res.data.data;
      setExpenses((prev) => prev.map((e) => (e._id === expenseId ? updated : e)));

      if (currentTrip?._id) {
        const [settlementsRes, expensesRes] = await Promise.all([
          api.get(`/expenses/trip/${currentTrip._id}/settlements`),
          api.get(`/expenses/trip/${currentTrip._id}`),
        ]);
        setSettlements(settlementsRes.data.data?.settlements || []);
        setAnalytics(expensesRes.data.data?.analytics || null);
      }

      return { success: true, data: updated };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update expense';
      return { success: false, error: msg };
    }
  };

  const deleteTripExpense = async (expenseId) => {
    try {
      await api.delete(`/expenses/${expenseId}`);
      setExpenses((prev) => prev.filter((e) => e._id !== expenseId));

      if (currentTrip?._id) {
        const [settlementsRes, expensesRes] = await Promise.all([
          api.get(`/expenses/trip/${currentTrip._id}/settlements`),
          api.get(`/expenses/trip/${currentTrip._id}`),
        ]);
        setSettlements(settlementsRes.data.data?.settlements || []);
        setAnalytics(expensesRes.data.data?.analytics || null);
      }

      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete expense';
      return { success: false, error: msg };
    }
  };

  // Settle / Mark a payment as done (Tick settlement)
  const settleDebtTransaction = async (tripId, settlementData) => {
    try {
      const res = await api.post(`/expenses/trip/${tripId}/settle`, settlementData);
      if (res.data?.data) {
        setSettlements(res.data.data.settlements || []);
        setBalances(res.data.data.balances || []);
      }
      return { success: true, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record settlement';
      return { success: false, error: msg };
    }
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        currentTrip,
        members: currentTrip?.members || [],
        itinerary,
        expenses,
        settlements,
        balances,
        analytics,
        loading,
        error,
        fetchTrips,
        fetchTripDetails,
        createNewTrip,
        updateExistingTrip,
        deleteExistingTrip,
        inviteMember,
        removeTripMember,
        addItineraryItem,
        updateItineraryItem,
        deleteItineraryItem,
        createTripExpense,
        updateTripExpense,
        deleteTripExpense,
        settleDebtTransaction,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
