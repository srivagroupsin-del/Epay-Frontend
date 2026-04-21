import { useState, useEffect } from "react";
import { SquarePen, Trash2 } from "lucide-react";
import "./addBrandTabHeading.css";
import { getMenus } from "../../../../api/multitab/brand_menu.api";
import type { Menu as BrandMultitabMenu } from "../../../../api/multitab/brand_menu.api";
import {
    getTabHeadings,
    createTabHeading,
    updateTabHeading,
    deleteTabHeading
} from "../../../../api/multitab/brand_heading.api";
import type { Heading as BrandTabHeading } from "../../../../api/multitab/brand_heading.api";

const AddBrandTabHeadingMaster = () => {
    const [menus, setMenus] = useState<BrandMultitabMenu[]>([]);
    const [headings, setHeadings] = useState<BrandTabHeading[]>([]);
    const [, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        id: null as number | null,
        menu_id: "",
        master_name: "",
        title: "",
        description: "",
        status: true,
        image: null as any
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Table state
    const [searchTerm, setSearchTerm] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage] = useState(1);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [m, h] = await Promise.all([getMenus(), getTabHeadings()]);
            setMenus(m || []);
            setHeadings(h || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setForm({ ...form, image: file });
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setForm({
            id: null,
            menu_id: "",
            master_name: "",
            title: "",
            description: "",
            status: true,
            image: null
        });
        setImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const submissionData = {
                ...form,
                menu_id: Number(form.menu_id),
                status: form.status ? "active" : "inactive"
            };
            if (form.id) {
                await updateTabHeading(form.id, submissionData as any);
                alert("Success ✅");
            } else {
                await createTabHeading(submissionData as any);
                alert("Success ✅");
            }
            resetForm();
            loadData();
        } catch (err: any) {
            alert("Failed ❌");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteTabHeading(id);
            loadData();
        } catch (err: any) { }
    };

    const getMenuName = (id: number) => menus.find(m => m.id === id)?.menu_name || id;

    const filteredHeadings = headings.filter(h =>
        h.heading_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentHeadings = filteredHeadings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="page-container">
            <div className="card-top">
                <div className="title-main">{form.id ? "Edit Brand Tab Heading Master" : "Add Tab Heading Master"}</div>
                <hr className="hr-dashed" />

                <form onSubmit={handleSubmit}>
                    <div className="form-grid-2">
                        <div className="floating-box">
                            <label>Brand Tab Heading (Menu)</label>
                            <select value={form.menu_id} onChange={(e) => setForm({ ...form, menu_id: e.target.value })} required >
                                {menus.map(m => <option key={m.id} value={m.id}>{m.menu_name}</option>)}
                            </select>
                        </div>
                        <div className="floating-box">
                            <label>Menu Title</label>
                            <input type="text" value={form.master_name} onChange={(e) => setForm({ ...form, master_name: e.target.value })} required />
                        </div>
                        <div className="floating-box">
                            <label>Title</label>
                            <input type="text" placeholder="Enter title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div className="floating-box">
                            <label>Status</label>
                            <select value={form.status ? "active" : "inactive"} onChange={(e) => setForm({ ...form, status: e.target.value === "active" })} >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="floating-box full-col">
                            <label>Description</label>
                            <textarea placeholder="Enter description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                    </div>

                    <div className="action-bar-bottom">
                        <div className="upload-group">
                            <div className="prev-sq" style={{ position: "relative" }}>
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} alt="Preview" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm({ ...form, image: null });
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
                            <input type="file" id="brand-img" hidden onChange={handleImageChange} accept="image/*" />
                            <button type="button" className="btn-brand btn-up-blue" onClick={() => document.getElementById('brand-img')?.click()}>Choose File</button>
                        </div>
                        <div className="btn-group-right">
                            <button type="submit" className="btn-brand btn-save-gr">{saving ? "Saving..." : "Save"}</button>
                            <button type="button" className="btn-brand btn-reset-red" onClick={resetForm}>Reset</button>
                            <button type="button" className="btn-brand btn-cancel-blue" onClick={resetForm}>Cancel</button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="list-card">
                <div className="title-main">View Brand Tab Heading Master List</div>
                <hr className="hr-dashed" />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "14px" }}>
                    <div>Show
                        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ margin: "0 8px" }}>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                        entries
                    </div>
                    <div>Search: <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: "4px", border: "1px solid #ddd" }} /></div>
                </div>

                <table className="list-table">
                    <thead>
                        <tr>
                            <th># ↕</th>
                            <th>Heading ↕</th>
                            <th>Master ↕</th>
                            <th>Status ↕</th>
                            <th>Action ↕</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentHeadings.map((h, i) => (
                            <tr key={h.id}>
                                <td>{(currentPage - 1) * pageSize + i + 1}</td>
                                <td>{getMenuName(h.multitab_menu_id)}</td>
                                <td>{h.heading_name}</td>
                                <td><span className={`stat-badge ${h.status === "active" ? "active" : "inactive"}`}>{h.status}</span></td>
                                <td>
                                    <button onClick={() => { setForm({ id: h.id, menu_id: h.multitab_menu_id.toString(), master_name: h.heading_name, title: h.title, description: h.description, status: h.status === "active", image: null }); setImagePreview(h.image); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ background: "#1a237e", color: "#fff", padding: "6px", border: "none", borderRadius: "4px", marginRight: "5px" }}><SquarePen size={14} /></button>
                                    <button onClick={() => handleDelete(h.id)} style={{ background: "#ef4444", color: "#fff", padding: "6px", border: "none", borderRadius: "4px" }}><Trash2 size={14} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AddBrandTabHeadingMaster;
