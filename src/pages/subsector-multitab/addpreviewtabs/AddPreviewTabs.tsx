import { useState, useEffect } from "react";
import { RefreshCcw } from "lucide-react";
import "./addPreviewTabs.css";
import { getMenus, getTabHeadings } from "../models/multitab.api";
import type { MultitabMenu, TabHeading } from "../models/multitab.api";

const AddSubPreviewTabs = () => {
    const [menus, setMenus] = useState<MultitabMenu[]>([]);
    const [headings, setHeadings] = useState<TabHeading[]>([]);

    const [selectedMenu, setSelectedMenu] = useState("");
    const [activeTab, setActiveTab] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [m, h] = await Promise.all([
                getMenus(),
                getTabHeadings()
            ]);
            setMenus(m || []);
            setHeadings(h || []);
        } catch (err) {
            console.error("Failed to load preview data", err);
        }
    };

    const filteredHeadings = headings.filter(h => h.menu_id === Number(selectedMenu));

    useEffect(() => {
        if (filteredHeadings.length > 0) {
            setActiveTab(filteredHeadings[0].id);
        } else {
            setActiveTab(null);
        }
    }, [selectedMenu]);

    const activeHeading = headings.find(h => h.id === activeTab);

    return (
        <div className="add-unit-type-container">
            <div className="add-unit-type-header">
                <h2>Add SubSector Preview Tabs</h2>
            </div>

            <div className="unit-type-card" style={{ background: "#fff", padding: "30px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                    <div className="field-group" style={{ flex: 1, maxWidth: "400px" }}>
                        <label style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px", display: "block" }}>Select SubMenu to Preview</label>
                        <select
                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e0e0e0", outline: "none" }}
                            value={selectedMenu}
                            onChange={(e) => setSelectedMenu(e.target.value)}
                        >
                            <option value="">-- Select SubMenu --</option>
                            {menus.map(menu => (
                                <option key={menu.id} value={menu.id}>{menu.name}</option>
                            ))}
                        </select>
                    </div>

                    <button className="btn-header-add" onClick={loadData} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "#017ffdff", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
                        <RefreshCcw size={16} /> Refresh
                    </button>
                </div>

                {selectedMenu ? (
                    <div className="preview-container">
                        <div className="tab-navigation">
                            {filteredHeadings.map(h => (
                                <button
                                    key={h.id}
                                    className={`tab-btn ${activeTab === h.id ? "active" : ""}`}
                                    onClick={() => setActiveTab(h.id)}
                                >
                                    {h.master_name}
                                </button>
                            ))}
                            {filteredHeadings.length === 0 && (
                                <div style={{ padding: "12px", color: "#999", fontSize: "14px" }}>No headings found for this submenu</div>
                            )}
                        </div>

                        <div className="tab-content-area">
                            {activeHeading ? (
                                <div style={{ textAlign: "center", width: "100%" }}>
                                    <h3 style={{ margin: "0 0 10px 0", color: "#1a237e" }}>{activeHeading.title}</h3>
                                    <p style={{ margin: "0 0 20px 0", color: "#555" }}>{activeHeading.description}</p>
                                    <div style={{ fontSize: "12px", color: "#999" }}>
                                        Master Name: {activeHeading.master_name} | ID: {activeHeading.id}
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: "#999" }}>Select a subtab heading to see content</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "50px", color: "#999", border: "1px dashed #eee", borderRadius: "8px" }}>
                        Please select a submenu to start previewing tabs
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddSubPreviewTabs;
