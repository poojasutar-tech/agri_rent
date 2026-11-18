import { useQuery } from '@tanstack/react-query';
import api from '@/utils/domain';

// Default static logo fallback
import defaultLogo from '@/assets/logo.png';

const fetchLogo = async () => {
    try {
        const response = await api.get('logo/');
        if (response.data && response.data.length > 0) {
            // Get the most recently uploaded logo (the first one since it's ordered by -id)
            const latestLogo = response.data[0];
            return latestLogo.image_src || defaultLogo;
        }
        return defaultLogo;
    } catch (error) {
        console.error('Failed to fetch site logo:', error);
        return defaultLogo;
    }
};

export const useLogo = () => {
    return useQuery({
        queryKey: ['site-logo'],
        queryFn: fetchLogo,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        refetchOnWindowFocus: false, // Don't aggressively refetch unless needed
    });
};