import { useQuery } from '@tanstack/react-query';
import api from '@/utils/domain';
import { 
  Fish, 
  Leaf, 
  Heart, 
  Recycle, 
  Users, 
  MapPin,
  Wifi,
  Coffee,
  Waves,
  Sun,
  Umbrella,
  Anchor,
  Star,
  Home,
  Compass
} from 'lucide-react';

/**
 * Default fallback features for the About page
 * These are used when no features are found in the database
 */
const DEFAULT_FEATURES = [
  {
    id: 1,
    feature_title: "Fresh Local Catch",
    feature_description: "Fish bought directly from local fishermen each morning at the harbor.",
    icon_name: "Fish",
    display_order: 1,
    status: 1
  },
  {
    id: 2,
    feature_title: "Farm-to-Table",
    feature_description: "Coconut, spices, and rice grown locally in our own coastal gardens.",
    icon_name: "Leaf",
    display_order: 2,
    status: 1
  },
  {
    id: 3,
    feature_title: "Boutique & Personal",
    feature_description: "Not a chain hotel; every guest is known by name and treated like family.",
    icon_name: "Heart",
    display_order: 3,
    status: 1
  },
  {
    id: 4,
    feature_title: "Eco-Conscious",
    feature_description: "Minimal plastic, local building materials, and a deep respect for nature.",
    icon_name: "Recycle",
    display_order: 4,
    status: 1
  },
  {
    id: 5,
    feature_title: "Supporting Local",
    feature_description: "We employ local chefs, fishermen, guides, and artisans.",
    icon_name: "Users",
    display_order: 5,
    status: 1
  },
  {
    id: 6,
    feature_title: "The Sea Is Everything",
    feature_description: "Our location, our food, and our soul are deeply tied to the Arabian Sea.",
    icon_name: "MapPin",
    display_order: 6,
    status: 1
  }
];

/**
 * Icon mapping for Lucide icons
 * Add more icons as needed
 */
const ICON_MAP = {
  Fish,
  Leaf,
  Heart,
  Recycle,
  Users,
  MapPin,
  Wifi,
  Coffee,
  Waves,
  Sun,
  Umbrella,
  Anchor,
  Star,
  Home,
  Compass
};

/**
 * Fetch property features from the public API
 * @returns {Promise<Array>} - Array of property features
 */
const fetchPropertyFeatures = async () => {
  try {
    const response = await api.get('property-features/public/');
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
    return DEFAULT_FEATURES;
  } catch (error) {
    console.warn('Failed to fetch property features:', error);
    return DEFAULT_FEATURES;
  }
};

/**
 * Get the Lucide icon component by name
 * @param {string} iconName - The name of the icon
 * @returns {Component} - The Lucide icon component
 */
export const getFeatureIcon = (iconName) => {
  if (!iconName) return Heart;
  const normalizedName = iconName.charAt(0).toUpperCase() + iconName.slice(1).toLowerCase();
  return ICON_MAP[normalizedName] || Heart;
};

/**
 * Custom hook to fetch and cache property features
 * @returns {Object} - Query result with features data, loading state, and error
 * 
 * @example
 * const { features, isLoading, error, getIcon } = usePropertyFeatures();
 * 
 * // In your component:
 * {features.map((feature) => (
 *   <div key={feature.id}>
 *     <IconComponent icon={getIcon(feature.icon_name)} />
 *     <h3>{feature.feature_title}</h3>
 *     <p>{feature.feature_description}</p>
 *   </div>
 * ))}
 */
export const usePropertyFeatures = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['property-features'],
    queryFn: fetchPropertyFeatures,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  return {
    features: data || DEFAULT_FEATURES,
    isLoading,
    error,
    getIcon: getFeatureIcon,
    // Helper to check if using fallback
    isFallback: !data || data === DEFAULT_FEATURES
  };
};

export default usePropertyFeatures;
