import { useState, useEffect } from "react";
import { Trash2, Pencil } from "lucide-react";
import "../../../variant/addunittype/addUnitType.css";
import "../../../variant/viewcolour/viewColourList.css";
import "./Mapping.css";
import {
    getMenus,
    getTabHeadings,
    getCheckboxes,
    saveMapping,
    updateMapping,
    getMappings,
    deleteMapping,
    getSectorTitles,
    type MultitabMenu,
    type TabHeading,
    type CheckboxMaster,
    type MultitabMapping
} from "../models/multitab.api";
import { getCategories } from "../../../../api/category.api";
import { getBrands } from "../../../../api/brand.api";
import { getProducts } from "../../../../api/product.api";

const AddSectorMappingCheckbox = () => {
    // Data Lists
    const [menus, setMenus] = useState<MultitabMenu[]>([]);
    const [headings, setHeadings] = useState<TabHeading[]>([]);
    const [checkboxes, setCheckboxes] = useState<CheckboxMaster[]>([]);
    const [mappings, setMappings] = useState<MultitabMapping[]>([]);

    const MENU_NAME_OPTIONS = [
        { id: "sector_title", name: "Sector Title" },
        { id: "category", name: "Category" },
        { id: "brand", name: "Brand" },
        { id: "product", name: "Product" }
    ];

    // Selection State
    const [menuId, setMenuId] = useState("");
    const [headingId, setHeadingId] = useState("");

    // Form Selection
    const [selectedCheckboxIds, setSelectedCheckboxIds] = useState<number[]>([]);
    const [status, setStatus] = useState("active");

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    // Dropdown UI state
    const [showMenuDropdown, setShowMenuDropdown] = useState(false);
    const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
    const [menuSearch, setMenuSearch] = useState("");
    const [headingSearch, setHeadingSearch] = useState("");
    const [checkboxSearch, setCheckboxSearch] = useState("");

    // Dynamic Secondary Data
    const [secondaryData, setSecondaryData] = useState<any[]>([]);
    const [selectedSecondaryId, setSelectedSecondaryId] = useState("");
    const [showSecondaryDropdown, setShowSecondaryDropdown] = useState(false);
    const [secondarySearch, setSecondarySearch] = useState("");

    // Mapping Mode Switch
    const [mappingMode, setMappingMode] = useState<"Tab Heading" | "Menu Name">("Tab Heading");

    // Reset headingId when mode changes
    useEffect(() => {
        if (mappingMode === "Menu Name") {
            setHeadingId("");
            setHeadingSearch("");
            setSecondaryData([]);
            setSelectedSecondaryId("");
        }
    }, [mappingMode]);

    // Fetch Secondary Data when Menu ID changes in Menu Name mode
    useEffect(() => {
        if (mappingMode !== "Menu Name" || !menuId) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setSecondaryData([]);
                setSelectedSecondaryId("");

                let data: any[] = [];
                if (menuId === "sector_title") data = await getSectorTitles();
                else if (menuId === "category") data = await getCategories();
                else if (menuId === "brand") data = await getBrands();
                else if (menuId === "product") data = await getProducts();

                setSecondaryData(Array.isArray(data) ? data : (data as any).data || []);
            } catch (err) {
                console.error("Secondary fetch failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [menuId, mappingMode]);

    // Initial Load - Fetch all masters
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            


            // 2. Fetch Menus
            getMenus().then(mData => {
                setMenus(Array.isArray(mData) ? mData : (mData as any)?.data || (mData as any)?.rows || []);
            }).catch(e => console.error("Menus fail", e));

            // 3. Fetch Headings
            getTabHeadings().then(hData => {
                setHeadings(Array.isArray(hData) ? hData : (hData as any)?.data || (hData as any)?.rows || []);
            }).catch(e => console.error("Headings fail", e));

            // 4. Fetch Checkboxes
            getCheckboxes().then(cData => {
                setCheckboxes(Array.isArray(cData) ? cData : (cData as any)?.data || (cData as any)?.rows || []);
            }).catch(e => console.error("Checkboxes fail", e));

            // 5. Fetch Mappings
            getMappings().then(maps => {
                setMappings(Array.isArray(maps) ? maps : (maps as any)?.data || (maps as any)?.rows || []);
            }).catch(e => console.error("Mappings fail", e));

            // 5. Fetch Sector Titles (Initial Load Only)
            getSectorTitles().then(() => {
                // We keep this here if needed elsewhere, otherwise handled by useEffect
            }).catch(e => console.error("Sector Titles fail", e));

        } catch (err) {
            console.error("Critical fail in loadInitialData", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.custom-select-container')) {
                setShowMenuDropdown(false);
                setShowHeadingDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadMappings = async () => {
        try {
            setLoading(true);
            const data = await getMappings();
            const rows = Array.isArray(data) ? data : (data as any)?.data || (data as any)?.rows || [];
            setMappings(rows);
        } catch (error) {
            console.error("Failed to load mappings", error);
        } finally {
            setLoading(false);
        }
    };



    const handleRemoveSelectedCheckbox = (id: number) => {
        setSelectedCheckboxIds(prev => prev.filter(item => item !== id));
    };

    const handleAddAll = () => {
        const filteredIds = checkboxes
            .filter(cb => (cb.checkbox_name || "").toLowerCase().includes(checkboxSearch.toLowerCase()))
            .map(cb => cb.id);
        
        // Add the newly selected filtered ones to the existing selections to ensure we don't clear un-searched items
        setSelectedCheckboxIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    };

    const handleUnselectAll = () => {
        setSelectedCheckboxIds([]);
    };

    const handleEdit = (m: any) => {
        setMenuId(m.menu_id?.toString() || "");
        setHeadingId(m.tabheading_id?.toString() || "");

        let cids: number[] = [];
        try {
            cids = (typeof m.checkbox_ids === 'string' ? JSON.parse(m.checkbox_ids) : m.checkbox_ids) || [];
        } catch (e) {
            cids = [];
        }
        setSelectedCheckboxIds(cids);
        setStatus(m.status || "active");

        setEditId(m.id);
        setIsEdit(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleReset = () => {
        setMenuId("");
        setHeadingId("");
        setSelectedSecondaryId("");
        setSelectedCheckboxIds([]);
        setStatus("active");
        setIsEdit(false);
        setEditId(null);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isHeadingMode = mappingMode === "Tab Heading";
        
        if (!menuId || (isHeadingMode && !headingId) || selectedCheckboxIds.length === 0) {
            alert("Please fill all fields");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                sector_id: mappingMode === "Menu Name" && menuId === "sector_title" ? Number(selectedSecondaryId) : null,
                category_id: mappingMode === "Menu Name" && menuId === "category" ? Number(selectedSecondaryId) : null,
                brand_id: mappingMode === "Menu Name" && menuId === "brand" ? Number(selectedSecondaryId) : null,
                product_id: mappingMode === "Menu Name" && menuId === "product" ? Number(selectedSecondaryId) : null,
                menu_id: isHeadingMode ? Number(menuId) : null,
                tabheading_id: isHeadingMode ? Number(headingId) : null,
                checkbox_ids: selectedCheckboxIds,
                status: status
            };

            if (isEdit && editId) {
                await updateMapping(editId, payload);
                alert("Mapping updated successfully ✅");
            } else {
                await saveMapping(payload);
                alert("Mapping saved successfully ✅");
            }

            handleReset();
            loadMappings();
        } catch (error: any) {
            alert(error.message || "Failed to save mapping ❌");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this mapping?")) return;
        try {
            await deleteMapping(id);
            alert("Deleted successfully ✅");
            loadMappings();
        } catch (error: any) {
            alert(error.message || "Delete failed ❌");
        }
    };


    return (
        <div className="page-container" style={{ padding: "0 20px" }}>
            <div className="page-header" style={{ marginBottom: "25px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>
                    {isEdit ? "Edit Mapping Checkbox" : "Add Mapping Checkbox"}
                </h1>
            </div>

            <div className="form-card" style={{ padding: "40px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                <form onSubmit={handleSubmit}>
                    {/* Mode Toggle Switch */}
                    <div className="mode-toggle-container" style={{ 
                        display: "flex", 
                        background: "#f1f5f9", 
                        padding: "4px", 
                        borderRadius: "10px", 
                        width: "fit-content",
                        marginBottom: "35px"
                    }}>
                        <button
                            type="button"
                            onClick={() => setMappingMode("Tab Heading")}
                            style={{
                                padding: "8px 24px",
                                borderRadius: "8px",
                                border: "none",
                                fontSize: "14px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                background: mappingMode === "Tab Heading" ? "#ffffff" : "transparent",
                                color: mappingMode === "Tab Heading" ? "#2563eb" : "#64748b",
                                boxShadow: mappingMode === "Tab Heading" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                            }}
                        >
                            Tab Heading
                        </button>
                        <button
                            type="button"
                            onClick={() => setMappingMode("Menu Name")}
                            style={{
                                padding: "8px 24px",
                                borderRadius: "8px",
                                border: "none",
                                fontSize: "14px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                background: mappingMode === "Menu Name" ? "#ffffff" : "transparent",
                                color: mappingMode === "Menu Name" ? "#2563eb" : "#64748b",
                                boxShadow: mappingMode === "Menu Name" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                            }}
                        >
                            Menu Name
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: "25px", marginBottom: "40px" }}>


                        {/* Menu Dropdown */}
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "10px", fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                                Menu
                            </label>
                            <div className="custom-select-container" style={{ position: "relative" }}>
                                <div
                                    className="custom-select-trigger"
                                    onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                                    style={{
                                        width: "100%",
                                        padding: "12px 18px",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "8px",
                                        background: "#fff",
                                        cursor: "pointer",
                                        fontSize: "15px",
                                        color: menuId ? "#334155" : "#94a3b8",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        height: "48px",
                                    }}
                                >
                                    {(() => {
                                        if (!menuId) return "select";
                                        if (mappingMode === "Menu Name") {
                                            return MENU_NAME_OPTIONS.find(o => o.id === menuId)?.name || "select";
                                        }
                                        const found = menus.find(m => m.id.toString() === menuId);
                                        return found ? (found.menu_name || found.name || found.tab_name || "select") : "select";
                                    })()}
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>▼</span>
                                </div>

                                {showMenuDropdown && (
                                    <div className="custom-dropdown-menu" style={{
                                        position: "absolute", top: "100%", left: 0, right: 0,
                                        background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px",
                                        marginTop: "5px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                        zIndex: 100, maxHeight: "250px", overflowY: "auto"
                                    }}>
                                        <div style={{ padding: "8px", borderBottom: "1px solid #f3f4f6" }}>
                                            <input
                                                type="text"
                                                placeholder="Search menus..."
                                                value={menuSearch}
                                                onChange={(e) => setMenuSearch(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "13px" }}
                                            />
                                        </div>
                                        <div style={{ padding: "4px" }}>
                                            {mappingMode === "Menu Name" ? (
                                                MENU_NAME_OPTIONS.filter(o => o.name.toLowerCase().includes(menuSearch.toLowerCase())).map(o => (
                                                    <div
                                                        key={o.id}
                                                        onClick={() => { setMenuId(o.id); setShowMenuDropdown(false); setMenuSearch(""); }}
                                                        style={{ padding: "10px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "14px", background: menuId === o.id ? "#f3f4f6" : "transparent" }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = menuId === o.id ? "#f3f4f6" : "transparent"}
                                                    >
                                                        {o.name}
                                                    </div>
                                                ))
                                            ) : (
                                                menus.length === 0 ? (
                                                    <div style={{ padding: "10px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>No menus available</div>
                                                ) : (
                                                    menus.filter(m => ((m.menu_name || m.name || m.tab_name || "").toLowerCase().includes(menuSearch.toLowerCase()))).map(m => (
                                                        <div
                                                            key={m.id}
                                                            onClick={() => { setMenuId(m.id.toString()); setShowMenuDropdown(false); setMenuSearch(""); }}
                                                            style={{ padding: "10px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "14px", background: menuId === m.id.toString() ? "#f3f4f6" : "transparent" }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = menuId === m.id.toString() ? "#f3f4f6" : "transparent"}
                                                        >
                                                            {m.menu_name || m.name || m.tab_name}
                                                        </div>
                                                    ))
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tab Heading Dropdown (Only show in Tab Heading mode) */}
                        {mappingMode === "Tab Heading" && (
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "10px", fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                                Tab Heading
                            </label>
                            <div className="custom-select-container" style={{ position: "relative" }}>
                                <div
                                    className="custom-select-trigger"
                                    onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
                                    style={{
                                        width: "100%",
                                        padding: "12px 18px",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "8px",
                                        background: "#fff",
                                        cursor: "pointer",
                                        fontSize: "15px",
                                        color: headingId ? "#334155" : "#94a3b8",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        height: "48px",
                                    }}
                                >
                                    {(headingId && headings.find(h => h.id.toString() === headingId)?.master_name) || "select"}
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>▼</span>
                                </div>

                                {showHeadingDropdown && (
                                    <div className="custom-dropdown-menu" style={{
                                        position: "absolute", top: "100%", left: 0, right: 0,
                                        background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px",
                                        marginTop: "5px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                        zIndex: 100, maxHeight: "250px", overflowY: "auto"
                                    }}>
                                        <div style={{ padding: "8px", borderBottom: "1px solid #f3f4f6" }}>
                                            <input
                                                type="text"
                                                placeholder="Search headings..."
                                                value={headingSearch}
                                                onChange={(e) => setHeadingSearch(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "13px" }}
                                            />
                                        </div>
                                        <div style={{ padding: "4px" }}>
                                            {headings.length === 0 ? (
                                                <div style={{ padding: "10px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>No headings available</div>
                                            ) : (
                                                headings.filter(h => (h.master_name || "").toLowerCase().includes(headingSearch.toLowerCase())).map(h => (
                                                    <div
                                                        key={h.id}
                                                        onClick={() => { setHeadingId(h.id.toString()); setShowHeadingDropdown(false); setHeadingSearch(""); }}
                                                        style={{ padding: "10px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "14px", background: headingId === h.id.toString() ? "#f3f4f6" : "transparent" }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = headingId === h.id.toString() ? "#f3f4f6" : "transparent"}
                                                    >
                                                        <div style={{ fontWeight: "600", color: "#1e293b" }}>{h.master_name}</div>
                                                        {h.title && <div style={{ fontSize: "12px", color: "#64748b" }}>{h.title}</div>}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        )}

                        {/* Secondary Dynamic Dropdown (Cascading) */}
                        {mappingMode === "Menu Name" && menuId && (
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", marginBottom: "10px", fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                                    Select {MENU_NAME_OPTIONS.find(o => o.id === menuId)?.name}
                                </label>
                                <div className="custom-select-container" style={{ position: "relative" }}>
                                    <div
                                        className="custom-select-trigger"
                                        onClick={() => setShowSecondaryDropdown(!showSecondaryDropdown)}
                                        style={{
                                            width: "100%",
                                            padding: "12px 18px",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "8px",
                                            background: "#fff",
                                            cursor: "pointer",
                                            fontSize: "15px",
                                            color: selectedSecondaryId ? "#334155" : "#94a3b8",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            height: "48px",
                                        }}
                                    >
                                        {(() => {
                                            if (!selectedSecondaryId) return `select ${menuId.replace('_', ' ')}`;
                                            const found = secondaryData.find(s => s.id.toString() === selectedSecondaryId);
                                            return found ? (found.title || found.name || found.category_name || found.brand_name || found.product_name) : `select ${menuId.replace('_', ' ')}`;
                                        })()}
                                        <span style={{ fontSize: "12px", color: "#64748b" }}>▼</span>
                                    </div>

                                    {showSecondaryDropdown && (
                                        <div className="custom-dropdown-menu" style={{
                                            position: "absolute", top: "100%", left: 0, right: 0,
                                            background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px",
                                            marginTop: "5px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                            zIndex: 100, maxHeight: "250px", overflowY: "auto"
                                        }}>
                                            <div style={{ padding: "8px", borderBottom: "1px solid #f3f4f6" }}>
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    value={secondarySearch}
                                                    onChange={(e) => setSecondarySearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "13px" }}
                                                />
                                            </div>
                                            <div style={{ padding: "4px" }}>
                                                {secondaryData.length === 0 ? (
                                                    <div style={{ padding: "10px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>No data found</div>
                                                ) : (
                                                    secondaryData.filter(s => (s.title || s.name || s.category_name || s.brand_name || s.product_name || "").toLowerCase().includes(secondarySearch.toLowerCase())).map(s => (
                                                        <div
                                                            key={s.id}
                                                            onClick={() => { setSelectedSecondaryId(s.id.toString()); setShowSecondaryDropdown(false); setSecondarySearch(""); }}
                                                            style={{ padding: "10px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "14px", background: selectedSecondaryId === s.id.toString() ? "#f3f4f6" : "transparent" }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = selectedSecondaryId === s.id.toString() ? "#f3f4f6" : "transparent"}
                                                        >
                                                            {s.title || s.name || s.category_name || s.brand_name || s.product_name}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Status Dropdown */}
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "10px", fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "12px 18px",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    background: "#fff",
                                    fontSize: "15px",
                                    color: "#334155",
                                    height: "48px",
                                    outline: "none"
                                }}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Selection content area */}
                    <div style={{
                        border: "1px solid #f1f5f9",
                        borderRadius: "12px",
                        padding: "30px",
                        background: "#fff",
                        marginBottom: "40px"
                    }}>
                        <div style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "400px" }}>
                            <span>Select check box list</span>
                            <input 
                                type="text" 
                                placeholder="Search check box list..."
                                value={checkboxSearch}
                                onChange={(e) => setCheckboxSearch(e.target.value)}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "13px",
                                    outline: "none",
                                    width: "180px",
                                    color: "#334155"
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", alignItems: "flex-start", gap: "25px" }}>
                            <div style={{ 
                                width: "400px", 
                                height: "250px", 
                                border: "1px solid #cbd5e1", 
                                borderRadius: "12px", 
                                overflowY: "auto", 
                                background: "#fff",
                                padding: "5px"
                            }}>
                                {checkboxes
                                    .filter(cb => (cb.checkbox_name || "").toLowerCase().includes(checkboxSearch.toLowerCase()))
                                    .map(cb => {
                                        const isChecked = selectedCheckboxIds.includes(cb.id);
                                        return (
                                            <div 
                                                key={cb.id}
                                                onClick={() => {
                                                    setSelectedCheckboxIds(prev => 
                                                        isChecked 
                                                            ? prev.filter(id => id !== cb.id) 
                                                            : [...prev, cb.id]
                                                    );
                                                }}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "12px",
                                                    padding: "10px 15px",
                                                    cursor: "pointer",
                                                    borderRadius: "8px",
                                                    background: isChecked ? "#eff6ff" : "transparent",
                                                    transition: "all 0.2s",
                                                    marginBottom: "2px"
                                                }}
                                                onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = "#f8fafc"; }}
                                                onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.background = "transparent"; }}
                                            >
                                                <div style={{
                                                    width: "18px",
                                                    height: "18px",
                                                    border: isChecked ? "2px solid #3b82f6" : "2px solid #cbd5e1",
                                                    borderRadius: "4px",
                                                    background: isChecked ? "#3b82f6" : "#fff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "12px",
                                                    color: "#fff",
                                                    fontWeight: "bold"
                                                }}>
                                                    {isChecked && "✓"}
                                                </div>
                                                <span style={{ 
                                                    fontSize: "14px", 
                                                    fontWeight: isChecked ? "600" : "500",
                                                    color: isChecked ? "#1e40af" : "#334155"
                                                }}>
                                                    {cb.checkbox_name}
                                                </span>
                                            </div>
                                        );
                                    })}
                                {checkboxes.filter(cb => (cb.checkbox_name || "").toLowerCase().includes(checkboxSearch.toLowerCase())).length === 0 && (
                                    <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                                        -- no items found --
                                    </div>
                                )}
                            </div>

                            <div style={{ paddingTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={handleAddAll}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: "6px",
                                        background: "#3b82f6",
                                        color: "#fff",
                                        border: "none",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        textAlign: "center",
                                        boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)"
                                    }}
                                >
                                    Select all
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUnselectAll}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: "6px",
                                        background: "#ef4444",
                                        color: "#fff",
                                        border: "none",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        textAlign: "center",
                                        boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)"
                                    }}
                                >
                                    Unselect all
                                </button>
                            </div>
                        </div>

                        <div style={{ marginTop: "15px", fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>
                            Tip: Simply click on items to toggle selection. Use Search to filter the list.
                        </div>

                        <div style={{ marginTop: "35px" }}>
                            <div style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "15px" }}>
                                Selected Checkboxes
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                {checkboxes
                                    .filter(cb => selectedCheckboxIds.includes(cb.id))
                                    .map(cb => (
                                        <div key={cb.id} style={{
                                            padding: "6px 15px",
                                            background: "#f1f5f9",
                                            borderRadius: "20px",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            color: "#334155",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px"
                                        }}>
                                            {cb.checkbox_name}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSelectedCheckbox(cb.id)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "#94a3b8",
                                                    cursor: "pointer",
                                                    fontSize: "16px",
                                                    padding: "0 2px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontWeight: "bold"
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                {selectedCheckboxIds.length === 0 && (
                                    <span style={{ fontSize: "13px", color: "#cbd5e1" }}>No items selected</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                padding: "12px 60px",
                                borderRadius: "8px",
                                fontWeight: "700",
                                background: "#28a745",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            {saving ? "Saving..." : isEdit ? "Update" : "Save"}
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            style={{
                                padding: "12px 60px",
                                borderRadius: "8px",
                                fontWeight: "700",
                                background: "#e2e8f0",
                                color: "#475569",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            {isEdit ? "Cancel" : "Reset"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="view-colour-container" style={{ marginTop: "40px" }}>
                <div className="view-colour-header">
                    <h2>View Mapping List {headingId ? `for "${headings.find(h => String(h.id) === headingId)?.master_name}"` : ""}</h2>
                </div>

                <div className="table-wrapper">
                    <table className="redesign-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Menu</th>
                                <th>Heading</th>
                                <th>Check Box List</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>Loading mappings...</td></tr>
                            ) : mappings.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>No mappings found</td></tr>
                            ) : (
                                    mappings.map((m, idx) => {
                                        const currentHeading = headings.find(h => String(h.id) === String(m.tabheading_id || m.tab_heading_id || (m as any).heading_id));
                                        const currentMenu = menus.find(menu => String(menu.id) === String(m.menu_id || (m as any).multitab_menu_id || currentHeading?.menu_id || currentHeading?.multitab_menu_id));
                                    
                                    const rawCids = m.checkbox_ids || m.checkbox_id || [];
                                    let currentCheckboxes: any[] = [];
                                    if (Array.isArray(rawCids)) {
                                        currentCheckboxes = rawCids;
                                    } else if (typeof rawCids === 'string' && rawCids.trim().startsWith("[")) {
                                        try { currentCheckboxes = JSON.parse(rawCids); } catch (e) { currentCheckboxes = []; }
                                    } else if (rawCids) {
                                        // Case where it might be a single number
                                        currentCheckboxes = [rawCids];
                                    }
                                    
                                    // Final safety check
                                    if (!Array.isArray(currentCheckboxes)) currentCheckboxes = [];

                                    // Map IDs to names, with fallback to item.label_name if present in the mapping data itself
                                    const checkboxNames = currentCheckboxes.map((id: any) => {
                                        const found = checkboxes.find(c => String(c.id) === String(id));
                                        return found?.checkbox_name || (m as any).label_name || (m as any).label || (m as any).checkbox_name || "—";
                                    }).filter(Boolean).join(", ");

                                    return (
                                        <tr key={m.id}>
                                            <td>{idx + 1}</td>
                                            <td style={{ fontWeight: "600", color: "#334155" }}>
                                                {currentMenu?.menu_name || currentMenu?.tab_name || currentMenu?.name || (m as any).menu_name || (m as any).name || (m as any).tab_name || "—"}
                                            </td>
                                            <td>
                                                {currentHeading?.master_name || currentHeading?.heading_name || currentHeading?.title || (m as any).heading_name || (m as any).tab_heading_name || (m as any).master_name || "—"}
                                            </td>
                                            <td style={{ fontWeight: "700", color: "#1e293b" }}>{checkboxNames || "—"}</td>
                                            <td>
                                                <span style={{
                                                    padding: "4px 10px",
                                                    borderRadius: "20px",
                                                    fontSize: "12px",
                                                    fontWeight: "700",
                                                    background: m.status === "active" ? "#dcfce7" : "#fee2e2",
                                                    color: m.status === "active" ? "#166534" : "#991b1b"
                                                }}>
                                                    {m.status === "active" ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "#3b82f6",
                                                            cursor: "pointer",
                                                            padding: "5px"
                                                        }}
                                                        onClick={() => handleEdit(m)}
                                                        title="Edit"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "#e11d48",
                                                            cursor: "pointer",
                                                            padding: "5px"
                                                        }}
                                                        onClick={() => handleDelete(m.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AddSectorMappingCheckbox;
