import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IMAGE_BASE_URL } from "../../../../base_api/api_list";
import { http } from "../../../../base_api/base_api";
import { getBrands, type Brand } from "../../../../api/brand.api";
import { saveBrandMapping, getBrandMapping } from "../../../../api/brandMapping.api";
import { type CategoryRow } from "../../../category/models/category.api";
import { X, Save, Search } from "lucide-react";
import "./AddCategoryBrand.css";
import { useMapping } from "../../../../context/MappingContext";
import { useLoading } from "../../../../context/LoadingContext";
import { useSuccessPopup } from "../../../../context/SuccessPopupContext";
import GlobalStoreHeader from "../../../../components/common/GlobalStoreHeader";
import { useCategoryStore } from "../../../../store/useCategoryStore";
import { useBrandStore } from "../../../../store/useBrandStore";

const AddCategoryBrand = () => {
    const navigate = useNavigate();
    const { refreshMappings } = useMapping();
    const { showLoader, hideLoader } = useLoading();
    const { showSuccess } = useSuccessPopup();
    const [brands, setBrands] = useState<Brand[]>([]);

    // Add useMemo to imports if not present, otherwise this relies on react import
    // To be safe assuming 'react' import has 'useMemo' added manually or already present.
    // The previous view_file showed: import { useEffect, useState, useRef } from "react";
    // I NEED TO ADD useMemo TO IMPORT. I will do it in a separate block or here? 
    // I can't edit multiple disjoint blocks easily if I don't target correctly. 
    // I will assume for now I can edit imports separately or I will just not use useMemo and do filter inline to be safe.
    // Let's avoid useMemo for now to reduce complexity of tool calls if imports checks fail.

    // Actually, I can just recalculate secondaryCategories on render, it's cheap.


    const [selectedPrimary, setSelectedPrimary] = useState("");
    const [enableSecondary, setEnableSecondary] = useState(false);
    const [selectedSecondary, setSelectedSecondary] = useState("");

    const [mappedBrandIds, setMappedBrandIds] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [fetchingMapping, setFetchingMapping] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [limit, setLimit] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const countOptions = [10, 20, 50, 100, 250, 500];


    /* ======================
       LOAD DATA
    ====================== */
    /* ======================
       LOAD DATA
    ====================== */
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    // const [hierarchy, setHierarchy] = useState<any[]>([]); // Removed: Not used for dropdowns

    useEffect(() => {
        // Load ALL Categories (Raw List)
        showLoader("Loading categories & brands...");
        Promise.all([
            http("/categories").then(res => setCategories(res.data || [])),
            getBrands().then(setBrands)
        ])
            .catch(console.error)
            .finally(() => hideLoader());
    }, []);



    /* ======================
       DERIVED STATE
    ====================== */
    const primaryCategories = categories.filter(c => c.category_type === "primary");

    const secondaryCategories = useMemo(() => {
        if (!selectedPrimary) return [];
        return categories.filter(c =>
            c.category_type === "secondary" &&
            String(c.parent_category_id) === selectedPrimary
        );
    }, [categories, selectedPrimary]);

    // The actual category ID to save against
    const finalCategoryId = enableSecondary && selectedSecondary
        ? selectedSecondary
        : selectedPrimary;

    const filteredBrandsTotal = brands
        .filter(b => {
            const bName = b.brand_name || "";
            const matchesSearch = bName.toLowerCase().startsWith(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" || (b.status || "").toLowerCase() === statusFilter.toLowerCase();
            const matchesSelection = !showSelectedOnly || mappedBrandIds.includes(b.id);
            return matchesSearch && matchesStatus && matchesSelection;
        })
        .sort((a, b) => (a.brand_name || "").localeCompare(b.brand_name || "", undefined, { sensitivity: 'base' }));



    const totalPages = Math.ceil(filteredBrandsTotal.length / limit);
    const paginatedBrands = filteredBrandsTotal.slice(
        (currentPage - 1) * limit,
        currentPage * limit
    );

    /* ======================
       FETCH MAPPING ON SELECT
    ====================== */
    /* ======================
       FETCH MAPPING ON SELECT
    ====================== */
    useEffect(() => {
        if (!finalCategoryId) {
            setMappedBrandIds([]);
            return;
        }

        const fetchMapping = async () => {
            try {
                setFetchingMapping(true);
                showLoader("Loading existing brand mapping...");
                const result = await getBrandMapping();

                let ids: number[] = [];
                const list = result.data || result.brand_mappings || result.mappings || result.items || (Array.isArray(result) ? result : []);

                if (Array.isArray(list)) {
                    // Loop through primaries to find match (either primary itself or nested secondary)
                    for (const primary of list) {
                        // 1. Check if Primary matches
                        if (Number(primary.primary_id || primary.id) === Number(finalCategoryId)) {
                            // Found Primary
                            // Check for direct brands
                            if (primary.brands && Array.isArray(primary.brands)) {
                                ids = primary.brands.map((b: any) => Number(b.brand_id || b.id));
                            } else if (primary.brand_ids && Array.isArray(primary.brand_ids)) {
                                ids = primary.brand_ids.map(Number);
                            }
                            break; // specific match found
                        }

                        // 2. Check Secondaries
                        if (primary.secondaries && Array.isArray(primary.secondaries)) {
                            const secMatch = primary.secondaries.find((s: any) => Number(s.secondary_id || s.id) === Number(finalCategoryId));
                            if (secMatch) {
                                // Found Secondary
                                if (secMatch.brands && Array.isArray(secMatch.brands)) {
                                    ids = secMatch.brands.map((b: any) => Number(b.brand_id || b.id));
                                } else if (secMatch.brand_ids && Array.isArray(secMatch.brand_ids)) {
                                    ids = secMatch.brand_ids.map(Number);
                                }
                                break; // specific match found
                            }
                        }
                    }
                } else if (result && typeof result === 'object') {
                    // Fallback
                    if (Number(result.category_id) === Number(finalCategoryId) || Number(result.id) === Number(finalCategoryId)) {
                        if (Array.isArray(result.brand_ids)) {
                            ids = result.brand_ids.map(Number);
                        } else if (Array.isArray(result.brands)) {
                            ids = result.brands.map((b: any) => Number(b.brand_id || b.id));
                        }
                    }
                }

                // Filter out NaNs if any
                setMappedBrandIds(ids.filter(id => !isNaN(id)));
            } catch (err) {
                console.error("Failed to fetch mapping", err);
                setMappedBrandIds([]);
            } finally {
                setFetchingMapping(false);
                hideLoader();
            }
        };

        fetchMapping();
    }, [finalCategoryId]);

    /* ======================
       HANDLERS
    ====================== */


    const toggleBrand = (id: number) => {
        setMappedBrandIds(prev =>
            prev.includes(id)
                ? prev.filter(bId => bId !== id)
                : [...prev, id]
        );
    };


    const handleSave = async () => {
        if (!selectedPrimary) {
            alert("Please select a Primary Category");
            return;
        }
        // Secondary is OPTIONAL — do not block save if secondary is enabled but not selected

        try {
            setSaving(true);
            showLoader("Saving brand mapping...");
            await saveBrandMapping({
                primary_category_id: selectedPrimary,
                // Send null when secondary is disabled OR not selected
                secondary_category_id: (enableSecondary && selectedSecondary) ? selectedSecondary : null,
                is_secondary_enabled: enableSecondary && !!selectedSecondary,
                brand_ids: mappedBrandIds,
            });
            showSuccess("Brand mapping has been saved successfully.", "Saved Successfully!");
            await refreshMappings(); // refresh view table
            navigate("/manage-category-brand");
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Save failed");
        } finally {
            setSaving(false);
            hideLoader();
        }
    };

    return (
        <div className="mcb-container">
            <GlobalStoreHeader />

            <div className="mcb-header">
                <div>
                    <h2>Add Category Brand</h2>
                </div>
                <Link
                    to="/brands/add"
                    className="mcb-btn mcb-btn-primary"
                >
                    Add New Brand
                </Link>
            </div>

            <div className="mcb-card mcb-overflow-visible problem-parent">

                {/* FILTERS / CATEGORY SELECTION */}
                <div className="mcb-filters-row mcb-overflow-visible">

                    {/* PRIMARY CATEGORY */}
                    <div className="mcb-dropdown-container">
                        <label>Primary Category *</label>
                        <select
                            className="mcb-entries-select"
                            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", height: "42px", outline: "none", cursor: "pointer" }}
                            value={selectedPrimary}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedPrimary(val);
                                const selectedCategory = primaryCategories.find(c => String(c.id) === val);
                                if (selectedCategory && selectedCategory.category_name) {
                                    useCategoryStore.getState().setCategory(selectedCategory.category_name);
                                }
                                setSelectedSecondary("");
                            }}
                        >
                            <option value="">Select Primary</option>
                            {primaryCategories.map(c => (
                                <option key={c.id} value={String(c.id)}>
                                    {c.category_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mcb-checkbox-wrapper">
                        <label className="mcb-checkbox-label">
                            <input
                                type="checkbox"
                                checked={enableSecondary}
                                onChange={e => setEnableSecondary(e.target.checked)}
                            />
                            <span>Enable Secondary</span>
                        </label>
                    </div>

                    {/* SECONDARY CATEGORY */}
                    {enableSecondary && (
                        <div className="mcb-dropdown-container">
                            <label>Secondary Category</label>
                            <select
                                className="mcb-entries-select"
                                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", height: "42px", outline: "none", cursor: "pointer" }}
                                value={selectedSecondary}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedSecondary(val);
                                    const selectedCategory = secondaryCategories.find(c => String(c.id) === val);
                                    if (selectedCategory && selectedCategory.category_name) {
                                        useCategoryStore.getState().setCategory(selectedCategory.category_name);
                                    }
                                }}
                                disabled={!selectedPrimary}
                            >
                                <option value="">Select Secondary</option>
                                {secondaryCategories.map(c => (
                                    <option key={c.id} value={String(c.id)}>
                                        {c.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                </div>

                {/* BRAND TABLE CONTROLS */}
                <div className="mcb-brand-selection-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <h3 className="mcb-brand-selection-title" style={{ margin: 0 }}>Select Brands</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                className="mcb-btn mcb-btn-primary mcb-btn-small"
                                onClick={() => {
                                    const visibleIds = paginatedBrands.map(b => b.id);
                                    setMappedBrandIds(prev => Array.from(new Set([...prev, ...visibleIds])));
                                }}
                            >
                                Select Page
                            </button>
                            <button
                                type="button"
                                className="mcb-btn mcb-btn-danger mcb-btn-small"
                                onClick={() => {
                                    const visibleIds = paginatedBrands.map(b => b.id);
                                    setMappedBrandIds(prev => prev.filter(id => !visibleIds.includes(id)));
                                }}
                            >
                                Unselect Page
                            </button>
                        </div>
                    </div>

                    <div className="mcb-brand-filters-row mcb-overflow-visible">

                        {/* SHOW ENTRIES */}
                        <div className="mcb-filter-group">
                            <label>Show</label>
                            <select
                                className="mcb-entries-select"
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                {countOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        {/* STATUS DROPDOWN */}
                        <div className="mcb-filter-group">
                            <label>Status</label>
                            <select
                                className="mcb-entries-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", height: "42px", outline: "none", cursor: "pointer" }}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* SEARCH BOX */}
                        <div className="mcb-filter-group">
                            <label>Search</label>
                            <div className="mcb-search-icon-wrapper">
                                <Search size={16} className="mcb-search-icon" />
                                <input
                                    className="mcb-brand-search-input"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>

                        {/* SELECTED ONLY TOGGLE */}
                        <div className="mcb-checkbox-wrapper mcb-ml-auto">
                            <label className="mcb-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={showSelectedOnly}
                                    onChange={(e) => setShowSelectedOnly(e.target.checked)}
                                />
                                Selected Only
                            </label>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                {fetchingMapping ? <p className="mcb-text-center">Loading selection...</p> : (
                    <>
                        <div className="mcb-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th className="mcb-col-check"></th>
                                        <th className="mcb-col-id">#</th>
                                        <th>Image</th>
                                        <th>Brand Name</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedBrands.map((brand, index) => (
                                        <tr key={brand.id}>
                                            <td className="mcb-text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={mappedBrandIds.includes(brand.id)}
                                                    onChange={() => {
                                                        toggleBrand(brand.id);
                                                        if (!mappedBrandIds.includes(brand.id)) {
                                                            useBrandStore.getState().setBrand(brand.brand_name);
                                                        }
                                                    }}
                                                    className="mcb-table-checkbox"
                                                />

                                            </td>
                                            <td>{(currentPage - 1) * limit + index + 1}</td>
                                            <td>
                                                {brand.image ? (
                                                    <img
                                                        src={`${IMAGE_BASE_URL}/${brand.image}`}
                                                        alt={brand.brand_name}
                                                        className="thumb"
                                                        style={{ width: "40px", height: "40px", objectFit: "contain" }}
                                                    />
                                                ) : "—"}
                                            </td>
                                            <td className="mcb-brand-name-cell" style={{ cursor: 'pointer' }} onClick={() => useBrandStore.getState().setBrand(brand.brand_name)}>{brand.brand_name}</td>

                                            <td>
                                                <span className={`badge ${brand.status.toLowerCase()}`}>
                                                    {brand.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedBrands.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="empty">No brands found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        {filteredBrandsTotal.length > 0 && (
                            <div className="mcb-pagination-wrapper">
                                <div>
                                    Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, filteredBrandsTotal.length)} of {filteredBrandsTotal.length} entries
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #323da7', borderRadius: '50%', background: 'transparent', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#323da7', opacity: currentPage === 1 ? 0.5 : 1 }}
                                    >≪</button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d1d5db', borderRadius: '50%', background: '#f3f4f6', color: '#323da7', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                                    >‹</button>
                                    <span style={{ fontWeight: '600', color: '#323da7' }}>{currentPage}</span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d1d5db', borderRadius: '50%', background: '#f3f4f6', color: '#323da7', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                                    >›</button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #323da7', borderRadius: '50%', background: 'transparent', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: '#323da7', opacity: currentPage === totalPages ? 0.5 : 1 }}
                                    >≫</button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="mcb-form-actions">
                    <Link to="/manage-category-brand" className="mcb-btn mcb-btn-secondary">
                        <X size={16} /> Cancel
                    </Link>
                    <button className="mcb-btn mcb-btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : <><Save size={16} /> Save Mapping</>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddCategoryBrand;
