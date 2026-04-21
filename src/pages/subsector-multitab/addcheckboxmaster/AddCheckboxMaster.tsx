import { useState, useEffect } from "react";
import { Check, Plus, SquarePen, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import "../../variant/addunittype/addUnitType.css";
import "../../variant/viewcolour/viewColourList.css";
import { getCheckboxes, createCheckbox, updateCheckbox, deleteCheckbox } from "../models/multitab.api";
import type { CheckboxMaster } from "../models/multitab.api";

const AddSubCheckboxMaster = () => {
    const [checkboxes, setCheckboxes] = useState<CheckboxMaster[]>([]);
    const [loading, setLoading] = useState(true);

    const [multiChecks, setMultiChecks] = useState<string[]>([""]);
    const [saving, setSaving] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: "", status: "active" });

    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getCheckboxes();
            setCheckboxes(data || []);
        } catch (err) {
            console.error("Failed to load checkboxes", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddInput = () => {
        setMultiChecks([...multiChecks, ""]);
    };

    const handleInputChange = (index: number, value: string) => {
        const updated = [...multiChecks];
        updated[index] = value;
        setMultiChecks(updated);
    };

    const handleRemoveInput = (index: number) => {
        setMultiChecks(multiChecks.filter((_, i) => i !== index));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const validChecks = multiChecks.filter(c => c.trim() !== "");
        if (validChecks.length === 0) {
            alert("Please enter at least one subcheckbox name");
            return;
        }

        try {
            setSaving(true);
            await Promise.all(validChecks.map(name => createCheckbox({ checkbox_name: name, status: "active" })));
            alert("Saved successfully ✅");
            setMultiChecks([""]);
            loadData();
        } catch (err: any) {
            alert(err.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm.name.trim() || !editingId) return;

        try {
            setSaving(true);
            await updateCheckbox(editingId, { checkbox_name: editForm.name, status: editForm.status });
            alert("Updated successfully ✅");
            setEditingId(null);
            loadData();
        } catch (err: any) {
            alert(err.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const handleEditClick = (cb: CheckboxMaster) => {
        setEditingId(cb.id);
        setEditForm({ name: cb.checkbox_name, status: cb.status });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteCheckbox(id);
            alert("Deleted successfully");
            loadData();
        } catch (err: any) {
            alert(err.message || "Delete failed");
        }
    };

    const filtered = checkboxes.filter(cb =>
        cb.checkbox_name.toLowerCase().includes(search.toLowerCase())
    );

    const totalEntries = filtered.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="add-unit-type-container">
            <div className="add-unit-type-header">
                <h2>{editingId ? "Edit SubCheckbox Master" : "Add SubCheckbox Master"}</h2>
            </div>

            <div className="unit-type-card" style={{ marginBottom: "30px", background: "#fff", padding: "30px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
                {!editingId ? (
                    <form onSubmit={handleSave}>
                        <div className="form-group" style={{ marginBottom: "15px" }}>
                            <label>Multi SubCheckbox</label>
                            {multiChecks.map((val, idx) => (
                                <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                                    <input
                                        type="text"
                                        placeholder="Enter subcheckbox name"
                                        value={val}
                                        onChange={(e) => handleInputChange(idx, e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    {multiChecks.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveInput(idx)} style={{ background: "#ff4d4f", color: "white", border: "none", borderRadius: "4px", padding: "0 10px" }}>✕</button>
                                    )}
                                </div>
                            ))}
                            <button type="button" className="btn-add-new-colour" onClick={handleAddInput} style={{ marginTop: "5px", padding: "8px 15px", fontSize: "12px", background: "#1a237e" }}>
                                <Plus size={14} /> Add subcheckbox
                            </button>
                        </div>

                        <div className="form-actions-centered" style={{ marginTop: "20px" }}>
                            <button type="submit" className="btn-save-unit" disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </button>
                            <button type="button" className="btn-reset-unit" onClick={() => setMultiChecks([""])}>
                                Reset
                            </button>
                            <button type="button" className="btn-cancel-unit">
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleUpdate}>
                        <div className="form-row">
                            <div className="form-group" style={{ gridColumn: "span 2" }}>
                                <label>SubCheckbox Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="status-row-fixed">
                            <span className="status-label-fixed">Status</span>
                            <div
                                className={`blue-square-checkbox ${editForm.status === "inactive" ? "inactive" : ""}`}
                                onClick={() => setEditForm({ ...editForm, status: editForm.status === "active" ? "inactive" : "active" })}
                            >
                                {editForm.status === "active" && <Check size={24} />}
                            </div>
                        </div>

                        <div className="form-actions-centered">
                            <button type="submit" className="btn-save-unit" disabled={saving}>
                                {saving ? "Updating..." : "Update"}
                            </button>
                            <button type="button" className="btn-reset-unit" onClick={() => setEditingId(null)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* VIEW SECTION */}
            <div className="view-colour-container" style={{ padding: 0 }}>
                <div className="view-colour-header">
                    <h2>View SubCheckbox Master List</h2>
                    <button className="btn-add-new-colour" onClick={() => { setEditingId(null); setMultiChecks([""]); }}>
                        Add New SubCheckbox Master
                    </button>
                </div>

                <div className="view-colour-card">
                    <h3>SubCheckbox Master - Master</h3>
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
                                    <th>Sub Check Box ↕</th>
                                    <th>Action ↕</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={3} style={{ textAlign: "center" }}>Loading...</td></tr>
                                ) : currentData.length === 0 ? (
                                    <tr><td colSpan={3} style={{ textAlign: "center" }}>No entries found</td></tr>
                                ) : (
                                    currentData.map((cb, index) => (
                                        <tr key={cb.id}>
                                            <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                            <td>{cb.checkbox_name}</td>
                                            <td>
                                                <div className="action-icons">
                                                    <button className="btn-icon-edit" onClick={() => handleEditClick(cb)}><SquarePen size={16} /></button>
                                                    <button className="btn-icon-view" style={{ background: "#ff4d4f" }} onClick={() => handleDelete(cb.id)}><Eye size={16} /></button>
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

export default AddSubCheckboxMaster;
