import { useState, useEffect } from "react";
import { RefreshCcw, HelpCircle } from "lucide-react";
import "./addPreviewTabs.css";
import { getSectorTitles, type SectorTitle } from "../../../../api/sectorTitle.api";
import {
    getTabsByMenuTitle,
    getHeadingsByTab,
    getMappingByHeading,
    getCheckboxesByMenuTitle,
    type CheckboxMaster,
    type MultitabMenu,
    type TabHeading
} from "../../../../api/multitab_master.api";

const AddPreviewTabs = () => {
    // Data States
    const [sectors, setSectors] = useState<SectorTitle[]>([]);
    const [menus, setMenus] = useState<MultitabMenu[]>([]);
    const [headings, setHeadings] = useState<TabHeading[]>([]);
    const [checkboxes, setCheckboxes] = useState<CheckboxMaster[]>([]);
    const [mappings, setMappings] = useState<any[]>([]);

    // Selection States
    const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);
    const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
    const [activeHeadingId, setActiveHeadingId] = useState<number | null>(null);
    const [showSectorDropdown, setShowSectorDropdown] = useState(false);
    const [sectorSearch, setSectorSearch] = useState("");

    const [loading, setLoading] = useState(false);

    // Initial Load: Sectors
    useEffect(() => {
        const loadInitial = async () => {
            try {
                const s = await getSectorTitles();
                const rows = s || [];
                setSectors(rows);
                if (rows.length > 0 && !selectedSectorId) {
                    setSelectedSectorId(rows[0].id);
                }
            } catch (err) {
                console.error("Failed to load sectors", err);
            }
        };
        loadInitial();
    }, []);

    // Load Menus and Checkboxes when Sector Changes
    useEffect(() => {
        if (selectedSectorId) {
            fetchMenusForSector(Number(selectedSectorId));
        } else {
            setMenus([]);
            setSelectedMenuId(null);
        }
    }, [selectedSectorId]);

    // Load Headings when Menu Changes
    useEffect(() => {
        if (selectedMenuId) {
            fetchHeadingsForMenu(Number(selectedMenuId));
        } else {
            setHeadings([]);
            setActiveHeadingId(null);
        }
    }, [selectedMenuId]);

    // Load Mappings when Heading Changes
    useEffect(() => {
        if (activeHeadingId) {
            fetchMappingsForHeading(Number(activeHeadingId));
        } else {
            setMappings([]);
        }
    }, [activeHeadingId]);

    const fetchMenusForSector = async (sectorId: number) => {
        try {
            setLoading(true);
            const [menusData, checkboxesData] = await Promise.all([
                getTabsByMenuTitle(sectorId),
                getCheckboxesByMenuTitle(sectorId)
            ]);

            const menuRows = Array.isArray(menusData) ? menusData : menusData?.data || [];
            setMenus(menuRows);
            setCheckboxes(Array.isArray(checkboxesData) ? checkboxesData : checkboxesData?.data || []);

            if (menuRows.length > 0) {
                setSelectedMenuId(menuRows[0].id);
            } else {
                setSelectedMenuId(null);
            }
        } catch (err) {
            console.error("Failed to load sector data", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHeadingsForMenu = async (menuId: number) => {
        try {
            const headingData = await getHeadingsByTab(menuId);
            const rows = headingData.data || headingData || [];
            setHeadings(rows);
            if (rows.length > 0) {
                setActiveHeadingId(rows[0].id);
            } else {
                setActiveHeadingId(null);
            }
        } catch (err) {
            console.error("Failed to load headings", err);
        }
    };

    const fetchMappingsForHeading = async (headingId: number) => {
        try {
            const mapData = await getMappingByHeading(headingId);
            setMappings(mapData.data || mapData || []);
        } catch (err) {
            console.error("Failed to load mappings", err);
        }
    };

    const handleRefresh = () => {
        if (selectedSectorId) fetchMenusForSector(Number(selectedSectorId));
    };

    const currentMenu = menus.find(m => m.id === selectedMenuId);

    return (
        <div style={{ background: "#f1f5f9", minHeight: "100vh" }}>
            {/* Header bar */}
            <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                    Sector Preview Tabs
                </h2>
                <button
                    onClick={handleRefresh}
                    style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "8px 16px", background: "#1a237e", color: "#fff",
                        border: "none", borderRadius: "8px", cursor: "pointer",
                        fontWeight: "600", fontSize: "13px"
                    }}
                >
                    <RefreshCcw size={14} /> Refresh
                </button>
            </div>

            <div className="preview-layout-container">
                {/* Sidebar with dynamic active styling */}
                <aside className="preview-sidebar">
                    <div className="sidebar-title">Sector Title Menu</div>
                    <div className="sidebar-menu-list">
                        {sectors.map(s => (
                            <div
                                key={s.id}
                                className={`sidebar-item ${selectedSectorId === s.id ? "active" : ""}`}
                                onClick={() => setSelectedSectorId(s.id)}
                            >
                                {s.title}
                            </div>
                        ))}
                        {sectors.length === 0 && <div className="empty-state">No Sectors</div>}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="preview-main-content">
                    {!selectedSectorId ? (
                        <div className="empty-state">Please select a Sector Title from the menu</div>
                    ) : loading ? (
                        <div className="empty-state">Loading data...</div>
                    ) : (
                        <>
                            {/* Sector Selection Placeholder / Dropdown (Top Selection) */}
                            <div style={{ marginBottom: "30px", maxWidth: "400px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                                    Select Sector
                                </label>
                                <div className="custom-select-container" style={{ position: "relative" }}>
                                    <div
                                        className="custom-select-trigger"
                                        onClick={() => setShowSectorDropdown(!showSectorDropdown)}
                                        style={{
                                            width: "100%",
                                            padding: "12px 18px",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "10px",
                                            background: "#fff",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            color: selectedSectorId ? "#1e293b" : "#94a3b8",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            height: "48px",
                                        }}
                                    >
                                        <span>{sectors.find(s => s.id === selectedSectorId)?.title || "-- select --"}</span>
                                        <span style={{ fontSize: "12px", color: "#64748b" }}>▼</span>
                                    </div>

                                    {showSectorDropdown && (
                                        <div className="custom-dropdown-menu" style={{
                                            position: "absolute", top: "100%", left: 0, right: 0,
                                            background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px",
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
                                                        onClick={() => { setSelectedSectorId(s.id); setShowSectorDropdown(false); setSectorSearch(""); }}
                                                        style={{ padding: "10px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "14px", background: selectedSectorId === s.id ? "#f3f4f6" : "transparent" }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = selectedSectorId === s.id ? "#f3f4f6" : "transparent"}
                                                    >
                                                        {s.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Horizontal Menu Selection if Sector has multiple menus */}
                            {menus.length > 1 && (
                                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                                    {menus.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMenuId(m.id)}
                                            style={{
                                                padding: "6px 16px",
                                                borderRadius: "20px",
                                                border: "none",
                                                background: selectedMenuId === m.id ? "#1a237e" : "transparent",
                                                color: selectedMenuId === m.id ? "#fff" : "#64748b",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                transition: "all 0.2s"
                                            }}
                                        >
                                            {m.menu_name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Blue Accent Header Bar */}
                            <div className="preview-header-bar">
                                <h3 className="preview-header-title">
                                    {currentMenu?.menu_name || "Select a Menu"}
                                </h3>
                            </div>

                            {/* Icon-based Tab Headings */}
                            <div className="sub-tabs-container">
                                {headings.map(h => (
                                    <div
                                        key={h.id}
                                        className={`sub-tab-item ${activeHeadingId === h.id ? "active" : ""}`}
                                        onClick={() => setActiveHeadingId(h.id)}
                                    >
                                        <img
                                            src={h.image || `https://ui-avatars.com/api/?name=${h.heading_name}&background=random`}
                                            alt={h.heading_name}
                                            className="sub-tab-icon"
                                        />
                                        <span className="sub-tab-label">{h.heading_name}</span>
                                    </div>
                                ))}
                                {headings.length === 0 && (
                                    <div style={{ color: "#94a3b8", fontSize: "14px" }}>No tab headings found</div>
                                )}
                            </div>

                            {/* Checkbox Mapping Grid */}
                            <div className="checkbox-cards-grid">
                                {mappings.map(m => {
                                    const cb = checkboxes.find(c => c.id === m.checkbox_id);
                                    return (
                                        <div key={m.id} className="checkbox-card">
                                            <div className="card-header">
                                                <div className="card-title">{cb?.label || `ID: ${m.checkbox_id}`}</div>
                                                <div className="help-icon">
                                                    <HelpCircle size={14} />
                                                </div>
                                            </div>
                                            <div className="card-checkbox-container">
                                                <input
                                                    type="checkbox"
                                                    className="styled-checkbox"
                                                    checked={m.is_default === 1}
                                                    readOnly
                                                />
                                                <span className="checkbox-label">checkbox[]</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {activeHeadingId && mappings.length === 0 && (
                                    <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                                        No checkboxes mapped to this heading
                                    </div>
                                )}
                            </div>

                            {/* Separate Mapping List Section */}
                            <div style={{ marginTop: "50px", paddingTop: "30px", borderTop: "2px solid #f1f5f9" }}>
                                <div style={{ marginBottom: "20px" }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>
                                        View Mapping List {activeHeadingId ? `for "${headings.find(h => h.id === activeHeadingId)?.heading_name}"` : ""}
                                    </h3>
                                </div>
                                <div className="table-wrapper">
                                    <table className="redesign-table">
                                        <thead>
                                            <tr>
                                                <th>No</th>
                                                <th>Sector Title</th>
                                                <th>Tab Heading Title</th>
                                                <th>Tab Heading</th>
                                                <th>Check Box List</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mappings.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                                                        No mappings found for this selection
                                                    </td>
                                                </tr>
                                            ) : (
                                                mappings.map((m, idx) => {
                                                    const currentHeading = headings.find(h => h.id === activeHeadingId);
                                                    const currentSector = sectors.find(s => s.id === selectedSectorId);
                                                    const currentCheckbox = checkboxes.find(c => c.id === m.checkbox_id);
                                                    return (
                                                        <tr key={m.id}>
                                                            <td>{idx + 1}</td>
                                                            <td>{currentSector?.title}</td>
                                                            <td>{currentHeading?.title}</td>
                                                            <td>{currentHeading?.heading_name}</td>
                                                            <td style={{ fontWeight: "600" }}>{currentCheckbox?.label}</td>
                                                            <td>
                                                                <span style={{
                                                                    padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
                                                                    background: m.is_default ? "#dcfce7" : "#fee2e2", color: m.is_default ? "#166534" : "#991b1b"
                                                                }}>
                                                                    {m.is_default ? "Active" : "Inactive"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Sector Title List Section - DEFAULT TO SHOW */}
                            <div style={{ marginTop: "50px", padding: "30px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>View Sector Title List</h3>
                                    <div style={{ color: "#64748b", fontSize: "13px" }}>Total Sectors: {sectors.length}</div>
                                </div>
                                <div className="table-wrapper">
                                    <table className="redesign-table">
                                        <thead>
                                            <tr>
                                                <th>No</th>
                                                <th>Title Name</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sectors.length === 0 ? (
                                                <tr><td colSpan={3} style={{ textAlign: "center", padding: "20px" }}>No sectors found</td></tr>
                                            ) : (
                                                sectors.map((s, idx) => (
                                                    <tr key={s.id}>
                                                        <td>{idx + 1}</td>
                                                        <td style={{ fontWeight: "700", color: "#1a237e" }}>{s.title}</td>
                                                        <td>
                                                            <span style={{
                                                                padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
                                                                background: "#dcfce7", color: "#166534"
                                                            }}>
                                                                Active
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AddPreviewTabs;
