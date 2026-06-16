import React, { useEffect, useState, useRef } from "react";
import { Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import {
  getMultitabMenus,
  getMultitabTabs,
  addMultitabTab,
  updateMultitabTab,
  deleteMultitabTab,
} from "../../../api/multitab.api";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import { useDeleteConfirm } from "../../../context/DeleteConfirmContext";

import { getMenuTitles } from "../menu_section/menutitle/menuTitle.api";
import type { MenuTitle } from "../menu_section/menutitle/menuTitle.types";

interface MultitabMenu {
  id: number;
  menu_name: string;
  menu_title_id: number;
}

interface MultitabTab {
  id: number;
  menu_id: number;
  tab_name: string;
  tab_title: string;
  description: string;
  image: string;
  image_url: string;
  status: "active" | "inactive";
  menu_name?: string;
}

const MultitabTabs: React.FC = () => {
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess, showDeleteSuccess } = useSuccessPopup();
  const { confirmDelete } = useDeleteConfirm();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [menus, setMenus] = useState<MultitabMenu[]>([]);
  const [tabs, setTabs] = useState<MultitabTab[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    menu_id: "",
    tab_name: "",
    tab_title: "",
    description: "",
    status: "active" as "active" | "inactive",
  });
  const [menuTitles, setMenuTitles] = useState<MenuTitle[]>([]);
  const [selectedMenuTitleId, setSelectedMenuTitleId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const loadData = async () => {
    try {
      showLoader("Loading data...");
      const [titlesRes, menusRes, tabsRes] = await Promise.all([
        getMenuTitles(),
        getMultitabMenus(),
        getMultitabTabs(),
      ]);
      setMenuTitles(Array.isArray(titlesRes) ? titlesRes : titlesRes?.data || []);
      setMenus(menusRes.filter((m: any) => m.status === "active"));
      setTabs(tabsRes);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.menu_id || !form.tab_name.trim() || !form.tab_title.trim()) {
      alert("Please fill all required fields");
      return;
    }

    try {
      showLoader(editingId ? "Updating Tab..." : "Saving Tab...");
      
      const formData = new FormData();
      formData.append("menu_id", form.menu_id);
      formData.append("tab_name", form.tab_name.trim());
      formData.append("tab_title", form.tab_title.trim());
      formData.append("description", form.description.trim());
      formData.append("status", form.status);
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      if (editingId) {
        await updateMultitabTab(editingId, formData);
        showSuccess("Tab heading updated successfully.", "Successfully Updated!");
      } else {
        await addMultitabTab(formData);
        showSuccess("Tab heading created successfully.", "Successfully Created!");
      }

      setForm({
        menu_id: "",
        tab_name: "",
        tab_title: "",
        description: "",
        status: "active",
      });
      setSelectedMenuTitleId("");
      setSelectedFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setEditingId(null);
      await loadData();
    } catch (error: any) {
      alert(error.message || "Operation failed");
    } finally {
      hideLoader();
    }
  };

  const handleEdit = (tab: MultitabTab) => {
    setEditingId(tab.id);
    setForm({
      menu_id: String(tab.menu_id),
      tab_name: tab.tab_name,
      tab_title: tab.tab_title,
      description: tab.description || "",
      status: tab.status,
    });
    const associatedMenu = menus.find(m => m.id === tab.menu_id);
    if (associatedMenu) {
      setSelectedMenuTitleId(String(associatedMenu.menu_title_id));
    } else {
      setSelectedMenuTitleId("");
    }
    setSelectedFile(null);
    setImagePreview(tab.image_url || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = (id: number) => {
    confirmDelete(async () => {
      try {
        showLoader("Deleting tab...");
        await deleteMultitabTab(id);
        showDeleteSuccess("Tab has been soft-deleted successfully.", "Deleted Successfully!");
        await loadData();
      } catch (error: any) {
        alert(error.message || "Failed to delete tab");
      } finally {
        hideLoader();
      }
    });
  };

  const handleCancel = () => {
    setForm({
      menu_id: "",
      tab_name: "",
      tab_title: "",
      description: "",
      status: "active",
    });
    setSelectedMenuTitleId("");
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
              {editingId ? "Edit Tab Heading" : "Add Tab Heading"}
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
            {/* Menu Title Filter */}
            <div style={{ position: "relative" }}>
              <label style={floatingLabelStyle}>MENU TITLE</label>
              <select
                name="menu_title_filter"
                value={selectedMenuTitleId}
                onChange={(e) => {
                  setSelectedMenuTitleId(e.target.value);
                  setForm(prev => ({ ...prev, menu_id: "" }));
                }}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                  backgroundSize: "18px",
                }}
              >
                <option value="">All Menu Titles</option>
                {menuTitles.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.menu_title}
                  </option>
                ))}
              </select>
            </div>

            {/* Multitab Menu Select */}
            <div style={{ position: "relative" }}>
              <label style={floatingLabelStyle}>MULTITAB MENU *</label>
              <select
                name="menu_id"
                value={form.menu_id}
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
                <option value="">Select Menu</option>
                {menus
                  .filter((m) => !selectedMenuTitleId || String(m.menu_title_id) === selectedMenuTitleId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.menu_name}
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ position: "relative" }}>
              <label style={floatingLabelStyle}>TAB NAME *</label>
              <input
                type="text"
                name="tab_name"
                value={form.tab_name}
                onChange={handleChange}
                placeholder="Enter Tab Name"
                style={inputStyle}
              />
            </div>

            <div style={{ position: "relative" }}>
              <label style={floatingLabelStyle}>TAB TITLE *</label>
              <input
                type="text"
                name="tab_title"
                value={form.tab_title}
                onChange={handleChange}
                placeholder="Enter Tab Title"
                style={inputStyle}
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

            <div style={{ position: "relative", gridColumn: "span 2" }}>
              <label style={floatingLabelStyle}>DESCRIPTION</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter tab description (optional)"
                rows={2}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

            {/* Image Upload Option */}
            <div style={{ gridColumn: "span 2", display: "flex", gap: "25px", alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <label style={floatingLabelStyle}>TAB IMAGE</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={inputStyle}
                />
              </div>

              {/* Preview Box */}
              <div style={{
                width: "90px",
                height: "90px",
                borderRadius: "12px",
                border: "2px dashed #cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc",
                overflow: "hidden",
              }}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <ImageIcon size={28} color="#94a3b8" />
                )}
              </div>
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
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>Tab Heading List</h3>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>S.NO</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>IMAGE</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>TAB NAME</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>TAB TITLE</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>MENU</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>STATUS</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569", textAlign: "center" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {tabs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                      No Tabs Configured
                    </td>
                  </tr>
                ) : (
                  tabs.map((tab, index) => (
                    <tr key={tab.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px" }}>{index + 1}</td>
                      <td style={{ padding: "16px" }}>
                        <div style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          background: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          {tab.image_url ? (
                            <img src={tab.image_url} alt={tab.tab_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <ImageIcon size={18} color="#94a3b8" />
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "16px", fontWeight: "600", color: "#1e293b" }}>{tab.tab_name}</td>
                      <td style={{ padding: "16px", color: "#334155" }}>{tab.tab_title}</td>
                      <td style={{ padding: "16px", color: "#64748b" }}>{tab.menu_name || "—"}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: tab.status === "active" ? "#dcfce7" : "#fee2e2",
                          color: tab.status === "active" ? "#166534" : "#991b1b",
                        }}>
                          {tab.status.charAt(0).toUpperCase() + tab.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                          <button
                            onClick={() => handleEdit(tab)}
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
                            onClick={() => handleDelete(tab.id)}
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

export default MultitabTabs;
