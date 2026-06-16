import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./CategoryMapping.css";
import {
    Trash2,
    Save,
    AlertCircle,
    ChevronDown,
    Search,
    RefreshCw,
    CheckSquare,
    Square,
} from "lucide-react";

import { getSectors, type Sector } from "../../../api/sectors.api";
import { getCategoryGroups, type CategoryGroupRow } from "../../category/models/categoryGroup.api";
import {
    assignGroupsToBusiness,
    getGroupsByBusiness,
    deleteBusinessCategoryGroupMapping,
    type BusinessCategoryGroupMapping,
} from "../../../api/businessCategoryGroup.api";
import {
    getCategoryGroupMappingsByGroup,
    assignCategoriesToGroup,
} from "../../category/models/categoryGroup.api";
import { getCategories, type CategoryRow } from "../../../api/category.api";
import { getSectorTitles, type SectorTitle } from "../../../api/sectorTitle.api";
import { getSubSubSectors, type SubSectorRow } from "../../subsector/models/subSectors.api";
import { getBusinesses, type Business } from "../../../api/business.api";
import { useLoading } from "../../../context/LoadingContext";


const CategoryMapping: React.FC = () => {
    const { showLoader, hideLoader } = useLoading();

    // -- Master data
    const [allSectors, setAllSectors] = useState<Sector[]>([]);
    const [categoryGroups, setCategoryGroups] = useState<CategoryGroupRow[]>([]);
    const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
    const [allCategories, setAllCategories] = useState<CategoryRow[]>([]);

    const [sectorTitles, setSectorTitles] = useState<SectorTitle[]>([]);
    const [allSubSectors, setAllSubSectors] = useState<SubSectorRow[]>([]);

    // -- Selection (Business/Sector Selection)
    const [businessId, setBusinessId] = useState("");

    // -- Dropdown States
    const [businessOpen, setBusinessOpen] = useState(false);
    const [businessSearch, setBusinessSearch] = useState("");

    // -- Group Filter State (Checklist)
    const [groupSearch, setGroupSearch] = useState("");

    // -- Currently mapped rows for the selected business
    const [mappings, setMappings] = useState<BusinessCategoryGroupMapping[]>([]);

    // -- Selected category_group_ids (for the save operation)
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set());

    // -- Category -> Group Mapping state
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
    const [categorySearch, setCategorySearch] = useState("");
    const [loadingCategories, setLoadingCategories] = useState(false);

    // -- Category Filters (Drill-down)
    const [catSectorTitleId, setCatSectorTitleId] = useState("");
    const [catSectorId, setCatSectorId] = useState("");
    const [catSubSectorId, setCatSubSectorId] = useState("");

    // -- State messages
    const [loadingMappings, setLoadingMappings] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // -- Refs for click-outside
    const businessRef = useRef<HTMLDivElement>(null);

    // ─────────────────────────────────────────
    //  Boot: load Sector Titles + Businesses + Groups
    // ─────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            showLoader("Loading mapping data...");
            try {
                // Fetch all master data in parallel
                const [
                    sectorsData,
                    groupsData,
                    businessesData,
                    catsData,
                    titlesData,
                    subRowsData
                ] = await Promise.all([
                    getSectors(),
                    getCategoryGroups(),
                    getBusinesses(),
                    getCategories(),
                    getSectorTitles(),
                    getSubSubSectors(),
                ]);

                // Update states with validated arrays
                setAllSectors(Array.isArray(sectorsData) ? sectorsData : []);
                setCategoryGroups(Array.isArray(groupsData) ? groupsData : []);
                setAllBusinesses(Array.isArray(businessesData) ? businessesData : []);
                setAllCategories(Array.isArray(catsData) ? catsData : []);
                setSectorTitles(Array.isArray(titlesData) ? titlesData : []);
                setAllSubSectors(Array.isArray(subRowsData) ? subRowsData : []);

            } catch (err: any) {
                console.error("Load fallback error:", err);
                setErrorMsg(err?.message || "Failed to load master data");
            } finally {
                hideLoader();
            }
        };
        load();
    }, []);


    // ─────────────────────────────────────────
    //  Click-outside handler
    // ─────────────────────────────────────────
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (businessRef.current && !businessRef.current.contains(e.target as Node)) {
                setBusinessOpen(false);
                setBusinessSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ─────────────────────────────────────────
    //  Auto-clear messages
    // ─────────────────────────────────────────
    useEffect(() => {
        if (!successMsg && !errorMsg) return;
        const t = setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
        return () => clearTimeout(t);
    }, [successMsg, errorMsg]);

    // ─────────────────────────────────────────
    //  Filtered Options
    // ─────────────────────────────────────────
    const filteredSectors = useMemo(() => {
        const q = businessSearch.trim().toLowerCase();
        return allBusinesses.filter(b => {
            const nameStr = (b.business_name || b.name || (b as any).sector_name || (b as any).title || "").toLowerCase();
            return !q || nameStr.includes(q);
        });
    }, [allBusinesses, businessSearch]);



    const filteredGroups = useMemo(() => {
        const q = groupSearch.trim().toLowerCase();
        return categoryGroups.filter(g => !q || (g.name || "").toLowerCase().includes(q));
    }, [categoryGroups, groupSearch]);

    const filteredCategories = useMemo(() => {
        const q = categorySearch.trim().toLowerCase();
        return allCategories.filter(c => {
            const matchesSearch = !q || (c.category_name || "").toLowerCase().includes(q);
            const matchesTitle = !catSectorTitleId || String(c.sector_title_id) === catSectorTitleId;
            const matchesSector = !catSectorId || String(c.sector_id) === catSectorId;
            const matchesSub = !catSubSectorId || String(c.sub_sector_id) === catSubSectorId;
            return matchesSearch && matchesTitle && matchesSector && matchesSub;
        });
    }, [allCategories, categorySearch, catSectorTitleId, catSectorId, catSubSectorId]);

    const sectorOptions = useMemo(() => {
        if (!catSectorTitleId) return [];
        return allSectors.filter(s => String(s.sector_title_id) === catSectorTitleId);
    }, [allSectors, catSectorTitleId]);

    const subSectorOptions = useMemo(() => {
        if (!catSectorId) return [];
        return allSubSectors.filter(ss => String(ss.sector_id) === catSectorId);
    }, [allSubSectors, catSectorId]);

    const selectedBusinessLabel = (() => {
        const b = allBusinesses.find(x => String(x.id) === businessId);
        if (!b) return "Select Business";
        return b.business_name || b.name || (b as any).sector_name || (b as any).title || `ID #${b.id}`;
    })();



    // ─────────────────────────────────────────
    //  Fetch Mappings
    // ─────────────────────────────────────────
    const fetchMappings = useCallback(async (bId: string) => {
        if (!bId) return;
        setLoadingMappings(true);
        setErrorMsg(null);
        try {
            const data = await getGroupsByBusiness(Number(bId));

            // Robust transformation of raw data into our component mapping type
            const active = Array.isArray(data) ? data.map((m: any) => {
                const cgId = m.category_group_id || m.id;
                return {
                    ...m,
                    id: m.id, // Current item ID (could be mapping ID or group ID)
                    business_id: m.business_id || Number(bId),
                    category_group_id: cgId,
                    category_group_name: m.category_group_name || m.name,
                    is_active: (m.is_active === undefined || m.is_active === null) ? 1 : m.is_active
                };
            }).filter(m => m.is_active !== 0) : [];

            setMappings(active);
            setSelectedGroupIds(new Set(active.map(m => Number(m.category_group_id))));
        } catch (err: any) {
            setErrorMsg(err?.message || "Failed to load business mappings");
            setMappings([]);
            setSelectedGroupIds(new Set());

        } finally {
            setLoadingMappings(false);
        }
    }, []);

    const handleBusinessSelect = (id: string) => {
        setBusinessId(id);
        setBusinessOpen(false);
        setBusinessSearch("");
        fetchMappings(id);
    };

    const toggleGroup = (groupId: number) => {
        setSelectedGroupIds(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    const toggleSelectAllGroups = () => {
        if (selectedGroupIds.size === filteredGroups.length) {
            setSelectedGroupIds(new Set());
        } else {
            setSelectedGroupIds(new Set(filteredGroups.map(g => g.id)));
        }
    };

    // -- Category -> Group Mapping Logic
    const handleManageCategories = async (groupId: number) => {
        setActiveGroupId(groupId);
        setLoadingCategories(true);
        setErrorMsg(null);
        try {
            const data = await getCategoryGroupMappingsByGroup(groupId);
            const active = Array.isArray(data) ? data.filter(m => m.is_active !== 0) : [];
            setSelectedCategoryIds(new Set(active.map(m => m.category_id)));
        } catch (err: any) {
            setErrorMsg("Failed to load group categories.");
        } finally {
            setLoadingCategories(false);
        }
    };

    const toggleCategory = (catId: number) => {
        setSelectedCategoryIds(prev => {
            const next = new Set(prev);
            if (next.has(catId)) next.delete(catId);
            else next.add(catId);
            return next;
        });
    };

    const toggleSelectAllCategories = () => {
        if (selectedCategoryIds.size === filteredCategories.length) {
            setSelectedCategoryIds(new Set());
        } else {
            setSelectedCategoryIds(new Set(filteredCategories.map(c => c.id)));
        }
    };

    const handleSaveCategories = async () => {
        if (!activeGroupId) return;
        setSaving(true);
        setErrorMsg(null);
        try {
            await assignCategoriesToGroup({
                category_group_id: activeGroupId,
                category_ids: Array.from(selectedCategoryIds)
            });
            setSuccessMsg("Group categories updated!");
            setActiveGroupId(null);
        } catch (err: any) {
            setErrorMsg("Failed to save categories.");
        } finally {
            setSaving(false);
        }
    };

    // ─────────────────────────────────────────
    //  Actions
    // ─────────────────────────────────────────
    const handleSave = async () => {
        if (!businessId) {
            setErrorMsg("Please select a Business first.");
            return;
        }
        setSaving(true);
        setErrorMsg(null);
        try {
            // 1. Identify groups to remove (were mapped, but now unselected)
            const toDelete = mappings.filter(m => !selectedGroupIds.has(Number(m.category_group_id)));
            
            // 2. Perform deletions
            if (toDelete.length > 0) {
                await Promise.all(toDelete.map(item => deleteBusinessCategoryGroupMapping(item.id)));
            }

            // 3. Identify new groups to add (now selected, but not previously mapped)
            const currentMappedIds = new Set(mappings.map(m => Number(m.category_group_id)));
            const toAdd = Array.from(selectedGroupIds).filter(id => !currentMappedIds.has(id));

            // 4. Perform additions
            if (toAdd.length > 0) {
                await assignGroupsToBusiness({
                    business_id: Number(businessId),
                    category_group_ids: toAdd,
                });
            }

            setSuccessMsg("Mapping updated successfully.");
            await fetchMappings(businessId);
            setActiveGroupId(null);
        } catch (err: any) {
            setErrorMsg(err?.message || "Failed to save mapping.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (mapping: BusinessCategoryGroupMapping) => {
        if (!window.confirm("Remove this category group from the business?")) return;
        try {
            await deleteBusinessCategoryGroupMapping(mapping.id);
            setMappings(prev => prev.filter(m => m.id !== mapping.id));
            setSelectedGroupIds(prev => {
                const next = new Set(prev);
                next.delete(mapping.category_group_id);
                return next;
            });
            if (activeGroupId === mapping.category_group_id) setActiveGroupId(null);
            setSuccessMsg("Group removed successfully.");
        } catch (err: any) {
            setErrorMsg(err?.message || "Failed to delete mapping.");
        }
    };

    const getGroupName = (m: BusinessCategoryGroupMapping) =>
        m.category_group_name ||
        categoryGroups.find(g => g.id === m.category_group_id)?.name ||
        `Group #${m.category_group_id}`;

    return (
        <div className="cm-container">
            <div className="cm-header">
                <div>
                    <h1>Category Group Mapping</h1>
                    <p>Map Category Groups to Businesses (Sectors)</p>
                </div>
            </div>

            {successMsg && <div className="cm-toast cm-toast--success">{successMsg}</div>}
            {errorMsg && <div className="cm-toast cm-toast--error"><AlertCircle size={15} /> {errorMsg}</div>}

            <div className="cm-panel">
                <div className="cm-form-row">


                    {/* Business (Sector) Dropdown */}
                    <div className="cm-field" ref={businessRef}>
                        <label className="cm-label">Select Business (Sector)</label>
                        <div className={`cm-trigger ${businessOpen ? "open" : ""}`} onClick={() => setBusinessOpen(!businessOpen)}>
                            <span className={businessId ? "cm-value" : "cm-placeholder"}>{selectedBusinessLabel}</span>
                            <ChevronDown size={16} className={`cm-chevron ${businessOpen ? "rotated" : ""}`} />
                        </div>
                        {businessOpen && (
                            <div className="cm-dropdown">
                                <div className="cm-search-wrap">
                                    <Search size={13} />
                                    <input type="text" placeholder="Search business..." value={businessSearch} onChange={e => setBusinessSearch(e.target.value)} onClick={e => e.stopPropagation()} />
                                </div>
                                <div className="cm-options" style={{ maxHeight: '300px' }}>
                                    {filteredSectors.length > 0 ? filteredSectors.map(b => (
                                        <div key={b.id} className={`cm-option ${String(b.id) === businessId ? "selected" : ""}`} onClick={() => handleBusinessSelect(String(b.id))}>
                                            {b.business_name || b.name || (b as any).sector_name || (b as any).title}
                                        </div>

                                    )) : <div className="cm-option disabled">No businesses found</div>}

                                </div>
                            </div>
                        )}
                    </div>


                </div>

                {businessId && (
                    <div className="cm-cat-section">
                        <div className="cm-cat-header">
                            <span className="cm-cat-title">Select Category Groups <span className="cm-count-badge">{selectedGroupIds.size} selected</span></span>
                            <div className="cm-cat-search-wrap">
                                <Search size={13} />
                                <input type="text" placeholder="Search groups..." value={groupSearch} onChange={e => setGroupSearch(e.target.value)} />
                            </div>
                            <button className="cm-select-all-btn" onClick={toggleSelectAllGroups}>
                                {selectedGroupIds.size === filteredGroups.length && filteredGroups.length > 0 ? <><CheckSquare size={14} /> Deselect All</> : <><Square size={14} /> Select All</>}
                            </button>
                        </div>
                        <div className="cm-cat-grid">
                            {filteredGroups.length === 0 ? <p className="cm-cat-empty">No category groups found.</p> : filteredGroups.map(g => (
                                <label key={g.id} className={`cm-cat-item ${selectedGroupIds.has(g.id) ? "checked" : ""}`}>
                                    <input type="checkbox" checked={selectedGroupIds.has(g.id)} onChange={() => toggleGroup(g.id)} />
                                    <span className="cm-cat-name">{g.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {businessId && (
                <>
                    <div className="cm-table-wrap">
                        {loadingMappings ? (
                            <div className="cm-loading"><RefreshCw size={22} className="cm-spin" /><span>Loading mappings...</span></div>
                        ) : (
                            <table className="cm-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 60 }}>S.No</th>
                                        <th>Business (Sector)</th>
                                        <th>Category Group</th>
                                        <th className="text-center" style={{ width: 110 }}>Action</th>
                                    </tr>

                                </thead>
                                <tbody>
                                    {mappings.length === 0 ? (
                                        <tr><td colSpan={3}><div className="cm-empty"><AlertCircle size={38} /><p>No active mappings for this business.</p></div></td></tr>
                                    ) : mappings.map((m, idx) => (
                                        <tr key={m.id} className={activeGroupId === m.category_group_id ? "selected-row" : ""}>
                                            <td><span className="cm-badge">#{idx + 1}</span></td>
                                            <td>
                                                <span className="cm-business-name" style={{ fontWeight: 500, color: '#334155' }}>
                                                    {allBusinesses.find(b => b.id === m.business_id)?.business_name ||
                                                        allBusinesses.find(b => b.id === m.business_id)?.name ||
                                                        `Business #${m.business_id}`}
                                                </span>
                                            </td>
                                            <td><span className="cm-group-name" style={{ color: '#4f46e5', fontWeight: 600 }}>{getGroupName(m)}</span></td>
                                            <td className="text-center">

                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                    <button
                                                        className={`cm-action-btn ${activeGroupId === m.category_group_id ? 'active' : ''}`}
                                                        onClick={() => handleManageCategories(m.category_group_id)}
                                                        title="Manage Categories"
                                                    >
                                                        <CheckSquare size={18} />
                                                    </button>
                                                    <button className="cm-delete-btn" onClick={() => handleDelete(m)} title="Delete Selection">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="cm-footer-save" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', padding: '0 10px' }}>
                        <button className="cm-save-btn" style={{ minWidth: '200px', height: '50px', fontSize: '16px' }} onClick={handleSave} disabled={saving || !businessId}>
                            {saving ? <><RefreshCw size={16} className="cm-spin" /> Saving...</> : <><Save size={16} /> Save Mapping</>}
                        </button>
                    </div>
                </>
            )}


            {/* ── Category -> Group Drill Down Section ── */}
            {activeGroupId && (
                <div className="cm-panel cm-drilldown-panel" style={{ marginTop: '25px', borderColor: '#4f46e5', borderWidth: '2px' }}>
                    <div className="cm-cat-header">
                        <span className="cm-cat-title">
                            Categories for <span style={{ color: '#4f46e5' }}>{categoryGroups.find(g => g.id === activeGroupId)?.name}</span>
                            <span className="cm-count-badge">{selectedCategoryIds.size} selected</span>
                        </span>
                        <div className="cm-cat-search-wrap">
                            <Search size={13} />
                            <input type="text" placeholder="Search categories..." value={categorySearch} onChange={e => setCategorySearch(e.target.value)} />
                        </div>
                        <button className="cm-select-all-btn" onClick={toggleSelectAllCategories}>
                            {selectedCategoryIds.size === filteredCategories.length && filteredCategories.length > 0 ? <><CheckSquare size={14} /> Deselect All</> : <><Square size={14} /> Select All</>}
                        </button>
                    </div>

                    {/* Hierarchical Filters for Categories */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '10px' }}>
                        <div className="cm-field">
                            <label className="cm-label">Sector Title</label>
                            <select
                                className="cm-trigger"
                                style={{ width: '100%', height: '40px', fontSize: '13px' }}
                                value={catSectorTitleId}
                                onChange={(e) => {
                                    setCatSectorTitleId(e.target.value);
                                    setCatSectorId("");
                                    setCatSubSectorId("");
                                }}
                            >
                                <option value="">All Sector Titles</option>
                                {sectorTitles.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                            </select>
                        </div>
                        <div className="cm-field">
                            <label className="cm-label">Sector</label>
                            <select
                                className="cm-trigger"
                                style={{ width: '100%', height: '40px', fontSize: '13px' }}
                                value={catSectorId}
                                onChange={(e) => {
                                    setCatSectorId(e.target.value);
                                    setCatSubSectorId("");
                                }}
                                disabled={!catSectorTitleId}
                            >
                                <option value="">All Sectors</option>
                                {sectorOptions.map(s => <option key={s.id} value={s.id}>{s.sector_name || s.name}</option>)}
                            </select>
                        </div>
                        <div className="cm-field">
                            <label className="cm-label">Subsector</label>
                            <select
                                className="cm-trigger"
                                style={{ width: '100%', height: '40px', fontSize: '13px' }}
                                value={catSubSectorId}
                                onChange={(e) => setCatSubSectorId(e.target.value)}
                                disabled={!catSectorId}
                            >
                                <option value="">All Subsectors</option>
                                {subSectorOptions.map(ss => <option key={ss.id} value={ss.id}>{ss.sub_sector_name}</option>)}
                            </select>
                        </div>
                    </div>

                    {loadingCategories ? (
                        <div className="cm-loading"><RefreshCw size={22} className="cm-spin" /><span>Loading categories...</span></div>
                    ) : (
                        <>
                            <div className="cm-cat-grid" style={{ maxHeight: '250px' }}>
                                {filteredCategories.length === 0 ? <p className="cm-cat-empty">No categories found matching filters.</p> : filteredCategories.map(c => (
                                    <label key={c.id} className={`cm-cat-item ${selectedCategoryIds.has(c.id) ? "checked" : ""}`}>
                                        <input type="checkbox" checked={selectedCategoryIds.has(c.id)} onChange={() => toggleCategory(c.id)} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="cm-cat-name">{c.category_name}</span>
                                            <span style={{ fontSize: '10px', color: '#64748b' }}>{c.sector_name} • {c.sub_sector_name}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="cm-footer-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button className="cm-cancel-btn" onClick={() => setActiveGroupId(null)}>Cancel</button>
                                <button className="cm-save-btn" onClick={handleSaveCategories} disabled={saving}>
                                    {saving ? <><RefreshCw size={16} className="cm-spin" /> Saving...</> : <><Save size={16} /> Save Categories</>}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default CategoryMapping;
