import { useState, useEffect } from "react";
import { Check, SquarePen, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import "../../variant/addunittype/addUnitType.css"; // Reuse existing clean styles
import "../../variant/viewcolour/viewColourList.css"; // Reuse table styles
import { createMenu, getMenus, updateMenu, deleteMenu } from "../models/multitab.api";
import type { MultitabMenu } from "../models/multitab.api";

const AddSubMenu = () => {
    const [menus, setMenus] = useState<MultitabMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: "",
        status: "active",
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        try {
            setLoading(true);
            const data = await getMenus();
            setMenus(data);
        } catch (err) {
            console.error("Failed to load submenus", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleStatus = () => {
        setForm(prev => ({
            ...prev,
            status: prev.status === "active" ? "inactive" : "active"
        }));
    };

    const resetForm = () => {
        setForm({
            name: "",
            status: "active",
        });
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim()) {
            alert("Menu name is required");
            return;
        }

        try {
            setSaving(true);
            if (editingId) {
                await updateMenu(editingId, form);
                alert("SubSector Multi Tab Menu updated successfully ✅");
            } else {
                await createMenu(form);
                alert("SubSector Multi Tab Menu saved successfully ✅");
            }
            resetForm();
            fetchMenus();
        } catch (error: any) {
            alert(error.message || "Failed to save menu ❌");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (menu: MultitabMenu) => {
        setForm({
            name: menu.name,
            status: menu.status,
        });
        setEditingId(menu.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this menu?")) return;
        try {
            await deleteMenu(id);
            alert("Deleted successfully");
            fetchMenus();
        } catch (err: any) {
            alert(err.message || "Delete failed");
        }
    };

    const filtered = menus.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    const totalEntries = filtered.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="add-unit-type-container">
            <div className="add-unit-type-header">
                <h2>{editingId ? "Edit SubSector Multi Tab Menu" : "Add SubSector Multi Tab Menu"}</h2>
            </div>

            <div className="unit-type-card" style={{ marginBottom: "30px" }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group" style={{ gridColumn: "span 2" }}>
                            <label>SubSector Multi Tab Menu</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter Multi Tab Menu"
                                value={form.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="status-row-fixed">
                        <span className="status-label-fixed">Status</span>
                        <div
                            className={`blue-square-checkbox ${form.status === "inactive" ? "inactive" : ""}`}
                            onClick={toggleStatus}
                        >
                            {form.status === "active" && <Check size={24} />}
                        </div>
                    </div>

                    <div className="form-actions-centered">
                        <button type="submit" className="btn-save-unit" disabled={saving}>
                            {saving ? "Saving..." : editingId ? "Update" : "Save"}
                        </button>
                        <button type="button" className="btn-reset-unit" onClick={resetForm}>
                            Reset
                        </button>
                        <button type="button" className="btn-cancel-unit" onClick={resetForm}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            {/* VIEW SECTION (TABLE) */}
            <div className="view-colour-container" style={{ padding: 0 }}>
                <div className="view-colour-header">
                    <h2>View SubSector Multi Tab Title List</h2>
                    <button className="btn-add-new-colour" style={{ background: "#1a237e", color: "white" }} onClick={resetForm}>
                        Add New SubSector Multi Tab Name
                    </button>
                </div>

                <div className="view-colour-card">
                    <h3>SubSector Multi Tab Menu - Master</h3>
                    <div className="table-controls-top">
                        <div className="entries-control">
                            Show
                            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            entries
                        </div>
                        <div className="search-control">
                            Search:
                            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="redesign-table">
                            <thead>
                                <tr>
                                    <th># ↕</th>
                                    <th>SubSector Multi Tab Title ↕</th>
                                    <th>Status ↕</th>
                                    <th>Action ↕</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} style={{ textAlign: "center" }}>Loading...</td></tr>
                                ) : currentData.length === 0 ? (
                                    <tr><td colSpan={4} style={{ textAlign: "center" }}>No data found</td></tr>
                                ) : (
                                    currentData.map((m, index) => (
                                        <tr key={m.id}>
                                            <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                            <td>{m.name}</td>
                                            <td><span className="status-badge">{m.status === "active" ? "Active" : "Inactive"}</span></td>
                                            <td>
                                                <div className="action-icons">
                                                    <button className="btn-icon-edit" style={{ background: "#1a237e", color: "white" }} onClick={() => handleEdit(m)}><SquarePen size={16} /></button>
                                                    <button className="btn-icon-delete" style={{ background: "#ff4d4f", color: "white", border: "none", padding: "4px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => handleDelete(m.id)}><Eye size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-footer">
                        <div className="info-text">Showing {Math.min((currentPage - 1) * pageSize + 1, totalEntries)} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries</div>
                        <div className="pagination-controls">
                            <button className="btn-page-nav" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft size={18} /></button>
                            <button className="btn-page-nav" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}><ChevronLeft size={18} /></button>
                            <div className="page-number" style={{ background: "#1a237e" }}>{currentPage}</div>
                            <button className="btn-page-nav" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)}><ChevronRight size={18} /></button>
                            <button className="btn-page-nav" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)}><ChevronsRight size={18} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSubMenu;
