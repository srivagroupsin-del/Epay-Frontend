import { useState, useEffect } from "react";
import { Plus, SquarePen, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check, X, Settings2 } from "lucide-react";
import "./Check_box.css";
import { getCheckboxes, createCheckbox, updateCheckbox, deleteCheckbox } from "../models/multitab.api";
import type { CheckboxMaster } from "../models/multitab.api";

const AddSectorCheckboxMaster = () => {
    type TableConfig = {
        title: string;
        cols: number;
        rows: number;
        headings: string[];
        data: string[][];
    };

    type ButtonConfig = {
        name: string;
        color: string;
        textColor: string;
        width: string;
        height: string;
        borderRadius: string;
    };

    const [checkboxes, setCheckboxes] = useState<CheckboxMaster[]>([]);
    const [loading, setLoading] = useState(true);

    const [multiChecks, setMultiChecks] = useState<{ name: string; checked: boolean; type?: string; tableConfig?: TableConfig; buttonConfig?: ButtonConfig }[]>([{ name: "", checked: false }]);
    const [saving, setSaving] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: "", status: "active" });

    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal State
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [currentTypeIndex, setCurrentTypeIndex] = useState<number | null>(null);

    const typeOptions = ["Placeholder", "Image", "Dropdown", "Table", "Button"];

    // Table Modal State
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [currentTableConfig, setCurrentTableConfig] = useState<TableConfig>({ 
        title: '', cols: 2, rows: 2, headings: ['Col 1', 'Col 2'], data: [['', ''], ['', '']] 
    });

    // Button Modal State
    const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);
    const [currentButtonConfig, setCurrentButtonConfig] = useState<ButtonConfig>({
        name: 'Click Me', color: '#3b82f6', textColor: '#ffffff', width: '120', height: '40', borderRadius: '8'
    });

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

    const handleTypeSelect = (selectedType: string) => {
        if (currentTypeIndex !== null) {
            if (selectedType === "Table") {
                const existingConfig = multiChecks[currentTypeIndex].tableConfig;
                if (existingConfig) {
                    setCurrentTableConfig(existingConfig);
                } else {
                    setCurrentTableConfig({ title: '', cols: 2, rows: 2, headings: ['Col 1', 'Col 2'], data: [['', ''], ['', '']] });
                }
                setIsTypeModalOpen(false);
                setIsTableModalOpen(true);
            } else if (selectedType === "Button") {
                const existingConfig = multiChecks[currentTypeIndex].buttonConfig;
                if (existingConfig) {
                    setCurrentButtonConfig(existingConfig);
                } else {
                    setCurrentButtonConfig({ name: 'Click Me', color: '#3b82f6', textColor: '#ffffff', width: '120', height: '40', borderRadius: '8' });
                }
                setIsTypeModalOpen(false);
                setIsButtonModalOpen(true);
            } else {
                const updated = [...multiChecks];
                updated[currentTypeIndex].type = selectedType;
                updated[currentTypeIndex].tableConfig = undefined; // Clear config if changing type
                updated[currentTypeIndex].buttonConfig = undefined; 
                setMultiChecks(updated);
                setIsTypeModalOpen(false);
                setCurrentTypeIndex(null);
            }
        }
    };

    const handleTableColsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cols = parseInt(e.target.value) || 0;
        setCurrentTableConfig(prev => {
            const newHeadings = [...prev.headings];
            if (cols > newHeadings.length) {
                for (let i = newHeadings.length; i < cols; i++) {
                    newHeadings.push(`Col ${i + 1}`);
                }
            } else {
                newHeadings.splice(cols);
            }
            
            const newData = prev.data.map(row => {
                const newRow = [...row];
                if (cols > newRow.length) {
                    for (let i = newRow.length; i < cols; i++) {
                        newRow.push('');
                    }
                } else {
                    newRow.splice(cols);
                }
                return newRow;
            });

            return { ...prev, cols, headings: newHeadings, data: newData };
        });
    };

    const handleTableRowsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rows = parseInt(e.target.value) || 0;
        setCurrentTableConfig(prev => {
            const newData = [...prev.data];
            if (rows > newData.length) {
                for (let i = newData.length; i < rows; i++) {
                    newData.push(Array(prev.cols).fill(''));
                }
            } else {
                newData.splice(rows);
            }
            return { ...prev, rows, data: newData };
        });
    };

    const handleTableHeadingChange = (colIndex: number, value: string) => {
        setCurrentTableConfig(prev => {
            const newHeadings = [...prev.headings];
            newHeadings[colIndex] = value;
            return { ...prev, headings: newHeadings };
        });
    };

    const handleTableCellChange = (rowIndex: number, colIndex: number, value: string) => {
        setCurrentTableConfig(prev => {
            const newData = [...prev.data];
            newData[rowIndex] = [...newData[rowIndex]];
            newData[rowIndex][colIndex] = value;
            return { ...prev, data: newData };
        });
    };

    const handleAddRow = () => {
        setCurrentTableConfig(prev => ({
            ...prev,
            rows: prev.rows + 1,
            data: [...prev.data, Array(prev.cols).fill('')]
        }));
    };

    const handleRemoveRow = () => {
        setCurrentTableConfig(prev => {
            if (prev.rows <= 1) return prev;
            return {
                ...prev,
                rows: prev.rows - 1,
                data: prev.data.slice(0, -1)
            };
        });
    };

    const handleSaveTable = () => {
        if (currentTypeIndex !== null) {
            const updated = [...multiChecks];
            updated[currentTypeIndex].type = "Table";
            updated[currentTypeIndex].tableConfig = currentTableConfig;
            setMultiChecks(updated);
            setIsTableModalOpen(false);
            setCurrentTypeIndex(null);
        }
    };

    const handleSaveButton = () => {
        if (currentTypeIndex !== null) {
            const updated = [...multiChecks];
            updated[currentTypeIndex].type = "Button";
            updated[currentTypeIndex].buttonConfig = currentButtonConfig;
            setMultiChecks(updated);
            setIsButtonModalOpen(false);
            setCurrentTypeIndex(null);
        }
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
            await Promise.all(checkedItems.map(item => createCheckbox({ checkbox_name: item.name, status: "active" })));
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
        <div className="checkbox-page-container">
            {/* Form Section */}
            <div className="checkbox-form-card">
                <div className="checkbox-form-header">
                    <h2>{editingId ? "Edit Checkbox " : "Add Checkbox"}</h2>
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
                                    {item.type && item.type !== 'Table' && (
                                        <div className="selected-type-badge">{item.type}</div>
                                    )}
                                </div>
                                <button type="button" className="btn-add-more" onClick={handleAddInput}>
                                    <Plus size={18} /> Add More
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-type" 
                                    onClick={() => { setIsTypeModalOpen(true); setCurrentTypeIndex(idx); }}
                                >
                                    <Settings2 size={18} /> Type
                                </button>
                                {multiChecks.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveInput(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                                )}
                                
                                {item.type === "Table" && item.tableConfig && (
                                    <div className="preview-table-container">
                                        <h4>{item.tableConfig.title || "Table Preview"} (Table)</h4>
                                        <table>
                                            <thead>
                                                <tr>
                                                    {item.tableConfig.headings.map((h, i) => <th key={i}>{h}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {item.tableConfig.data.map((row, rI) => (
                                                    <tr key={rI}>
                                                        {row.map((cell, cI) => <td key={cI}>{cell}</td>)}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {item.type === "Button" && item.buttonConfig && (
                                    <div className="preview-table-container">
                                        <h4>Button Preview (Button)</h4>
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                            <button type="button" style={{
                                                backgroundColor: item.buttonConfig.color,
                                                color: item.buttonConfig.textColor,
                                                width: `${item.buttonConfig.width}px`,
                                                height: `${item.buttonConfig.height}px`,
                                                borderRadius: `${item.buttonConfig.borderRadius}px`,
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                fontSize: '15px'
                                            }}>
                                                {item.buttonConfig.name}
                                            </button>
                                        </div>
                                    </div>
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
                    <h2>View Checkbox Master List</h2>
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
                                    <td>{cb.checkbox_name}</td>
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

            {/* Type Selection Modal */}
            {isTypeModalOpen && (
                <div className="type-modal-overlay">
                    <div className="type-modal-content">
                        <div className="type-modal-header">
                            <h3>Select Type</h3>
                            <button 
                                type="button" 
                                className="type-modal-close" 
                                onClick={() => { setIsTypeModalOpen(false); setCurrentTypeIndex(null); }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="type-modal-options">
                            {typeOptions.map(option => (
                                <button 
                                    key={option} 
                                    type="button" 
                                    className="type-option-card"
                                    onClick={() => handleTypeSelect(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Table Configuration Modal */}
            {isTableModalOpen && (
                <div className="type-modal-overlay">
                    <div className="table-config-modal-content">
                        <div className="type-modal-header">
                            <h3>Configure Table</h3>
                            <button 
                                type="button" 
                                className="type-modal-close" 
                                onClick={() => { setIsTableModalOpen(false); setCurrentTypeIndex(null); }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="table-config-inputs">
                            <div className="checkbox-input-group" style={{ minWidth: '0' }}>
                                <label>Table Title (Optional)</label>
                                <input
                                    type="text"
                                    value={currentTableConfig.title}
                                    placeholder="Enter table title..."
                                    onChange={(e) => setCurrentTableConfig({ ...currentTableConfig, title: e.target.value })}
                                />
                            </div>
                            <div className="checkbox-input-group" style={{ minWidth: '0' }}>
                                <label>Columns</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={currentTableConfig.cols || ''}
                                    onChange={handleTableColsChange}
                                />
                            </div>
                            <div className="checkbox-input-group" style={{ minWidth: '0' }}>
                                <label>Rows</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={currentTableConfig.rows || ''}
                                    onChange={handleTableRowsChange}
                                />
                            </div>
                        </div>

                        <div className="table-config-preview">
                            <table>
                                <thead>
                                    <tr>
                                        {currentTableConfig.headings.map((heading, i) => (
                                            <th key={i}>
                                                <input 
                                                    type="text" 
                                                    value={heading} 
                                                    onChange={(e) => handleTableHeadingChange(i, e.target.value)} 
                                                />
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentTableConfig.data.map((row, rIndex) => (
                                        <tr key={rIndex}>
                                            {row.map((cell, cIndex) => (
                                                <td key={cIndex}>
                                                    <input 
                                                        type="text" 
                                                        value={cell} 
                                                        onChange={(e) => handleTableCellChange(rIndex, cIndex, e.target.value)} 
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="table-config-actions">
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button type="button" onClick={handleAddRow} className="btn-check-premium" style={{ background: '#1e293b', padding: '10px 20px', fontSize: '14px' }}>
                                    + Add Row
                                </button>
                                <button type="button" onClick={handleRemoveRow} className="btn-check-premium" style={{ background: '#ef4444', padding: '10px 20px', fontSize: '14px' }}>
                                    - Remove Row
                                </button>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button type="button" onClick={() => setIsTableModalOpen(false)} className="btn-check-premium" style={{ background: '#94a3b8', padding: '10px 30px', fontSize: '14px' }}>
                                    Cancel
                                </button>
                                <button type="button" onClick={handleSaveTable} className="btn-check-premium btn-check-save" style={{ padding: '10px 30px', fontSize: '14px' }}>
                                    Save Table
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Button Configuration Modal */}
            {isButtonModalOpen && (
                <div className="type-modal-overlay">
                    <div className="table-config-modal-content" style={{ width: '500px' }}>
                        <div className="type-modal-header">
                            <h3>Configure Button</h3>
                            <button 
                                type="button" 
                                className="type-modal-close" 
                                onClick={() => { setIsButtonModalOpen(false); setCurrentTypeIndex(null); }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                            <div className="checkbox-input-group" style={{ minWidth: '0' }}>
                                <label>Button Name</label>
                                <input
                                    type="text"
                                    value={currentButtonConfig.name}
                                    placeholder="Click Me"
                                    onChange={(e) => setCurrentButtonConfig({ ...currentButtonConfig, name: e.target.value })}
                                />
                            </div>
                            <div className="checkbox-input-group" style={{ minWidth: '0' }}>
                                <label>Border Radius (px)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={currentButtonConfig.borderRadius}
                                    onChange={(e) => setCurrentButtonConfig({ ...currentButtonConfig, borderRadius: e.target.value })}
                                />
                            </div>
                            <div className="checkbox-input-group" style={{ minWidth: '0' }}>
                                <label>Width (px)</label>
                                <input
                                    type="number"
                                    min="10"
                                    value={currentButtonConfig.width}
                                    onChange={(e) => setCurrentButtonConfig({ ...currentButtonConfig, width: e.target.value })}
                                />
                            </div>
                            <div className="checkbox-input-group" style={{ minWidth: '0' }}>
                                <label>Height (px)</label>
                                <input
                                    type="number"
                                    min="10"
                                    value={currentButtonConfig.height}
                                    onChange={(e) => setCurrentButtonConfig({ ...currentButtonConfig, height: e.target.value })}
                                />
                            </div>
                            <div className="checkbox-input-group" style={{ minWidth: '0' }}>
                                <label>Background Color</label>
                                <input
                                    type="color"
                                    value={currentButtonConfig.color}
                                    style={{ height: '48px', padding: '4px' }}
                                    onChange={(e) => setCurrentButtonConfig({ ...currentButtonConfig, color: e.target.value })}
                                />
                            </div>
                            <div className="checkbox-input-group" style={{ minWidth: '0' }}>
                                <label>Text Color</label>
                                <input
                                    type="color"
                                    value={currentButtonConfig.textColor}
                                    style={{ height: '48px', padding: '4px' }}
                                    onChange={(e) => setCurrentButtonConfig({ ...currentButtonConfig, textColor: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="table-config-preview" style={{ padding: '20px', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
                            <button type="button" style={{
                                backgroundColor: currentButtonConfig.color,
                                color: currentButtonConfig.textColor,
                                width: `${currentButtonConfig.width}px`,
                                height: `${currentButtonConfig.height}px`,
                                borderRadius: `${currentButtonConfig.borderRadius}px`,
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '15px'
                            }}>
                                {currentButtonConfig.name || "Button"}
                            </button>
                        </div>

                        <div className="table-config-actions" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsButtonModalOpen(false)} className="btn-check-premium" style={{ background: '#94a3b8', padding: '10px 30px', fontSize: '14px' }}>
                                Cancel
                            </button>
                            <button type="button" onClick={handleSaveButton} className="btn-check-premium btn-check-save" style={{ padding: '10px 30px', fontSize: '14px' }}>
                                Save Button
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddSectorCheckboxMaster;
