import { useState, useEffect } from "react";
import { Check, Plus, SquarePen, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import "./checkboxMaster.css";
import { getCheckboxes, createCheckbox, updateCheckbox, deleteCheckbox } from "../../../../api/multitab/category_checkbox.api";
import type { Checkbox as CategoryCheckboxMaster } from "../../../../api/multitab/category_checkbox.api";

const AddCategoryCheckboxMaster = () => {
    const [checkboxes, setCheckboxes] = useState<CategoryCheckboxMaster[]>([]);
    const [loading, setLoading] = useState(true);

    const [multiChecks, setMultiChecks] = useState<{ name: string; checked: boolean }[]>([{ name: "", checked: false }]);
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
        setMultiChecks([...multiChecks, { name: "", checked: false }]);
    };

    const handleInputChange = (index: number, value: string) => {
        const updated = [...multiChecks];
        updated[index].name = value;
        setMultiChecks(updated);
    };

    const handleCheckboxToggle = (index: number) => {
        const updated = [...multiChecks];
        updated[index].checked = !updated[index].checked;
        setMultiChecks(updated);
    };

    const handleRemoveInput = (index: number) => {
        setMultiChecks(multiChecks.filter((_, i) => i !== index));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const checkedItems = multiChecks.filter(item => item.checked && item.name.trim() !== "");
        if (checkedItems.length === 0) {
            alert("Please check at least one checkbox and enter a name");
            return;
        }

        try {
            setSaving(true);
            await Promise.all(checkedItems.map(item => createCheckbox({ label: item.name, status: "active", value: item.name })));
            alert("Saved successfully ✅");
            setMultiChecks([{ name: "", checked: false }]);
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
            await updateCheckbox(editingId, { label: editForm.name, status: editForm.status });
            alert("Updated successfully ✅");
            setEditingId(null);
            loadData();
        } catch (err: any) {
            alert(err.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const handleEditClick = (cb: CategoryCheckboxMaster) => {
        setEditingId(cb.id);
        setEditForm({ name: cb.label, status: cb.status });
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
        cb.label.toLowerCase().includes(search.toLowerCase())
    );

    const totalEntries = filtered.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="checkbox-page-container">
            {/* Form Section */}
            <div className="checkbox-form-card">
                <div className="checkbox-form-header">
                    <h2>{editingId ? "Edit Category Checkbox Master" : "Add Checkbox Master"}</h2>
                </div>
                <hr className="checkbox-dashed-divider" />

                {!editingId ? (
                    <form onSubmit={handleSave}>
                        {multiChecks.map((item, idx) => (
                            <div key={idx} className="checkbox-input-row">
                                <div
                                    className={`custom-checkbox-styled ${item.checked ? 'checked' : ''}`}
                                    onClick={() => handleCheckboxToggle(idx)}
                                >
                                    {item.checked && <Check size={16} color="white" />}
                                </div>
                                <div className="checkbox-input-group">
                                    <label>Menu Title</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Menu Title..."
                                        value={item.name}
                                        onChange={(e) => handleInputChange(idx, e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="button" className="btn-add-more" onClick={handleAddInput}>
                                    <Plus size={18} /> Add More
                                </button>
                                {multiChecks.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveInput(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                                )}
                            </div>
                        ))}

                        <div className="checkbox-action-footer">
                            <button type="submit" className="btn-check-premium btn-check-save" disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </button>
                            <button type="button" className="btn-check-premium btn-check-reset" onClick={() => setMultiChecks([{ name: "", checked: false }])}>
                                Reset
                            </button>
                            <button type="button" className="btn-check-premium btn-check-cancel" onClick={() => { setMultiChecks([{ name: "", checked: false }]); }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleUpdate}>
                        <div className="checkbox-input-row" style={{ marginTop: '20px' }}>
                            <div className="checkbox-input-group">
                                <label>Checkbox Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div className="checkbox-input-group" style={{ width: '200px' }}>
                                <label>Status</label>
                                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="checkbox-action-footer">
                            <button type="submit" className="btn-check-premium btn-check-save" disabled={saving}>
                                {saving ? "Updating..." : "Update"}
                            </button>
                            <button type="button" className="btn-check-premium btn-check-cancel" onClick={() => setEditingId(null)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* List Section */}
            <div className="checkbox-table-card">
                <div className="checkbox-table-header">
                    <h2>View Category Checkbox Master List</h2>
                    <p>All active checkbox items</p>
                </div>
                <hr className="checkbox-dashed-divider" />

                <div className="checkbox-table-controls">
                    <div>
                        Show
                        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        entries
                    </div>
                    <div>
                        Search:
                        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
                    </div>
                </div>

                <table className="checkbox-premium-table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}># ↕</th>
                            <th>Check Box ↕</th>
                            <th style={{ width: '150px' }}>Action ↕</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={3} style={{ textAlign: 'center', padding: '30px' }}>Loading...</td></tr>
                        ) : currentData.length === 0 ? (
                            <tr><td colSpan={3} style={{ textAlign: 'center', padding: '30px' }}>No entries found</td></tr>
                        ) : (
                            currentData.map((cb, idx) => (
                                <tr key={cb.id}>
                                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                                    <td>{cb.label}</td>
                                    <td>
                                        <button className="checkbox-action-btn checkbox-edit-btn" onClick={() => handleEditClick(cb)}><SquarePen size={16} /></button>
                                        <button className="checkbox-action-btn checkbox-delete-btn" onClick={() => handleDelete(cb.id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="checkbox-pagination">
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                        Showing {totalEntries > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
                    </div>
                    <div className="checkbox-pagination-btns">
                        <button className="checkbox-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft size={16} /></button>
                        <button className="checkbox-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16} /></button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                className={`checkbox-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button className="checkbox-page-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={16} /></button>
                        <button className="checkbox-page-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)}><ChevronsRight size={16} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCategoryCheckboxMaster;
