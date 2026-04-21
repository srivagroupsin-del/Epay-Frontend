import { useEffect, useState, useRef, useMemo } from "react";
import { http } from "../../../base_api/base_api";
import { Check, Edit, Trash2, Search } from "lucide-react";
import "./CategoryTax.css";
import { getTaxes, createCategoryTax, getCategoryTaxes, deleteCategoryTax, updateCategoryTax } from "../../variant/models/tax.api";
import type { Tax, CategoryTaxPayload, CategoryTax as CategoryTaxResponse } from "../../variant/models/tax.api";

type Category = {
  id: number;
  category_name: string;
  category_type: "primary" | "secondary";
};

type CategoryTaxItem = {
  id: number;
  categoryId: string;
  categoryName: string;
  taxName: string;
  gstPercent: string;
  gstVariantId: string;
  hsnCode: string;
  status: "active" | "inactive";
};

type CategoryTaxForm = {
  categoryId: string;
  gstVariantId: string;
  hsnCode: string;
  status: "active" | "inactive";
};

const CategoryTax = () => {
  /* ======================
     STATES
  ====================== */
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxList, setTaxList] = useState<CategoryTaxItem[]>([]);
  const [form, setForm] = useState<CategoryTaxForm>({
    categoryId: "",
    gstVariantId: "",
    hsnCode: "",
    status: "active",
  });
  const [gstOptions, setGstOptions] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Searchable Dropdown States
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Primary" | "Secondary">("All");
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ======================
     LOAD DATA
  ====================== */
  const fetchTaxList = async () => {
    try {
      const res = await getCategoryTaxes();
      const list = Array.isArray(res) ? res : [];
      setTaxList(list.map((item: CategoryTaxResponse) => ({
        id: item.id,
        categoryId: String(item.category_id),
        categoryName: item.category_name || "Unknown",
        taxName: item.variant_name || item.name || "N/A",
        gstPercent: (() => {
          const val = item.gst_value || item.value || item.percentage || item.gst_percent || item.tax_percent || item.gst || item.tax || "0";
          return String(val).endsWith("%") ? String(val) : `${val}%`;
        })(),
        gstVariantId: String(item.gst_variant_id),
        hsnCode: item.hsn_code,
        status: (item.status === "active" || String(item.status) === "1") ? "active" : "inactive"
      })));
    } catch (err) {
      console.error("Failed to fetch tax list", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await http("/categories");
        const catData = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || catRes);
        setCategories(Array.isArray(catData) ? catData : []);

        // Fetch GST options from variant API
        const variantData = await getTaxes();
        setGstOptions(Array.isArray(variantData) ? variantData : []);

        // Fetch existing tax configurations
        await fetchTaxList();

        setLoading(false);
      } catch (err) {
        console.error("Fetch error", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ======================
     CLICK OUTSIDE
  ====================== */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ======================
     FILTERED CATEGORIES
  ====================== */
  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        const matchesSearch = cat.category_name.toLowerCase().includes(categorySearch.toLowerCase());
        const matchesFilter = categoryFilter === "All" || cat.category_type.toLowerCase() === categoryFilter.toLowerCase();
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => a.category_name.localeCompare(b.category_name));
  }, [categories, categorySearch, categoryFilter]);

  /* ======================
     HANDLERS
  ====================== */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleStatus = () => {
    setForm(prev => ({
      ...prev,
      status: prev.status === "active" ? "inactive" : "active"
    }));
  };

  const resetForm = () => {
    setForm({
      categoryId: "",
      gstVariantId: "",
      hsnCode: "",
      status: "active",
    });
    setEditId(null);
    setCategorySearch("");
    setCategoryFilter("All");
  };

  const handleEdit = (item: CategoryTaxItem) => {
    setForm({
      categoryId: item.categoryId,
      gstVariantId: item.gstVariantId,
      hsnCode: item.hsnCode,
      status: item.status,
    });
    setEditId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this tax configuration?")) {
      try {
        await deleteCategoryTax(id);
        alert("Deleted successfully 🗑️");
        fetchTaxList();
      } catch (error: any) {
        alert(error.message || "Failed to delete ❌");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.gstVariantId) {
      alert("Please fill in all required fields (Category, GST %)");
      return;
    }

    try {
      setSaving(true);
      const payload: CategoryTaxPayload = {
        category_id: Number(form.categoryId),
        gst_variant_id: Number(form.gstVariantId),
        hsn_code: form.hsnCode,
        status: form.status,
      };

      if (editId) {
        await updateCategoryTax(editId, payload);
        alert("Updated successfully ✅");
      } else {
        await createCategoryTax(payload);
        alert("Saved successfully ✅");
      }
      resetForm();
      fetchTaxList(); // Refresh the list
    } catch (error: any) {
      alert(error.message || "Failed to save category tax ❌");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="form-header">
        <div>
          <h2>Category Tax</h2>
          <p className="subtitle">
            Manage and monitor tax settings across all product categories
          </p>
        </div>
      </div>

      {/* ENTRY FORM CARD */}
      <div className="form-card" style={{
        marginBottom: "40px",
        overflow: "visible",
        zIndex: showCategoryList ? 1001 : 2,
        position: "relative"
      }}>
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Fetching data...</span>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>

              {/* CUSTOM SEARCHABLE CATEGORY DROPDOWN */}
              <div className="inline-form-field" ref={dropdownRef} style={{ position: "relative" }}>
                <label>CATEGORY LIST</label>
                <div
                  className="tax-select"
                  onClick={() => setShowCategoryList(!showCategoryList)}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    maxWidth: "100%",
                    background: "#fff"
                  }}
                >
                  <span style={{ color: form.categoryId ? "#1e293b" : "#94a3b8" }}>
                    {categories.find(c => String(c.id) === form.categoryId)?.category_name || "Select Category"}
                  </span>
                  <span style={{ fontSize: "10px" }}>▼</span>
                </div>

                {showCategoryList && (
                  <div className="dropdown-panel" style={{
                    position: "absolute",
                    top: "105%",
                    left: 0,
                    right: 0,
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    zIndex: 1000,
                    padding: "12px"
                  }}>
                    {/* FILTER TABS */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                      {["All", "Primary", "Secondary"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`filter-tab ${categoryFilter === type ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategoryFilter(type as any);
                          }}
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            border: categoryFilter === type ? "1px solid #2563eb" : "1px solid #e2e8f0",
                            background: categoryFilter === type ? "#eff6ff" : "#fff",
                            color: categoryFilter === type ? "#2563eb" : "#64748b",
                            cursor: "pointer",
                            fontWeight: 600
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {/* SEARCH INPUT */}
                    <div style={{ position: "relative", marginBottom: "12px" }}>
                      <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                      <input
                        type="text"
                        placeholder="Search category..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: "100%",
                          padding: "8px 10px 8px 32px",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "13px",
                          outline: "none"
                        }}
                        autoFocus
                      />
                    </div>

                    {/* LIST ITEMS */}
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className="drop-item"
                            onClick={() => {
                              setForm(prev => ({ ...prev, categoryId: String(cat.id) }));
                              setShowCategoryList(false);
                            }}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "14px",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: form.categoryId === String(cat.id) ? "#f1f5f9" : "transparent"
                            }}
                          >
                            <span>{cat.category_name}</span>
                            <span style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: cat.category_type === "primary" ? "#dcfce7" : "#fef9c3",
                              color: cat.category_type === "primary" ? "#166534" : "#854d0e",
                              textTransform: "capitalize"
                            }}>
                              {cat.category_type}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: "center", padding: "12px", color: "#94a3b8", fontSize: "13px" }}>
                          No categories found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* <div className="inline-form-field">
                <label>TAX NAME</label>
                <input
                  type="text"
                  name="taxName"
                  value={form.taxName}
                  onChange={handleChange}
                  className="hsn-input"
                />
              </div> */}

              <div className="inline-form-field">
                <label>GST %</label>
                <select
                  name="gstVariantId"
                  value={form.gstVariantId}
                  onChange={handleChange}
                  className="tax-select"
                  style={{ width: "100%", maxWidth: "100%" }}
                >
                  <option value="">Select GST</option>
                  {gstOptions
                    .filter(t => t.status === "active" || t.status === 1 || t.status === "1")
                    .map(tax => (
                      <option key={tax.id} value={tax.id}>
                        {tax.value}%
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="inline-form-field">
                <label>HSN CODE</label>
                <input
                  type="text"
                  name="hsnCode"
                  placeholder="Enter HSN Code"
                  value={form.hsnCode}
                  onChange={handleChange}
                  className="hsn-input"
                />
              </div>

            </div>

            <div className="status-row-fixed" style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontWeight: 600, color: "#475569" }}>Status</span>
              <div
                className={`blue-square-checkbox ${form.status === "inactive" ? "inactive" : ""}`}
                onClick={toggleStatus}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "4px",
                  border: "2px solid #2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: form.status === "active" ? "#2563eb" : "transparent"
                }}
              >
                {form.status === "active" && <Check size={18} color="white" />}
              </div>
            </div>

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-cancel" onClick={resetForm}>
                {editId ? "Cancel Edit" : "Reset"}
              </button>
              <button type="submit" className="btn btn-save" disabled={saving}>
                {saving ? "Processing..." : (editId ? "Update" : "Save")}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* DATA TABLE CARD */}
      <div className="form-card">
        <div className="form-header" style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "20px" }}>
          <h3>Category Tax List</h3>
        </div>

        <div className="table-wrapper" style={{ boxShadow: "none", border: "none" }}>
          <table className="tax-table">
            <thead>
              <tr>
                <th>Category</th>
                {/* <th>Tax Name</th> */}
                <th>Percentage</th>
                <th>HSN Code</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {taxList.length > 0 ? (
                taxList.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{item.categoryName}</span>
                    </td>
                    {/* <td>{item.taxName}</td> */}
                    <td>
                      <span className="category-name-badge" style={{ background: "#f0fdf4", color: "#166534" }}>{item.gstPercent}</span>
                    </td>
                    <td><code>{item.hsnCode || "N/A"}</code></td>
                    <td>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: item.status === "active" ? "#dcfce7" : "#fee2e2",
                        color: item.status === "active" ? "#15803d" : "#b91c1c"
                      }}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                      <button
                        className="action-btn"
                        onClick={() => handleEdit(item)}
                        title="Edit"
                        style={{ color: "#2563eb", borderColor: "#dbeafe" }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleDelete(item.id)}
                        title="Delete"
                        style={{ color: "#ef4444", borderColor: "#fee2e2" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    No tax configurations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoryTax;
