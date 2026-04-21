import { useState, useEffect, useMemo } from "react";
import { useMapping, type PrimaryCategory, type SecondaryCategory, type Brand } from "../../context/MappingContext";

/**
 * DEPENDENT DROPDOWNS IMPLEMENTATION
 * 
 * Structure: Primary → Secondary → Brand
 * 
 * Rules:
 * 1. Primary selection loads secondaries
 * 2. Secondary selection loads brands
 * 3. Changing Primary resets Secondary and Brand
 * 4. Changing Secondary resets Brand
 */

const DependentDropdownsExample = () => {
    const { categoryData, loading } = useMapping();

    // Form state with IDs
    const [formData, setFormData] = useState({
        primary_id: "",
        secondary_id: "",
        brand_id: "",
    });

    /* ============================================================
       STEP 1: EXTRACT OPTIONS FROM HIERARCHICAL DATA
    ============================================================ */

    // Primary options (always available)
    const primaryOptions = useMemo(() => {
        return categoryData.map((primary: PrimaryCategory) => ({
            value: primary.primary_id,
            label: primary.primary_name,
        }));
    }, [categoryData]);

    // Secondary options (filtered by selected primary)
    const secondaryOptions = useMemo(() => {
        if (!formData.primary_id) return [];

        const selectedPrimary = categoryData.find(
            (p: PrimaryCategory) => p.primary_id === Number(formData.primary_id)
        );

        if (!selectedPrimary?.secondaries) return [];

        return selectedPrimary.secondaries.map((secondary: SecondaryCategory) => ({
            value: secondary.secondary_id,
            label: secondary.secondary_name,
        }));
    }, [categoryData, formData.primary_id]);

    // Brand options (filtered by selected secondary)
    const brandOptions = useMemo(() => {
        if (!formData.primary_id || !formData.secondary_id) return [];

        const selectedPrimary = categoryData.find(
            (p: PrimaryCategory) => p.primary_id === Number(formData.primary_id)
        );

        if (!selectedPrimary) return [];

        const selectedSecondary = selectedPrimary.secondaries?.find(
            (s: SecondaryCategory) => s.secondary_id === Number(formData.secondary_id)
        );

        if (!selectedSecondary?.brands) return [];

        return selectedSecondary.brands.map((brand: Brand) => ({
            value: brand.brand_id,
            label: brand.brand_name,
        }));
    }, [categoryData, formData.primary_id, formData.secondary_id]);

    /* ============================================================
       STEP 2: HANDLE DROPDOWN CHANGES WITH CASCADING RESET
    ============================================================ */

    const handlePrimaryChange = (value: string) => {
        setFormData({
            primary_id: value,
            secondary_id: "", // Reset secondary
            brand_id: "",     // Reset brand
        });
    };

    const handleSecondaryChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            secondary_id: value,
            brand_id: "", // Reset brand
        }));
    };

    const handleBrandChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            brand_id: value,
        }));
    };

    /* ============================================================
       STEP 3: AUTO-SELECT FOR EDIT MODE
       
       When editing, you receive:
       - mapping.category_id (this is actually secondary_id)
       - mapping.brand_id
       
       You need to:
       1. Find which primary contains this secondary
       2. Set primary_id, secondary_id, brand_id in correct order
    ============================================================ */

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const autoSelectFromMapping = (mappingData: { category_id: number; brand_id: number }) => {
        // Find the primary that contains this secondary
        let foundPrimary: PrimaryCategory | null = null;
        let foundSecondary: SecondaryCategory | null = null;

        for (const primary of categoryData) {
            const secondary = primary.secondaries?.find(
                (s: SecondaryCategory) => s.secondary_id === mappingData.category_id
            );
            if (secondary) {
                foundPrimary = primary;
                foundSecondary = secondary;
                break;
            }
        }

        if (foundPrimary && foundSecondary) {
            // IMPORTANT: Set in the correct order
            // This ensures the dropdowns populate correctly
            setFormData({
                primary_id: String(foundPrimary.primary_id),
                secondary_id: String(foundSecondary.secondary_id),
                brand_id: String(mappingData.brand_id),
            });
        }
    };
    /* eslint-enable @typescript-eslint/no-unused-vars */

    /* ============================================================
       EXAMPLE: SIMULATE EDIT MODE
    ============================================================ */

    useEffect(() => {
        // Example: When editing a product with mapping data
        // Uncomment this when you have actual product data

        // const productMapping = {
        //     category_id: 5,  // This is actually secondary_id from API
        //     brand_id: 12
        // };

        // if (categoryData.length > 0) {
        //     autoSelectFromMapping(productMapping);
        // }
    }, [categoryData, autoSelectFromMapping]);

    /* ============================================================
       RENDER
    ============================================================ */

    if (loading) {
        return <div>Loading categories...</div>;
    }

    return (
        <div className="dependent-dropdowns">
            {/* PRIMARY CATEGORY */}
            <div className="form-field">
                <label>Primary Category *</label>
                <select
                    value={formData.primary_id}
                    onChange={(e) => handlePrimaryChange(e.target.value)}
                    required
                >
                    <option value="">Select Primary Category</option>
                    {primaryOptions.map((option: { value: string | number; label: string }) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* SECONDARY CATEGORY */}
            <div className="form-field">
                <label>Secondary Category *</label>
                <select
                    value={formData.secondary_id}
                    onChange={(e) => handleSecondaryChange(e.target.value)}
                    disabled={!formData.primary_id || secondaryOptions.length === 0}
                    required
                >
                    <option value="">Select Secondary Category</option>
                    {secondaryOptions.map((option: { value: string | number; label: string }) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {formData.primary_id && secondaryOptions.length === 0 && (
                    <small>No secondary categories available</small>
                )}
            </div>

            {/* BRAND */}
            <div className="form-field">
                <label>Brand *</label>
                <select
                    value={formData.brand_id}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    disabled={!formData.secondary_id || brandOptions.length === 0}
                    required
                >
                    <option value="">Select Brand</option>
                    {brandOptions.map((option: { value: string | number; label: string }) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {formData.secondary_id && brandOptions.length === 0 && (
                    <small>No brands available</small>
                )}
            </div>

            {/* DEBUG INFO */}
            <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
                <h4>Selected Values:</h4>
                <p>Primary ID: {formData.primary_id || 'Not selected'}</p>
                <p>Secondary ID: {formData.secondary_id || 'Not selected'}</p>
                <p>Brand ID: {formData.brand_id || 'Not selected'}</p>
            </div>
        </div>
    );
};

export default DependentDropdownsExample;
