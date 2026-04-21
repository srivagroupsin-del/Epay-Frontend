import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMenuTitles } from "../menutitle/menuTitle.api";
import { getMenus } from "../menu/menu.api";
import type { MenuTitle } from "../menutitle/menuTitle.types";

interface MenuField {
    id: number;
    page_title: string;
    link?: string;
}

interface MappingItem {
    id: number;
    menu_title_id: string;
    menu_id: string;
    title: string;
    menu: string;
    link: string;
    status: "active" | "inactive";
}

const EditMenuMapping: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [titles, setTitles] = useState<MenuTitle[]>([]);
    const [menus, setMenus] = useState<MenuField[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [form, setForm] = useState({
        menu_title_id: "",
        menu_id: "",
        status: true,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [titleRes, menuRes] = await Promise.all([
                    getMenuTitles(),
                    getMenus()
                ]);

                setTitles(titleRes.data || titleRes);
                setMenus(menuRes.data || menuRes);

                // Load existing mapping data
                const storedMappings = localStorage.getItem("menu_mappings_data");
                if (storedMappings) {
                    const mappings = JSON.parse(storedMappings);
                    const existingMapping = mappings.find((m: MappingItem) => m.id === Number(id));

                    if (existingMapping) {
                        setForm({
                            menu_title_id: existingMapping.menu_title_id,
                            menu_id: existingMapping.menu_id,
                            status: existingMapping.status === "active",
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const storedMappings = localStorage.getItem("menu_mappings_data");
            const mappings = storedMappings ? JSON.parse(storedMappings) : [];

            // Find selected options to store name along with ID
            const selectedTitle = titles.find(t => String(t.id) === String(form.menu_title_id));
            const selectedMenu = menus.find(m => String(m.id) === String(form.menu_id));

            const updatedMapping = {
                id: Number(id),
                menu_title_id: form.menu_title_id,
                menu_id: form.menu_id,
                title: selectedTitle ? selectedTitle.menu_title : "Unknown",
                menu: selectedMenu ? selectedMenu.page_title : "Unknown",
                link: selectedMenu ? selectedMenu.link || "/" : "/",
                status: form.status ? "active" : "inactive"
            };

            const updatedMappings = mappings.map((m: MappingItem) =>
                m.id === Number(id) ? updatedMapping : m
            );

            localStorage.setItem("menu_mappings_data", JSON.stringify(updatedMappings));

            console.log("Updated Mapping:", updatedMapping);
            navigate("/settings/menu-mapping");
        } catch (error) {
            console.error("Update failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        // Reload original data
        const storedMappings = localStorage.getItem("menu_mappings_data");
        if (storedMappings) {
            const mappings = JSON.parse(storedMappings);
            const existingMapping = mappings.find((m: MappingItem) => m.id === Number(id));

            if (existingMapping) {
                setForm({
                    menu_title_id: existingMapping.menu_title_id,
                    menu_id: existingMapping.menu_id,
                    status: existingMapping.status === "active",
                });
            }
        }
    };

    if (initialLoading) {
        return (
            <div className="page-container">
                <div style={{ textAlign: "center", padding: "50px" }}>
                    Loading mapping data...
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <form className="form-card" onSubmit={handleUpdate} style={{ maxWidth: "1200px" }}>
                <div className="form-header" style={{ borderBottom: "1px solid #f1f5f9", padding: "20px 30px" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>Edit Mapping</h2>
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
                        {loading ? "Updating..." : "Update Mapping"}
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

export default EditMenuMapping;
