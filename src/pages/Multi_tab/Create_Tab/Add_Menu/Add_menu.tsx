import { useState, useEffect } from "react";
import { SquarePen, Trash2, ChevronsLeft, ChevronsRight } from "lucide-react";
import { getMenus, createMenu, updateMenu, deleteMenu, type MultitabMenu } from "../models/multitab.api";
import { getMenuTitles } from "../../../settings/menu_section/menutitle/menuTitle.api";
import { getMenus as getSubMenusList } from "../../../settings/menu_section/menu/menu.api";
import "./Add_menu.css";

const AddSectorMultiTabMenu = () => {
    const [menus, setMenus] = useState<MultitabMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        id: null as number | null,
        menu_title_id: "",
        sub_menu_id: "",
        name: "",
        status: "active"
    });

    // Table state
    const [searchTerm, setSearchTerm] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [menusData] = await Promise.all([
                getMenus(),
                getMenuTitles(),
                getSubMenusList()
            ]);
            setMenus(menusData || []);
        } catch (err) {
            console.error("Failed to load list data", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMenus = async () => {
        try {
            const data = await getMenus();
            setMenus(data);
        } catch (err) {
            console.error("Failed to load menus", err);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            alert("Please enter a menu name");
            return;
        }

        try {
            setSaving(true);
            const payload: any = {
                menu_title_id: Number(form.menu_title_id) || 1, // Default to 1 as per example
                tab_name: form.name,
                status: form.status
            };

            if (form.id) {
                await updateMenu(form.id, payload);
                alert("Menu updated successfully ✅");
            } else {
                await createMenu(payload);
                alert("Menu created successfully ✅");
            }

            setForm({ id: null, menu_title_id: "", sub_menu_id: "", name: "", status: "active" });
            fetchMenus();
        } catch (err: any) {
            alert(err.message || "Failed to save menu ❌");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this menu?")) return;
        try {
            await deleteMenu(id);
            alert("Deleted successfully ✅");
            fetchMenus();
        } catch (err: any) {
            alert(err.message || "Delete failed ❌");
        }
    };

    const filteredMenus = menus.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalEntries = filteredMenus.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentMenus = filteredMenus.slice((currentPage - 1) * pageSize, currentPage * pageSize);


    return (
        <div className="container">
            <h2 className="page-title">{form.id ? "Edit Menu" : "Add Menu"}</h2>
            <hr />

            <form onSubmit={handleSave}>
                <div className="merged-container" style={{ flexWrap: "wrap", marginBottom: "15px" }}>
                    {/* <div className="input-floating-group" style={{ flex: "1 1 300px" }}>
                        <label>Menu Title</label>
                        <select
                            value={form.menu_title_id}
                            onChange={(e) => setForm({ ...form, menu_title_id: e.target.value, sub_menu_id: "" })}
                        >
                            <option value="">Select Menu</option>
                            {menuTitles.map(t => (
                                <option key={t.id} value={t.id}>{t.menu_title}</option>
                            ))}
                        </select>
                    </div> */}

                    {/* <div className="input-floating-group" style={{ flex: "1 1 300px" }}>
                        <label>Sub Menu Title</label>
                        <select
                            value={form.sub_menu_id}
                            onChange={(e) => setForm({ ...form, sub_menu_id: e.target.value })}
                        >
                            <option value="">Select Sub Menu</option>
                            {filteredSubMenus.map(sm => (
                                <option key={sm.id} value={sm.id}>{sm.page_title}</option>
                            ))}
                        </select>
                    </div> */}
                </div>

                <div className="merged-container">
                    <div className="input-floating-group" style={{ flex: "1 1 400px" }}>
                        <label>Menu Title</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Type the Page name"
                            required
                        />
                    </div>

                    <div className="input-floating-group" style={{ flex: "0 0 200px" }}>
                        <label>Status</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
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
                    <button
                        type="button"
                        className="btn cancel"
                        onClick={() => setForm({ id: null, menu_title_id: "", sub_menu_id: "", name: "", status: "active" })}
                    >
                        Cancel
                    </button>
                </div>
            </form>

            {/* TABLE SECTION */}
            <div className="table-card">
                <div className="table-header">
                    <h3>View Sector Multi Tab Title List</h3>
                    <button className="btn add" onClick={() => setForm({ id: null, menu_title_id: "", sub_menu_id: "", name: "", status: "active" })}>
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
                            <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>No data found</td></tr>
                        ) : (
                            currentMenus.map((m, idx) => (
                                <tr key={m.id}>
                                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                                    <td>{m.name}</td>
                                    <td>
                                        <span className={`badge ${m.status === "active" ? "active" : "inactive"}`}>
                                            {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="action edit" onClick={() => {
                                                setForm({
                                                    id: m.id,
                                                    name: m.name,
                                                    status: m.status,
                                                    menu_title_id: String((m as any).menu_title_id || ""),
                                                    sub_menu_id: String((m as any).sub_menu_id || "")
                                                });
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

export default AddSectorMultiTabMenu;
