import { useState, useEffect } from "react";
import { SquarePen, Trash2 } from "lucide-react";
import "./addCategoryTabHeading.css";
import { getMenus } from "../../../../api/multitab/category_menu.api";
import type { Menu as MultitabMenu } from "../../../../api/multitab/category_menu.api";
import {
    getTabHeadings,
    createTabHeading,
    updateTabHeading,
    deleteTabHeading
} from "../../../../api/multitab/category_heading.api";
import type { Heading as CategoryTabHeading } from "../../../../api/multitab/category_heading.api";

const AddCategoryTabHeadingMaster = () => {
    const [menus, setMenus] = useState<MultitabMenu[]>([]);
    const [headings, setHeadings] = useState<CategoryTabHeading[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showMenuDropdown, setShowMenuDropdown] = useState(false);

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
                multitab_menu_id: Number(form.menu_id),
                heading_name: form.master_name,
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
            <div className="main-card">
                <div className="title-line">{form.id ? "Edit Category Tab Heading Master" : "Add Tab Heading Master"}</div>
                <hr className="dash-sep" />

                <form onSubmit={handleSubmit}>
                    <div className="grid-2col">
                        <div className="input-box" style={{ position: "relative" }}>
                            <label>Category Tab Heading (Menu)</label>
                            <div
                                style={{
                                    padding: "10px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    background: "#fff",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                            >
                                <span style={{ color: form.menu_id ? "#000" : "#71717a" }}>
                                    {menus.find(m => m.id.toString() === form.menu_id)?.menu_name || "select"}
                                </span>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>▼</span>
                            </div>

                            {showMenuDropdown && (
                                <div style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    background: "#fff",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    marginTop: "4px",
                                    zIndex: 1000,
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                                }}>
                                    <div
                                        style={{ padding: "8px 12px", cursor: "pointer", color: "#71717a", borderBottom: "1px solid #eee" }}
                                        onClick={() => {
                                            setForm({ ...form, menu_id: "" });
                                            setShowMenuDropdown(false);
                                        }}
                                    >
                                        select
                                    </div>
                                    {menus.map(m => (
                                        <div
                                            key={m.id}
                                            style={{
                                                padding: "8px 12px",
                                                cursor: "pointer",
                                                backgroundColor: form.menu_id === m.id.toString() ? "#f1f5f9" : "transparent"
                                            }}
                                            onClick={() => {
                                                setForm({ ...form, menu_id: m.id.toString() });
                                                setShowMenuDropdown(false);
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = form.menu_id === m.id.toString() ? "#f1f5f9" : "transparent")}
                                        >
                                            {m.menu_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="input-box">
                            <label>Menu Title</label>
                            <input type="text" placeholder="Enter master name" value={form.master_name} onChange={(e) => setForm({ ...form, master_name: e.target.value })} required />
                        </div>
                        <div className="input-box">
                            <label>Title</label>
                            <input type="text" placeholder="Enter title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div className="input-box">
                            <label>Status</label>
                            <select value={form.status ? "active" : "inactive"} onChange={(e) => setForm({ ...form, status: e.target.value === "active" })} >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="input-box span-full">
                            <label>Description</label>
                            <textarea placeholder="Enter description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                    </div>

                    <div className="action-tray">
                        <div className="image-tray">
                            <div className="sq-prev" style={{ position: "relative" }}>
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
                            <input type="file" id="cat-img" hidden onChange={handleImageChange} accept="image/*" />
                            <button type="button" className="btn-c btn-blue-up" onClick={() => document.getElementById('cat-img')?.click()}>Choose File</button>
                        </div>
                        <div className="btn-tray">
                            <button type="submit" className="btn-c btn-save-gr">{saving ? "Saving..." : "Save"}</button>
                            <button type="button" className="btn-c btn-re" onClick={resetForm}>Reset</button>
                            <button type="button" className="btn-c btn-sky" onClick={resetForm}>Cancel</button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="tab-list-card">
                <div className="title-line">View Category Tab Heading Master List</div>
                <hr className="dash-sep" />
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

                <table className="tab-list-table">
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
                        {loading ? (
                            <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>Loading...</td></tr>
                        ) : currentHeadings.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>No entries found</td></tr>
                        ) : (
                            currentHeadings.map((h, i) => (
                                <tr key={h.id}>
                                    <td>{(currentPage - 1) * pageSize + i + 1}</td>
                                    <td>{getMenuName(h.multitab_menu_id)}</td>
                                    <td>{h.heading_name}</td>
                                    <td><span className={`stat-p ${h.status === "active" ? "ac" : "in"}`}>{h.status}</span></td>
                                    <td>
                                        <button onClick={() => { setForm({ id: h.id, menu_id: h.multitab_menu_id.toString(), master_name: h.heading_name, title: h.title, description: h.description, status: h.status === "active", image: null }); setImagePreview(h.image); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ background: "#1a237e", color: "#fff", padding: "6px", border: "none", borderRadius: "4px", marginRight: "5px" }}><SquarePen size={14} /></button>
                                        <button onClick={() => handleDelete(h.id)} style={{ background: "#ef4444", color: "#fff", padding: "6px", border: "none", borderRadius: "4px" }}><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AddCategoryTabHeadingMaster;
