import React, { useState, useEffect } from "react";
import { HelpCircle, Box, Bookmark, Tag, Save, CheckCircle2, ChevronDown, Layers, Search, Database, Grid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./Preview.css";

import {
    getMenus,
    getTabHeadings,
    getCheckboxes,
    getMappings,
    getSectorTitles,
    type MultitabMenu,
    type TabHeading,
    type CheckboxMaster,
    type MultitabMapping
} from "../models/multitab.api";



const PreviewTabs: React.FC = () => {
    // Data State
    const [allMenus, setAllMenus] = useState<MultitabMenu[]>([]);
    const [allHeadings, setAllHeadings] = useState<TabHeading[]>([]);
    const [allCheckboxes, setAllCheckboxes] = useState<CheckboxMaster[]>([]);
    const [allMappings, setAllMappings] = useState<MultitabMapping[]>([]);

    // Selection State
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [activeHeadingId, setActiveHeadingId] = useState<number | null>(null);
    const [selectedCheckboxes, setSelectedCheckboxes] = useState<number[]>([]);
    const [sidebarSearch, setSidebarSearch] = useState("");

    // Custom Component State
    const [showTabDropdown, setShowTabDropdown] = useState(false);
    const [selectedTab, setSelectedTab] = useState("");
    
    // Sector Title Selection
    const [allSectorTitles, setAllSectorTitles] = useState<any[]>([]);
    const [selectedSectorTitleId, setSelectedSectorTitleId] = useState<number | null>(null);
    const [showSectorDropdown, setShowSectorDropdown] = useState(false);

    const [loading, setLoading] = useState(true);

    // Click Outside listener for custom dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const tabDropdown = document.getElementById("tab-heading-dropdown");
            if (tabDropdown && !tabDropdown.contains(event.target as Node)) {
                setShowTabDropdown(false);
            }
            
            const sectorDropdown = document.getElementById("sector-title-dropdown");
            if (sectorDropdown && !sectorDropdown.contains(event.target as Node)) {
                setShowSectorDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [mData, hData, cData, mapsData, sTitles] = await Promise.all([
                getMenus(),
                getTabHeadings(),
                getCheckboxes(),
                getMappings(),
                getSectorTitles()
            ]);
            
            // Extract arrays safely
            const mList = Array.isArray(mData) ? mData : (mData as any)?.data || [];
            const hList = Array.isArray(hData) ? hData : (hData as any)?.data || [];
            const cList = Array.isArray(cData) ? cData : (cData as any)?.data || [];
            const mapsList = Array.isArray(mapsData) ? mapsData : (mapsData as any)?.data || [];

            setAllMenus(mList);
            setAllHeadings(hList);
            setAllCheckboxes(cList);
            setAllMappings(mapsList);
            setAllSectorTitles(Array.isArray(sTitles) ? sTitles : []);

            if (mList.length > 0) {
                setActiveMenuId(mList[0].id);
            }
        } catch (error) {
            console.error("❌ Failed to load initial data", error);
        } finally {
            setLoading(false);
        }
    };

    // Filtered data based on selection
    const filteredHeadings = allHeadings.filter(h => String(h.menu_id || h.multitab_menu_id) === String(activeMenuId));

    // Auto-select first heading when menu changes
    useEffect(() => {
        if (filteredHeadings.length > 0) {
            setActiveHeadingId(filteredHeadings[0].id);
        } else {
            setActiveHeadingId(null);
        }
    }, [activeMenuId, allHeadings.length]);

    // Derived states
    const activeHeading = filteredHeadings.find(h => h.id === activeHeadingId);

    // Sync selectedTab with activeMenuId
    useEffect(() => {
        const currentMenu = allMenus.find(m => m.id === activeMenuId);
        if (currentMenu) {
            setSelectedTab(currentMenu.name || currentMenu.menu_name || "");
        }
    }, [activeMenuId, allMenus]);

    // Find custom icon for heading tabs
    const getTabIcon = (index: number) => {
        if (index % 3 === 0) return <Box size={16} />;
        if (index % 3 === 1) return <Bookmark size={16} />;
        return <Tag size={16} />;
    };

    // Find checkboxes mapped to the currently selected heading OR selectedSectorTitleId
    const activeMappings = allMappings.filter(m => {
        if (selectedSectorTitleId) {
            return String(m.sector_id) === String(selectedSectorTitleId);
        }
        return String(m.tabheading_id || m.tab_heading_id || (m as any).heading_id) === String(activeHeadingId);
    });
    
    let mappedCheckboxIds: number[] = [];
    activeMappings.forEach(m => {
        const rawCids = m.checkbox_ids || m.checkbox_id || (m as any).checkbox_id;
        if (Array.isArray(rawCids)) {
            mappedCheckboxIds.push(...rawCids.map(Number));
        } else if (typeof rawCids === 'string' && rawCids.trim().startsWith("[")) {
            try { mappedCheckboxIds.push(...JSON.parse(rawCids).map(Number)); } catch(e) {}
        } else if (rawCids) {
            mappedCheckboxIds.push(Number(rawCids));
        }
    });

    const mappedCheckboxes = allCheckboxes.filter(cb => mappedCheckboxIds.includes(cb.id));

    // Toggle checkbox selection
    const toggleCheckbox = (id: number) => {
        setSelectedCheckboxes(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const ids = mappedCheckboxes.map(cb => cb.id);
        setSelectedCheckboxes(ids);
    };

    const handleRemoveAll = () => {
        setSelectedCheckboxes([]);
    };

    // Handle Save Configuration
    const handleSaveConfig = () => {
        if (selectedCheckboxes.length === 0) {
            alert("⚠️ Please select at least one option to save.");
            return;
        }
        
        // This is where you would call an API to save the user's specific configuration
        console.log("Saving Configuration:", {
            menu_id: activeMenuId,
            heading_id: activeHeadingId,
            selected_checkbox_ids: selectedCheckboxes
        });
        
        alert(`✅ Configuration saved successfully!\nSelected items: ${selectedCheckboxes.length}`);
    };

    return (
        <div className="preview-page-container">
            <div className="preview-layout">
                {/* LEFT SIDEBAR */}
                <div className="preview-sidebar">
                    <div className="sidebar-title">Tab Heading</div>
                    <div className="sidebar-menu-list">
                        {loading ? (
                            <div className="sidebar-state-text">Loading menus...</div>
                        ) : allMenus.length === 0 ? (
                            <div className="sidebar-state-text">No menus found</div>
                        ) : (
                            <div className="sidebar-accordion">
                                <div 
                                    className={`sidebar-dropdown-toggle ${activeMenuId !== null ? "active" : ""}`}
                                    onClick={() => {
                                        const isOpening = activeMenuId === null;
                                        setActiveMenuId(isOpening ? (allMenus[0]?.id || 0) : null);
                                        if (isOpening) {
                                            setShowTabDropdown(false);
                                            setShowSectorDropdown(false);
                                        }
                                    }}
                                >
                                    <div className="toggle-left">
                                        <Layers size={18} />
                                        <span>Tab Heading</span>
                                    </div>
                                    <ChevronDown 
                                        size={16} 
                                        className={`chevron-icon ${activeMenuId !== null ? "open" : ""}`} 
                                    />
                                </div>
                                
                                <AnimatePresence>
                                    {activeMenuId !== null && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="sidebar-dropdown-content"
                                        >
                                            <div className="sidebar-search-wrapper">
                                                <Search className="search-icon" size={14} />
                                                <input 
                                                    type="text" 
                                                    placeholder="Search..." 
                                                    className="sidebar-search-input"
                                                    value={sidebarSearch}
                                                    onChange={(e) => setSidebarSearch(e.target.value)}
                                                />
                                            </div>
                                            
                                            {allMenus.filter(m => (m.name || m.menu_name || "").toLowerCase().includes(sidebarSearch.toLowerCase())).map((m) => (
                                                <div
                                                    key={m.id}
                                                    className={`sidebar-menu-item ${activeMenuId === m.id ? "active" : ""}`}
                                                    onClick={() => setActiveMenuId(m.id)}
                                                >
                                                    <Box className="sidebar-menu-icon" size={18} />
                                                    <span className="sidebar-menu-text">{m.name || m.menu_name || "—"}</span>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                         <div className="tab-heading-selection-section">
                        <label className="selection-label">Menu Name</label>
                        <div className="custom-dropdown-container" id="tab-heading-dropdown">
                            <div 
                                className={`custom-dropdown-trigger ${showTabDropdown ? "open" : ""}`}
                                onClick={() => {
                                    const isOpening = !showTabDropdown;
                                    setShowTabDropdown(isOpening);
                                    if (isOpening) {
                                        setActiveMenuId(null);
                                        setShowSectorDropdown(false);
                                    }
                                }}
                            >
                                <div className="trigger-content">
                                    <Layers size={18} className="left-icon" />
                                    <span>{selectedTab || "Select Menu"}</span>
                                </div>
                                <ChevronDown size={18} className={`arrow-icon ${showTabDropdown ? "rotated" : ""}`} />
                            </div>

                            <AnimatePresence>
                                {showTabDropdown && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="custom-dropdown-list"
                                    >
                                        {[
                                            { name: "Sector Title", icon: <Database size={16} /> },
                                            { name: "Category", icon: <Grid size={16} /> },
                                            { name: "Brand", icon: <Tag size={16} /> },
                                            { name: "Product", icon: <Box size={16} /> }
                                        ].map((item) => (
                                            <div 
                                                key={item.name} 
                                                className={`custom-dropdown-item ${selectedTab === item.name ? "selected" : ""}`}
                                                onClick={() => {
                                                    setSelectedTab(item.name);
                                                    setShowTabDropdown(false);
                                                    // Sync main application state
                                                    const foundMenu = allMenus.find(m => 
                                                        (m.name || m.menu_name || "").toLowerCase() === item.name.toLowerCase()
                                                    );
                                                    if (foundMenu) {
                                                        setActiveMenuId(foundMenu.id);
                                                    }
                                                }}
                                            >
                                                <div className="item-content">
                                                    <span className="item-icon">{item.icon}</span>
                                                    <span>{item.name}</span>
                                                </div>
                                                {selectedTab === item.name && <CheckCircle2 size={16} className="check-icon" />}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    </div>
                </div>
                

                {/* RIGHT MAIN CONTENT */}
                <div className="preview-main">
                   <h1 className="page-title"> Preview Tabs</h1>

                    {/* Sector Title Select Dropdown (Only show if 'Sector Title' is selected in sidebar) */}
                    {selectedTab === "Sector Title" && (
                        <div className="sector-title-selection-container" style={{ marginBottom: "30px", maxWidth: "450px" }}>
                            <label style={{ display: "block", marginBottom: "10px", fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                                Sector title dropdown
                            </label>
                            <div className="custom-dropdown-container" id="sector-title-dropdown">
                                <div 
                                    className={`custom-dropdown-trigger ${showSectorDropdown ? "open" : ""}`}
                                    onClick={() => {
                                        const isOpening = !showSectorDropdown;
                                        setShowSectorDropdown(isOpening);
                                        if (isOpening) {
                                            setActiveMenuId(null);
                                            setShowTabDropdown(false);
                                        }
                                    }}
                                >
                                    <div className="trigger-content">
                                        <Database size={18} className="left-icon" />
                                        <span>
                                            {allSectorTitles.find(s => s.id === selectedSectorTitleId)?.title || "Select Sector Title"}
                                        </span>
                                    </div>
                                    <ChevronDown size={18} className={`arrow-icon ${showSectorDropdown ? "rotated" : ""}`} />
                                </div>

                                <AnimatePresence>
                                    {showSectorDropdown && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="custom-dropdown-list"
                                            style={{ maxHeight: "300px", overflowY: "auto" }}
                                        >
                                            {allSectorTitles.length === 0 ? (
                                                <div style={{ padding: "15px", textAlign: "center", color: "#94a3b8" }}>No sector titles found</div>
                                            ) : (
                                                allSectorTitles.map((item) => (
                                                    <div 
                                                        key={item.id} 
                                                        className={`custom-dropdown-item ${selectedSectorTitleId === item.id ? "selected" : ""}`}
                                                        onClick={() => {
                                                            setSelectedSectorTitleId(item.id);
                                                            setShowSectorDropdown(false);
                                                        }}
                                                    >
                                                        <div className="item-content">
                                                            <Database size={16} />
                                                            <span>{item.title}</span>
                                                        </div>
                                                        {selectedSectorTitleId === item.id && <CheckCircle2 size={16} className="check-icon" />}
                                                    </div>
                                                ))
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    {(activeHeading || selectedSectorTitleId) ? (
                        <>
                            {activeHeading && (
                                <>
                                    {/* Input Field below title */}
                                    <div className="description-input-container">
                                        <input 
                                            type="text" 
                                            className="description-input" 
                                            readOnly 
                                            value={activeHeading.description || activeHeading.title || "No description set"}
                                        />
                                    </div>

                                    {/* Heading Tabs */}
                                    <div className="heading-tabs-row">
                                        {filteredHeadings.map((h, idx) => {
                                            const isActive = h.id === activeHeadingId;
                                            return (
                                                <button
                                                    key={h.id}
                                                    className={`heading-pill-tab ${isActive ? "active" : ""}`}
                                                    onClick={() => setActiveHeadingId(h.id)}
                                                >
                                                    {getTabIcon(idx)}
                                                    <span>{h.heading_name || h.master_name || h.title}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* Checkboxes Card Container */}
                            <div className="checkbox-card-container">
                                <div className="checkbox-card-header">
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span className="checkbox-card-title">
                                            {selectedSectorTitleId 
                                                ? (allSectorTitles.find(s => s.id === selectedSectorTitleId)?.title || "Sector Checkboxes")
                                                : (activeHeading?.title || activeHeading?.heading_name || "Configuration")}
                                        </span>
                                        <HelpCircle className="help-icon" size={18} />
                                    </div>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        {mappedCheckboxes.length > 0 && (
                                            <>
                                                <button 
                                                    onClick={handleSelectAll}
                                                    style={{
                                                        padding: "6px 14px",
                                                        borderRadius: "6px",
                                                        background: "#eff6ff",
                                                        color: "#2563eb",
                                                        border: "1px solid #bfdbfe",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s"
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = "#dbeafe"}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = "#eff6ff"}
                                                >
                                                    Select all
                                                </button>
                                                <button 
                                                    onClick={handleRemoveAll}
                                                    style={{
                                                        padding: "6px 14px",
                                                        borderRadius: "6px",
                                                        background: "#fef2f2",
                                                        color: "#ef4444",
                                                        border: "1px solid #fecaca",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s"
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = "#fef2f2"}
                                                >
                                                    Remove all
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="checkbox-pills-container">
                                    {mappedCheckboxes.length > 0 ? (
                                        mappedCheckboxes.map(cb => {
                                            const isSelected = selectedCheckboxes.includes(cb.id);
                                            return (
                                                <div 
                                                    key={cb.id} 
                                                    className={`checkbox-pill ${isSelected ? "active" : ""}`}
                                                    onClick={() => toggleCheckbox(cb.id)}
                                                >
                                                    {cb.label || cb.value || cb.checkbox_name}
                                                    {isSelected && (
                                                        <div className="corner-tick">
                                                            <CheckCircle2 size={16} fill="#16a34a" stroke="#ffffff" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="no-data-text">No checkboxes mapped to this tab</div>
                                    )}
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="bottom-action-container">
                                <button className="btn-save-config" onClick={handleSaveConfig}>
                                    <Save size={18} />
                                    Save Configuration
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state-main">
                            {loading ? "Loading..." : "Please select a menu or add tab headings first"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewTabs;
