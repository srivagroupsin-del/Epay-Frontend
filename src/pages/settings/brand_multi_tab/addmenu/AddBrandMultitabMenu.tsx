import { useState, useEffect } from "react";
import { SquarePen, Trash2, ChevronsLeft, ChevronsRight } from "lucide-react";
import "./addBrandMenu.css";
import { getMenuTitles } from "../../menu_section/menutitle/menuTitle.api";
import type { MenuTitle } from "../../menu_section/menutitle/menuTitle.types";
import {
    createMenu,
    getMenus,
    updateMenu,
    deleteMenu,
    type Menu as MultitabMenu
} from "../../../../api/multitab/brand_menu.api";

const AddBrandMultitabMenu = () => {
    const [menuTitles, setMenuTitles] = useState<MenuTitle[]>([]);
    const [menus, setMenus] = useState<MultitabMenu[]>([]);
    const [menuTitleId, setMenuTitleId] = useState("");
    const [form, setForm] = useState({ id: null as number | null, name: "", status: "active" });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Table state
    const [searchTerm, setSearchTerm] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (menuTitleId) {
            loadMenus(Number(menuTitleId));
        } else {
            fetchAllMenus();
        }
        setCurrentPage(1);
    }, [menuTitleId]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const titlesRes = await getMenuTitles();
            setMenuTitles(titlesRes || []);

            if (titlesRes && titlesRes.length > 0) {
                const firstId = String(titlesRes[0].id);
                setMenuTitleId(firstId);
                // loadMenus will be triggered by useEffect [menuTitleId]
            } else {
                fetchAllMenus();
            }
        } catch (err) {
            console.error("Failed to load initial data", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllMenus = async () => {
        try {
            setLoading(true);
            const data = await getMenus();
            setMenus(data || []);
        } catch (err) {
            console.error("Failed to load all menus", err);
        } finally {
            setLoading(false);
        }
    };

    const loadMenus = async (titleId: number) => {
        try {
            setLoading(true);
            const data = await getMenus();
            const filtered = (data || []).filter((m: any) => m.menu_title_id === titleId);
            setMenus(filtered);
        } catch (err) {
            console.error("Failed to load menus", err);
            setMenus([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!menuTitleId) {
            alert("Please select a Menu Title");
            return;
        }
        try {
            setSaving(true);
            const payload = {
                menu_name: form.name,
                status: form.status,
                sort_order: 1
            };

            if (form.id) {
                await updateMenu(form.id, payload);
                alert("Menu updated successfully ✅");
            } else {
                await createMenu({
                    ...payload,
                    menu_title_id: Number(menuTitleId) as any // Add back if backend expects it
                });
                alert("Menu created successfully ✅");
            }
            setForm({ id: null, name: "", status: "active" });
            loadMenus(Number(menuTitleId));
        } catch (err: any) {
            alert(err.message || "Operation failed ❌");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this menu?")) return;
        try {
            await deleteMenu(id);
            alert("Deleted successfully ✅");
            if (menuTitleId) loadMenus(Number(menuTitleId));
        } catch (err: any) {
            alert(err.message || "Delete failed ❌");
        }
    };

    const filteredMenus = menus.filter(m =>
        m.menu_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalEntries = filteredMenus.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentMenus = filteredMenus.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="container">
            <h2 className="page-title">{form.id ? "Edit Brand Multi Tab Menu" : "Add Brand Multi Tab Menu"}</h2>
            <hr />

            <form onSubmit={handleSubmit}>
                <div className="merged-container">
                    {/* <div className="input-floating-group" style={{ flex: "1 1 300px" }}>
                        <label>Menu Title</label>
                        <select
                            value={menuTitleId}
                            onChange={(e) => setMenuTitleId(e.target.value)}
                            disabled={form.id !== null}
                        >
                            {menuTitles.map(m => (
                                <option key={m.id} value={m.id}>{m.menu_title}</option>
                            ))}
                        </select>
                    </div> */}

                    <div className="input-floating-group" style={{ flex: "1 1 300px" }}>
                        <label>Brand Multi Tab Menu</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-floating-group" style={{ flex: "0 0 200px" }}>
                        <label>Status</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="btn-row">
                    <button type="submit" className="btn save" disabled={saving}>
                        {saving ? "Saving..." : form.id ? "Update" : "Save"}
                    </button>
                    <button type="button" className="btn cancel" onClick={() => {
                        setForm({ id: null, name: "", status: "active" });
                        if (menuTitles.length > 0) setMenuTitleId(String(menuTitles[0].id));
                    }}>Cancel</button>
                </div>
            </form>

            {/* TABLE SECTION */}
            <div className="table-card">
                <div className="table-header">
                    <h3>View Brand Multi Tab Menu List</h3>
                    <button className="btn add" onClick={() => setForm({ id: null, name: "", status: "active" })}>
                        Add New
                    </button>
                </div>

                <hr />

                <div className="table-toolbar">
                    <div className="entries-control">
                        Show
                        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ margin: "0 10px" }}>
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
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            style={{ marginLeft: "10px" }}
                        />
                    </div>
                </div>

                <table className="redesign-table">
                    <thead>
                        <tr>
                            <th># ↕</th>
                            <th>Menu Name ↕</th>
                            <th>Status ↕</th>
                            <th>Action ↕</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>Loading...</td></tr>
                        ) : currentMenus.length === 0 ? (
                            <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>No entries found</td></tr>
                        ) : (
                            currentMenus.map((m, idx) => (
                                <tr key={m.id}>
                                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                                    <td>{m.menu_name}</td>
                                    <td>
                                        <span className={`badge ${m.status === "active" ? "active" : "inactive"}`}>
                                            {m.status === "active" ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="action edit" onClick={() => {
                                                setForm({ id: m.id, name: m.menu_name, status: m.status === "active" ? "active" : "inactive" });
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}><SquarePen size={16} /></button>
                                            <button className="action delete" onClick={() => handleDelete(m.id)}><Trash2 size={16} /></button>
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

export default AddBrandMultitabMenu;
