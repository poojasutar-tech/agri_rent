import { useQuery } from "@tanstack/react-query";
import { 
  fetchDashboardStats, 
  fetchBookings, 
  fetchRevenueAnalytics, 
  fetchOccupancyData,
  fetchAccuracyRate,
  fetchExpensesHistory
} from "@/services/dashboardApi";

/**
 * useDashboardData Hook
 *
 * Orchestrates TanStack Query requests for the dashboard.
 * Fetches stats, bookings, revenue analytics, and occupancy data.
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 */
export const useDashboardData = (date) => {
  // Extract month from date for revenue analytics
  const monthRange = date ? date.substring(0, 7) : null; // YYYY-MM

  const statsQuery = useQuery({
    queryKey: ["dashboard-stats", date],
    queryFn: () => fetchDashboardStats(date),
    enabled: !!date,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });

  const bookingsQuery = useQuery({
    queryKey: ["dashboard-bookings", date],
    queryFn: () => fetchBookings(date),
    enabled: !!date,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  const revenueQuery = useQuery({
    queryKey: ["revenue-analytics", monthRange],
    queryFn: () => fetchRevenueAnalytics(monthRange),
    enabled: !!monthRange,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const occupancyQuery = useQuery({
    queryKey: ["occupancy-data", date],
    queryFn: () => fetchOccupancyData(date),
    enabled: !!date,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  const accuracyQuery = useQuery({
    queryKey: ["accuracy-data", date],
    queryFn: () => fetchAccuracyRate(date),
    enabled: !!date,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const expensesQuery = useQuery({
    queryKey: ["expenses-history", monthRange],
    queryFn: () => fetchExpensesHistory(monthRange),
    enabled: !!monthRange,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  return {
    // Stats
    kpis: statsQuery.data?.kpis ?? null,
    revenueChart: revenueQuery.data ?? statsQuery.data?.revenue_chart ?? [],
    bookingMix: statsQuery.data?.booking_mix ?? [],
    statsLoading: statsQuery.isLoading,
    statsError: statsQuery.isError,
    statsErrorObj: statsQuery.error,

    // Bookings
    bookings: bookingsQuery.data ?? [],
    bookingsLoading: bookingsQuery.isLoading,
    bookingsError: bookingsQuery.isError,
    bookingsErrorObj: bookingsQuery.error,

    // Revenue Analytics
    revenueLoading: revenueQuery.isLoading,
    revenueError: revenueQuery.isError,
    revenueErrorObj: revenueQuery.error,

    // Occupancy
    occupancyData: occupancyQuery.data ?? null,
    occupancyLoading: occupancyQuery.isLoading,
    occupancyError: occupancyQuery.isError,
    occupancyErrorObj: occupancyQuery.error,

    // Accuracy
    accuracyData: accuracyQuery.data ?? null,
    accuracyLoading: accuracyQuery.isLoading,
    accuracyError: accuracyQuery.isError,
    accuracyErrorObj: accuracyQuery.error,

    // Expenses
    expensesHistory: expensesQuery.data ?? [],
    expensesLoading: expensesQuery.isLoading,
    expensesError: expensesQuery.isError,
    expensesErrorObj: expensesQuery.error,

    // Global
    isLoading: statsQuery.isLoading || bookingsQuery.isLoading || revenueQuery.isLoading || occupancyQuery.isLoading || accuracyQuery.isLoading || expensesQuery.isLoading,
    isError: statsQuery.isError || bookingsQuery.isError || revenueQuery.isError || occupancyQuery.isError || accuracyQuery.isError || expensesQuery.isError,
  };
};
