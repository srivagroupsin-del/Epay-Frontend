import { useState, useEffect } from "react";
import { SquarePen, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
    createMultitabTitle,
    getMultitabTitles,
    updateMultitabTitle,
    deleteMultitabTitle,
    type MultitabTitle
} from "../../../../api/multitab/title.api";

const AddSubsectorTitle = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState(true);

    const [list, setList] = useState<MultitabTitle[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Table state
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchTitles();
    }, []);

    const fetchTitles = async () => {
        try {
            setLoading(true);
            const data = await getMultitabTitles();
            setList(data || []);
        } catch (err) {
            console.error("Failed to fetch multitab titles", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            alert("Title is required");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                title: title,
                description: description,
                status: status ? 1 : 0
            };

            if (editingId) {
                await updateMultitabTitle(editingId, payload);
                alert("Subsector Title updated successfully ✅");
            } else {
                await createMultitabTitle(payload);
                alert("Subsector Title saved successfully ✅");
            }

            handleReset();
            fetchTitles();
        } catch (error: any) {
            console.error("SAVE ERROR:", error);
            alert(error.message || "Failed to save subsector title ❌");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setTitle("");
        setDescription("");
        setStatus(true);
        setEditingId(null);
    };

    const handleEdit = (item: MultitabTitle) => {
        setTitle(item.menu_title);
        setDescription(item.description || "");
        setStatus(item.status === "active" || item.status === undefined ? true : false);
        setEditingId(item.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this title?")) {
            try {
                await deleteMultitabTitle(id);
                alert("Deleted successfully ✅");
                fetchTitles();
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    // Filter Logic
    const filteredItems = list.filter(item =>
        item.menu_title?.toLowerCase().includes(search.toLowerCase())
    );

    const totalEntries = filteredItems.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentData = filteredItems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="page-container">
            <form className="form-card" onSubmit={handleSave}>
                <div className="form-header">
                    <h2>{editingId ? "Edit Subsector Title" : "Add Subsector Title"}</h2>
                    <p className="subtitle">
                        Create a separate list of subsector titles for settings page use
                    </p>
                </div>
                <hr style={{ margin: "20px 0", opacity: 0.1 }} />

                <div className="form-grid">
                    <div className="inline-form-field">
                        <label>Subsector Title</label>
                        <input
                            placeholder="Enter Subsector Title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="inline-form-field">
                        <label>Description</label>
                        <input
                            placeholder="Enter description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "20px" }}>
                    <div className="inline-form-field" style={{ width: "200px" }}>
                        <label>Status</label>
                        <select
                            value={status ? "active" : "inactive"}
                            onChange={(e) => setStatus(e.target.value === "active")}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn ghost" onClick={handleReset}>Reset</button>
                    <button type="submit" className="btn primary" disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </form>

            {/* TABLE SECTION */}
            <div className="form-card" style={{ marginTop: "30px", maxWidth: "100%" }}>
                <div className="form-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2>View Subsector Title List</h2>
                    </div>
                    <button className="btn primary" onClick={handleReset}>Add New</button>
                </div>
                <hr style={{ margin: "20px 0", opacity: 0.1 }} />

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div>
                        Show
                        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ margin: "0 10px", padding: "5px", borderRadius: "5px" }}>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        entries
                    </div>
                    <div>
                        Search:
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            style={{ marginLeft: "10px", padding: "8px", borderRadius: "5px", border: "1px solid #ddd" }}
                        />
                    </div>
                </div>

                <table className="redesign-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ textAlign: "left", background: "#f8fafc" }}>
                            <th style={{ padding: "12px", borderBottom: "1px solid #eee" }}># ↕</th>
                            <th style={{ padding: "12px", borderBottom: "1px solid #eee" }}>Title Name ↕</th>
                            <th style={{ padding: "12px", borderBottom: "1px solid #eee" }}>Status ↕</th>
                            <th style={{ padding: "12px", borderBottom: "1px solid #eee" }}>Action ↕</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>Loading...</td></tr>
                        ) : currentData.length === 0 ? (
                            <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>No data found</td></tr>
                        ) : (
                            currentData.map((item, idx) => (
                                <tr key={item.id}>
                                    <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{(currentPage - 1) * pageSize + idx + 1}</td>
                                    <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{item.menu_title}</td>
                                    <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            background: (item.status === "active" || item.status === undefined) ? "#dcfce7" : "#fee2e2",
                                            color: (item.status === "active" || item.status === undefined) ? "#166534" : "#991b1b"
                                        }}>
                                            {(item.status === "active" || item.status === undefined) ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button onClick={() => handleEdit(item)} style={{ border: "none", background: "#1e293b", color: "#fff", padding: "6px", borderRadius: "4px", cursor: "pointer" }}>
                                                <SquarePen size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} style={{ border: "none", background: "#ef4444", color: "#fff", padding: "6px", borderRadius: "4px", cursor: "pointer" }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* PAGINATION */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", alignItems: "center" }}>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>
                        Showing {totalEntries > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
                    </div>
                    <div style={{ display: "flex", gap: "5px" }}>
                        <button className="btn-page-nav" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={16} /></button>
                        <button className="btn-page-nav" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft size={16} /></button>
                        <div style={{ background: "#1e293b", color: "#fff", padding: "6px 12px", borderRadius: "4px" }}>{currentPage}</div>
                        <button className="btn-page-nav" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}><ChevronRight size={16} /></button>
                        <button className="btn-page-nav" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}><ChevronsRight size={16} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSubsectorTitle;
