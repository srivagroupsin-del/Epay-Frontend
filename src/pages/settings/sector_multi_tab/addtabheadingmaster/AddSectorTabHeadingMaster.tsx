import { useState, useEffect } from "react";
import { SquarePen, Trash2 } from "lucide-react";
import "./addSectorTabHeading.css";
import { getMenus, getTabHeadings, createTabHeading, updateTabHeading, deleteTabHeading } from "../models/multitab.api";
import type { MultitabMenu, TabHeading } from "../models/multitab.api";

const AddSectorTabHeadingMaster = () => {
    const [menus, setMenus] = useState<MultitabMenu[]>([]);
    const [tabHeadings, setTabHeadings] = useState<TabHeading[]>([]);
    const [, setLoading] = useState(true);
    const [form, setForm] = useState({
        menu_id: 0,
        master_name: "",
        title: "",
        description: "",
        status: true,
        image: null as File | null,
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage] = useState(1);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [menusData, headingsData] = await Promise.all([
                getMenus(),
                getTabHeadings()
            ]);
            setMenus(menusData);
            setTabHeadings(headingsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: name === "menu_id" ? Number(value) : value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setForm(prev => ({ ...prev, image: file }));
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const resetForm = () => {
        setForm({
            menu_id: 0,
            master_name: "",
            title: "",
            description: "",
            status: true,
            image: null,
        });
        setEditingId(null);
        setPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const submissionData = {
                ...form,
                status: form.status ? "active" : "inactive"
            };
            if (editingId) {
                await updateTabHeading(editingId, submissionData);
                alert("Success ✅");
            } else {
                await createTabHeading(submissionData);
                alert("Success ✅");
            }
            resetForm();
            fetchInitialData();
        } catch (error: any) {
            alert("Failed ❌");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (heading: TabHeading) => {
        setForm({
            menu_id: heading.menu_id || 0,
            master_name: heading.master_name || "",
            title: heading.title,
            description: heading.description,
            status: heading.status === "active",
            image: null,
        });
        setEditingId(heading.id);
        if (heading.image) setPreview(heading.image);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteTabHeading(id);
            fetchInitialData();
        } catch (err: any) { }
    };

    const filtered = tabHeadings.filter(h =>
        h.master_name.toLowerCase().includes(search.toLowerCase()) ||
        h.title.toLowerCase().includes(search.toLowerCase())
    );

    const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="page-container">
            <div className="form-box">
                <div className="t-head">{editingId ? "Edit Sector Tab Heading Master" : "Add Tab Heading Master"}</div>
                <hr className="d-sep" />

                <form onSubmit={handleSubmit}>
                    <div className="g-layout">
                        <div className="i-group">
                            <label>Tab Heading</label>
                            <select name="menu_id" value={form.menu_id} onChange={handleChange}>
                                <option value={0}>Select Tab Heading</option>
                                {menus.map(menu => <option key={menu.id} value={menu.id}>{menu.name}</option>)}
                            </select>
                        </div>
                        <div className="i-group">
                            <label>Menu Title</label>
                            <input type="text" name="master_name" placeholder="Enter Menu Title..." value={form.master_name} onChange={handleChange} required />
                        </div>
                        <div className="i-group">
                            <label>Title</label>
                            <input type="text" name="title" placeholder="Enter Title..." value={form.title} onChange={handleChange} />
                        </div>
                        <div className="i-group">
                            <label>Status</label>
                            <select value={form.status ? "active" : "inactive"} onChange={(e) => setForm({ ...form, status: e.target.value === "active" })} >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="i-group col-span-2">
                            <label>Description</label>
                            <textarea name="description" placeholder="Enter description..." value={form.description} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="a-row">
                        <div className="u-side">
                            <div className="p-box" style={{ position: "relative" }}>
                                {preview ? <img src={preview} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} /> : "Image Preview"}
                                {preview && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForm({ ...form, image: null });
                                            setPreview(null);
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
                                )}
                            </div>
                            <input type="file" id="sec-img" hidden onChange={handleFileChange} accept="image/*" />
                            <button type="button" className="btn-p btn-u-b" onClick={() => document.getElementById('sec-img')?.click()}>Choose File</button>
                        </div>
                        <div className="b-side">
                            <button type="submit" className="btn-p btn-s-g">{saving ? "Saving..." : "Save"}</button>
                            <button type="button" className="btn-p btn-r-r" onClick={resetForm}>Reset</button>
                            <button type="button" className="btn-p btn-c-b" onClick={resetForm}>Cancel</button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="l-card">
                <div className="t-head">View Sector Tab Heading Master List</div>
                <hr className="d-sep" />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "14px" }}>
                    <div>Show
                        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ margin: "0 8px" }}>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                        entries
                    </div>
                    <div>Search: <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "4px", border: "1px solid #ddd" }} /></div>
                </div>

                <table className="l-table">
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
                        {currentData.map((h, i) => (
                            <tr key={h.id}>
                                <td>{(currentPage - 1) * pageSize + i + 1}</td>
                                <td>{menus.find(m => m.id === (h.menu_id || h.multitab_menu_id))?.name || h.menu_id || h.multitab_menu_id}</td>
                                <td>{h.master_name}</td>
                                <td><span className={`s-badge ${h.status === "active" ? "active" : "inactive"}`}>{h.status}</span></td>
                                <td>
                                    <button onClick={() => handleEdit(h)} style={{ background: "#1a237e", color: "#fff", padding: "6px", border: "none", borderRadius: "4px", marginRight: "5px" }}><SquarePen size={14} /></button>
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

export default AddSectorTabHeadingMaster;
