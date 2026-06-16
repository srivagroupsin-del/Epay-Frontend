import React, { useEffect, useState, useRef } from "react";
import { Pencil, Trash2, Upload } from "lucide-react";
import {
  getMultitabCheckboxes,
  addMultitabCheckbox,
  updateMultitabCheckbox,
  deleteMultitabCheckbox,
} from "../../../api/multitab.api";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import { useDeleteConfirm } from "../../../context/DeleteConfirmContext";

interface MultitabCheckbox {
  id: number;
  label: string;
  files: string[];
  file_urls: string[];
  description: string;
  status: "active" | "inactive";
  tab_names?: string;
}

const MultitabCheckboxes: React.FC = () => {
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess, showDeleteSuccess } = useSuccessPopup();
  const { confirmDelete } = useDeleteConfirm();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [checkboxes, setCheckboxes] = useState<MultitabCheckbox[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    label: "",
    description: "",
    status: "active" as "active" | "inactive",
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);

  const loadData = async () => {
    try {
      showLoader("Loading checkboxes...");
      const res = await getMultitabCheckboxes();
      setCheckboxes(res);
    } catch (error) {
      console.error("Failed to load checkboxes:", error);
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
    setSelectedFiles(e.target.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()) {
      alert("Please fill all required fields");
      return;
    }

    try {
      showLoader(editingId ? "Updating Checkbox..." : "Saving Checkbox...");

      const formData = new FormData();
      formData.append("label", form.label.trim());
      formData.append("description", form.description.trim());
      formData.append("status", form.status);

      if (selectedFiles) {
        Array.from(selectedFiles).forEach((file) => {
          formData.append("files", file);
        });
      }

      // Tell the backend which existing files to retain
      existingFiles.forEach((f) => {
        formData.append("existing_files", f);
      });


      if (editingId) {
        await updateMultitabCheckbox(editingId, formData);
        showSuccess("Checkbox updated successfully.", "Successfully Updated!");
      } else {
        await addMultitabCheckbox(formData);
        showSuccess("Checkbox created successfully.", "Successfully Created!");
      }

      setForm({
        label: "",
        description: "",
        status: "active",
      });
      setSelectedFiles(null);
      setExistingFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setEditingId(null);
      await loadData();
    } catch (error: any) {
      alert(error.message || "Operation failed");
    } finally {
      hideLoader();
    }
  };

  const handleEdit = (cb: MultitabCheckbox) => {
    setEditingId(cb.id);
    setForm({
      label: cb.label,
      description: cb.description || "",
      status: cb.status,
    });
    setSelectedFiles(null);
    setExistingFiles(Array.isArray(cb.files) ? cb.files : []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleDelete = (id: number) => {
    confirmDelete(async () => {
      try {
        showLoader("Deleting checkbox...");
        await deleteMultitabCheckbox(id);
        showDeleteSuccess("Checkbox has been soft-deleted successfully.", "Deleted Successfully!");
        await loadData();
      } catch (error: any) {
        alert(error.message || "Failed to delete checkbox");
      } finally {
        hideLoader();
      }
    });
  };

  const handleCancel = () => {
    setForm({
      label: "",
      description: "",
      status: "active",
    });
    setSelectedFiles(null);
    setExistingFiles([]);
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
        <form ref={formRef} onSubmit={handleSubmit} style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          marginBottom: "40px",
        }}>
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>
              {editingId ? "Edit Checkbox (Code Module)" : "Add Checkbox (Code Module)"}
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
            <div style={{ position: "relative", gridColumn: "span 2" }}>
              <label style={floatingLabelStyle}>CHECKBOX LABEL *</label>
              <input
                type="text"
                name="label"
                value={form.label}
                onChange={handleChange}
                placeholder="Enter Checkbox Label (e.g. Scan Configuration, GST Verification)"
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
                rows={2}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <label style={floatingLabelStyle}>CODE / COMPONENT FILES</label>

              {/* Existing files from server */}
              {existingFiles.length > 0 && (
                <div style={{ marginBottom: "10px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {existingFiles.map((file, idx) => {
                    const name = file.substring(file.lastIndexOf("/") + 1);
                    return (
                      <span key={idx} style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "4px 10px", borderRadius: "6px", fontSize: "12px",
                        fontWeight: "600", background: "#eff6ff", color: "#3b82f6",
                        border: "1px solid #bfdbfe",
                      }}>
                        📄 {name}
                        <button
                          type="button"
                          onClick={() => setExistingFiles(prev => prev.filter((_, i) => i !== idx))}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#ef4444", fontSize: "14px", lineHeight: 1, padding: 0,
                          }}
                          title="Remove file"
                        >×</button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Upload new files */}
              <div style={{
                border: "2px dashed #cbd5e1",
                borderRadius: "10px",
                padding: "20px",
                textAlign: "center",
                background: "#f8fafc",
                cursor: "pointer",
              }} onClick={() => fileInputRef.current?.click()}>
                <Upload size={24} color="#6366f1" style={{ marginBottom: "8px" }} />
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  {selectedFiles && selectedFiles.length > 0
                    ? `${selectedFiles.length} new file(s) selected`
                    : existingFiles.length > 0
                      ? "Click to replace / add more files"
                      : "Click to select multiple code/component files"}
                </p>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Allowed: any file format (.tsx, .jsx, .ts, .js)</span>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <a
                      href="/sample_module.tsx"
                      download="sample_module.tsx"
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#4f46e5",
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                    >
                      Download Sample View
                    </a>
                    <span style={{ color: "#cbd5e1" }}>|</span>
                    <a
                      href="/sample_form_module.tsx"
                      download="sample_form_module.tsx"
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#4f46e5",
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                    >
                      Download Sample Form
                    </a>
                  </div>
                </div>
              </div>
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
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>Checkbox List</h3>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>S.NO</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>LABEL</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>TAB NAME</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>STATUS</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569", textAlign: "center" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {checkboxes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                      No Checkboxes Configured
                    </td>
                  </tr>
                ) : (
                  checkboxes.map((cb, index) => (
                    <tr key={cb.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px" }}>{index + 1}</td>
                      <td style={{ padding: "16px", fontWeight: "600", color: "#1e293b" }}>{cb.label}</td>
                      <td style={{ padding: "16px", color: "#64748b" }}>{cb.tab_names || "—"}</td>
                      {/* <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {cb.files && cb.files.length > 0 ? (
                            cb.files.map((file, idx) => (
                              <a
                                key={idx}
                                href={cb.file_urls[idx]}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  background: "#f1f5f9",
                                  color: "#475569",
                                  textDecoration: "none",
                                  border: "1px solid #e2e8f0",
                                }}
                                title="Click to view file"
                              >
                                <FileIcon size={12} color="#6366f1" />
                                {getFileName(file)}
                              </a>
                            ))
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "13px" }}>None</span>
                          )}
                        </div>
                      </td> */}
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: cb.status === "active" ? "#dcfce7" : "#fee2e2",
                          color: cb.status === "active" ? "#166534" : "#991b1b",
                        }}>
                          {cb.status.charAt(0).toUpperCase() + cb.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                          <button
                            onClick={() => handleEdit(cb)}
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
                            onClick={() => handleDelete(cb.id)}
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

export default MultitabCheckboxes;
