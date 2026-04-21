import { useState, useEffect } from "react";
import { Trash2, Pencil } from "lucide-react";
import "../../../variant/addunittype/addUnitType.css";
import "../../../variant/viewcolour/viewColourList.css";
import "./addMappingCheckbox.css";
import {
    getCheckboxes,
    type Checkbox as CheckboxMaster
} from "../../../../api/multitab/subsector_checkbox.api";
import {
    getAllTabHeadings as getTabHeadings,
    type Heading as TabHeading
} from "../../../../api/multitab/subsector_heading.api";
import {
    getMappings,
    createMapping as saveMapping,
    updateMapping,
    deleteMapping,
} from "../../../../api/multitab/subsector_mapping.api";
import { getMenus, type Menu as MultitabMenu } from "../../../../api/multitab/subsector_menu.api";

const AddSubsectorMappingCheckbox = () => {
    // Data Lists
    const [sectors] = useState([
        { id: 1, title: "Agriculture" },
        { id: 2, title: "Manufacturing" },
        { id: 3, title: "Service" },
        { id: 4, title: "Real Estate" },
    ]);
    const [subsectors, setSubsectors] = useState<any[]>([]); // Assuming subsectors or keeping it generic
    const [menus, setMenus] = useState<MultitabMenu[]>([]);
    const [headings, setHeadings] = useState<TabHeading[]>([]);
    const [checkboxes, setCheckboxes] = useState<CheckboxMaster[]>([]);
    const [mappings, setMappings] = useState<any[]>([]);

    // Selection State
    const [sectorId, setSectorId] = useState("");
    const [subsectorId, setSubsectorId] = useState("");
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
    const [showSectorDropdown, setShowSectorDropdown] = useState(false);
    const [showSubsectorDropdown, setShowSubsectorDropdown] = useState(false);
    const [showMenuDropdown, setShowMenuDropdown] = useState(false);
    const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
    const [sectorSearch, setSectorSearch] = useState("");
    const [subsectorSearch, setSubsectorSearch] = useState("");
    const [menuSearch, setMenuSearch] = useState("");
    const [headingSearch, setHeadingSearch] = useState("");

    // Initial Load - Fetch all masters
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [mData, hData, cData, maps] = await Promise.all([
                getMenus(),
                getTabHeadings(),
                getCheckboxes(),
                getMappings()
            ]);
            setMenus(mData || []);
            setHeadings(hData || []);
            setSelectedCheckboxIds([]);
            setCheckboxes(cData || []);
            setMappings(maps || []);

            // For now, setting subsectors empty or logic to fetch them
            setSubsectors([]);
        } catch (err) {
            console.error("Failed to load initial data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.custom-select-container')) {
                setShowSectorDropdown(false);
                setShowSubsectorDropdown(false);
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
            setMappings(data || []);
        } catch (error) {
            console.error("Failed to load mappings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
        setSelectedCheckboxIds(selected);
    };

    const handleRemoveSelectedCheckbox = (id: number) => {
        setSelectedCheckboxIds(prev => prev.filter(item => item !== id));
    };

    const handleAddAll = () => {
        const allIds = checkboxes.map(cb => cb.id);
        setSelectedCheckboxIds(allIds);
    };

    const handleEdit = (m: any) => {
        setSectorId(m.sector_id?.toString() || "");
        setSubsectorId(m.subsector_id?.toString() || "");
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
        setSectorId("");
        setSubsectorId("");
        setMenuId("");
        setHeadingId("");
        setSelectedCheckboxIds([]);
        setStatus("active");
        setIsEdit(false);
        setEditId(null);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!menuId || !headingId || selectedCheckboxIds.length === 0) {
            alert("Please fill all fields");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                sector_id: sectorId ? Number(sectorId) : null,
                subsector_id: subsectorId ? Number(subsectorId) : null,
                menu_id: Number(menuId),
                tabheading_id: Number(headingId),
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
                    {isEdit ? "Edit Subsector Mapping Checkbox" : "Add Subsector Mapping Checkbox"}
                </h1>
            </div>

            <div className="form-card" style={{ padding: "40px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: "flex", gap: "25px", marginBottom: "40px" }}>
                        {/* Sector Title Dropdown */}
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "10px", fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                                Sector Title
                            </label>
                            <div className="custom-select-container" style={{ position: "relative" }}>
                                <div
                                    className="custom-select-trigger"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowSectorDropdown(!showSectorDropdown);
                                        setShowSubsectorDropdown(false);
                                        setShowMenuDropdown(false);
                                        setShowHeadingDropdown(false);
                                    }}
                                    style={{
                                        width: "100%",
                                        padding: "12px 18px",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "8px",
                                        background: "#fff",
                                        cursor: "pointer",
                                        fontSize: "15px",
                                        color: sectorId ? "#334155" : "#94a3b8",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        height: "48px",
                                        position: "relative",
                                        zIndex: 10,
                                    }}
                                >
                                    <span>{sectors.find(s => s.id.toString() === sectorId)?.title || "select"}</span>
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>▼</span>
                                </div>

                                {showSectorDropdown && (
                                    <div className="custom-dropdown-menu" style={{
                                        position: "absolute", top: "100%", left: 0, right: 0,
                                        background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px",
                                        marginTop: "5px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                        zIndex: 100, maxHeight: "250px", overflowY: "auto"
                                    }}>
                                        <div style={{ padding: "8px", borderBottom: "1px solid #f3f4f6" }}>
                                            <input
                                                type="text"
                                                placeholder="Search sectors..."
                                                value={sectorSearch}
                                                onChange={(e) => setSectorSearch(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "13px" }}
                                            />
                                        </div>
                                        <div style={{ padding: "4px" }}>
                                            {sectors.filter(s => s.title.toLowerCase().includes(sectorSearch.toLowerCase())).map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => { setSectorId(s.id.toString()); setShowSectorDropdown(false); setSectorSearch(""); }}
                                                    style={{ padding: "10px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "14px", background: sectorId === s.id.toString() ? "#f3f4f6" : "transparent" }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = sectorId === s.id.toString() ? "#f3f4f6" : "transparent"}
                                                >
                                                    {s.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Subsector Dropdown */}
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "10px", fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                                SubSector
                            </label>
                            <div className="custom-select-container" style={{ position: "relative" }}>
                                <div
                                    className="custom-select-trigger"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowSubsectorDropdown(!showSubsectorDropdown);
                                        setShowSectorDropdown(false);
                                        setShowMenuDropdown(false);
                                        setShowHeadingDropdown(false);
                                    }}
                                    style={{
                                        width: "100%",
                                        padding: "12px 18px",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "8px",
                                        background: "#fff",
                                        cursor: "pointer",
                                        fontSize: "15px",
                                        color: subsectorId ? "#334155" : "#94a3b8",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        height: "48px",
                                        position: "relative",
                                        zIndex: 10,
                                    }}
                                >
                                    <span>{subsectors.find(b => b.id.toString() === subsectorId)?.name || "select"}</span>
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>▼</span>
                                </div>

                                {showSubsectorDropdown && (
                                    <div className="custom-dropdown-menu" style={{
                                        position: "absolute", top: "100%", left: 0, right: 0,
                                        background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px",
                                        marginTop: "5px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                        zIndex: 100, maxHeight: "250px", overflowY: "auto"
                                    }}>
                                        <div style={{ padding: "8px", borderBottom: "1px solid #f3f4f6" }}>
                                            <input
                                                type="text"
                                                placeholder="Search subsectors..."
                                                value={subsectorSearch}
                                                onChange={(e) => setSubsectorSearch(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "13px" }}
                                            />
                                        </div>
                                        <div style={{ padding: "4px" }}>
                                            {subsectors.length === 0 ? (
                                                <div style={{ padding: "10px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>No subsectors available</div>
                                            ) : (
                                                subsectors.filter(b => b.name.toLowerCase().includes(subsectorSearch.toLowerCase())).map(b => (
                                                    <div
                                                        key={b.id}
                                                        onClick={() => { setSubsectorId(b.id.toString()); setShowSubsectorDropdown(false); setSubsectorSearch(""); }}
                                                        style={{ padding: "10px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "14px", background: subsectorId === b.id.toString() ? "#f3f4f6" : "transparent" }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = subsectorId === b.id.toString() ? "#f3f4f6" : "transparent"}
                                                    >
                                                        {b.name}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

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
                                    {(menuId && menus.find(m => m.id.toString() === menuId)?.menu_name) || "select"}
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
                                            {menus.length === 0 ? (
                                                <div style={{ padding: "10px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>No menus available</div>
                                            ) : (
                                                menus.filter(m => m.menu_name.toLowerCase().includes(menuSearch.toLowerCase())).map(m => (
                                                    <div
                                                        key={m.id}
                                                        onClick={() => { setMenuId(m.id.toString()); setShowMenuDropdown(false); setMenuSearch(""); }}
                                                        style={{ padding: "10px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "14px", background: menuId === m.id.toString() ? "#f3f4f6" : "transparent" }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = menuId === m.id.toString() ? "#f3f4f6" : "transparent"}
                                                    >
                                                        {m.menu_name}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tab Heading Dropdown */}
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
                                    {(headingId && headings.find(h => h.id.toString() === headingId)?.heading_name) || "select"}
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
                                                headings.filter(h => h.heading_name.toLowerCase().includes(headingSearch.toLowerCase())).map(h => (
                                                    <div
                                                        key={h.id}
                                                        onClick={() => { setHeadingId(h.id.toString()); setShowHeadingDropdown(false); setHeadingSearch(""); }}
                                                        style={{ padding: "10px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "14px", background: headingId === h.id.toString() ? "#f3f4f6" : "transparent" }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = headingId === h.id.toString() ? "#f3f4f6" : "transparent"}
                                                    >
                                                        <div style={{ fontWeight: "600", color: "#1e293b" }}>{h.heading_name}</div>
                                                        {h.title && <div style={{ fontSize: "12px", color: "#64748b" }}>{h.title}</div>}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

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
                        <div style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "15px" }}>
                            Select check box list
                        </div>

                        <div style={{ display: "flex", alignItems: "flex-start", gap: "25px" }}>
                            <div style={{ width: "400px" }}>
                                <select
                                    multiple
                                    className="custom-multi-select"
                                    value={selectedCheckboxIds.map(String)}
                                    onChange={handleCheckboxChange}
                                    style={{
                                        width: "100%",
                                        height: "250px",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "12px",
                                        padding: "15px",
                                        fontSize: "15px",
                                        color: "#334155",
                                        outline: "none"
                                    }}
                                >
                                    {checkboxes.length === 0 && <option value="" disabled>-- no items found --</option>}
                                    {checkboxes.map(cb => (
                                        <option key={cb.id} value={cb.id}>{cb.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ paddingTop: "10px" }}>
                                <button
                                    type="button"
                                    onClick={handleAddAll}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#000080",
                                        fontWeight: "800",
                                        textDecoration: "underline",
                                        cursor: "pointer",
                                        fontSize: "14px"
                                    }}
                                >
                                    Add all
                                </button>
                            </div>
                        </div>

                        <div style={{ marginTop: "15px", fontSize: "13px", color: "#94a3b8" }}>
                            Tip: if the select has `multiple` you can Ctrl/Cmd+click to select multiple items.
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
                                            {cb.label}
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
                    <h2>View Mapping List {headingId ? `for "${headings.find(h => String(h.id) === headingId)?.heading_name}"` : ""}</h2>
                </div>

                <div className="table-wrapper">
                    <table className="redesign-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Sector Name</th>
                                <th>SubSector Name</th>
                                <th>Menu Name</th>
                                <th>Tab Heading</th>
                                <th>Check Box List</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>Loading mappings...</td></tr>
                            ) : mappings.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>No mappings found</td></tr>
                            ) : (
                                mappings.map((m, idx) => {
                                    const currentSector = sectors.find(s => s.id === m.sector_id);
                                    const currentSubsector = subsectors.find(b => b.id === m.subsector_id);
                                    const currentMenu = menus.find(menu => menu.id === m.menu_id);
                                    const currentHeading = headings.find(h => h.id === m.tabheading_id);
                                    const currentCheckboxes = (typeof m.checkbox_ids === 'string' ? JSON.parse(m.checkbox_ids) : m.checkbox_ids) || [];
                                    const checkboxNames = currentCheckboxes.map((id: number) => checkboxes.find(c => c.id === id)?.label).filter(Boolean).join(", ");

                                    return (
                                        <tr key={m.id}>
                                            <td>{idx + 1}</td>
                                            <td style={{ fontWeight: "600", color: "#64748b" }}>{currentSector?.title}</td>
                                            <td style={{ fontWeight: "600", color: "#64748b" }}>{currentSubsector?.name}</td>
                                            <td style={{ fontWeight: "600", color: "#334155" }}>{currentMenu?.menu_name}</td>
                                            <td>{currentHeading?.heading_name}</td>
                                            <td style={{ fontWeight: "700", color: "#1e293b" }}>{checkboxNames}</td>
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

export default AddSubsectorMappingCheckbox;
