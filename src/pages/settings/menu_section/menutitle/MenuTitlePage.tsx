import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { MenuTitle } from "./menuTitle.types";
import {
  addMenuTitle,
  deleteMenuTitle,
  getMenuTitles,
  updateMenuTitle,
  updateMenuTitleStatus,
} from "./menuTitle.api";
import EmptyState from "../../../../components/emptystate/EmptyState";
import Alert from "../../../../components/alert/Alert";
import { Pencil, Trash2, ArrowUpDown, ChevronsLeft, ChevronsRight } from "lucide-react";
import "./MenuTitlePage.css";
import { useDeleteConfirm } from "../../../../context/DeleteConfirmContext";
import { useSuccessPopup } from "../../../../context/SuccessPopupContext";

const MenuTitlePage = () => {
  const [titles, setTitles] = useState<MenuTitle[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [titleName, setTitleName] = useState("");
  const [status, setStatus] =
    useState<"active" | "inactive" | "blocked">("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { confirmDelete } = useDeleteConfirm();
  const { showSuccess, showDeleteSuccess } = useSuccessPopup();

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = Number(searchParams.get("page")) || 1;
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [sortConfig, setSortConfig] = useState<{ key: keyof MenuTitle; direction: "asc" | "desc" } | null>(null);

  const loadTitles = async () => {
    try {
      setError("");
      const list = await getMenuTitles();
      setTitles(list);
    } catch (err: any) {
      console.error("Load failed:", err);
      setError("Unable to load menu titles. Please check your connection.");
      setTitles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTitles();
  }, []);

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!titleName.trim()) return;

    try {
      setSaving(true);
      setError("");

      if (editId !== null) {
        // 1️⃣ Update title
        await updateMenuTitle(editId, titleName);

        // 2️⃣ Update status (separate API)
        await updateMenuTitleStatus(editId, status);
      } else {
        await addMenuTitle(titleName);
      }

      resetForm();
      showSuccess(editId !== null ? "Menu title updated successfully." : "Menu title added successfully.", editId !== null ? "Successfully Updated!" : "Successfully Saved!");
      await loadTitles();
    } catch (err: any) {
      console.error("Save failed:", err);
      setError(err.message || "Operation failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    confirmDelete(async () => {
      try {
        await deleteMenuTitle(id);
        showDeleteSuccess("Menu Title has been deleted successfully.", "Deleted Successfully!");
        loadTitles();
      } catch (err: any) {
        console.error("Delete failed:", err);
      }
    }, "Delete this menu title?");
  };

  const resetForm = () => {
    setEditId(null);
    setTitleName("");
    setStatus("active");
  };

  /* ================= FILTER & PAGINATION ================= */
  const filteredTitles = titles
    .filter((item) =>
      item.menu_title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (key: keyof MenuTitle) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const totalPages = Math.ceil(filteredTitles.length / limit);
  const paginatedTitles = filteredTitles.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  // Safety: Reset current page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    setSearchParams({ page: String(currentPage) }, { replace: true });
  }, [currentPage, setSearchParams]);

  return (
    <div className="page-container menu-title-container">
      <form
        className="form-card menu-title-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {/* HEADER */}
        <div className="form-header">
          <h2>{editId ? "Edit Menu Title" : "Add Menu Title"}</h2>
          <p className="subtitle">
            {editId
              ? "Update existing details"
              : "Create a new menu title"}
          </p>
        </div>

        {/* GRID */}
        <div className="form-grid menu-title-form-grid">
          <div className="inline-form-field menu-title-field-wrapper">
            <label>Menu Title</label>
            <input
              placeholder="Enter Menu Title..."
              value={titleName}
              onChange={(e) => setTitleName(e.target.value)}
              required
            />
          </div>

          <div
            className="inline-form-field menu-title-field-wrapper"
          >
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="custom-select"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-save"
            disabled={saving}
          >
            {saving ? "Saving..." : (editId ? "Update" : "Save")}
          </button>

          {/* <button
            type="button"
            className="btn btn-reset"
            onClick={resetForm}
          >
            Reset
          </button> */}

          <button
            type="button"
            className="btn btn-cancel"
            onClick={resetForm}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* LIST */}
      <div className="card menu-title-list-card">
        <div className="page-header menu-title-list-header">
          <div>
            <h3>Menu Title List</h3>
          </div>
        </div>

        {/* TABLE CONTROLS */}
        <div className="table-controls menu-title-controls">
          <div className="menu-title-controls-group">
            <span style={{ fontSize: "14px", color: "#666" }}>Show</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="menu-title-select-limit"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span style={{ fontSize: "14px", color: "#666" }}>entries</span>
          </div>

          <div className="menu-title-controls-group">
            <span style={{ fontSize: "14px", color: "#666" }}>Search:</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search menu title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <Alert message={error} />
        {loading && <EmptyState message="Loading..." />}

        {!loading && titles.length > 0 && (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                      <div className="th-content">
                        S.NO <ArrowUpDown size={14} />
                      </div>
                    </th>
                    <th onClick={() => handleSort("menu_title")} style={{ cursor: "pointer" }}>
                      <div className="th-content">
                        MENU TITLE <ArrowUpDown size={14} />
                      </div>
                    </th>
                    <th onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                      <div className="th-content">
                        STATUS <ArrowUpDown size={14} />
                      </div>
                    </th>
                    <th className="menu-title-th-action">
                      <div className="th-content" style={{ justifyContent: "center" }}>
                        ACTION <ArrowUpDown size={14} />
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedTitles.map((item, i) => (
                    <tr key={item.id}>
                      <td>{(currentPage - 1) * limit + i + 1}</td>
                      <td style={{ fontWeight: "600", color: "#334155" }}>{item.menu_title}</td>
                      <td>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "700",
                            background: item.status === "active" ? "#dcfce7" : "#fee2e2",
                            color: item.status === "active" ? "#166534" : "#991b1b",
                            textTransform: "capitalize",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className="menu-title-action-cell" style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                          <button
                            className="action-btn edit"
                            onClick={() => {
                              setEditId(item.id);
                              setTitleName(item.menu_title);
                              setStatus(item.status);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "#eff6ff",
                              border: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                            title="Edit"
                          >
                            <Pencil size={15} color="#3b82f6" />
                          </button>

                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(item.id)}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "#fef2f2",
                              border: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                            title="Delete"
                          >
                            <Trash2 size={15} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PREMIUM PAGINATION */}
            <div className="pagination-container" style={{ padding: "20px 24px", justifyContent: "space-between", display: "flex", alignItems: "center" }}>
              <span className="pagination-text" style={{ fontSize: "14px", color: "#6b7280" }}>
                Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, filteredTitles.length)} of {filteredTitles.length} entries
              </span>

              {totalPages > 0 && (
                <div className="pagination-premium">
                  <button
                    className="pagination-btn nav-btn"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft size={18} />
                  </button>

                  {totalPages <= 7 ? (
                    [...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        className={`pagination-btn ${currentPage === i + 1 ? "active" : ""}`}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))
                  ) : (
                    [...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="pagination-dots" style={{ padding: "0 5px", color: "#6b7280" }}>...</span>;
                      }
                      return null;
                    })
                  )}

                  <button
                    className="pagination-btn nav-btn"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MenuTitlePage;

