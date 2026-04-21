import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SquarePen, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import "./tabHeadingMaster.css";
import {
    getMenus,
    type Menu
} from "../../../../api/multitab/sector_menu.api";
import {
    createHeading as createTabHeading,
    getHeadingsByMenu as getHeadingsByTab,
    updateHeading as updateTabHeading,
    deleteHeading as deleteTabHeading,
    type Heading as TabHeading,
} from "../../../../api/multitab/sector_heading.api";

const TabHeadingMaster: React.FC = () => {
    // Data Lists
    const [menus, setMenus] = useState<Menu[]>([]);
    const [list, setList] = useState<TabHeading[]>([]);

    // Form State
    const [searchParams] = useSearchParams();
    const menuIdFromUrl = searchParams.get("menuId") || "";
    const [menuId, setMenuId] = useState(menuIdFromUrl);

    const [form, setForm] = useState({
        heading_name: "",
        title: "",
        description: "",
        image: "",
        status: 1,
    });

    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [search] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);


    // Table Pagination State
    const [pageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadAllMenus();
    }, []);



    const loadAllMenus = async () => {
        try {
            console.log("📡 Loading menus for Tab Heading dropdown...");
            const res = await getMenus();
            console.log("📦 Menus received:", res);
            setMenus(res);

            // Auto-select first menu if none in URL
            if (!menuIdFromUrl && res.length > 0 && !menuId) {
                setMenuId(res[0].id.toString());
                console.log("🎯 Auto-selected first menu:", res[0]);
            }
        } catch (error) {
            console.error("❌ Failed to load menus:", error);
        }
    };

    useEffect(() => {
        if (menuId) {
            loadHeadings(Number(menuId));
        } else {
            setList([]);
        }
    }, [menuId]);

    const loadHeadings = async (id: number) => {
        try {
            setLoading(true);
            console.log("📡 Loading headings for menu ID:", id);
            const data = await getHeadingsByTab(id);
            console.log("📦 Headings received:", data);
            setList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("❌ Failed to load headings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setForm({ ...form, [name]: checked });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!menuId) {
            alert("Please select a Menu");
            return;
        }

        const formData = new FormData();
        formData.append("multitab_menu_id", menuId);
        formData.append("heading_name", form.heading_name);
        formData.append("title", form.title);
        formData.append("description", form.description);
        formData.append("status", String(form.status));

        if (imageFile) {
            formData.append("image", imageFile);
        }

        try {
            setSaving(true);
            if (isEdit && editId) {
                await updateTabHeading(editId, formData);
                alert("Heading updated successfully ✅");
            } else {
                await createTabHeading(formData);
                alert("Heading created successfully ✅");
            }
            await loadHeadings(Number(menuId));
            handleReset(false);
        } catch (error: any) {
            console.error("❌ Save failed:", error);
            alert(`Failed to save: ${error.message || "Unknown error"}`);
        } finally {
            setSaving(false);
        }
    };

    const isStatusActive = (status: any) => {
        return status === 1 || status === "1" || status === "active" || status === true;
    };

    const handleToggleStatus = async (item: TabHeading) => {
        const active = isStatusActive(item.status);
        if (!window.confirm(`Are you sure you want to change status to ${active ? 'Inactive' : 'Active'}?`)) {
            return;
        }

        try {
            const formData = new FormData();
            // We need to send other required fields if the backend validation is strict, 
            // but typically for partial updates we might need a different endpoint.
            // However, assuming updateTabHeading handles partials or we send everything.
            // It's safer to send everything for PUT requests usually.
            formData.append("multitab_menu_id", String(item.multitab_menu_id));
            formData.append("heading_name", item.heading_name);
            formData.append("title", item.title);
            formData.append("description", item.description);
            formData.append("status", active ? "0" : "1");
            // For image, we don't change it, so we don't append "image"

            await updateTabHeading(item.id, formData);
            loadHeadings(Number(menuId));
        } catch (error) {
            console.error("Status update failed", error);
            alert("Failed to update status ❌");
        }
    };

    const handleEdit = (item: TabHeading) => {
        const active = isStatusActive(item.status);

        setForm({
            heading_name: item.heading_name,
            title: item.title,
            description: item.description,
            image: item.image || "",
            status: active ? 1 : 0,
        });
        setEditId(item.id);
        setIsEdit(true);
        setPreview(item.image || null);
        setImageFile(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Are you sure you want to delete?")) {
            try {
                await deleteTabHeading(id);
                loadHeadings(Number(menuId));
                alert("Deleted successfully ✅");
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    const handleReset = (fullReset = true) => {
        setForm({
            heading_name: "",
            title: "",
            description: "",
            image: "",
            status: 1,
        });
        setImageFile(null);
        setIsEdit(false);
        setEditId(null);
        setPreview(null);
        if (fullReset) {
            setMenuId("");
        }
    };

    const filteredList = list.filter((item: TabHeading) =>
        (item.heading_name || "").toLowerCase().includes(search.toLowerCase())
    );

    const lastIdx = currentPage * pageSize;
    const firstIdx = lastIdx - pageSize;
    const currentItems = filteredList.slice(firstIdx, lastIdx);
    const totalPages = Math.ceil(filteredList.length / pageSize);

    return (
        <div className="page-container">
            {/* FORM CARD */}
            <div className="form-card">
                <div className="form-header-title">
                    {isEdit ? "Edit Tab Heading Master" : "Add Tab Heading Master"}
                </div>
                <hr className="dashed-divider" />

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {/* Multi Tab Menu Custom Dropdown */}
                        <div className="input-field-group">
                            <label>Tab Heading (Menu)</label>
                            <select
                                value={menuId}
                                onChange={(e) => setMenuId(e.target.value)}
                                disabled={isEdit}
                                style={{
                                    width: "100%",
                                    padding: "14px 18px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "12px",
                                    background: isEdit ? "#f8fafc" : "#fff",
                                    cursor: isEdit ? "not-allowed" : "pointer",
                                    fontSize: "15px",
                                    color: menuId ? "#334155" : "#94a3b8",
                                    height: "52px",
                                    outline: "none"
                                }}
                            >
                                <option value="">Select Multi Tab Menu...</option>
                                {menus.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.menu_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tab Heading Name */}
                        <div className="input-field-group">
                            <label>Tab Heading Master</label>
                            <input
                                name="heading_name"
                                value={form.heading_name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Title */}
                        <div className="input-field-group">
                            <label>Title</label>
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Status */}
                        <div className="input-field-group">
                            <label>Status</label>
                            <select
                                name="status"
                                value={form.status === 1 ? "active" : "inactive"}
                                onChange={(e) => setForm({ ...form, status: e.target.value === "active" ? 1 : 0 })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div className="input-field-group full-width">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Bottom Action Row Wrapper */}
                    <div className="action-row-container">
                        <div className="upload-section">
                            <input type="file" id="head-img" hidden onChange={handleImage} accept="image/*" />
                            <div className="image-preview-box" style={{ position: "relative" }}>
                                {preview ? (
                                    <>
                                        <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                                        {preview && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setForm({ ...form, image: "" });
                                                    setPreview(null);
                                                    setImageFile(null);
                                                }}
                                                style={{
                                                    position: "absolute",
                                                    top: "-12px",
                                                    right: "-12px",
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
                                                    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                                                    zIndex: 10
                                                }}
                                                title="Delete Image"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    "Preview"
                                )}
                            </div>
                            <div className="upload-actions">
                                <label
                                    htmlFor="head-img"
                                    className="btn-upload"
                                >
                                    Choose File
                                </label>
                            </div>
                        </div>

                        <div className="btn-group-right">
                            <button type="submit" disabled={saving} className="btn-premium btn-save">
                                {saving ? "Saving..." : isEdit ? "Update" : "Save"}
                            </button>
                            <button type="button" onClick={() => handleReset(true)} className="btn-premium btn-reset">
                                Reset
                            </button>
                            <button type="button" onClick={() => handleReset(true)} className="btn-premium btn-cancel">
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* VIEW TABLE CARD */}
            <div className="table-card">
                <div className="table-title">
                    View Tab Heading Master List
                    {menuId && menus.find(m => m.id.toString() === menuId) && (
                        <span style={{ color: "#2c3dd7", marginLeft: "10px", fontSize: "0.8em" }}>
                            — {menus.find(m => m.id.toString() === menuId)?.menu_name}
                        </span>
                    )}
                </div>
                <hr className="dashed-divider" />

                <div className="table-wrapper">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th># ↕</th>
                                <th>Title ↕</th>
                                <th>Label ↕</th>
                                <th>Image ↕</th>
                                <th>Status ↕</th>
                                <th>Action ↕</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px" }}>Loading...</td></tr>
                            ) : currentItems.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>No data found</td></tr>
                            ) : (
                                currentItems.map((item, idx) => {
                                    const active = isStatusActive(item.status);
                                    return (
                                        <tr key={item.id}>
                                            <td>{firstIdx + idx + 1}</td>
                                            <td>{item.title}</td>
                                            <td>{item.heading_name}</td>
                                            <td>
                                                {item.image && (
                                                    <img
                                                        src={item.image}
                                                        alt=""
                                                        style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }}
                                                    />
                                                )}
                                            </td>
                                            <td>
                                                <span
                                                    className={`status-badge ${active ? 'active' : 'inactive'}`}
                                                    onClick={() => handleToggleStatus(item)}
                                                    style={{ cursor: "pointer" }}
                                                    title="Click to toggle status"
                                                >
                                                    {active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button className="btn-icon btn-edit" title="Edit" onClick={() => handleEdit(item)}>
                                                        <SquarePen size={18} />
                                                    </button>
                                                    <button className="btn-icon btn-delete" title="Delete" onClick={() => handleDelete(item.id)}>
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

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
                    <div style={{ color: "#64748b", fontSize: "14px" }}>
                        Showing {filteredList.length > 0 ? firstIdx + 1 : 0} to {Math.min(lastIdx, filteredList.length)} of {filteredList.length} entries
                    </div>
                    {totalPages > 0 && (
                        <div style={{ display: "flex", gap: "5px" }}>
                            <button className="btn-icon" style={{ background: "#f1f5f9", color: "#4b5563" }} disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft size={16} /></button>
                            <button className="btn-icon" style={{ background: "#f1f5f9", color: "#4b5563" }} disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}><ChevronLeft size={16} /></button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: currentPage === i + 1 ? "#1a237e" : "#f1f5f9", color: currentPage === i + 1 ? "#fff" : "#4b5563", cursor: "pointer", fontWeight: "600" }}>{i + 1}</button>
                            ))}
                            <button className="btn-icon" style={{ background: "#f1f5f9", color: "#4b5563" }} disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}><ChevronRight size={16} /></button>
                            <button className="btn-icon" style={{ background: "#f1f5f9", color: "#4b5563" }} disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}><ChevronsRight size={16} /></button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default TabHeadingMaster;
