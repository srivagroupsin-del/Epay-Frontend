import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen, Trash2, Eye } from "lucide-react";
import "./addSectorMenu.css";

import {
    createMenu,
    getMenus,
    updateMenu,
    deleteMenu,
    type Menu
} from "../../../../api/multitab/sector_menu.api";

type StatusType = "active" | "inactive";

const MultiTabMenuPage: React.FC = () => {
    const navigate = useNavigate();

    const [menuList, setMenuList] = useState<Menu[]>([]);

    // FORM
    const [menuName, setMenuName] = useState("");
    const [status, setStatus] = useState<StatusType>("active");
    const [editingId, setEditingId] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMenus();
    }, []);

    // 🔥 ALWAYS FETCH FROM DB
    const fetchMenus = async () => {
        try {
            setLoading(true);
            console.log("📡 Fetching menus...");
            const res = await getMenus();
            console.log("📦 Menus received:", res);
            setMenuList(res);
        } catch (err) {
            console.error("❌ Failed to fetch menus:", err);
            setMenuList([]);
        } finally {
            setLoading(false);
        }
    };

    // SAVE / UPDATE
    const handleSave = async () => {
        if (!menuName.trim()) return alert("Menu name required");

        const payload = {
            menu_name: menuName,
            status: status,
            is_active: status === "active" ? 1 : 0
        };

        try {
            setSaving(true);

            if (editingId) {
                const result = await updateMenu(editingId, payload);
                console.log("✅ Menu updated:", result);
                alert("Menu updated successfully!");
            } else {
                const result = await createMenu(payload);
                console.log("✅ Menu created:", result);
                alert("Menu created successfully!");
            }

            resetForm();
            await fetchMenus(); // 🔥 VERY IMPORTANT - Reload table data
        } catch (err) {
            console.error("❌ Save failed:", err);
            alert(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setMenuName("");
        setStatus("active");
        setEditingId(null);
    };

    // EDIT
    const handleEdit = (item: Menu) => {
        setMenuName(item.menu_name || "");
        setStatus(item.status === "active" ? "active" : "inactive");
        setEditingId(item.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // DELETE
    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this menu?")) return;
        await deleteMenu(id);
        fetchMenus();
    };

    return (
        <div className="container">
            <h2 className="page-title">
                {editingId ? "Edit Multi Tab Menu" : "Add Multi Tab Menu"}
            </h2>

            {/* FORM */}
            <div className="merged-container">
                <div className="input-floating-group">
                    <label>Menu Name</label>
                    <input
                        value={menuName}
                        onChange={e => setMenuName(e.target.value)}
                    />
                </div>

                <div className="input-floating-group">
                    <label>Status</label>
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value as StatusType)}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="btn-row">
                <button className="btn save" onClick={handleSave} disabled={saving}>
                    {editingId ? "Update" : "Save"}
                </button>
                <button className="btn cancel" onClick={resetForm}>Cancel</button>
            </div>

            {/* TABLE */}
            <h3>View Multi Tab Title List</h3>
            <table className="redesign-table">

                <thead>
                    <tr>
                        <th>#</th>
                        <th>Menu Name</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={4}>Loading...</td></tr>
                    ) : menuList.length === 0 ? (
                        <tr><td colSpan={4}>No data</td></tr>
                    ) : (
                        menuList.map((item, i) => (
                            <tr key={item.id}>
                                <td>{i + 1}</td>
                                <td>{item.menu_name}</td>
                                <td>
                                    <span className={`badge ${item.status === "active" ? "active" : "inactive"}`}>
                                        {item.status === "active" ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="action edit" onClick={() => handleEdit(item)}>
                                            <SquarePen size={16} />
                                        </button>
                                        <button className="action delete" onClick={() => handleDelete(item.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                        <button className="action view" onClick={() =>
                                            navigate(`/multitab/add-tabheading?menuId=${item.id}`)
                                        }>
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default MultiTabMenuPage;
