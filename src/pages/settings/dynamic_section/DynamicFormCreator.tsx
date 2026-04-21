import { useState, useMemo, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
    getDynamicPages,
    getDynamicFields,
    saveDynamicFields,
    deleteDynamicField,
    updateDynamicField,
    deleteDynamicPage,
    updateDynamicPage,
    type DynamicPage,
    type DynamicField
} from "../../../api/dynamicForm.api";
import "./DynamicFormCreator.css";

type FormFieldState = {
    id?: string | number;
    label: string;
    name: string;
    placeholder: string;
    type: string;
    status: "active" | "inactive";
};

const DynamicFormCreator = () => {
    const [pages, setPages] = useState<DynamicPage[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>("");
    const [tableName, setTableName] = useState("");
    const [fields, setFields] = useState<FormFieldState[]>([
        { label: "", name: "", placeholder: "", type: "Text", status: "active" }
    ]);

    /* LIST VIEW STATE */
    const [savedFields, setSavedFields] = useState<DynamicField[]>([]);
    const [search, setSearch] = useState("");
    const [entriesLimit, setEntriesLimit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    /* PAGE EDIT MODAL STATE */
    const [isEditPageModalOpen, setIsEditPageModalOpen] = useState(false);
    const [editingPageData, setEditingPageData] = useState<DynamicPage | null>(null);

    /* ======================
       LOAD DATA
    ====================== */
    const loadInitialData = async () => {
        try {
            setLoading(true);
            const pagesData = await getDynamicPages();
            setPages(pagesData);
            if (pagesData.length > 0) {
                setSelectedPageId(String(pagesData[0].id));
            }
        } catch (err) {
            console.error("Failed to load pages", err);
        } finally {
            setLoading(false);
        }
    };

    const loadFieldsForPage = async (pageId: string) => {
        if (!pageId) return;
        try {
            setLoading(true);
            const fieldsData = await getDynamicFields(Number(pageId));
            setSavedFields(fieldsData);
        } catch (err) {
            console.error("Failed to load fields", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedPageId) {
            loadFieldsForPage(selectedPageId);
        }
    }, [selectedPageId]);

    /* ======================
       FILTERING
    ====================== */
    const selectedPage = useMemo(() =>
        pages.find(p => String(p.id) === selectedPageId),
        [pages, selectedPageId]);

    const filteredFields = useMemo(() => {
        return savedFields.filter(f =>
            f.field_label.toLowerCase().includes(search.toLowerCase()) ||
            f.field_name.toLowerCase().includes(search.toLowerCase()) ||
            f.field_type.toLowerCase().includes(search.toLowerCase())
        );
    }, [savedFields, search]);

    /* ======================
       HANDLERS
    ====================== */
    const addField = () => {
        setFields([...fields, { label: "", name: "", placeholder: "", type: "Text", status: "active" }]);
    };

    const removeField = (index: number) => {
        if (fields.length > 1) {
            setFields(fields.filter((_, i) => i !== index));
        }
    };

    const updateField = (index: number, key: keyof FormFieldState, value: string) => {
        setFields(fields.map((f, i) => (i === index ? { ...f, [key]: value } : f)));
    };

    const handleSave = async () => {
        if (!selectedPageId) {
            alert("Please select a page first");
            return;
        }

        try {
            setSaving(true);

            const updates = fields.filter(f => f.id);
            const newFields = fields.filter(f => !f.id);

            // Handle updates
            for (const f of updates) {
                await updateDynamicField(Number(f.id), {
                    field_label: f.label,
                    field_name: f.name,
                    placeholder: f.placeholder,
                    field_type: f.type,
                    status: f.status
                });
            }

            // Handle new fields
            if (newFields.length > 0) {
                const payload = newFields.map(f => ({
                    field_label: f.label,
                    field_name: f.name,
                    placeholder: f.placeholder,
                    field_type: f.type,
                    status: f.status
                }));
                await saveDynamicFields(Number(selectedPageId), payload, tableName);
            }

            alert("Dynamic Fields Saved/Updated Successfully! ✅");

            // Reset creator form
            setFields([{ label: "", name: "", placeholder: "", type: "Text", status: "active" }]);
            setTableName("");

            // Refresh list
            loadFieldsForPage(selectedPageId);
        } catch (err) {
            console.error("Save error:", err);
            alert("Failed to save/update fields");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteField = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this field?")) return;
        try {
            await deleteDynamicField(id);
            alert("Field deleted ✅");
            loadFieldsForPage(selectedPageId);
        } catch (err) {
            alert("Failed to delete field");
        }
    };

    const handleEditField = (f: DynamicField) => {
        // Populate form with this field to allow update
        setFields([{
            id: f.id,
            label: f.field_label,
            name: f.field_name,
            placeholder: f.placeholder,
            type: f.field_type,
            status: f.status
        }]);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeletePage = async () => {
        if (!selectedPage || !window.confirm(`Are you sure you want to delete the page "${selectedPage.title}"? This cannot be undone.`)) return;
        try {
            await deleteDynamicPage(selectedPage.id);
            alert("Page deleted successfully ✅");
            setSelectedPageId("");
            loadInitialData();
        } catch (err) {
            alert("Failed to delete page");
        }
    };

    const handleOpenEditPageModal = () => {
        if (!selectedPage) return;
        setEditingPageData({ ...selectedPage });
        setIsEditPageModalOpen(true);
    };

    const handleSavePageEdit = async () => {
        if (!editingPageData) return;
        try {
            setSaving(true);
            await updateDynamicPage(editingPageData.id, {
                title: editingPageData.title,
                folder_name: editingPageData.folder_name,
                url: editingPageData.url,
                status: editingPageData.status,
                info: editingPageData.info,
                route_link: editingPageData.route_link
            });
            alert("Page updated successfully ✅");
            setIsEditPageModalOpen(false);
            loadInitialData();
        } catch (err) {
            alert("Failed to update page");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-container dynamic-creator-container">
            <h2>view page</h2>

            {/* CREATOR FORM */}
            <div className="dynamic-creator-card">
                <div className="form-header-row">
                    <div className="dynamic-form-group">
                        <label>Select Dynamic Page</label>
                        <select
                            value={selectedPageId}
                            onChange={(e) => setSelectedPageId(e.target.value)}
                        >
                            <option value="">Select Page...</option>
                            {pages.map(p => (
                                <option key={p.id} value={p.id}>{p.folder_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="dynamic-form-group">
                        <label>Table Name (Optional)</label>
                        <input
                            placeholder="e.g. contact_form"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="divider"></div>

                {fields.map((field, index) => (
                    <div key={index} className="field-row-container">
                        <div className="field-setup-row">
                            <div className="dynamic-form-group">
                                <label>Label</label>
                                <input
                                    placeholder="Label"
                                    value={field.label}
                                    onChange={(e) => updateField(index, "label", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="dynamic-form-group">
                                <label>Name</label>
                                <input
                                    placeholder="Name"
                                    value={field.name}
                                    onChange={(e) => updateField(index, "name", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="dynamic-form-group">
                                <label>Placeholder</label>
                                <input
                                    placeholder="Placeholder"
                                    value={field.placeholder}
                                    onChange={(e) => updateField(index, "placeholder", e.target.value)}
                                />
                            </div>

                            <div className="dynamic-form-group">
                                <label>Type</label>
                                <select
                                    value={field.type}
                                    onChange={(e) => updateField(index, "type", e.target.value)}
                                >
                                    <option value="Text">Text</option>
                                    <option value="Number">Number</option>
                                    <option value="Email">Email</option>
                                    <option value="Select">Select</option>
                                    <option value="Checkbox">Checkbox</option>
                                    <option value="Radio">Radio</option>
                                </select>
                            </div>
                        </div>

                        <div className="dynamic-row-actions">
                            <button className="btn-remove-field" onClick={() => removeField(index)}>
                                Remove Field
                            </button>
                        </div>
                        {index < fields.length - 1 && <div className="divider"></div>}
                    </div>
                ))}

                <div className="divider"></div>

                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <button className="btn-add-field" onClick={addField} disabled={saving}>
                        <Plus size={18} /> Add New Field
                    </button>

                    <button className="btn-save-dynamic" onClick={handleSave} disabled={saving || !selectedPageId}>
                        {saving ? "Saving..." : "Save Dynamic Form"}
                    </button>
                </div>
            </div>

            {/* LIST VIEW SECTION */}
            <div className="dynamic-list-view-container">
                <div className="list-header-actions">
                    <div className="selection-info">
                        <h3 className="selected-page-name">{selectedPage ? selectedPage.title : "—"}</h3>
                        <p className="selection-meta">
                            Folder: <span className="meta-val">{selectedPage ? selectedPage.folder_name : "—"}</span> |
                            URL: <span className="meta-val highlight">{selectedPage ? selectedPage.url : "—"}</span>
                        </p>
                    </div>
                    <div className="header-btns">
                        <button className="btn-edit-header" onClick={handleOpenEditPageModal}>Edit Page</button>
                        <button className="btn-delete-header" onClick={handleDeletePage}>Delete Page</button>
                    </div>
                </div>

                <div className="list-controls-bar">
                    <div className="entries-select">
                        Show
                        <select value={entriesLimit} onChange={(e) => setEntriesLimit(Number(e.target.value))}>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        entries
                    </div>
                    <div className="search-box">
                        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="dynamic-table-wrapper">
                    <table className="creators-table">
                        <thead>
                            <tr>
                                <th>Field Label <span className="sort-icon">▲</span></th>
                                <th>Field Name <span className="sort-icon">⇅</span></th>
                                <th>Type <span className="sort-icon">⇅</span></th>
                                <th>Status <span className="sort-icon">⇅</span></th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>Loading fields...</td></tr>}
                            {!loading && filteredFields.length > 0 ? (
                                filteredFields.map(f => (
                                    <tr key={f.id}>
                                        <td>{f.field_label}</td>
                                        <td>{f.field_name}</td>
                                        <td>{f.field_type}</td>
                                        <td><span className="status-text-active">{f.status}</span></td>
                                        <td>
                                            <div style={{ display: "flex", gap: "10px" }}>
                                                <button style={{ color: "#323da7", border: "none", background: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600" }} onClick={() => handleEditField(f)}>Edit</button>
                                                <button style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600" }} onClick={() => handleDeleteField(f.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : !loading && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>No fields found for this page.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="list-footer-bar">
                    <div className="showing-info">
                        Showing {filteredFields.length} entries
                    </div>
                    <div className="pagination-controls">
                        <button className="btn-pagi"><ChevronLeft size={16} /></button>
                        <button className="btn-pagi active">1</button>
                        <button className="btn-pagi"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>
            {/* EDIT PAGE MODAL */}
            {isEditPageModalOpen && editingPageData && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Edit Page Information</h3>
                        <div className="modal-form">
                            <div className="dynamic-form-group">
                                <label>Title</label>
                                <input
                                    value={editingPageData.title}
                                    onChange={(e) => setEditingPageData({ ...editingPageData, title: e.target.value })}
                                />
                            </div>
                            <div className="dynamic-form-group">
                                <label>Folder Name</label>
                                <input
                                    value={editingPageData.folder_name}
                                    onChange={(e) => setEditingPageData({ ...editingPageData, folder_name: e.target.value })}
                                />
                            </div>
                            <div className="dynamic-form-group">
                                <label>URL</label>
                                <input
                                    value={editingPageData.url}
                                    onChange={(e) => setEditingPageData({ ...editingPageData, url: e.target.value })}
                                />
                            </div>
                            <div className="dynamic-form-group">
                                <label>Status</label>
                                <select
                                    value={editingPageData.status}
                                    onChange={(e) => setEditingPageData({ ...editingPageData, status: e.target.value as any })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setIsEditPageModalOpen(false)}>Cancel</button>
                            <button className="btn-save" onClick={handleSavePageEdit} disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DynamicFormCreator;
