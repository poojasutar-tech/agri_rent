import { useQuery } from "@tanstack/react-query";
import api from "@/utils/domain";

/**
 * useBarData Hook
 * * Purpose: Manages state and data fetching for the Bar module including 
 * Categories, Subcategories, and Bar Items.
 * * Senior Dev Note: Uses TanStack Query for caching and state management 
 * to minimize redundant API calls.
 */

// --- API Fetchers ---

// Fetch Bar Categories (Master)
const fetchBarCategories = async () => {
  const res = await api.get("bar_categories/");
  return res.data || [];
};

// Fetch Bar Subcategories (Filtered by Category if provided)
const fetchBarSubcategories = async (barCatCode = null) => {
  const url = barCatCode
    ? `bar_subcategories/?bar_cat_code=${barCatCode}`
    : "bar_subcategories/";
  const res = await api.get(url);
  return res.data || [];
};

// Fetch Bar Items (Filtered by Category if provided)
const fetchBarItems = async (barCatCode = null) => {
  const url = barCatCode
    ? `bar_items/?bar_cat_code=${barCatCode}`
    : "bar_items/";
  const res = await api.get(url);
  return res.data || [];
};

// --- Individual Hooks ---

/**
 * Fetches all bar categories.
 * Stale time set to 10 mins as master data changes infrequently.
 */
export const useBarCategories = () => {
  return useQuery({
    queryKey: ["bar-categories"],
    queryFn: fetchBarCategories,
    staleTime: 1000 * 60 * 10, 
    refetchOnWindowFocus: false,
  });
};

/**
 * Fetches bar subcategories.
 * Keyed by barCatCode to ensure correct caching per category.
 */
export const useBarSubcategories = (barCatCode = null) => {
  return useQuery({
    queryKey: ["bar-subcategories", barCatCode],
    queryFn: () => fetchBarSubcategories(barCatCode),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
};

/**
 * Fetches individual bar items (drinks, spirits, etc.)
 */
export const useBarItems = (barCatCode = null) => {
  return useQuery({
    queryKey: ["bar-items", barCatCode],
    queryFn: () => fetchBarItems(barCatCode),
    staleTime: 1000 * 60 * 5, // 5 minutes for items
    refetchOnWindowFocus: false,
  });
};

// --- Combined Hook ---

/**
 * Orchestrator hook to fetch all related bar data in one go.
 * Useful for a full menu overview.
 */
export const useBarData = (barCatCode = null) => {
  const categoriesQuery = useBarCategories();
  const subcategoriesQuery = useBarSubcategories(barCatCode);
  const itemsQuery = useBarItems(barCatCode);

  return {
    categories: categoriesQuery.data || [],
    subcategories: subcategoriesQuery.data || [],
    items: itemsQuery.data || [],
    isLoading: 
      categoriesQuery.isLoading || 
      subcategoriesQuery.isLoading || 
      itemsQuery.isLoading,
    isError: 
      categoriesQuery.isError || 
      subcategoriesQuery.isError || 
      itemsQuery.isError,
    error: 
      categoriesQuery.error || 
      subcategoriesQuery.error || 
      itemsQuery.error,
  };
};