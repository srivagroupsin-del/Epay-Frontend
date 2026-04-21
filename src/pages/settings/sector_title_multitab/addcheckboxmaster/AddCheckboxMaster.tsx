import { useState, useEffect } from "react";
import {
    Plus,
    SquarePen,
    Trash2,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight
} from "lucide-react";
import "./checkboxMaster.css";

import {
    getCheckboxes,
    createCheckbox as createCheckboxMaster,
    updateCheckbox as updateCheckboxMaster,
    deleteCheckbox as deleteCheckboxMaster
} from "../../../../api/multitab/sector_checkbox.api";

const AddCheckboxMaster = () => {
    const [checkboxes, setCheckboxes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Multi-add state
    const [multiChecks, setMultiChecks] = useState([
        { label: "", checked: true } // Default to checked so user just has to type
    ]);

    // Edit state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({
        label: "",
        status: 1
    });

    // Sub-Table State: Search & Pagination
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    /* ================= LOAD CHECKBOXES ================= */
    useEffect(() => {
        fetchCheckboxes();
    }, []);

    const fetchCheckboxes = async () => {
        try {
            setLoading(true);
            const res = await getCheckboxes();
            setCheckboxes(Array.isArray(res) ? res : []);
        } catch (e) {
            console.error("Fetch failed", e);
            setCheckboxes([]);
        } finally {
            setLoading(false);
        }
    };

    /* ================= ADD ================= */
    const handleSave = async (e: any) => {
        e.preventDefault();

        const validItems = multiChecks.filter(
            i => i.label.trim() !== ""
        );

        if (!validItems.length) {
            alert("Please enter at least one checkbox name");
            return;
        }

        try {
            setLoading(true);
            await Promise.all(
                validItems.map(i =>
                    createCheckboxMaster({
                        label: i.label,
                        value: i.label,
                        status: 1 // Using numeric status for consistency
                    } as any)
                )
            );

            alert("Checkboxes saved successfully ✅");
            setMultiChecks([{ label: "", checked: true }]);
            fetchCheckboxes();
        } catch (error) {
            console.error("Save failed", error);
            alert("Save failed ❌");
        } finally {
            setLoading(false);
        }
    };

    /* ================= UPDATE ================= */
    const handleUpdate = async (e: any) => {
        e.preventDefault();

        if (!editForm.label.trim()) {
            alert("Checkbox name is required");
            return;
        }

        try {
            setLoading(true);
            await updateCheckboxMaster(editingId!, {
                label: editForm.label,
                value: editForm.label,
                status: editForm.status
            });

            alert("Updated successfully ✅");
            setEditingId(null);
            fetchCheckboxes();
        } catch (error) {
            console.error("Update failed", error);
            alert("Update failed ❌");
        } finally {
            setLoading(false);
        }
    };

    /* ================= DELETE ================= */
    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this checkbox?")) return;

        try {
            await deleteCheckboxMaster(id);
            alert("Deleted successfully ✅");
            fetchCheckboxes();
        } catch (error) {
            alert("Delete failed ❌");
        }
    };

    const handleAddMore = () => {
        setMultiChecks([...multiChecks, { label: "", checked: true }]);
    };

    // Helper for Status
    const isStatusActive = (status: any) => {
        return status === 1 || status === "1" || status === "active" || status === true;
    };

    /* ================= FILTER & PAGINATION ================= */
    const filteredList = checkboxes.filter((item: any) =>
        (item.label || "").toLowerCase().includes(search.toLowerCase())
    );

    const lastIdx = currentPage * pageSize;
    const firstIdx = lastIdx - pageSize;
    const currentItems = filteredList.slice(firstIdx, lastIdx);
    const totalPages = Math.ceil(filteredList.length / pageSize);

    return (
        <div className="checkbox-master-container" style={{ padding: "20px" }}>
            {/* ===== HEADER ===== */}
            {/* <div className="checkbox-master-header">
                <h1>Checkbox Master</h1>
            </div> */}

            {/* ===== FORM ===== */}
            <div className="form-card" style={{ marginBottom: "30px" }}>
                <div className="form-header-title">
                    {editingId ? "Edit Checkbox Master Item" : "Add Checkbox Master Items"}
                </div>
                <hr className="dashed-divider" />

                {!editingId ? (
                    <form onSubmit={handleSave} style={{ padding: "20px" }}>
                        {multiChecks.map((m, i) => (
                            <div key={i} className="form-grid" style={{ marginBottom: '15px', alignItems: 'flex-end' }}>
                                <div className="input-field-group">
                                    <label>Checkbox Name</label>
                                    <input
                                        value={m.label}
                                        placeholder="Enter item name..."
                                        onChange={(e) => {
                                            const c = [...multiChecks];
                                            c[i].label = e.target.value;
                                            setMultiChecks(c);
                                        }}
                                        style={{ width: "100%" }}
                                    />
                                </div>

                                {i === multiChecks.length - 1 && (
                                    <button type="button" className="btn-premium btn-save" onClick={handleAddMore} style={{ height: "52px", width: "auto", padding: "0 20px" }}>
                                        <Plus size={16} style={{ marginRight: "5px" }} /> Add More
                                    </button>
                                )}
                            </div>
                        ))}

                        <div className="action-row-container">
                            <div className="btn-group-right">
                                <button type="submit" disabled={loading} className="btn-premium btn-save">
                                    {loading ? "Saving..." : "Save Master List"}
                                </button>
                                <button type="button" className="btn-premium btn-reset" onClick={() => setMultiChecks([{ label: "", checked: true }])}>
                                    Reset
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleUpdate} style={{ padding: "20px" }}>
                        <div className="form-grid">
                            <div className="input-field-group">
                                <label>Checkbox Name</label>
                                <input
                                    value={editForm.label}
                                    onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                                />
                            </div>
                            <div className="input-field-group">
                                <label>Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={e => setEditForm({ ...editForm, status: Number(e.target.value) })}
                                >
                                    <option value={1}>Active</option>
                                    <option value={0}>Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="action-row-container" style={{ marginTop: "20px" }}>
                            <div className="btn-group-right">
                                <button type="submit" className="btn-premium btn-save">Update</button>
                                <button type="button" className="btn-premium btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* ===== TABLE ===== */}
            <div className="table-card">
                <div className="table-title">
                    Checkbox Master - Master
                </div>
                <hr className="dashed-divider" />

                {/* CONTROLS: Show entries & Search */}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "20px", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#64748b", fontSize: "14px" }}>
                        Show
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                            style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", outline: "none" }}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        entries
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <label style={{ color: "#64748b", fontSize: "14px" }}>Search:</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px" }}
                        />
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th># ↕</th>
                                <th>Check Box ↕</th>
                                <th>Status ↕</th>
                                <th>Action ↕</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && checkboxes.length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: "center", padding: "30px" }}>Loading...</td></tr>
                            ) : currentItems.length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>No data found</td></tr>
                            ) : (
                                currentItems.map((c, i) => {
                                    const active = isStatusActive(c.status);
                                    return (
                                        <tr key={c.id}>
                                            <td>{firstIdx + i + 1}</td>
                                            <td>{c.label}</td>
                                            <td>
                                                <span className={`status-badge ${active ? 'active' : 'inactive'}`}>
                                                    {active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button className="btn-icon btn-edit" title="Edit" onClick={() => {
                                                        setEditingId(c.id);
                                                        setEditForm({
                                                            label: c.label,
                                                            status: active ? 1 : 0
                                                        });
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}>
                                                        <SquarePen size={18} />
                                                    </button>
                                                    <button className="btn-icon btn-delete" title="Delete" onClick={() => handleDelete(c.id)}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION FOOTER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderTop: "1px solid #f1f5f9" }}>
                    <div style={{ color: "#64748b", fontSize: "14px" }}>
                        Showing {filteredList.length > 0 ? firstIdx + 1 : 0} to {Math.min(lastIdx, filteredList.length)} of {filteredList.length} entries
                    </div>
                    {totalPages > 0 && (
                        <div style={{ display: "flex", gap: "5px" }}>
                            <button className="btn-icon" style={{ background: "#f1f5f9", color: "#4b5563" }} disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft size={16} /></button>
                            <button className="btn-icon" style={{ background: "#f1f5f9", color: "#4b5563" }} disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}><ChevronLeft size={16} /></button>
                            <div style={{ padding: "5px 10px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>Page {currentPage} of {totalPages}</div>
                            <button className="btn-icon" style={{ background: "#f1f5f9", color: "#4b5563" }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}><ChevronRight size={16} /></button>
                            <button className="btn-icon" style={{ background: "#f1f5f9", color: "#4b5563" }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}><ChevronsRight size={16} /></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddCheckboxMaster;
