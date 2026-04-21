import { http } from "../base_api/base_api";

export type Business = {
    id: number;
    business_name: string;
    name?: string;
    status?: string;
};

/**
 * Fetch all businesses
 * GET /api/businesses
 */
export const getBusinesses = async (): Promise<Business[]> => {
    const json = await http("/businesses");

    // Robust parsing for different API response styles
    if (Array.isArray(json)) return json;

    // Check for nested data property (User reported: { data: { data: [] } })
    if (json.data) {
        if (Array.isArray(json.data)) return json.data;
        if (json.data.data && Array.isArray(json.data.data)) return json.data.data;
        if (json.data.businesses && Array.isArray(json.data.businesses)) return json.data.businesses;
    }

    // Check for direct businesses property
    if (json.businesses && Array.isArray(json.businesses)) return json.businesses;

    return [];
};
