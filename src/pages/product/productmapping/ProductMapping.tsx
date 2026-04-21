import { useState, useEffect, useMemo, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import "./ProductMapping.css";

// API Imports
import { getProductsMappings, bulkUpdateMappings, type ProductMappingRecord } from "../../../api/product.api";

const ProductMapping = () => {

    const [allMappingRecords, setAllMappingRecords] = useState<ProductMappingRecord[]>([]);
    const [saving, setSaving] = useState(false);
    const [productsLoading, setProductsLoading] = useState(false);
    const { showLoader, hideLoader } = useLoading();
    const { showSuccess } = useSuccessPopup();

    const [selectedPrimaryId, setSelectedPrimaryId] = useState<string>("");
    const [selectedSecondaryId, setSelectedSecondaryId] = useState<string>("");
    const [selectedBrandId, setSelectedBrandId] = useState<string>("");

    const [productSearch, setProductSearch] = useState("");
    const [limit, setLimit] = useState(10);

    // Dropdown visibility states
    const [showPrimary, setShowPrimary] = useState(false);
    const [showSecondary, setShowSecondary] = useState(false);
    const [showBrand, setShowBrand] = useState(false);

    // Dropdown search states
    const [primarySearch, setPrimarySearch] = useState("");
    const [brandSearch, setBrandSearch] = useState("");

    const primaryRef = useRef<HTMLDivElement>(null);
    const secondaryRef = useRef<HTMLDivElement>(null);
    const brandRef = useRef<HTMLDivElement>(null);

    const loadProducts = async () => {
        try {
            setProductsLoading(true);
            showLoader("Loading product mappings, please wait...");
            const res: any = await getProductsMappings().catch(() => null);
            const list = res?.data || res?.mappings || (Array.isArray(res) ? res : []);
            setAllMappingRecords(list);
        } catch (error) {
            console.error("Failed to fetch product mappings:", error);
        } finally {
            setProductsLoading(false);
            hideLoader();
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (primaryRef.current && !primaryRef.current.contains(event.target as Node)) setShowPrimary(false);
            if (secondaryRef.current && !secondaryRef.current.contains(event.target as Node)) setShowSecondary(false);
            if (brandRef.current && !brandRef.current.contains(event.target as Node)) setShowBrand(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /* ---------------- DROPDOWN DATA ---------------- */

    // Extract unique primary categories from the mapping records
    const primaryCategories = useMemo(() => {
        const map = new Map<string, string>();

        allMappingRecords.forEach(rec => {
            if (
                rec.primary_category_id !== null &&
                rec.primary_category_name
            ) {
                map.set(
                    String(rec.primary_category_id),
                    rec.primary_category_name
                );
            }
        });

        let list = Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (primarySearch) {
            list = list.filter(x =>
                x.name.toLowerCase().includes(primarySearch.toLowerCase())
            );
        }

        return list;
    }, [allMappingRecords, primarySearch]);
    const secondaryOptions = useMemo(() => {
        if (!selectedPrimaryId) return [];

        const map = new Map<string, string>();

        allMappingRecords.forEach(rec => {
            if (
                String(rec.primary_category_id) === selectedPrimaryId &&
                rec.secondary_category_id !== null &&
                rec.secondary_category_name
            ) {
                map.set(
                    String(rec.secondary_category_id),
                    rec.secondary_category_name
                );
            }
        });

        return Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [allMappingRecords, selectedPrimaryId]);

    // Extract unique brands filtered by selected primary
    const brandOptions = useMemo(() => {
        if (!selectedPrimaryId) return [];

        const map = new Map<string, string>();

        allMappingRecords.forEach(rec => {
            const pId = String(rec.primary_category_id || "");
            if (pId === selectedPrimaryId && rec.brand_id && rec.brand_name) {
                map.set(String(rec.brand_id), rec.brand_name);
            }
        });

        let list = Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (brandSearch) {
            list = list.filter(x =>
                x.name.toLowerCase().includes(brandSearch.toLowerCase())
            );
        }

        return list;
    }, [allMappingRecords, selectedPrimaryId, brandSearch]);
    /* ---------------- NORMALIZATION ---------------- */
    const normalizedProducts = useMemo(() => {
        return allMappingRecords.map(rec => ({
            ...rec,
            id: rec.product_id,
            name: rec.product_name,
            primary_category_id: rec.primary_category_id,
            secondary_category_id: rec.secondary_category_id,
            brand_id: rec.brand_id,
            primaryName: rec.primary_category_name || "",
            secondaryName: rec.secondary_category_name || "",
            brandName: rec.brand_name || ""
        }));
    }, [allMappingRecords]);
    /* ---------------- TABLE FILTER LOGIC ---------------- */

    const productRows = useMemo(() => {
        if (!selectedPrimaryId || !selectedBrandId) return [];

        let filtered = normalizedProducts.filter(p => {
            const matchP = String(p.primary_category_id) === selectedPrimaryId;
            const matchS =
                !selectedSecondaryId ||
                String(p.secondary_category_id) === selectedSecondaryId;
            const matchB = String(p.brand_id) === selectedBrandId;

            return matchP && matchS && matchB;
        });

        if (productSearch) {
            const search = productSearch.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(search)
            );
        }

        return filtered.slice(0, limit);
    }, [
        normalizedProducts,
        selectedPrimaryId,
        selectedSecondaryId,
        selectedBrandId,
        productSearch,
        limit
    ]);
    /* ---------------- HANDLERS ---------------- */

    const handleUpdateMapping = async () => {
        try {
            setSaving(true);
            showLoader("Saving product mapping...");
            const pIdsToUpdate = productRows.map((p: any) => Number(p.id));
            if (pIdsToUpdate.length === 0) return;

            await bulkUpdateMappings(pIdsToUpdate, [1]);
            showSuccess("Mapping saved successfully.", "Saved Successfully!");

            await loadProducts();

        } catch (err) {
            console.error(err);
            alert("Mapping failed ❌");
        } finally {
            setSaving(false);
            hideLoader();
        }
    };

    return (
        <div className="page-container">
            <div className="section-title">Product Mapping</div>

            {/* HEADER ACTIONS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                    Map products to specific Category & Brand combinations
                </p>
                <button
                    className="save-btn"
                    onClick={handleUpdateMapping}
                    disabled={saving || !selectedPrimaryId || !selectedBrandId || productRows.length === 0}
                >
                    {saving ? "Saving..." : `Save Mapping (${productRows.length})`}
                </button>
            </div>

            {/* FILTERS CARD */}
            <div className="card mapping-card">
                <div className="row">
                    {/* Primary Category Dropdown */}
                    <div className="form-group" ref={primaryRef}>
                        <label>Primary Category</label>
                        <div className="custom-dropdown-container">
                            <button
                                className="custom-dropdown-trigger"
                                onClick={() => setShowPrimary(!showPrimary)}
                            >
                                <span>{primaryCategories.find(c => c.id === selectedPrimaryId)?.name || "Select Category"}</span>
                                <ChevronDown size={16} />
                            </button>
                            {showPrimary && (
                                <div className="custom-dropdown-menu">
                                    <div className="dropdown-search-wrapper">
                                        <input
                                            className="dropdown-search-input"
                                            placeholder="Search category..."
                                            value={primarySearch}
                                            onChange={(e) => setPrimarySearch(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="dropdown-items">
                                        {primaryCategories.map(cat => (
                                            <div
                                                key={cat.id}
                                                className={`dropdown-item ${selectedPrimaryId === cat.id ? "selected" : ""}`}
                                                onClick={() => {
                                                    setSelectedPrimaryId(cat.id);
                                                    setSelectedSecondaryId("");
                                                    setSelectedBrandId("");
                                                    setShowPrimary(false);
                                                    setPrimarySearch("");
                                                }}
                                            >
                                                {cat.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Secondary Category Dropdown */}
                    <div className="form-group" ref={secondaryRef}>
                        <label>Secondary Category</label>
                        <div className="custom-dropdown-container">
                            <button
                                className="custom-dropdown-trigger"
                                onClick={() => setShowSecondary(!showSecondary)}
                                disabled={!selectedPrimaryId}
                            >
                                <span>
                                    {secondaryOptions.find(s => s.id === selectedSecondaryId)?.name ||
                                        "Select Secondary"}
                                </span>
                                <ChevronDown size={16} />
                            </button>

                            {showSecondary && (
                                <div className="custom-dropdown-menu">
                                    <div className="dropdown-items">
                                        <div
                                            className={`dropdown-item ${!selectedSecondaryId ? "selected" : ""}`}
                                            onClick={() => {
                                                setSelectedSecondaryId("");
                                                setShowSecondary(false);
                                            }}
                                        >
                                            All Secondary
                                        </div>

                                        {secondaryOptions.map(sec => (
                                            <div
                                                key={sec.id}
                                                className={`dropdown-item ${selectedSecondaryId === sec.id ? "selected" : ""}`}
                                                onClick={() => {
                                                    setSelectedSecondaryId(sec.id);
                                                    setShowSecondary(false);
                                                }}
                                            >
                                                {sec.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Brand Dropdown */}
                    <div className="form-group" ref={brandRef}>
                        <label>Brand</label>
                        <div className="custom-dropdown-container">
                            <button
                                className="custom-dropdown-trigger"
                                onClick={() => setShowBrand(!showBrand)}
                                disabled={!selectedPrimaryId}
                            >
                                <span>{brandOptions.find(b => b.id === selectedBrandId)?.name || "Select Brand"}</span>
                                <ChevronDown size={16} />
                            </button>
                            {showBrand && (
                                <div className="custom-dropdown-menu">
                                    <div className="dropdown-search-wrapper">
                                        <input
                                            className="dropdown-search-input"
                                            placeholder="Search brand..."
                                            value={brandSearch}
                                            onChange={(e) => setBrandSearch(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="dropdown-items">
                                        <div
                                            className={`dropdown-item ${!selectedBrandId ? "selected" : ""}`}
                                            onClick={() => {
                                                setSelectedBrandId("");
                                                setShowBrand(false);
                                                setBrandSearch("");
                                            }}
                                        >
                                            All Brands
                                        </div>
                                        {brandOptions.map(brand => (
                                            <div
                                                key={brand.id}
                                                className={`dropdown-item ${selectedBrandId === brand.id ? "selected" : ""}`}
                                                onClick={() => {
                                                    setSelectedBrandId(brand.id);
                                                    setShowBrand(false);
                                                    setBrandSearch("");
                                                }}
                                            >
                                                {brand.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PRODUCT TABLE SECTION */}
            {
                !selectedPrimaryId ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                        <div style={{ color: "#94a3b8", fontSize: "16px", marginBottom: "8px" }}>Primary Category Mandatory</div>
                        <div style={{ color: "#64748b", fontSize: "14px" }}>Please select a Primary Category to list products.</div>
                    </div>
                ) : (
                    <div className="table-container-outer">
                        {/* NEW SEARCH & LIMIT ROW */}
                        <div className="table-filter-integration-row">
                            <div className="filter-group-item" style={{ width: "400px" }}>
                                <label className="filter-label-text">PRODUCT SEARCH</label>
                                <div className="premium-search-container">
                                    <Search className="premium-search-icon" size={18} />
                                    <input
                                        className="premium-search-input"
                                        placeholder="Type product name or model..."
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="filter-group-item" style={{ width: "100px" }}>
                                <label className="filter-label-text">SHOW</label>
                                <select
                                    className="premium-limit-select"
                                    value={limit}
                                    onChange={e => setLimit(Number(e.target.value))}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={250}>250</option>
                                    <option value={500}>500</option>
                                </select>
                            </div>
                        </div>

                        <div className="product-table-header">
                            <h3 className="product-table-title">Select Products</h3>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                                Showing {Math.min(productRows.length, limit)} of {productRows.length} available results
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="mapping-table">
                                <thead>
                                    <tr>
                                        <th className="checkbox-col">
                                            <input
                                                type="checkbox"
                                                checked={productRows.length > 0}
                                                readOnly
                                            />
                                        </th>
                                        <th>PRODUCT NAME</th>
                                        <th>BRAND</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productRows.map((row: any) => (
                                        <tr
                                            key={row.id}
                                            className="selected-row"
                                            style={{ cursor: 'default' }}
                                        >
                                            <td className="checkbox-col">
                                                <input
                                                    type="checkbox"
                                                    checked={true}
                                                    readOnly
                                                />
                                            </td>
                                            <td className="product-name">{row.name || row.product_name}</td>
                                            <td>{row.brandName || "—"}</td>
                                        </tr>
                                    ))}

                                    {productRows.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="no-data">
                                                {productsLoading ? (
                                                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                                                        <div className="spinner-small"></div>
                                                        <span>Loading products...</span>
                                                    </div>
                                                ) : "No products matching current filter"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default ProductMapping;
