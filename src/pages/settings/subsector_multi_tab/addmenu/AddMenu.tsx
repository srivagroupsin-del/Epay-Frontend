import { useState, useEffect } from "react";
import { SquarePen, Trash2, ChevronsLeft, ChevronsRight } from "lucide-react";
import "./addSectorTitleMenu.css";
import {
    createMenu as createMenuTab,
    getMenus as getMenuTabs,
    updateMenu as updateMenuTab,
    deleteMenu as deleteMenuTab,
    type Menu as MultitabMenu
} from "../../../../api/multitab/subsector_menu.api";

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
        fetchAllMenus();
    }, []);

    const fetchAllMenus = async () => {
        try {
            setLoading(true);
            const data = await getMenuTabs();
            setMenus(data);
        } catch (err) {
            console.error("Failed to load all menus", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
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
                await updateMenuTab(editingId, {
                    menu_name: form.name,
                    status: form.status as "active" | "inactive",
                    sort_order: 1
                });
                alert("Menu updated successfully ✅");
            } else {
                await createMenuTab({
                    menu_name: form.name,
                    status: form.status as "active" | "inactive"
                });
                alert("Menu saved successfully ✅");
            }

            resetForm();
            fetchAllMenus();
        } catch (error: any) {
            alert(error.message || "Failed to save menu ❌");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (menu: MultitabMenu) => {
        setForm({
            name: menu.menu_name,
            status: menu.status || "active",
        });
        setEditingId(menu.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeleteMenu = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this menu?")) return;
        try {
            await deleteMenuTab(id);
            alert("Deleted successfully ✅");
            fetchAllMenus();
        } catch (err: any) {
            alert(err.message || "Delete failed");
        }
    };

    const filtered = menus.filter(m =>
        m.menu_name.toLowerCase().includes(search.toLowerCase())
    );

    const totalEntries = filtered.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="container">
            <h2 className="page-title">{editingId ? "Edit SubSector Multi Tab Menu" : "Add SubSector Multi Tab Menu"}</h2>
            <hr />

            <form onSubmit={handleSubmit}>
                <div className="merged-container">
                    <div className="input-floating-group" style={{ width: "300px" }}>
                        <label>SubSector Multi Tab Menu</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Type the Menu name"
                        />
                    </div>

                    <div className="input-floating-group" style={{ flex: "0 0 200px" }}>
                        <label>Status</label>
                        <select name="status" value={form.status} onChange={handleChange}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="btn-row">
                    <button type="submit" className="btn save" disabled={saving}>
                        {saving ? "Saving..." : editingId ? "Update" : "Save"}
                    </button>
                    <button type="button" className="btn cancel" onClick={() => resetForm()}>
                        Cancel
                    </button>
                </div>
            </form>

            {/* VIEW SECTION (TABLE) */}
            <div className="table-card">
                <div className="table-header">
                    <h3>View SubSector Multi Tab Title List</h3>
                    <button className="btn add" onClick={() => resetForm()}>
                        Add New
                    </button>
                </div>

                <hr />

                <div className="table-toolbar">
                    <div className="entries-control">
                        Show
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                            style={{ margin: "0 10px" }}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        entries
                    </div>

                    <div className="search-control">
                        Search:
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            style={{ marginLeft: "10px" }}
                        />
                    </div>
                </div>

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
                            <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>Loading...</td></tr>
                        ) : currentData.length === 0 ? (
                            <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>No data found</td></tr>
                        ) : (
                            currentData.map((m, index) => (
                                <tr key={m.id}>
                                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                    <td>{m.menu_name}</td>
                                    <td>
                                        <span className={`badge ${m.status === "active" ? "active" : "inactive"}`}>
                                            {m.status === "active" ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="action edit" onClick={() => handleEdit(m)}><SquarePen size={16} /></button>
                                            <button className="action delete" onClick={() => handleDeleteMenu(m.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="table-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="info-text">
                        Showing {totalEntries > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
                    </div>
                    {totalPages > 0 && (
                        <div className="pagination-premium">
                            <button
                                className="pagination-btn nav-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                                <ChevronsLeft size={18} />
                            </button>
                            {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                if (totalPages <= 7 || page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                    return (
                                        <button
                                            key={page}
                                            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    );
                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                    return <span key={page} style={{ padding: "0 5px" }}>...</span>;
                                }
                                return null;
                            })}
                            <button
                                className="pagination-btn nav-btn"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            >
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddSubMenu;
