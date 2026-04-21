import { useState, useEffect } from "react";
import { Check, SquarePen, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import "../../variant/addunittype/addUnitType.css";
import "../../variant/viewcolour/viewColourList.css";
import { getMenus, getTabHeadings, createTabHeading, updateTabHeading, deleteTabHeading } from "../models/multitab.api";
import type { MultitabMenu, TabHeading } from "../models/multitab.api";

const AddSubTabheadingMaster = () => {
    const [menus, setMenus] = useState<MultitabMenu[]>([]);
    const [headings, setHeadings] = useState<TabHeading[]>([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        menu_id: "",
        master_name: "",
        title: "",
        description: "",
        status: "active",
    });
    const [image, setImage] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [m, h] = await Promise.all([
                getMenus(),
                getTabHeadings()
            ]);
            setMenus(m || []);
            setHeadings(h || []);
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const toggleStatus = () => {
        setForm(prev => ({
            ...prev,
            status: prev.status === "active" ? "inactive" : "active"
        }));
    };

    const resetForm = () => {
        setForm({
            menu_id: "",
            master_name: "",
            title: "",
            description: "",
            status: "active",
        });
        setImage(null);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.menu_id) {
            alert("Please select a submenu");
            return;
        }

        if (!form.master_name.trim()) {
            alert("SubTab Heading Master is required");
            return;
        }

        try {
            setSaving(true);
            const data = {
                menu_id: Number(form.menu_id),
                master_name: form.master_name,
                title: form.title,
                description: form.description,
                status: form.status,
                image: image ? image.name : "" // Simplified for mockup context
            };

            if (editingId) {
                await updateTabHeading(editingId, data);
                alert("Updated successfully ✅");
            } else {
                await createTabHeading(data);
                alert("Saved successfully ✅");
            }
            resetForm();
            loadData();
        } catch (error: any) {
            alert(error.message || "Operation failed ❌");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (h: TabHeading) => {
        setForm({
            menu_id: String(h.menu_id),
            master_name: h.master_name,
            title: h.title ?? "",
            description: h.description ?? "",
            status: h.status,
        });
        setEditingId(h.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteTabHeading(id);
            alert("Deleted successfully");
            loadData();
        } catch (err: any) {
            alert(err.message || "Delete failed");
        }
    };

    const filtered = (headings || []).filter(h =>
        (h.master_name && h.master_name.toLowerCase().includes(search.toLowerCase())) ||
        String(h.menu_id).includes(search)
    );

    const totalEntries = filtered.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="add-unit-type-container">
            <div className="add-unit-type-header">
                <h2>{editingId ? "Edit SubTab Heading Master" : "Add SubTab Heading Master"}</h2>
            </div>

            <div className="unit-type-card" style={{ marginBottom: "30px", background: "#fff", padding: "30px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "30px", marginBottom: "25px" }}>
                        <div className="form-group">
                            <label>SubMenu</label>
                            <select
                                name="menu_id"
                                value={form.menu_id}
                                onChange={handleChange}
                            >
                                <option value="">Select SubMenu</option>
                                {menus.map(menu => (
                                    <option key={menu.id} value={menu.id}>{menu.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>SubTab Heading Master</label>
                            <input
                                type="text"
                                name="master_name"
                                placeholder="Enter SubTab Heading"
                                value={form.master_name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Images</label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                style={{ padding: "8px" }}
                            />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "25px" }}>
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                name="title"
                                placeholder="Enter Title"
                                value={form.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <input
                                type="text"
                                name="description"
                                placeholder="Enter Description"
                                value={form.description}
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

            {/* VIEW SECTION */}
            <div className="view-colour-container" style={{ padding: 0 }}>
                <div className="view-colour-header">
                    <h2>View SubTab Heading Master List</h2>
                    <button className="btn-add-new-colour" onClick={() => resetForm()}>
                        Add New SubTab Heading Master
                    </button>
                </div>

                <div className="view-colour-card">
                    <h3>SubTab Heading Master - Master</h3>
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
                                    <th>SubMenu ↕</th>
                                    <th>SubTab Heading ↕</th>
                                    <th>Images ↕</th>
                                    <th>Status ↕</th>
                                    <th>Action ↕</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ textAlign: "center" }}>Loading...</td></tr>
                                ) : currentData.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: "center" }}>No data found</td></tr>
                                ) : (
                                    currentData.map((h, index) => (
                                        <tr key={h.id}>
                                            <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                            <td>{menus.find(m => m.id === h.menu_id)?.name || h.menu_id}</td>
                                            <td>{h.master_name}</td>
                                            <td>
                                                <img
                                                    src={h.image || "https://via.placeholder.com/50"}
                                                    alt="Preview"
                                                    style={{ width: "60px", height: "40px", objectFit: "cover", borderRadius: "4px" }}
                                                />
                                            </td>
                                            <td><span className="status-badge">{h.status}</span></td>
                                            <td>
                                                <div className="action-icons">
                                                    <button className="btn-icon-edit" onClick={() => handleEdit(h)}><SquarePen size={16} /></button>
                                                    <button className="btn-icon-view" onClick={() => handleDelete(h.id)}><Eye size={16} /></button>
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
                            <div className="page-number">{currentPage}</div>
                            <button className="btn-page-nav" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)}><ChevronRight size={18} /></button>
                            <button className="btn-page-nav" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)}><ChevronsRight size={18} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSubTabheadingMaster;
