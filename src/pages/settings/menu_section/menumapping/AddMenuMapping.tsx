import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMenuTitles } from "../menutitle/menuTitle.api";
import { getMenus } from "../menu/menu.api";
import type { MenuTitle } from "../menutitle/menuTitle.types";

interface MenuField {
    id: number;
    page_title: string;
}

const AddMenuMapping: React.FC = () => {
    const navigate = useNavigate();
    const [titles, setTitles] = useState<MenuTitle[]>([]);
    const [menus, setMenus] = useState<MenuField[]>([]);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        menu_title_id: "",
        menu_id: "",
        status: true,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const titleRes = await getMenuTitles();
                setTitles(titleRes.data || titleRes);

                const menuRes = await getMenus();
                setMenus(menuRes.data || menuRes);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const storedMappings = localStorage.getItem("menu_mappings_data");
            const mappings = storedMappings ? JSON.parse(storedMappings) : [];

            // Find selected options to store name along with ID
            const selectedTitle = titles.find(t => String(t.id) === String(form.menu_title_id));
            const selectedMenu = menus.find(m => String(m.id) === String(form.menu_id));

            const newMapping = {
                id: Date.now(),
                menu_title_id: form.menu_title_id,
                menu_id: form.menu_id,
                title: selectedTitle ? selectedTitle.menu_title : "Unknown",
                menu: selectedMenu ? selectedMenu.page_title : "Unknown",
                link: selectedMenu ? (selectedMenu as any).link || "/" : "/", // Assuming menu object has link, fallback if not
                status: form.status ? "active" : "inactive"
            };

            mappings.push(newMapping);
            localStorage.setItem("menu_mappings_data", JSON.stringify(mappings));

            console.log("Saved Mapping:", newMapping);
            navigate("/settings/menu-mapping");
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            menu_title_id: "",
            menu_id: "",
            status: true,
        });
    };

    return (
        <div className="page-container">
            <form className="form-card" onSubmit={handleSave} style={{ maxWidth: "1200px" }}>
                <div className="form-header" style={{ borderBottom: "1px solid #f1f5f9", padding: "20px 30px" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>Add Mapping</h2>
                </div>

                <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px 40px", padding: "30px" }}>
                    <div className="inline-form-field">
                        <label style={{ fontWeight: "600", marginBottom: "8px", display: "block", fontSize: "14px", color: "#374151" }}>Menu Title</label>
                        <select
                            name="menu_title_id"
                            value={form.menu_title_id}
                            onChange={handleChange}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", height: "45px", border: "1px solid #d1d5db", appearance: "none", background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E\") no-repeat right 12px center", backgroundColor: "#fff" }}
                        >
                            <option value="">select</option>
                            {titles.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.menu_title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="inline-form-field">
                        <label style={{ fontWeight: "600", marginBottom: "8px", display: "block", fontSize: "14px", color: "#374151" }}>Menu</label>
                        <select
                            name="menu_id"
                            value={form.menu_id}
                            onChange={handleChange}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", height: "45px", border: "1px solid #d1d5db", appearance: "none", background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E\") no-repeat right 12px center", backgroundColor: "#fff" }}
                        >
                            <option value="">select</option>
                            {menus.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.page_title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="inline-form-field" style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
                        <label style={{ fontWeight: "600", marginBottom: "15px", display: "block", fontSize: "14px", color: "#374151" }}>Status</label>
                        <div
                            onClick={() => setForm({ ...form, status: !form.status })}
                            style={{
                                width: "32px",
                                height: "32px",
                                backgroundColor: form.status ? "#007bff" : "#fff",
                                border: "2px solid #007bff",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            {form.status && (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            )}
                        </div>
                    </div>
                </div>

                <div className="form-actions" style={{ justifyContent: "center", gap: "15px", marginTop: "20px", paddingBottom: "30px" }}>
                    <button
                        type="submit"
                        className="btn"
                        disabled={loading}
                        style={{ background: "#22c55e", color: "white", padding: "10px 30px", borderRadius: "8px", fontWeight: "600", border: "none" }}
                    >
                        {loading ? "Saving..." : "Save Mapping"}
                    </button>
                    <button
                        type="button"
                        className="btn"
                        onClick={resetForm}
                        style={{ background: "#e5e7eb", color: "#374151", padding: "10px 30px", borderRadius: "8px", fontWeight: "600", border: "none" }}
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        className="btn"
                        onClick={() => navigate("/settings/menu-mapping")}
                        style={{ background: "#5bc0de", color: "white", padding: "10px 30px", borderRadius: "8px", fontWeight: "600", border: "none" }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddMenuMapping;
