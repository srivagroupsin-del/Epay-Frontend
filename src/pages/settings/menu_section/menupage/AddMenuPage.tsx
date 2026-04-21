import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";

const AddMenuPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form, setForm] = useState({
        menu_title: "",
        page_title: "",
        link: "",
        itab: "",
        status: true,
        image: null as File | null
    });
    const [preview, setPreview] = useState<string | null>(null);

    // Load data if in edit mode
    useEffect(() => {
        if (id) {
            const savedPages = localStorage.getItem("menu_pages_data");
            if (savedPages) {
                const pages = JSON.parse(savedPages);
                const pageToEdit = pages.find((p: any) => p.id === Number(id));
                if (pageToEdit) {
                    setForm({
                        menu_title: pageToEdit.menu_title || "", // stored menu_title if available
                        page_title: pageToEdit.page_title,
                        link: pageToEdit.link,
                        itab: pageToEdit.itab,
                        status: pageToEdit.status === "active",
                        image: null // Cannot easily restore file object from local storage
                    });
                    // If we stored an image URL or name, we might handle preview here, 
                    // but for now we skip complex image persistence in localStorage
                }
            }
        }
    }, [id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setForm({ ...form, image: file });

            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const storedData = localStorage.getItem("menu_pages_data");
        const pages = storedData ? JSON.parse(storedData) : [];


        if (id) {
            // Update existing
            const index = pages.findIndex((p: any) => p.id === Number(id));
            if (index !== -1) {
                pages[index] = {
                    ...pages[index],
                    menu_title: form.menu_title,
                    page_title: form.page_title,
                    link: form.link,
                    itab: form.itab,
                    status: form.status ? "active" : "inactive",
                    icon_name: preview || pages[index].icon_name // Store data URL or keep existing
                };
            }
        } else {
            // Create new
            const newPage = {
                id: Date.now(), // Simple ID generation
                menu_title: form.menu_title,
                page_title: form.page_title,
                link: form.link,
                itab: form.itab,
                icon_name: preview || "LayoutDashboard", // Store data URL or default
                status: form.status ? "active" : "inactive"
            };
            pages.push(newPage);
        }

        localStorage.setItem("menu_pages_data", JSON.stringify(pages));
        console.log("Saved Menu Pages:", pages);
        navigate("/settings/menu-pages");
    };

    return (
        <div className="page-container">
            <form className="form-card" onSubmit={handleSubmit} style={{ maxWidth: "1000px" }}>
                <div className="form-header">
                    <h2>{id ? "Edit Menu Page" : "Add Menu Page"}</h2>
                </div>

                <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 40px" }}>
                   {/* <div className="inline-form-field">
                        {/* <label>Menu Title</label>
                        <input
                            name="menu_title"
                            placeholder="Enter Page Title"
                            value={form.menu_title}
                            onChange={handleChange}
                            style={{ paddingLeft: "12px", borderRadius: "8px" }}
                        /> */}
                    {/* </div> */} 
                    <div className="inline-form-field">
                        <label>Sub Menu Title</label>
                        <input
                            name="page_title"
                            placeholder="Enter Sub Menu Title"
                            value={form.page_title}
                            onChange={handleChange}
                            style={{ paddingLeft: "12px", borderRadius: "8px" }}
                        />
                    </div>
                    <div className="inline-form-field">
                        <label>Itab</label>
                        <input
                            name="itab"
                            placeholder="Enter Itab"
                            value={form.itab}
                            onChange={handleChange}
                            style={{ paddingLeft: "12px", borderRadius: "8px" }}
                        />
                    </div>

                    {/* Row 2 - Link below Page Title */}
                    <div className="inline-form-field">
                        <label>Link</label>
                        <input
                            name="link"
                            placeholder="Enter Link"
                            value={form.link}
                            onChange={handleChange}
                            style={{ paddingLeft: "12px", borderRadius: "8px" }}
                        />
                    </div>
                    <div></div>

                    {/* Row 3 - Image & Status precisely aligned */}
                    <div className="inline-form-field" style={{ gridColumn: "1 / -1", marginTop: "15px" }}>
                        <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#374151" }}>Image</label>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
                                <div style={{ position: "relative" }}>
                                    <div style={{
                                        width: "90px",
                                        height: "90px",
                                        border: "1px dashed #d1d5db",
                                        borderRadius: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                        background: "#fff"
                                    }}>
                                        {preview ? (
                                            <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <div style={{ width: "100%", height: "100%" }}></div>
                                        )}
                                    </div>

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
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label
                                        htmlFor="icon-file"
                                        className="btn-upload-file"
                                        style={{
                                            height: "fit-content",
                                            width: "fit-content",
                                            padding: "10px 24px",
                                            borderRadius: "10px",
                                            margin: "70px 100px",
                                            background: "#2c3dd7"
                                        }}
                                    >
                                        Choose File
                                    </label>
                                </div>
                                <input
                                    type="file"
                                    id="icon-file"
                                    style={{ display: "none" }}
                                    onChange={handleFileChange}
                                    accept="image/*,.ico,.cur,.gif,.jpg,.jpeg,.png,.svg,.webp"
                                />
                            </div>

                            {/* Status Aligned to Right and Centered vertically with Frame/Button */}
                            <div style={{ position: "relative", width: "300px" }}>
                                <label style={{
                                    position: "absolute",
                                    top: "-10px",
                                    left: "12px",
                                    background: "#fff",
                                    padding: "0 4px",
                                    fontSize: "12px",
                                    color: "#6b7280",
                                    zIndex: 1
                                }}>
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={form.status ? "active" : "inactive"}
                                    onChange={(e) => setForm({ ...form, status: e.target.value === "active" })}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "8px",
                                        outline: "none",
                                        appearance: "none",
                                        background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E\") no-repeat right 12px center",
                                        fontSize: "14px",
                                        color: "#374151"
                                    }}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions" style={{ justifyContent: "center", gap: "15px", marginTop: "40px" }}>
                    <button
                        type="submit"
                        className="btn"
                        style={{ background: "#22c55e", color: "white", padding: "10px 25px", borderRadius: "8px", fontWeight: "600", border: "none" }}
                    >
                        Save Menu page
                    </button>
                    <button
                        type="button"
                        className="btn"
                        onClick={() => {
                            setForm({ menu_title: "", page_title: "", link: "", itab: "", status: true, image: null });
                            setPreview(null);
                        }}
                        style={{ background: "#e5e7eb", color: "#374151", padding: "10px 25px", borderRadius: "8px", fontWeight: "600", border: "none" }}
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        className="btn"
                        onClick={() => navigate("/settings/menu-pages")}
                        style={{ background: "#5bc0de", color: "white", padding: "10px 25px", borderRadius: "8px", fontWeight: "600", border: "none" }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddMenuPage;
