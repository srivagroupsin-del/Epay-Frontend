import React, { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { getMenuTitles } from "../menu_section/menutitle/menuTitle.api";
import {
  getMultitabMenus,
  addMultitabMenu,
  updateMultitabMenu,
  deleteMultitabMenu,
} from "../../../api/multitab.api";
import type { MenuTitle } from "../menu_section/menutitle/menuTitle.types";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import { useDeleteConfirm } from "../../../context/DeleteConfirmContext";

interface MultitabMenu {
  id: number;
  menu_title_id: number;
  menu_name: string;
  description: string;
  status: "active" | "inactive";
  menu_title_name?: string;
}

const MultitabMenus: React.FC = () => {
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess, showDeleteSuccess } = useSuccessPopup();
  const { confirmDelete } = useDeleteConfirm();

  const [menuTitles, setMenuTitles] = useState<MenuTitle[]>([]);
  const [menus, setMenus] = useState<MultitabMenu[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    menu_title_id: "",
    menu_name: "",
    description: "",
    status: "active" as "active" | "inactive",
  });

  const loadData = async () => {
    try {
      showLoader("Loading data...");
      const [titlesRes, menusRes] = await Promise.all([
        getMenuTitles(),
        getMultitabMenus(),
      ]);
      setMenuTitles(Array.isArray(titlesRes) ? titlesRes : titlesRes?.data || []);
      setMenus(menusRes);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.menu_title_id || !form.menu_name.trim()) {
      alert("Please fill all required fields");
      return;
    }

    try {
      showLoader(editingId ? "Updating Menu..." : "Saving Menu...");
      const payload = {
        menu_title_id: Number(form.menu_title_id),
        menu_name: form.menu_name.trim(),
        description: form.description.trim(),
        status: form.status,
      };

      if (editingId) {
        await updateMultitabMenu(editingId, payload);
        showSuccess("Menu updated successfully.", "Successfully Updated!");
      } else {
        await addMultitabMenu(payload);
        showSuccess("Menu created successfully.", "Successfully Created!");
      }

      setForm({
        menu_title_id: "",
        menu_name: "",
        description: "",
        status: "active",
      });
      setEditingId(null);
      await loadData();
    } catch (error: any) {
      alert(error.message || "Operation failed");
    } finally {
      hideLoader();
    }
  };

  const handleEdit = (menu: MultitabMenu) => {
    setEditingId(menu.id);
    setForm({
      menu_title_id: String(menu.menu_title_id),
      menu_name: menu.menu_name,
      description: menu.description || "",
      status: menu.status,
    });
  };

  const handleDelete = (id: number) => {
    confirmDelete(async () => {
      try {
        showLoader("Deleting menu...");
        await deleteMultitabMenu(id);
        showDeleteSuccess("Menu has been soft-deleted successfully.", "Deleted Successfully!");
        await loadData();
      } catch (error: any) {
        alert(error.message || "Failed to delete menu");
      } finally {
        hideLoader();
      }
    });
  };

  const handleCancel = () => {
    setForm({
      menu_title_id: "",
      menu_name: "",
      description: "",
      status: "active",
    });
    setEditingId(null);
  };

  const floatingLabelStyle: React.CSSProperties = {
    position: "absolute",
    top: "-10px",
    left: "12px",
    background: "#fff",
    padding: "0 6px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#6366f1",
    zIndex: 1,
    letterSpacing: "0.5px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#334155",
    outline: "none",
    background: "#fff",
  };

  return (
    <div className="page-container" style={{ padding: "40px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* Form Card */}
        <form onSubmit={handleSubmit} style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          marginBottom: "40px",
        }}>
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>
              {editingId ? "Edit Multitab Menu" : "Add Multitab Menu"}
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
            <div style={{ position: "relative" }}>
              <label style={floatingLabelStyle}>MENU TITLE *</label>
              <select
                name="menu_title_id"
                value={form.menu_title_id}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                  backgroundSize: "18px",
                }}
              >
                <option value="">Select Menu Title</option>
                {menuTitles.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.menu_title}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ position: "relative" }}>
              <label style={floatingLabelStyle}>MENU NAME *</label>
              <input
                type="text"
                name="menu_name"
                value={form.menu_name}
                onChange={handleChange}
                placeholder="Enter Menu Name"
                style={inputStyle}
              />
            </div>

            <div style={{ position: "relative", gridColumn: "span 2" }}>
              <label style={floatingLabelStyle}>DESCRIPTION</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter description (optional)"
                rows={3}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <label style={floatingLabelStyle}>STATUS</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                  backgroundSize: "18px",
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", marginTop: "40px" }}>
            <button
              type="submit"
              style={{
                background: "#4f46e5",
                color: "#fff",
                padding: "14px 40px",
                borderRadius: "12px",
                fontWeight: "700",
                border: "none",
                fontSize: "15px",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
              }}
            >
              {editingId ? "Update" : "Save"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: "#fff",
                  color: "#64748b",
                  padding: "14px 40px",
                  borderRadius: "12px",
                  fontWeight: "700",
                  border: "2px solid #f1f5f9",
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* List Card */}
        <div style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
        }}>
          <div style={{ marginBottom: "25px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>Multitab Menu List</h3>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>S.NO</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>MENU NAME</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>MENU TITLE</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>STATUS</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569", textAlign: "center" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {menus.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                      No Menus Configured
                    </td>
                  </tr>
                ) : (
                  menus.map((menu, index) => (
                    <tr key={menu.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px" }}>{index + 1}</td>
                      <td style={{ padding: "16px", fontWeight: "600", color: "#1e293b" }}>{menu.menu_name}</td>
                      <td style={{ padding: "16px", color: "#64748b" }}>{menu.menu_title_name || "—"}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: menu.status === "active" ? "#dcfce7" : "#fee2e2",
                          color: menu.status === "active" ? "#166534" : "#991b1b",
                        }}>
                          {menu.status.charAt(0).toUpperCase() + menu.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                          <button
                            onClick={() => handleEdit(menu)}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "#eff6ff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "none",
                              cursor: "pointer",
                            }}
                            title="Edit"
                          >
                            <Pencil size={15} color="#3b82f6" />
                          </button>
                          <button
                            onClick={() => handleDelete(menu.id)}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "#fef2f2",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "none",
                              cursor: "pointer",
                            }}
                            title="Delete"
                          >
                            <Trash2 size={15} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MultitabMenus;
