import { useQuery } from '@tanstack/react-query';
import api from '@/utils/domain';

/**
 * Default fallback images for different page types
 * These are used when no banner is found in the database
 */
const DEFAULT_BANNERS = {
  EXPERIENCES: {
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2",
    title: "Life Beyond the Room",
    subtitle: "The Konkan coast is your playground"
  },
  BAR: {
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b",
    title: "The Shore Bar",
    subtitle: "Cold Drinks. Warm Breeze. Golden Hours."
  },
  ABOUT: {
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd",
    title: "Our Story",
    subtitle: "Where the Sea Meets the Soul"
  },
  RESTAURANT: {
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
    title: "Coastal Kitchen",
    subtitle: "Authentic Konkani Flavors"
  },
  ROOMS: {
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32",
    title: "Rooms & Suites",
    subtitle: "Stay by the Sea"
  },
  GALLERY: {
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    title: "Gallery",
    subtitle: "Moments from the Konkan Coast"
  },
  CONTACT: {
    image: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a",
    title: "Get in Touch",
    subtitle: "We'd love to hear from you"
  },
  HOME: {
    image: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0",
    title: "YourHotel",
    subtitle: "Where the Sea Meets the Soul"
  }
};

/**
 * Fetch banner data by page_code from the API
 * @param {string} pageCode - The page code (e.g., 'EXPERIENCES', 'BAR', 'ABOUT')
 * @returns {Promise<Object>} - Banner data with display_image, banner_title, banner_subtitle
 */
const fetchBannerByCode = async (pageCode) => {
  try {
    const response = await api.get(`page-banners/${pageCode}/`);
    if (response.data) {
      return {
        image: response.data.display_image || getDefaultBanner(pageCode).image,
        title: response.data.banner_title || getDefaultBanner(pageCode).title,
        subtitle: response.data.banner_subtitle || getDefaultBanner(pageCode).subtitle,
        pageCode: pageCode,
        status: response.data.status
      };
    }
    return getDefaultBanner(pageCode);
  } catch (error) {
    console.warn(`Failed to fetch banner for ${pageCode}:`, error);
    return getDefaultBanner(pageCode);
  }
};

/**
 * Get default banner data for a page code
 * @param {string} pageCode - The page code
 * @returns {Object} - Default banner data
 */
const getDefaultBanner = (pageCode) => {
  const upperCode = pageCode?.toUpperCase();
  return DEFAULT_BANNERS[upperCode] || {
    image: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0",
    title: "YourHotel",
    subtitle: "Where the Sea Meets the Soul"
  };
};

/**
 * Custom hook to fetch and cache page banner data
 * @param {string} pageCode - The page code to fetch banner for
 * @returns {Object} - Query result with banner data, loading state, and error
 * 
 * @example
 * const { bannerData, isLoading, error } = usePageBanner('EXPERIENCES');
 * 
 * // In your component:
 * <img src={bannerData.image} alt={bannerData.title} />
 * <h1>{bannerData.title}</h1>
 * <p>{bannerData.subtitle}</p>
 */
export const usePageBanner = (pageCode) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['page-banner', pageCode],
    queryFn: () => fetchBannerByCode(pageCode),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    refetchOnWindowFocus: false,
    enabled: !!pageCode, // Only fetch if pageCode is provided
  });

  return {
    bannerData: data || getDefaultBanner(pageCode),
    isLoading,
    error,
    // Helper to check if using fallback
    isFallback: !data || data.image === getDefaultBanner(pageCode).image
  };
};

export default usePageBanner;
