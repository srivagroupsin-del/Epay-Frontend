import { useState, useEffect } from "react";
import { Search, SquarePen, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import "./addMappingCheckbox.css";
import { getMenus, getTabHeadings, getCheckboxes, saveMapping, getMappings, deleteMapping } from "../models/multitab.api";
import { getSubSubSectors } from "../../subsector/models/subSectors.api";
import type { SubSectorRow } from "../../subsector/models/subSectors.api";
import type { MultitabMenu, TabHeading, CheckboxMaster } from "../models/multitab.api";

const AddSubMappingCheckbox = () => {
    const [subsectors, setSubsectors] = useState<SubSectorRow[]>([]);
    const [menus, setMenus] = useState<MultitabMenu[]>([]);
    const [headings, setHeadings] = useState<TabHeading[]>([]);
    const [checkboxes, setCheckboxes] = useState<CheckboxMaster[]>([]);
    const [mappings, setMappings] = useState<any[]>([]);

    const [form, setForm] = useState({
        sector_id: "",
        menu_id: "",
        tabheading_id: "",
        checkbox_ids: [] as number[],
        status: "active",
    });

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [s, m, h, c, maps] = await Promise.all([
                getSubSubSectors(),
                getMenus(),
                getTabHeadings(),
                getCheckboxes(),
                getMappings()
            ]);
            setSubsectors(s || []);
            setMenus(m || []);
            setHeadings(h || []);
            setCheckboxes(c || []);
            setMappings(maps || []);
        } catch (err) {
            console.error("Failed to load mapping data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => {
            const next = { ...prev, [name]: value };
            if (name === "menu_id") {
                next.tabheading_id = "";
            }
            return next;
        });
    };

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
        setForm(prev => ({ ...prev, checkbox_ids: selectedOptions }));
    };

    const handleAddAll = () => {
        const allIds = checkboxes.map(cb => cb.id);
        setForm(prev => ({ ...prev, checkbox_ids: allIds }));
    };

    const resetForm = () => {
        setForm(prev => ({
            ...prev,
            menu_id: "",
            tabheading_id: "",
            checkbox_ids: [],
            status: "active",
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.sector_id || !form.menu_id || !form.tabheading_id || form.checkbox_ids.length === 0) {
            alert("Please fill all required fields and select at least one subcheckbox");
            return;
        }

        try {
            setSaving(true);
            await saveMapping(form);
            alert("Mapping saved successfully ✅");
            resetForm();
            const maps = await getMappings();
            setMappings(maps || []);
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
            const maps = await getMappings();
            setMappings(maps || []);
        } catch (error: any) {
            alert(error.message || "Delete failed ❌");
        }
    };

    const getSubsectorName = (id: any) => subsectors.find(s => String(s.id) === String(id))?.sub_sector_name || id;
    const getMenuName = (id: any) => menus.find(m => String(m.id) === String(id))?.name || id;
    const getTabName = (id: any) => headings.find(h => String(h.id) === String(id))?.master_name || id;
    const getCheckboxNames = (ids: number[]) => {
        if (!ids || !Array.isArray(ids)) return "";
        return ids.map(id => checkboxes.find(c => c.id === id)?.checkbox_name).filter(Boolean).join(", ");
    };

    const filteredHeadings = (headings || []).filter(h =>
        form.menu_id && String(h.menu_id) === String(form.menu_id)
    );

    const filteredMappings = (mappings || []).filter(m => {
        const sector = String(getSubsectorName(m.sector_id) || "").toLowerCase();
        const menu = String(getMenuName(m.menu_id) || "").toLowerCase();
        const tab = String(getTabName(m.tabheading_id) || "").toLowerCase();
        const search = (searchTerm || "").toLowerCase();
        return sector.includes(search) || menu.includes(search) || tab.includes(search);
    });

    const totalEntries = filteredMappings.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentMappings = filteredMappings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="add-unit-type-container">
            <div className="add-unit-type-header">
                <h2>Add SubSector Mapping</h2>
            </div>

            <div className="mapping-card">
                <form onSubmit={handleSubmit}>
                    <div className="dropdown-row">
                        <div className="field-group">
                            <label>SubSector</label>
                            <select name="sector_id" value={form.sector_id} onChange={handleChange}>
                                <option value="">select</option>
                                {subsectors.map(s => (
                                    <option key={s.id} value={s.id}>{s.sub_sector_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="field-group">
                            <label>SubMenu</label>
                            <select name="menu_id" value={form.menu_id} onChange={handleChange} disabled={!form.sector_id}>
                                <option value="">select</option>
                                {menus.map(menu => (
                                    <option key={menu.id} value={menu.id}>{menu.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="field-group">
                            <label>SubTab Heading</label>
                            <select name="tabheading_id" value={form.tabheading_id} onChange={handleChange} disabled={!form.menu_id}>
                                <option value="">select</option>
                                {filteredHeadings.map(h => (
                                    <option key={h.id} value={h.id}>{h.master_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="selection-box-container">
                        <div className="selection-box-header">Select subcheckbox list</div>
                        <div className="selection-flex">
                            <select
                                multiple
                                className="multi-select-box"
                                value={form.checkbox_ids.map(String)}
                                onChange={handleMultiSelectChange}
                            >
                                <option value="" disabled>-- select --</option>
                                {checkboxes.map(cb => (
                                    <option key={cb.id} value={cb.id}>{cb.checkbox_name}</option>
                                ))}
                            </select>
                            <div className="add-all-link" onClick={handleAddAll}>Add all</div>
                        </div>
                        <div className="selection-tip">
                            Tip: if the select has `multiple` you can Ctrl/Cmd+click to select multiple items, otherwise it's single-select.
                        </div>

                        <div className="preview-section">
                            <div className="preview-heading">Preview (generated subcheckboxes — these will be submitted)</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                                {checkboxes
                                    .filter(cb => (form.checkbox_ids || []).includes(cb.id))
                                    .map(cb => (
                                        <div key={cb.id} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "14px" }}>
                                            <input type="checkbox" checked readOnly style={{ width: "16px", height: "16px" }} />
                                            <span>{cb.checkbox_name}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    <div className="mapping-actions">
                        <button type="submit" className="btn-mapping-save" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                        <button type="button" className="btn-mapping-reset" onClick={resetForm}>Reset</button>
                        <button type="button" className="btn-mapping-cancel">Cancel</button>
                    </div>
                </form>
            </div>

            <div className="view-mapping-header">
                <h2>View SubSector Mapping List</h2>
            </div>

            <div className="table-container-card">
                <div className="table-top-bar">
                    <div className="show-entries">
                        Show
                        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        entries
                    </div>
                    <div className="search-bar">
                        Search:
                        <div style={{ position: "relative" }}>
                            <Search size={14} style={{ position: "absolute", left: "10px", top: "52%", transform: "translateY(-50%)", color: "#888" }} />
                            <input
                                type="text"
                                placeholder=""
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{ paddingLeft: "30px" }}
                            />
                        </div>
                    </div>
                </div>

                <table className="mapping-data-table">
                    <thead>
                        <tr>
                            <th># ↕</th>
                            <th>SubSector ↕</th>
                            <th>SubMenu ↕</th>
                            <th>SubTab Heading ↕</th>
                            <th>SubCheckBox List ↕</th>
                            <th>Status ↕</th>
                            <th>Action ↕</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: "center" }}>Loading...</td></tr>
                        ) : currentMappings.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: "center" }}>No entries found</td></tr>
                        ) : (
                            currentMappings.map((m, idx) => (
                                <tr key={m.id}>
                                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                                    <td>{getSubsectorName(m.sector_id)}</td>
                                    <td>{getMenuName(m.menu_id)}</td>
                                    <td>{getTabName(m.tabheading_id)}</td>
                                    <td>{getCheckboxNames(m.checkbox_ids)}</td>
                                    <td><span className="status-badge">{m.status || "Active"}</span></td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-action-edit" onClick={() => {
                                                setForm({
                                                    sector_id: String(m.sector_id),
                                                    menu_id: String(m.menu_id),
                                                    tabheading_id: String(m.tabheading_id),
                                                    checkbox_ids: m.checkbox_ids || [],
                                                    status: m.status || "active"
                                                });
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}><SquarePen size={14} /></button>
                                            <button className="btn-action-delete" onClick={() => handleDelete(m.id)}><Eye size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="table-footer-pagination">
                    <div className="pagination-info">
                        Showing {totalEntries > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
                    </div>
                    <div className="pagination-btns">
                        <button className="btn-nav" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={16} /></button>
                        <button className="btn-nav" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft size={16} /></button>
                        <div className="page-num">{currentPage}</div>
                        <button className="btn-nav" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}><ChevronRight size={16} /></button>
                        <button className="btn-nav" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}><ChevronsRight size={16} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSubMappingCheckbox;
