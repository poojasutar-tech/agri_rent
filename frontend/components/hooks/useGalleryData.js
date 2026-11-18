import { useQuery } from "@tanstack/react-query";
import api from "@/utils/domain";

/**
 * useGalleryData Hook
 * Purpose: Manages state and data fetching for the Gallery module.
 * Logic: Implements TanStack Query for optimized caching of images and categories.
 */

// --- API Fetchers ---

const fetchGalleryCategories = async () => {
  const res = await api.get("gallery_categories/");
  return Array.isArray(res.data) ? res.data : res.data.results || [];
};

/**
 * Dynamic Image Fetcher
 * Matches Django paths:
 *   - 'api/gallery_images/public/all/'  (for All / null)
 *   - 'api/gallery_images/<str:gallery_cat_code>/images/' (for specific category)
 */
const fetchGalleryImages = async (categoryCode) => {
  const isAll = !categoryCode || categoryCode === "All";
  const endpoint = isAll
    ? "gallery_images/public/all/"
    : `gallery_images/${categoryCode}/images/`;
  const res = await api.get(endpoint);
  return Array.isArray(res.data) ? res.data : res.data.results || [];
};

// --- Individual Hooks ---

export const useGalleryCategories = () => {
  return useQuery({
    queryKey: ["gallery-categories"],
    queryFn: fetchGalleryCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes for master data
    refetchOnWindowFocus: false,
  });
};

export const useGalleryImages = (categoryCode = null) => {
  return useQuery({
    // Include categoryCode in the key to ensure independent cache buckets
    queryKey: ["gallery-images", categoryCode || "All"],
    queryFn: () => fetchGalleryImages(categoryCode),
    staleTime: 1000 * 60 * 5, // 5 minutes for images
    refetchOnWindowFocus: false,
  });
};

// --- Combined Orchestrator ---

export const useGalleryData = (categoryCode = null) => {
  const categoriesQuery = useGalleryCategories();
  const imagesQuery = useGalleryImages(categoryCode);

  return {
    categories: categoriesQuery.data || [],
    images: imagesQuery.data || [],
    isLoading: categoriesQuery.isLoading || imagesQuery.isLoading,
    isError: categoriesQuery.isError || imagesQuery.isError,
    error: categoriesQuery.error || imagesQuery.error,
    refetchAll: () => {
      categoriesQuery.refetch();
      imagesQuery.refetch();
    }
  };
};