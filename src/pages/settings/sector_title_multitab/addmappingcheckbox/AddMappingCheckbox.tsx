import { useState, useEffect } from "react";
import { Trash2, Pencil } from "lucide-react";
import "../../../variant/addunittype/addUnitType.css";
import "../../../variant/viewcolour/viewColourList.css";
import "./addMappingCheckbox.css";
import { getMultitabTitles, type MultitabTitle } from "../../../../api/multitab/title.api";
import { getMenus as getMenuTabs, type Menu as MultitabMenu } from "../../../../api/multitab/sector_menu.api";
import {
    getHeadingsByMenu as getHeadingsByTab,
    getAllTabHeadings as getTabHeadings,
    type Heading as TabHeading
} from "../../../../api/multitab/sector_heading.api";
import {
    getCheckboxes,
    type Checkbox as CheckboxMaster
} from "../../../../api/multitab/sector_checkbox.api";
import {
    getMappings,
    createMapping as saveMapping,
    updateMapping,
    deleteMapping
} from "../../../../api/multitab/sector_mapping.api";

const AddSectorTitleMappingCheckbox = () => {
    // Data Lists
    const [sectors, setSectors] = useState<MultitabTitle[]>([]);
    const [menus, setMenus] = useState<MultitabMenu[]>([]);
    const [headings, setHeadings] = useState<TabHeading[]>([]);
    const [checkboxes, setCheckboxes] = useState<CheckboxMaster[]>([]);
    const [mappings, setMappings] = useState<any[]>([]);

    // Global lists for Table resolution
    const [allMenus, setAllMenus] = useState<MultitabMenu[]>([]);
    const [allHeadings, setAllHeadings] = useState<TabHeading[]>([]);
    const [allCheckboxes, setAllCheckboxes] = useState<CheckboxMaster[]>([]);

    // Selection State
    const [sectorId, setSectorId] = useState("");
    const [menuId, setMenuId] = useState("");
    const [headingId, setHeadingId] = useState("");

    // Form Selection
    const [selectedCheckboxIds, setSelectedCheckboxIds] = useState<number[]>([]);
    const [status, setStatus] = useState("active");

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);




    // Initial Load
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [sectorData, menuData, checkboxData, headingData] = await Promise.all([
                    getMultitabTitles(),
                    getMenuTabs(),
                    getCheckboxes(),
                    getTabHeadings()
                ]);

                setSectors(sectorData || []);
                setAllMenus(menuData || []);
                setAllCheckboxes(checkboxData || []);
                setAllHeadings(headingData || []);

                // Load mappings
                loadMappings();
            } catch (err: any) {
                console.error("Failed to fetch initial data", err);
                if (err.message?.includes("Authorization") || err.message?.includes("token")) {
                    alert("Your session has expired or you are not logged in. Please log in again.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Load Menus, Headings and Checkboxes when Sector changes
    useEffect(() => {
        setLoading(true);


        Promise.all([
            getMenuTabs(),
            getCheckboxes()
        ]).then(([menuData, cbData]) => {
            // Handle Menus - Show all menus (no filtering by sector)
            setMenus(menuData || []);

            // Handle Checkboxes
            setCheckboxes(cbData || []);

            // Always reset child selections when sector changes
            setMenuId("");
            setHeadingId("");
            setSelectedCheckboxIds([]);
        }).finally(() => setLoading(false));
    }, [sectorId]);

    // Load Tab Headings when Menu changes
    useEffect(() => {
        if (menuId) {
            getHeadingsByTab(Number(menuId)).then(data => {
                setHeadings(data || []);
                setHeadingId("");
            }).catch(err => {
                console.error("Failed to load headings", err);
                setHeadings([]);
            });
        } else {
            setHeadings([]);
            setHeadingId("");
        }
    }, [menuId]);



    const loadMappings = async () => {
        try {
            const data = await getMappings();
            setMappings(data);
        } catch (error) {
            console.error("Failed to load mappings", error);
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
        setSectorId((m.sector_title_id || m.menu_title_id || m.sector_id)?.toString() || "");
        setMenuId((m.multitab_menu_id || m.menu_id)?.toString() || "");
        setHeadingId((m.tab_heading_id || m.tabheading_id || m.heading_id)?.toString() || "");

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
                menu_id: Number(menuId),
                tab_heading_id: Number(headingId),
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

    const selectedSector = sectors.find(s => s.id.toString() === sectorId);
    const selectedHeading = headings.find(h => h.id.toString() === headingId);

    return (
        <div className="page-container" style={{ padding: "0 20px" }}>
            <div className="page-header" style={{ marginBottom: "25px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>
                    {isEdit ? "Edit Sector Title Mapping Checkbox" : "Add Sector Title Mapping Checkbox"}
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
                            <div className="custom-select-container">
                                <select
                                    value={sectorId}
                                    onChange={(e) => setSectorId(e.target.value)}
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
                                    <option value="">Select Sector Title</option>
                                    {sectors.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.menu_title || (s as any).title || (s as any).name || (s as any).sector_title_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Menu Dropdown */}
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "10px", fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                                Menu
                            </label>
                            <div className="custom-select-container">
                                <select
                                    value={menuId}
                                    onChange={(e) => setMenuId(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "12px 18px",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "8px",
                                        background: "#fff",
                                        fontSize: "15px",
                                        color: "#334155",
                                        height: "48px",
                                        outline: "none",
                                        cursor: "pointer"
                                    }}
                                >
                                    <option value="">Select Menu</option>
                                    {menus.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.menu_name || (m as any).name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Tab Heading Dropdown */}
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "10px", fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                                Tab Heading
                            </label>
                            <div className="custom-select-container">
                                <select
                                    value={headingId}
                                    onChange={(e) => setHeadingId(e.target.value)}
                                    disabled={!menuId}
                                    style={{
                                        width: "100%",
                                        padding: "12px 18px",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "8px",
                                        background: menuId ? "#fff" : "#f8fafc",
                                        fontSize: "15px",
                                        color: headingId ? "#334155" : "#94a3b8",
                                        height: "48px",
                                        outline: "none",
                                        cursor: menuId ? "pointer" : "not-allowed"
                                    }}
                                >
                                    <option value="">Select Tab Heading</option>
                                    {headings.map(h => (
                                        <option key={h.id} value={h.id}>
                                            {h.heading_name || h.title}
                                        </option>
                                    ))}
                                </select>
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
                            Select check box list {sectorId && `for Sector: ${selectedSector?.menu_title}`}
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
                    <h2>View Mapping List {headingId ? `for "${selectedHeading?.heading_name}"` : ""}</h2>
                </div>

                <div className="table-wrapper">
                    <table className="redesign-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Sector Name</th>
                                <th>Menu Name</th>
                                <th>Tab Heading</th>
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
                                    const headingId = m.tab_heading_id || m.tabheading_id || m.heading_id;
                                    const currentHeading = allHeadings.find(h => h.id == headingId);
                                    
                                    // Trace back to Menu
                                    const menuId = currentHeading?.multitab_menu_id || m.menu_id || m.multitab_menu_id;
                                    const currentMenu = allMenus.find(menu => menu.id == menuId);

                                    // Trace back to Sector
                                    const sectorId = currentMenu?.menu_title_id || (currentMenu as any)?.sector_title_id || (currentMenu as any)?.sector_id || m.sector_id || m.menu_title_id || m.sector_title_id || m.sector_title || m.menu_title;
                                    const currentSector = sectors.find(s => s.id == sectorId);

                                    // Process checkboxes - handle both singular and plural
                                    let currentCheckboxes: any[] = [];
                                    try {
                                        if (m.checkbox_ids) {
                                            currentCheckboxes = (typeof m.checkbox_ids === 'string' ? JSON.parse(m.checkbox_ids) : m.checkbox_ids) || [];
                                        } else if (m.checkbox_id) {
                                            currentCheckboxes = [m.checkbox_id];
                                        }
                                    } catch (e) {
                                        currentCheckboxes = [];
                                    }

                                    const checkboxNames = currentCheckboxes.map((id: number) => {
                                        const found = allCheckboxes.find(c => c.id === id);
                                        return found ? found.label : `ID:${id}`;
                                    }).join(", ");

                                    return (
                                        <tr key={m.id}>
                                            <td>{idx + 1}</td>
                                            <td style={{ fontWeight: "600", color: "#64748b" }}>{currentSector?.menu_title || m.sector_title_name || m.title || m.sectorTitle || m.sector_name || "—"}</td>
                                            <td style={{ fontWeight: "600", color: "#334155" }}>{currentMenu ? (currentMenu.menu_name || (currentMenu as any).name) : (m.menu_name || m.name || "—")}</td>
                                            <td>{currentHeading?.heading_name || (currentHeading as any)?.title || m.heading_name || "—"}</td>
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

export default AddSectorTitleMappingCheckbox;
