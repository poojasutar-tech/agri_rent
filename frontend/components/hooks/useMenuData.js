import { useQuery } from "@tanstack/react-query";
import api from "@/utils/domain";

// Fetch categories
const fetchCategories = async () => {
  const res = await api.get("menu-categories/public/");
  return res.data || [];
};

// Fetch subcategories (optionally filtered by category)
const fetchSubcategories = async (categoryCode = null) => {
  const url = categoryCode 
    ? `menu-subcategories/public/?category_code=${categoryCode}`
    : "menu-subcategories/public/";
  const res = await api.get(url);
  return res.data || [];
};

// Fetch menu items (optionally filtered by category)
const fetchMenuItems = async (categoryCode = null) => {
  const url = categoryCode 
    ? `menu-items/public/?category_code=${categoryCode}`
    : "menu-items/public/";
  const res = await api.get(url);
  return res.data || [];
};

// Hook for categories
export const useMenuCategories = () => {
  return useQuery({
    queryKey: ["menu-categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for subcategories
export const useMenuSubcategories = (categoryCode = null) => {
  return useQuery({
    queryKey: ["menu-subcategories", categoryCode],
    queryFn: () => fetchSubcategories(categoryCode),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    enabled: true,
  });
};

// Hook for menu items
export const useMenuItems = (categoryCode = null) => {
  return useQuery({
    queryKey: ["menu-items", categoryCode],
    queryFn: () => fetchMenuItems(categoryCode),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Combined hook for all menu data
export const useMenuData = (categoryCode = null) => {
  const categoriesQuery = useMenuCategories();
  const subcategoriesQuery = useMenuSubcategories(categoryCode);
  const itemsQuery = useMenuItems(categoryCode);

  return {
    categories: categoriesQuery.data || [],
    subcategories: subcategoriesQuery.data || [],
    items: itemsQuery.data || [],
    isLoading: categoriesQuery.isLoading || subcategoriesQuery.isLoading || itemsQuery.isLoading,
    isError: categoriesQuery.isError || subcategoriesQuery.isError || itemsQuery.isError,
    error: categoriesQuery.error || subcategoriesQuery.error || itemsQuery.error,
  };
};
