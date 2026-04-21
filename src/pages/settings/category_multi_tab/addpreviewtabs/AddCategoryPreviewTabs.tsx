import { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import "../../../variant/addunittype/addUnitType.css";
import "../../sector_multi_tab/addpreviewtabs/addPreviewTabs.css";
import { getCategoryMenus, getCategoryTabHeadings, getCategoryCheckboxes, getCategoryMappings } from "../models/category_multitab.api";
import type { CategoryMultitabMenu, CategoryTabHeading, CategoryCheckboxMaster, CategoryMultitabMapping } from "../models/category_multitab.api";

const AddCategoryPreviewTabs = () => {
    const [menus, setMenus] = useState<CategoryMultitabMenu[]>([]);
    const [headings, setHeadings] = useState<CategoryTabHeading[]>([]);
    const [checkboxes, setCheckboxes] = useState<CategoryCheckboxMaster[]>([]);
    const [mappings, setMappings] = useState<CategoryMultitabMapping[]>([]);

    const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
    const [activeHeadingId, setActiveHeadingId] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [m, h, c, maps] = await Promise.all([
                getCategoryMenus(),
                getCategoryTabHeadings(),
                getCategoryCheckboxes(),
                getCategoryMappings()
            ]);
            setMenus(m || []);
            setHeadings(h || []);
            setCheckboxes(c || []);
            setMappings(maps || []);

            if (m && m.length > 0) {
                setSelectedMenuId(m[0].id);
            }
        } catch (err) {
            console.error("Failed to load preview data", err);
        } finally {
            setLoading(false);
        }
    };

    const selectedMenu = menus.find(m => m.id === selectedMenuId);
    const filteredHeadings = headings.filter(h => h.menu_id === selectedMenuId);

    useEffect(() => {
        if (filteredHeadings.length > 0) {
            setActiveHeadingId(filteredHeadings[0].id);
        } else {
            setActiveHeadingId(null);
        }
    }, [selectedMenuId, headings]);

    const activeHeading = headings.find(h => h.id === activeHeadingId);

    const currentMapping = mappings.find(m =>
        String(m.menu_id) === String(selectedMenuId) &&
        String(m.tabheading_id) === String(activeHeadingId)
    );

    let mappedCheckboxIds: number[] = [];
    if (currentMapping) {
        try {
            mappedCheckboxIds = typeof currentMapping.checkbox_ids === 'string'
                ? JSON.parse(currentMapping.checkbox_ids)
                : currentMapping.checkbox_ids;
        } catch (e) {
            mappedCheckboxIds = [];
        }
    }

    const mappedCheckboxes = checkboxes.filter(cb => (mappedCheckboxIds || []).includes(cb.id));

    return (
        <div className="add-unit-type-container">
            <div className="add-unit-type-header">
                <h2>Add Category Preview Tabs</h2>
            </div>

            <div className="preview-tabs-container">
                <div className="preview-sidebar">
                    <div className="sidebar-header">Category Selection</div>
                    {menus.map(menu => (
                        <div
                            key={menu.id}
                            className={`sidebar-item ${selectedMenuId === menu.id ? "active" : ""}`}
                            onClick={() => setSelectedMenuId(menu.id)}
                        >
                            {menu.name}
                        </div>
                    ))}
                </div>

                <div className="preview-content">
                    {selectedMenuId ? (
                        <>
                            <div className="menu-banner">
                                {selectedMenu?.name}
                            </div>

                            <div className="heading-tabs">
                                {filteredHeadings.map(h => (
                                    <div
                                        key={h.id}
                                        className={`heading-tab ${activeHeadingId === h.id ? "active" : ""}`}
                                        onClick={() => setActiveHeadingId(h.id)}
                                    >
                                        {h.image ? (
                                            <img src={h.image} alt={h.master_name} className="heading-icon" />
                                        ) : (
                                            <div className="heading-icon" style={{ background: "#eee" }}></div>
                                        )}
                                        {h.master_name}
                                    </div>
                                ))}
                            </div>

                            {activeHeadingId && (
                                <div className="checkboxes-preview-box">
                                    <div className="checkboxes-title">
                                        <span>{activeHeading?.master_name}</span>
                                        <HelpCircle size={18} color="#999" />
                                    </div>
                                    <div className="checkboxes-grid">
                                        {mappedCheckboxes.map(cb => (
                                            <div key={cb.id} className="preview-checkbox-item">
                                                <input type="checkbox" readOnly checked={true} />
                                                <span>{cb.checkbox_name}</span>
                                            </div>
                                        ))}
                                        {mappedCheckboxes.length === 0 && <div style={{ color: "#999" }}>No mapped items</div>}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">{loading ? "Loading preview..." : "Please select a category from the sidebar"}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddCategoryPreviewTabs;
