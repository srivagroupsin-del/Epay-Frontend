import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { http } from "../base_api/base_api";

/* ============================================================================
   TYPES
============================================================================ */

export interface Brand {
    brand_id: number;
    brand_name: string;
}

export interface SecondaryCategory {
    secondary_id: number;
    secondary_name: string;
    brands: Brand[];
}

export interface PrimaryCategory {
    primary_id: number;
    primary_name: string;
    brands?: Brand[];        // direct brands (primary-only mapping)
    secondaries?: SecondaryCategory[];
}

/** Flattened item for tables and searches */
export interface CategoryBrandMappingItem {
    id?: number;
    mappingId?: number;
    primaryId: number;
    primaryName: string;
    secondaryId: number;
    secondaryName: string;
    brandId: number | string;
    brandName: string;
    /** For compatibility with older code */
    primary_category_id?: number;
    primary_name?: string;
    secondary_category_id?: number;
    secondary_name?: string;
    brand_id?: number | string;
    brand_name?: string;
    category_name?: string;
}

/* ============================================================================
   CONTEXT TYPE
============================================================================ */

interface MappingContextType {
    /** Hierarchical structure (Primary -> Secondary -> Brand) */
    categoryData: PrimaryCategory[];
    /** Flattened structure for tables */
    mappings: CategoryBrandMappingItem[];
    loading: boolean;
    refreshMappings: () => Promise<PrimaryCategory[]>;
}

const MappingContext = createContext<MappingContextType | undefined>(undefined);

/* ============================================================================
   PROVIDER
============================================================================ */

export const MappingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [categoryData, setCategoryData] = useState<PrimaryCategory[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshMappings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await http("/category-brand/list");
            const data = response?.data || response || [];

            // Expected format is already hierarchical
            setCategoryData(data);
            return data;
        } catch (err) {
            console.error("Failed to load category-brand hierarchy:", err);
            return [] as PrimaryCategory[];
        } finally {
            setLoading(false);
        }
    }, []);

    // Derive flattened mappings for backward compatibility
    const mappings = useMemo(() => {
        const flat: CategoryBrandMappingItem[] = [];

        categoryData.forEach(p => {
            const secondaries = p.secondaries ?? [];

            // ── Case 1: Primary has direct brands (no secondary) ──
            const directBrands = p.brands ?? [];
            if (directBrands.length > 0) {
                const bNames = directBrands.map(b => b.brand_name).join(", ");
                const bIds = directBrands.map(b => b.brand_id).join(",");
                flat.push({
                    id: p.primary_id,
                    mappingId: p.primary_id,
                    primaryId: p.primary_id,
                    primaryName: p.primary_name,
                    secondaryId: 0,
                    secondaryName: "",
                    brandId: bIds,
                    brandName: bNames,
                    primary_category_id: p.primary_id,
                    primary_name: p.primary_name,
                    secondary_category_id: undefined,
                    secondary_name: "",
                    brand_id: bIds,
                    brand_name: bNames,
                    category_name: p.primary_name,
                });
            }

            // ── Case 2: Primary-only (secondaries empty, no direct brands) ──
            // Still emit one row so it appears in the table
            if (directBrands.length === 0 && secondaries.length === 0) {
                flat.push({
                    id: p.primary_id,
                    mappingId: p.primary_id,
                    primaryId: p.primary_id,
                    primaryName: p.primary_name,
                    secondaryId: 0,
                    secondaryName: "",
                    brandId: "",
                    brandName: "",
                    primary_category_id: p.primary_id,
                    primary_name: p.primary_name,
                    secondary_category_id: undefined,
                    secondary_name: "",
                    brand_id: "",
                    brand_name: "",
                    category_name: p.primary_name,
                });
            }

            // ── Case 3: Has secondaries ──
            secondaries.forEach(s => {
                const bNames = s.brands.map(b => b.brand_name).join(", ");
                const bIds = s.brands.map(b => b.brand_id).join(",");
                const idValue = s.secondary_id || p.primary_id;

                flat.push({
                    id: idValue,
                    mappingId: idValue,
                    primaryId: p.primary_id,
                    primaryName: p.primary_name,
                    secondaryId: s.secondary_id,
                    secondaryName: s.secondary_name,
                    brandId: bIds,
                    brandName: bNames,
                    primary_category_id: p.primary_id,
                    primary_name: p.primary_name,
                    secondary_category_id: s.secondary_id,
                    secondary_name: s.secondary_name,
                    brand_id: bIds,
                    brand_name: bNames,
                    category_name: s.secondary_name || p.primary_name,
                });
            });
        });

        return flat;
    }, [categoryData]);

    useEffect(() => {
        refreshMappings();
    }, [refreshMappings]);

    return (
        <MappingContext.Provider value={{ categoryData, mappings, loading, refreshMappings }}>
            {children}
        </MappingContext.Provider>
    );
};

/* ============================================================================
   HOOK
============================================================================ */

export const useMapping = () => {
    const context = useContext(MappingContext);
    if (context === undefined) {
        throw new Error("useMapping must be used within a MappingProvider");
    }
    return context;
};
