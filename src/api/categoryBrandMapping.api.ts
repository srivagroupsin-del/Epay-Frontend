import { http } from "../base_api/base_api";

/* ============================================================================
   TYPES
============================================================================ */

/**
 * Represents a single category-brand mapping row.
 * Each row links a Primary Category → Secondary Category → Brand.
 */
export type CategoryBrandMappingItem = {
    mappingId: number;
    primaryId: number;
    primaryName: string;
    secondaryId: number;
    secondaryName: string;
    brandId: number;
    brandName: string;
};

/* ============================================================================
   GET /api/category-brand/list
   Fetches ONLY mapped data (Primary Category, Secondary Category, Brand)
============================================================================ */

export const getCategoryBrandMappings = async (): Promise<CategoryBrandMappingItem[]> => {
    const json = await http("/category-brand/list");
    return json.data ?? json;
};
