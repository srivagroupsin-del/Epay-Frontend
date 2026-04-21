import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    Plus, Search, Trash2,
    ChevronDown, SquarePen, Save
} from "lucide-react";

import { getBrands, type Brand } from "../../../../api/brand.api";
import { getCategories, type CategoryRow } from "../../../category/models/category.api";
import { saveBrandMapping } from "../../../../api/brandMapping.api";
import { IMAGE_BASE_URL } from "../../../../base_api/api_list";
import { useDeleteConfirm } from "../../../../context/DeleteConfirmContext";
import GlobalStoreHeader from "../../../../components/common/GlobalStoreHeader";
import { useCategoryStore } from "../../../../store/useCategoryStore";
import { useBrandStore } from "../../../../store/useBrandStore";
import { useMapping, type CategoryBrandMappingItem as MappingListItem } from "../../../../context/MappingContext";
import { useLoading } from "../../../../context/LoadingContext";
import { useSuccessPopup } from "../../../../context/SuccessPopupContext";
import "../../../category/views/addCategory.css";
import "./ManageCategoryBrand.css";




const ManageCategoryBrand = () => {
    /* ======================
       STATE
     ====================== */
    const { mappings, loading: contextLoading, refreshMappings } = useMapping();
    const { showLoader, hideLoader } = useLoading();
    const { showSuccess, showDeleteSuccess } = useSuccessPopup();
    const { confirmDelete } = useDeleteConfirm();
    const [viewMode, setViewMode] = useState<"list" | "add" | "edit">("list");
    const [searchParams, setSearchParams] = useSearchParams();


    // Form State
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [selectedPrimary, setSelectedPrimary] = useState("");
    const [enableSecondary, setEnableSecondary] = useState(false);
    const [selectedSecondary, setSelectedSecondary] = useState("");
    const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);

    // Search/Filter State
    const [searchQuery, setSearchQuery] = useState("");

    /* --- DYNAMIC DROPDOWN FILTERS --- */
    const [primaryFilter, setPrimaryFilter] = useState("");
    const [brandFilter, setBrandFilter] = useState("");

    const [limit, setLimit] = useState(10);
    const urlPage = Number(searchParams.get("page")) || 1;
    const [currentPage, setCurrentPage] = useState(urlPage);
    const [jumpInput, setJumpInput] = useState(String(urlPage));

    // Handle URL change (back button)
    useEffect(() => {
        setCurrentPage(urlPage);
    }, [urlPage]);
    const countOptions = [10, 20, 50, 100, 250, 500];

    // Searchable Dropdowns for Add/Edit
    const [showPrimaryList, setShowPrimaryList] = useState(false);
    const [showSecondaryList, setShowSecondaryList] = useState(false);
    const [primarySearch, setPrimarySearch] = useState("");
    const [secondarySearch, setSecondarySearch] = useState("");
    const primaryRef = useRef<HTMLDivElement>(null);
    const secondaryRef = useRef<HTMLDivElement>(null);

    // List Filter Searchable Dropdowns
    const [showPrimaryFilterList, setShowPrimaryFilterList] = useState(false);
    const [showBrandFilterList, setShowBrandFilterList] = useState(false);
    const [primaryFilterSearch, setPrimaryFilterSearch] = useState("");
    const [brandFilterSearch, setBrandFilterSearch] = useState("");
    const primaryFilterRef = useRef<HTMLDivElement>(null);
    const brandFilterRef = useRef<HTMLDivElement>(null);

    // Brand Selection Table State (Inside Form)
    const [brandLimit, setBrandLimit] = useState(10);
    const [brandPage, setBrandPage] = useState(1);
    const [brandSearch, setBrandSearch] = useState("");
    const [brandStatusFilter, setBrandStatusFilter] = useState("all");
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);

    /* ======================
       DERIVED STATE FOR FORM (FROM SYSTEM DATA)
    ====================== */
    const parentCategories = useMemo(() =>
        Array.isArray(categories) ? categories.filter((c: CategoryRow) => c.category_type?.toLowerCase() === "primary") : []
        , [categories]);

    const subCategories = useMemo(() =>
        Array.isArray(categories) ? categories.filter((c: CategoryRow) =>
            c.category_type?.toLowerCase() === "secondary" && String(c.parent_category_id) === selectedPrimary
        ) : []
        , [categories, selectedPrimary]);

    /* ======================
       DERIVED FILTER DROPDOWNS (PURELY FROM MAPPINGS)
    ====================== */

    // 1. Get unique Primary Categories from mappings for the filter dropdown
    const uniquePrimariesForFilter = useMemo(() => {
        const unique = new Map<number, string>();
        mappings.forEach(m => {
            const pId = m.primaryId || m.primary_category_id;
            const pName = m.primaryName || m.primary_name || m.category_name;
            if (pId && pName) {
                unique.set(Number(pId), pName);
            }
        });
        return Array.from(unique.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [mappings]);

    // 2. Get unique Brands from mappings, filtered by selected Primary ID
    const uniqueBrandsForFilter = useMemo(() => {
        const brandsFound = new Map<number, string>();

        let targetMappings = mappings;
        if (primaryFilter) {
            targetMappings = mappings.filter(m =>
                Number(m.primaryId || m.primary_category_id) === Number(primaryFilter)
            );
        }

        targetMappings.forEach(m => {
            const rawIds = String(m.brandId || m.brand_id || "");
            const rawNames = String(m.brandName || m.brand_name || "");

            if (rawIds && rawNames) {
                const idArray = rawIds.split(',').map(n => Number(n.trim()));
                const nameArray = rawNames.split(',').map(s => s.trim());

                idArray.forEach((id, idx) => {
                    if (!isNaN(id) && nameArray[idx]) {
                        brandsFound.set(id, nameArray[idx]);
                    }
                });
            }
        });

        return Array.from(brandsFound.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [mappings, primaryFilter]);

    // 3. Paginated brands for the form table
    const filteredBrandsForForm = useMemo(() => {
        let filtered = Array.isArray(brands) ? brands : [];

        // Apply search filter (Starts-With)
        const lowerBrandSearch = brandSearch.trim().toLowerCase();
        if (lowerBrandSearch) {
            filtered = filtered.filter(b =>
                (b.brand_name || "").trim().toLowerCase().startsWith(lowerBrandSearch)
            );
        }

        // Apply Status Filter
        if (brandStatusFilter !== "all") {
            filtered = filtered.filter(b => (b.status || "").toLowerCase() === brandStatusFilter.toLowerCase());
        }

        // Apply "Selected Only" Filter
        if (showSelectedOnly) {
            filtered = filtered.filter(b => selectedBrandIds.includes(Number(b.id)));
        }
        return filtered;
    }, [brands, brandSearch, brandStatusFilter, showSelectedOnly, selectedBrandIds]);

    const paginatedBrandsForForm = useMemo(() => {
        const start = (brandPage - 1) * brandLimit;
        const end = start + brandLimit;
        return filteredBrandsForForm.slice(start, end);
    }, [filteredBrandsForForm, brandPage, brandLimit]);

    const totalBrandPages = Math.ceil(filteredBrandsForForm.length / brandLimit);

    // Safety: Reset brand page if out of bounds
    useEffect(() => {
        if (brandPage > totalBrandPages && totalBrandPages > 0) {
            setBrandPage(totalBrandPages);
        }
    }, [totalBrandPages, brandPage]);

    const handleSelectPage = () => {
        const pageIds = paginatedBrandsForForm.map(b => Number(b.id));
        setSelectedBrandIds(prev => Array.from(new Set([...prev, ...pageIds])));
    };

    const handleUnselectPage = () => {
        const pageIds = paginatedBrandsForForm.map(b => Number(b.id));
        setSelectedBrandIds(prev => prev.filter(id => !pageIds.includes(id)));
    };

    /* ======================
       LOAD DATA
    ====================== */
    useEffect(() => {
        showLoader("Loading mapping data, please wait...");
        Promise.all([
            refreshMappings(),
            getCategories().then(setCategories),
            getBrands().then(setBrands)
        ]).finally(() => hideLoader());
    }, [refreshMappings]);

    // Sync jump inputs and URL with current pages
    useEffect(() => {
        setJumpInput(String(currentPage));
        const newParams = new URLSearchParams(searchParams);
        newParams.set("page", String(currentPage));
        setSearchParams(newParams, { replace: true });
    }, [currentPage, setSearchParams]);

    // Handle mappingId from URL for "Open in new tab"
    useEffect(() => {
        const mappingId = searchParams.get("mappingId");
        if (mappingId && mappings.length > 0 && viewMode === "list") {
            const item = mappings.find(m => String(m.mappingId || m.id) === mappingId);
            if (item) {
                handleEdit(item);
            }
        }
    }, [searchParams, mappings, viewMode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Form Refs
            if (primaryRef.current && !primaryRef.current.contains(event.target as Node)) {
                setShowPrimaryList(false);
                setPrimarySearch("");
            }
            if (secondaryRef.current && !secondaryRef.current.contains(event.target as Node)) {
                setShowSecondaryList(false);
                setSecondarySearch("");
            }
            // Filter Refs
            if (primaryFilterRef.current && !primaryFilterRef.current.contains(event.target as Node)) {
                setShowPrimaryFilterList(false);
                setPrimaryFilterSearch("");
            }
            if (brandFilterRef.current && !brandFilterRef.current.contains(event.target as Node)) {
                setShowBrandFilterList(false);
                setBrandFilterSearch("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [categoryType, setCategoryType] = useState("all");

    /* ======================
       FILTERING
    ====================== */
    const filteredMappings = mappings.filter(m => {
        const lowerQuery = searchQuery.trim().toLowerCase();

        const pName = (m.primaryName || m.primary_name || m.category_name || "").trim().toLowerCase();
        const sName = (m.secondaryName || m.secondary_name || "").trim().toLowerCase();
        const bName = (m.brandName || m.brand_name || "").trim().toLowerCase();

        // Search Filter matches
        const matchesSearch = !lowerQuery ||
            pName.startsWith(lowerQuery) ||
            sName.startsWith(lowerQuery) ||
            bName.split(',').some(b => b.trim().startsWith(lowerQuery));

        const matchesCategoryType = categoryType === "all" ||
            (categoryType === "primary" ? !sName : !!sName);

        const matchesPrimaryFilter = !primaryFilter || Number(m.primaryId || m.primary_category_id) === Number(primaryFilter);

        // Handle grouped brand IDs (comma-separated string)
        const brandIdStr = String(m.brandId || m.brand_id || "");
        const brandIdArray = brandIdStr.split(',').map(s => s.trim());
        const matchesBrandFilter = !brandFilter || brandIdArray.includes(String(brandFilter));

        return matchesSearch && matchesCategoryType && matchesPrimaryFilter && matchesBrandFilter;
    });

    const paginated = filteredMappings.slice((currentPage - 1) * limit, currentPage * limit);
    const totalPages = Math.ceil(filteredMappings.length / limit);

    const handleJumpChange = (val: string) => {
        if (val === "") {
            setJumpInput("");
            return;
        }
        if (!/^\d+$/.test(val)) return;
        setJumpInput(val);

        const p = Number(val);
        if (p >= 1 && p <= totalPages) {
            setCurrentPage(p);
        }
    };

    // Safety: Reset current page if out of bounds
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const getPageNumbers = (current: number, total: number) => {
        const pages: (number | string)[] = [];
        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            if (current > 3) pages.push("...");
            let start = Math.max(2, current - 1);
            let end = Math.min(total - 1, current + 1);
            if (current <= 3) end = 4;
            if (current >= total - 2) start = total - 3;
            for (let i = start; i <= end; i++) pages.push(i);
            if (current < total - 2) pages.push("...");
            pages.push(total);
        }
        return pages;
    };

    /* ======================
       CRUD HANDLERS
    ====================== */
    const resetForm = () => {
        setSelectedPrimary("");
        setEnableSecondary(false);
        setSelectedSecondary("");
        setSelectedBrandIds([]);
        setPrimarySearch("");
        setSecondarySearch("");
    };

    // const handleAdd = () => {
    //     resetForm();
    //     setViewMode("add");
    // };

    const handleEdit = (item: MappingListItem) => {
        resetForm();
        // Use either new or legacy property names
        const pId = String(item.primaryId || item.primary_category_id || "");
        const sId = String(item.secondaryId || item.secondary_category_id || "");

        const sName = item.secondaryName || item.secondary_name || "";
        const bName = item.brandName || item.brand_name || "";

        setSelectedPrimary(pId);
        if (sId !== "0" || sName) {
            setEnableSecondary(true);
            setSelectedSecondary(sId);
        } else {
            setEnableSecondary(false);
        }

        let bIds: number[] = [];
        const rawBrandId: any = item.brandId || item.brand_id;

        if (rawBrandId) {
            if (Array.isArray(rawBrandId)) {
                bIds = rawBrandId.map(Number);
            } else if (typeof rawBrandId === 'string' && rawBrandId.includes(',')) {
                bIds = rawBrandId.split(',').map((n: string) => Number(n)).filter((n: number) => !isNaN(n));
            } else {
                bIds = [Number(rawBrandId)];
            }
        } else if (bName) {
            const names = bName.split(',').map((n: string) => n.trim());
            bIds = brands.filter(b => names.includes(b.brand_name)).map(b => b.id);
        }

        setSelectedBrandIds(bIds);
        setViewMode("edit");
    };

    const handleDelete = (item: MappingListItem) => {
        confirmDelete(async () => {
            try {
                showLoader("Deleting mapping...");
                let catId: string | number = "";
                if (item.secondary_category_id) catId = item.secondary_category_id;
                else if (item.primary_category_id) catId = item.primary_category_id;
                else {
                    const found = categories.find(c => c.category_name === item.category_name);
                    if (found) catId = found.id;
                }

                if (!catId) throw new Error("Could not determine category ID");

                await saveBrandMapping({
                    primary_category_id: item.primary_category_id || catId,
                    secondary_category_id: item.secondary_category_id || null,
                    is_secondary_enabled: !!item.secondary_category_id || (item.secondary_name ? true : false),
                    brand_ids: []
                });
                showDeleteSuccess("Category Brand mapping has been deleted successfully.", "Deleted Successfully!");
                refreshMappings();
            } catch (err) {
                console.error(err);
                alert("Delete failed ❌");
            } finally {
                hideLoader();
            }
        }, `Delete mapping for ${item.category_name}?`);
    };

    const handleSave = async () => {
        if (!selectedPrimary) {
            alert("Please select a Primary Category");
            return;
        }
        // Secondary is OPTIONAL — save succeeds even if secondary is enabled but not selected

        try {
            setSaving(true);
            showLoader("Saving brand mapping...");
            await saveBrandMapping({
                primary_category_id: selectedPrimary,
                secondary_category_id: (enableSecondary && selectedSecondary) ? selectedSecondary : null,
                is_secondary_enabled: enableSecondary && !!selectedSecondary,
                brand_ids: selectedBrandIds
            });
            showSuccess("Mapping saved successfully.", "Successfully Saved!");
            setViewMode("list");
            refreshMappings();
        } catch (err) {
            console.error(err);
            alert("Save failed ❌");
        } finally {
            setSaving(false);
            hideLoader();
        }
    };

    /* ======================
       RENDER HELPERS
    ====================== */

    const toggleBrand = (id: number) => {
        setSelectedBrandIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="mcb-container">
            <GlobalStoreHeader />

            <div className="mcb-header">
                <div>
                    <h2>Manage Category Brand Mapping View Table</h2>
                    {/* <p className="subtitle">Assign brands to primary and secondary categories</p> */}
                </div>
                {/* {viewMode === "list" && (
                    <button onClick={handleAdd} className="mcb-btn mcb-btn-primary">
                        <Plus size={18} /> Add New Mapping
                    </button>
                )} */}
                {viewMode !== "list" && (
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <Link to="/brands/add" className="mcb-btn mcb-btn-primary" style={{ textDecoration: 'none' }}>
                            <Plus size={18} /> Add New Brand
                        </Link>
                    </div>
                )}
            </div>

            <div className="mcb-card">
                {viewMode === "list" ? (
                    <>
                        <div className="mcb-filters-row mcb-overflow-visible">

                            {/* Primary Category Searchable Dropdown */}
                            <div className="mcb-filter-group" ref={primaryFilterRef}>
                                <label>PRIMARY CATEGORY</label>
                                <div className="custom-dropdown">
                                    <div
                                        className="custom-select-trigger"
                                        onClick={() => setShowPrimaryFilterList(!showPrimaryFilterList)}
                                    >
                                        <span>{uniquePrimariesForFilter.find(p => String(p.id) === primaryFilter)?.name || "-- All Primary Categories --"}</span>
                                        <ChevronDown size={14} style={{ color: '#1e293b' }} />
                                    </div>
                                    {showPrimaryFilterList && (
                                        <div className="custom-select-options">
                                            <div className="dropdown-search-wrapper">
                                                <input
                                                    className="dropdown-search-input"
                                                    placeholder="Search primary..."
                                                    value={primaryFilterSearch}
                                                    onChange={e => setPrimaryFilterSearch(e.target.value)}
                                                    onClick={e => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="dropdown-items-list">
                                                <div className="option-item" onClick={() => { setPrimaryFilter(""); setBrandFilter(""); setShowPrimaryFilterList(false); setPrimaryFilterSearch(""); }}>-- All Primary Categories --</div>
                                                {uniquePrimariesForFilter.filter((p) => p.name.toLowerCase().includes(primaryFilterSearch.toLowerCase())).map((p) => (
                                                    <div key={p.id} className="option-item" onClick={() => {
                                                        setPrimaryFilter(String(p.id));
                                                        useCategoryStore.getState().setCategory(p.name);
                                                        setBrandFilter("");
                                                        setShowPrimaryFilterList(false);
                                                        setPrimaryFilterSearch("");
                                                        setCurrentPage(1);
                                                    }}>{p.name}</div>
                                                ))}

                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Brand Searchable Dropdown */}
                            <div className="mcb-filter-group" ref={brandFilterRef}>
                                <label>BRAND</label>
                                <div className="custom-dropdown">
                                    <div
                                        className="custom-select-trigger"
                                        onClick={() => setShowBrandFilterList(!showBrandFilterList)}
                                    >
                                        <span>{uniqueBrandsForFilter.find(b => String(b.id) === brandFilter)?.name || "-- All Brands --"}</span>
                                        <ChevronDown size={14} style={{ color: '#1e293b' }} />
                                    </div>
                                    {showBrandFilterList && (
                                        <div className="custom-select-options">
                                            <div className="dropdown-search-wrapper">
                                                <input
                                                    className="dropdown-search-input"
                                                    placeholder="Search brand..."
                                                    value={brandFilterSearch}
                                                    onChange={e => setBrandFilterSearch(e.target.value)}
                                                    onClick={e => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="dropdown-items-list">
                                                <div className="option-item" onClick={() => { setBrandFilter(""); setShowBrandFilterList(false); setBrandFilterSearch(""); }}>-- All Brands --</div>
                                                {uniqueBrandsForFilter.filter(b => b.name.toLowerCase().includes(brandFilterSearch.toLowerCase())).map(b => (
                                                    <div key={b.id} className="option-item" onClick={() => {
                                                        setBrandFilter(String(b.id));
                                                        useBrandStore.getState().setBrand(b.name);
                                                        setShowBrandFilterList(false);
                                                        setBrandFilterSearch("");
                                                        setCurrentPage(1);
                                                    }}>{b.name}</div>
                                                ))}

                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Search Filter - Redesigned Mapping Search */}
                            <div className="mcb-filter-group">
                                <label>SEARCH MAPPING</label>
                                <div className="mcb-search-mapping-group">
                                    <select
                                        className="mcb-type-select"
                                        value={categoryType}
                                        onChange={(e) => { setCategoryType(e.target.value); setCurrentPage(1); }}
                                    >
                                        <option value="all">-- All Types --</option>
                                        <option value="primary">Primary Only</option>
                                        <option value="secondary">Secondary Only</option>
                                    </select>
                                    <div className="mcb-mapping-search-input-wrapper">
                                        <Search size={16} className="mcb-search-icon" />
                                        <input
                                            className="mcb-mapping-search-input"
                                            placeholder="Search category or brand..."
                                            value={searchQuery}
                                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Entries Count */}
                            <div className="mcb-filter-group mcb-ml-auto">
                                <label>SHOW</label>
                                <select
                                    className="mcb-entries-select"
                                    value={limit}
                                    onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                                >
                                    {countOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="mcb-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th className="mcb-col-id">#</th>
                                        <th>Primary Name</th>
                                        <th>Secondary Name</th>
                                        <th>Brand Name</th>
                                        <th className="mcb-col-actions text-center">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contextLoading ? (
                                        <tr><td colSpan={5} className="mcb-text-center">Loading mappings...</td></tr>
                                    ) : paginated.length > 0 ? (
                                        paginated.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{(currentPage - 1) * limit + idx + 1}</td>
                                                <td>{item.primaryName || item.primary_name || item.category_name}</td>
                                                <td>{(item.secondaryName || item.secondary_name) ? (item.secondaryName || item.secondary_name) : "—"}</td>
                                                <td>
                                                    <div className="mcb-brand-cell-content" title={item.brandName || item.brand_name} style={{ cursor: 'pointer' }} onClick={() => useBrandStore.getState().setBrand(item.brandName || item.brand_name || null)}>
                                                        {item.brandName || item.brand_name}
                                                    </div>
                                                </td>

                                                <td className="text-center">
                                                    <div className="mcb-flex-center">
                                                        <a
                                                            href={`/manage-category-brand?mappingId=${item.mappingId || item.id || ''}`}
                                                            className="btn-icon-edit"
                                                            title="Edit"
                                                            onClick={(e) => { e.preventDefault(); handleEdit(item); }}
                                                        >
                                                            <SquarePen size={24} />
                                                        </a>
                                                        <button className="btn-icon-delete" onClick={() => handleDelete(item)}><Trash2 size={24} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={5} className="mcb-text-center">No mappings found for the selected filters</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mcb-pagination-wrapper">
                            <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Showing {paginated.length} of {filteredMappings.length} entries</p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                                <div className="page-jump-box">
                                    <span>Go to Page:</span>
                                    <input
                                        type="text"
                                        className="jump-input"
                                        value={jumpInput}
                                        onChange={(e) => handleJumpChange(e.target.value)}
                                    />
                                </div>

                                <div className="pagination-container">
                                    <button
                                        className="pagination-btn"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    >≪</button>
                                    <button
                                        className="pagination-btn"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >‹</button>

                                    {getPageNumbers(currentPage, totalPages).map((num, i) => (
                                        num === "..." ? (
                                            <span key={`ell-${i}`} className="pagination-ellipsis">...</span>
                                        ) : (
                                            <button
                                                key={num}
                                                onClick={() => setCurrentPage(Number(num))}
                                                className={`pagination-btn ${currentPage === num ? 'active' : ''}`}
                                            >
                                                {num}
                                            </button>
                                        )
                                    ))}

                                    <button
                                        className="pagination-btn"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                    >›</button>
                                    <button
                                        className="pagination-btn"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                    >≫</button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="mcb-form-content">
                        {/* CATEGORY SELECTION ROW */}
                        <div className="mcb-category-selection-row">
                            <div className="mcb-dropdown-container" ref={primaryRef}>
                                <label>Primary Category *</label>
                                <div className="custom-dropdown">
                                    <div className="custom-select-trigger" onClick={() => setShowPrimaryList(!showPrimaryList)}>
                                        <span>{parentCategories.find(c => String(c.id) === selectedPrimary)?.category_name || "Select Primary"}</span>
                                        <span style={{ fontSize: '10px' }}>▼</span>
                                    </div>
                                    {showPrimaryList && (
                                        <div className="custom-select-options">
                                            <div className="dropdown-search-wrapper">
                                                <input className="dropdown-search-input" placeholder="Search category..." value={primarySearch} onChange={e => setPrimarySearch(e.target.value)} onClick={e => e.stopPropagation()} autoFocus />
                                            </div>
                                            <div className="dropdown-items-list">
                                                {parentCategories.filter((c: CategoryRow) => (c.category_name || "").toLowerCase().includes(primarySearch.toLowerCase())).map((c: CategoryRow) => (
                                                    <div key={c.id} className="option-item" onClick={() => {
                                                        setSelectedPrimary(String(c.id));
                                                        useCategoryStore.getState().setCategory(c.category_name);
                                                        setSelectedSecondary("");
                                                        setShowPrimaryList(false);
                                                        setPrimarySearch("");
                                                    }}>{c.category_name}</div>
                                                ))}

                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mcb-checkbox-wrapper">
                                <label className="mcb-checkbox-label">
                                    <input type="checkbox" checked={enableSecondary} onChange={e => { setEnableSecondary(e.target.checked); if (!e.target.checked) setSelectedSecondary(""); }} />
                                    <span>Enable Secondary</span>
                                </label>
                            </div>

                            {enableSecondary && (
                                <div className="mcb-dropdown-container" ref={secondaryRef}>
                                    <label>Secondary Category *</label>
                                    <div className="custom-dropdown">
                                        <div className={`custom-select-trigger ${!selectedPrimary ? 'disabled' : ''}`} onClick={() => { if (selectedPrimary) setShowSecondaryList(!showSecondaryList); }}>
                                            <span>{subCategories.find(c => String(c.id) === selectedSecondary)?.category_name || "Select Secondary"}</span>
                                            <span style={{ fontSize: '10px' }}>▼</span>
                                        </div>
                                        {showSecondaryList && (
                                            <div className="custom-select-options">
                                                <div className="dropdown-search-wrapper">
                                                    <input className="dropdown-search-input" placeholder="Search secondary..." value={secondarySearch} onChange={e => setSecondarySearch(e.target.value)} onClick={e => e.stopPropagation()} autoFocus />
                                                </div>
                                                <div className="dropdown-items-list">
                                                    {subCategories.filter((c: CategoryRow) => (c.category_name || "").toLowerCase().includes(secondarySearch.toLowerCase())).map((c: CategoryRow) => (
                                                        <div key={c.id} className="option-item" onClick={() => {
                                                            setSelectedSecondary(String(c.id));
                                                            useCategoryStore.getState().setCategory(c.category_name);
                                                            setShowSecondaryList(false);
                                                            setSecondarySearch("");
                                                        }}>{c.category_name}</div>
                                                    ))}

                                                    {subCategories.length === 0 && (
                                                        <div className="option-item empty">No secondary categories</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BRAND SELECTION TABLE */}
                        <div className="mcb-brand-selection-section">
                            <div className="mcb-brand-selection-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <label style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>Select Brands</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="button"
                                        className="mcb-btn"
                                        style={{ background: '#323da7', color: '#fff' }}
                                        onClick={handleSelectPage}
                                    >
                                        Select Page
                                    </button>
                                    <button
                                        type="button"
                                        className="mcb-btn"
                                        style={{ background: '#ef4444', color: '#fff' }}
                                        onClick={handleUnselectPage}
                                    >
                                        Unselect Page
                                    </button>
                                </div>
                            </div>

                            <div className="mcb-brand-filters-row">
                                <div className="mcb-filter-group">
                                    <label>SHOW</label>
                                    <select className="mcb-entries-select" value={brandLimit} onChange={(e) => { setBrandLimit(Number(e.target.value)); setBrandPage(1); }}>
                                        {countOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="mcb-filter-group">
                                    <label>STATUS</label>
                                    <select className="mcb-entries-select" value={brandStatusFilter} onChange={(e) => { setBrandStatusFilter(e.target.value); setBrandPage(1); }} style={{ minWidth: '150px' }}>
                                        <option value="all">All Status</option>
                                        <option value="active">Active Only</option>
                                        <option value="inactive">Inactive Only</option>
                                    </select>
                                </div>
                                <div className="mcb-filter-group" style={{ flex: 1 }}>
                                    <label>SEARCH</label>
                                    <div className="mcb-search-icon-wrapper">
                                        <Search size={16} className="mcb-search-icon" />
                                        <input className="mcb-brand-search-input" placeholder="Search..." value={brandSearch} onChange={e => { setBrandSearch(e.target.value); setBrandPage(1); }} style={{ width: '100%' }} />
                                    </div>
                                </div>
                                <div className="mcb-filter-group">
                                    <label className="mcb-checkbox-label" style={{ marginTop: '25px' }}>
                                        <input type="checkbox" checked={showSelectedOnly} onChange={e => { setShowSelectedOnly(e.target.checked); setBrandPage(1); }} />
                                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Selected Only</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mcb-brand-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th className="mcb-col-check"></th>
                                            <th className="mcb-col-id">#</th>
                                            <th>IMAGE</th>
                                            <th>BRAND NAME</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedBrandsForForm.map((brand, index) => (
                                            <tr key={brand.id}>
                                                <td className="mcb-text-center">
                                                    <input type="checkbox" checked={selectedBrandIds.includes(Number(brand.id))} onChange={() => toggleBrand(Number(brand.id))} />
                                                </td>
                                                <td>{(brandPage - 1) * brandLimit + index + 1}</td>
                                                <td>
                                                    <div className="brand-thumb-wrapper">
                                                        {brand.image ? (
                                                            <img src={`${IMAGE_BASE_URL}/${brand.image}`} alt={brand.brand_name} />
                                                        ) : (
                                                            <span style={{ fontSize: '10px', color: '#9ca3af' }}>N/A</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: '600', color: '#4b5563' }}>{brand.brand_name}</td>
                                                <td><span className={`badge ${(brand.status || "").toLowerCase()}`}>{brand.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Brand Table Pagination (Form) */}
                            {totalBrandPages > 1 && (
                                <div className="mcb-pagination-wrapper" style={{ marginTop: '15px', padding: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#6b7280' }}>Page {brandPage} of {totalBrandPages}</span>
                                    <div className="pagination-container">
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setBrandPage(1)}
                                            disabled={brandPage === 1}
                                        >≪</button>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setBrandPage(p => Math.max(1, p - 1))}
                                            disabled={brandPage === 1}
                                        >‹</button>
                                        {getPageNumbers(brandPage, totalBrandPages).map((num, i) => (
                                            num === "..." ? (
                                                <span key={`ell-${i}`} className="pagination-ellipsis">...</span>
                                            ) : (
                                                <button
                                                    key={num}
                                                    onClick={() => setBrandPage(Number(num))}
                                                    className={`pagination-btn ${brandPage === num ? 'active' : ''}`}
                                                >
                                                    {num}
                                                </button>
                                            )
                                        ))}
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setBrandPage(p => Math.min(totalBrandPages, p + 1))}
                                            disabled={brandPage === totalBrandPages}
                                        >›</button>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setBrandPage(totalBrandPages)}
                                            disabled={brandPage === totalBrandPages}
                                        >≫</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mcb-form-actions">
                            <button className="mcb-btn mcb-btn-secondary" onClick={() => setViewMode("list")}>Cancel</button>
                            <button className="mcb-btn mcb-btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : <><Save size={18} /> {viewMode === "add" ? "Save Mapping" : "Update Mapping"}</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageCategoryBrand;
