import { useState, useEffect } from "react";
import { SquarePen, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import "./addSubTabHeading.css";
import {
    createHeading as createTabHeading,
    getHeadingsByTab,
    updateHeading as updateTabHeading,
    deleteHeading as deleteTabHeading,
    type Heading as TabHeading
} from "../../../../api/multitab/subsector_heading.api";
import { getMenus as getMenuTabs, type Menu as MultitabMenu } from "../../../../api/multitab/subsector_menu.api";

const AddSubTabheadingMaster = () => {
    const [menus, setMenus] = useState<MultitabMenu[]>([]);
    const [headings, setHeadings] = useState<TabHeading[]>([]);
    const [, setLoading] = useState(true);

    const [form, setForm] = useState<{
        menu_id: string;
        heading_name: string;
        title: string;
        description: string;
        status: string;
        image: string | null;
    }>({
        menu_id: "",
        heading_name: "",
        title: "",
        description: "",
        status: "active",
        image: null,
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (form.menu_id) {
            fetchHeadingsForMenu(Number(form.menu_id));
        } else {
            setHeadings([]);
        }
    }, [form.menu_id]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const data = await getMenuTabs();
            setMenus(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHeadingsForMenu = async (menuId: number) => {
        try {
            const headingData = await getHeadingsByTab(menuId);
            setHeadings(headingData || []);
        } catch (err) {
            setHeadings([]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setImagePreview(base64);
                setForm(prev => ({ ...prev, image: base64 }));
            };
            reader.readAsDataURL(file);
        }
    };


    const resetForm = () => {
        setForm({
            menu_id: form.menu_id,
            heading_name: "",
            title: "",
            description: "",
            status: "active",
            image: null,
        });
        setImagePreview(null);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.menu_id || !form.heading_name.trim()) {
            alert("SubSector Multi Tab Title and Heading Name are required");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                multitab_menu_id: Number(form.menu_id),
                heading_name: form.heading_name,
                title: form.title,
                description: form.description,
                image: form.image || "",
            };

            if (editingId) {
                await updateTabHeading(editingId, { ...payload, sort_order: 1 });
                alert("Success ✅");
            } else {
                await createTabHeading(payload);
                alert("Success ✅");
            }
            resetForm();
            fetchHeadingsForMenu(Number(form.menu_id));
        } catch (error: any) {
            alert("Failed ❌");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (h: TabHeading) => {
        setForm({
            menu_id: String(h.multitab_menu_id),
            heading_name: h.heading_name,
            title: h.title ?? "",
            description: h.description ?? "",
            status: h.status === 1 || h.status === undefined ? "active" : "inactive",
            image: h.image || null,
        });
        setImagePreview(h.image || null);
        setEditingId(h.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeleteHeading = async (id: number) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteTabHeading(id);
            if (form.menu_id) fetchHeadingsForMenu(Number(form.menu_id));
        } catch (err: any) { }
    };

    const filtered = headings.filter(h =>
        h.heading_name.toLowerCase().includes(search.toLowerCase())
    );

    const totalEntries = filtered.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="page-container">
            <div className="card-main">
                <div className="header-title">{editingId ? "Edit SubTab Heading Master" : "Add SubTab Heading Master"}</div>
                <hr className="dashed-line" />

                <form onSubmit={handleSubmit}>
                    <div className="form-layout">
                        <div className="field-group">
                            <label>SubSector Multi Tab Title</label>
                            <select name="menu_id" value={form.menu_id} onChange={handleChange}>
                                <option value="">Select SubSector Multi Tab Title</option>
                                {menus.map(m => <option key={m.id} value={m.id}>{m.menu_name}</option>)}
                            </select>
                        </div>
                        <div className="field-group">
                            <label>SubTab Heading Name</label>
                            <input name="heading_name" placeholder="Enter Heading" value={form.heading_name} onChange={handleChange} required />
                        </div>
                        <div className="field-group">
                            <label>Title</label>
                            <input name="title" placeholder="Enter Title" value={form.title} onChange={handleChange} />
                        </div>
                        <div className="field-group" style={{ width: "220px" }}>
                            <label>Status</label>
                            <select name="status" value={form.status} onChange={handleChange}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="field-group span-all">
                            <label>Description</label>
                            <textarea name="description" placeholder="Enter Description" value={form.description} onChange={handleChange} />
                        </div>

                    </div>

                    <div className="action-bar">
                        <div className="upload-part">
                            <div className="preview-sq" style={{ position: "relative" }}>
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} alt="Preview" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm(prev => ({ ...prev, image: null }));
                                                setImagePreview(null);
                                            }}
                                            style={{
                                                position: "absolute",
                                                top: "-8px",
                                                right: "-8px",
                                                background: "#ef4444",
                                                color: "#fff",
                                                border: "none",
                                                width: "24px",
                                                height: "24px",
                                                borderRadius: "50%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer",
                                                boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                                            }}
                                            title="Delete Image"
                                        >
                                            ✕
                                        </button>
                                    </>
                                ) : (
                                    "Preview"
                                )}
                            </div>
                            <input type="file" id="sub-img" hidden onChange={handleImageChange} accept="image/*" />
                            <button type="button" className="btn-p btn-upload-blue" onClick={() => document.getElementById('sub-img')?.click()}>Choose File</button>
                        </div>
                        <div className="btns-right">
                            <button type="submit" className="btn-p btn-save-green" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                            <button type="button" className="btn-p btn-reset-red" onClick={resetForm}>Reset</button>
                            <button type="button" className="btn-p btn-cancel-blue" onClick={resetForm}>Cancel</button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="data-table-card">
                <div className="header-title">View SubTab Heading Master List</div>
                <hr className="dashed-line" />

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                    <div style={{ fontSize: "14px" }}>
                        Show
                        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ margin: "0 8px", padding: "4px" }}>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        entries
                    </div>
                    <div style={{ fontSize: "14px" }}>
                        Search: <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "4px", border: "1px solid #ddd", borderRadius: "4px" }} />
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th># ↕</th>
                            <th>SubSector Multi Tab Title ↕</th>
                            <th>Heading ↕</th>
                            <th>Status ↕</th>
                            <th>Action ↕</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.map((h, i) => (
                            <tr key={h.id}>
                                <td>{(currentPage - 1) * pageSize + i + 1}</td>
                                <td>{menus.find(m => m.id === h.multitab_menu_id)?.menu_name || h.multitab_menu_id}</td>
                                <td>{h.heading_name}</td>
                                <td><span className={`badge-st ${h.status === 1 || h.status === undefined ? "active" : "inactive"}`}>{h.status === 1 || h.status === undefined ? "Active" : "Inactive"}</span></td>
                                <td>
                                    <button className="btn-p" style={{ padding: "6px", background: "#1a237e", color: "#fff", marginRight: "5px" }} onClick={() => handleEdit(h)}><SquarePen size={14} /></button>
                                    <button className="btn-p" style={{ padding: "6px", background: "#ef4444", color: "#fff" }} onClick={() => handleDeleteHeading(h.id)}><Trash2 size={14} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Pagination Simplified */}
                <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "13px" }}>Showing {totalEntries > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries</div>
                    <div style={{ display: "flex", gap: "4px" }}>
                        <button className="btn-p" style={{ padding: "6px", background: "#f1f5f9", color: "#000" }} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={16} /></button>
                        <button className="btn-p" style={{ padding: "6px", background: "#f1f5f9", color: "#000" }} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}><ChevronLeft size={16} /></button>
                        <button className="btn-p" style={{ padding: "8px 12px", background: "#1a237e", color: "#fff" }}>{currentPage}</button>
                        <button className="btn-p" style={{ padding: "6px", background: "#f1f5f9", color: "#000" }} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage >= totalPages}><ChevronRight size={16} /></button>
                        <button className="btn-p" style={{ padding: "6px", background: "#f1f5f9", color: "#000" }} onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}><ChevronsRight size={16} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSubTabheadingMaster;
