import { useEffect, useState, useRef, useMemo } from "react";
import { getProducts, type Product } from "../../../api/product.api";
import { Check, Edit, Trash2, Search } from "lucide-react";
import "./ProductTax.css";
import { getTaxes, createProductTax, getProductTaxes, updateProductTax, deleteProductTax } from "../../variant/models/tax.api";
import type { Tax, ProductTaxPayload, ProductTax as ProductTaxResponse } from "../../variant/models/tax.api";

type ProductTaxItem = {
  id: number;
  productId: string;
  productName: string;
  taxName: string;
  gstPercent: string;
  gstVariantId: string;
  hsnCode: string;
  status: "active" | "inactive";
};

type ProductTaxForm = {
  productId: string;
  gstVariantId: string;
  hsnCode: string;
  status: "active" | "inactive";
};

const ProductTax = () => {
  /* ======================
     STATES
  ====================== */
  const [products, setProducts] = useState<Product[]>([]);
  const [taxList, setTaxList] = useState<ProductTaxItem[]>([]);
  const [form, setForm] = useState<ProductTaxForm>({
    productId: "",
    gstVariantId: "",
    hsnCode: "",
    status: "active",
  });
  const [gstOptions, setGstOptions] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Searchable Dropdown States
  const [showProductList, setShowProductList] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ======================
     LOAD DATA
  ====================== */
  const fetchTaxList = async () => {
    try {
      const res = await getProductTaxes();
      const list = Array.isArray(res) ? res : [];
      setTaxList(list.map((item: ProductTaxResponse) => ({
        id: item.id,
        productId: String(item.product_id),
        productName: item.product_name || "Unknown",
        taxName: item.variant_name || item.name || item.tax || "N/A",
        gstPercent: (() => {
          const val = item.gst_value || item.value || item.percentage || item.gst_percent || item.tax_percent || item.gst || "0";
          return String(val).endsWith("%") ? String(val) : `${val}%`;
        })(),
        gstVariantId: String(item.gst_variant_id),
        hsnCode: item.hsn_code,
        status: (item.status === "active" || String(item.status) === "1") ? "active" : "inactive"
      })));
    } catch (err) {
      console.error("Failed to fetch product tax list", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productRes = await getProducts();
        setProducts(productRes || []);

        // Fetch GST options from variant API
        const variantData = await getTaxes();
        setGstOptions(Array.isArray(variantData) ? variantData : []);
        
        // Fetch existing tax configurations
        await fetchTaxList();
        
        setLoading(false);
      } catch (err: any) {
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
        setShowProductList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ======================
     FILTERED PRODUCTS
  ====================== */
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch = p.product_name.toLowerCase().includes(productSearch.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => a.product_name.localeCompare(b.product_name));
  }, [products, productSearch]);

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
      productId: "",
      gstVariantId: "",
      hsnCode: "",
      status: "active",
    });
    setEditId(null);
    setProductSearch("");
  };

  const handleEdit = (item: ProductTaxItem) => {
    setForm({
      productId: item.productId,
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
        await deleteProductTax(id);
        alert("Deleted successfully 🗑️");
        fetchTaxList();
      } catch (error: any) {
        alert(error.message || "Failed to delete ❌");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.gstVariantId) {
      alert("Please fill in all required fields (Product, GST %)");
      return;
    }
    
    try {
      setSaving(true);
      const payload: ProductTaxPayload = {
        product_id: Number(form.productId),
        gst_variant_id: Number(form.gstVariantId),
        hsn_code: form.hsnCode,
        status: form.status,
      };

      if (editId) {
        await updateProductTax(editId, payload);
        alert("Updated successfully ✅");
      } else {
        await createProductTax(payload);
        alert("Saved successfully ✅");
      }
      resetForm();
      fetchTaxList();
    } catch (error: any) {
      alert(error.message || "Failed to save product tax ❌");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="form-header">
        <div>
          <h2>Product Tax</h2>
          <p className="subtitle">
            Manage and monitor tax settings across all products
          </p>
        </div>
      </div>

      {/* ENTRY FORM CARD */}
      <div className="form-card" style={{ 
        marginBottom: "40px", 
        overflow: "visible", 
        zIndex: showProductList ? 1001 : 2,
        position: "relative" 
      }}>
        {loading ? (
          <div className="loading-state">
             <div className="spinner"></div>
             <span>Fetching products...</span>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
              
              {/* CUSTOM SEARCHABLE PRODUCT DROPDOWN */}
              <div className="inline-form-field" ref={dropdownRef} style={{ position: "relative", zIndex: showProductList ? 10 : 1 }}>
                <label>PRODUCT LIST</label>
                <div 
                  className="tax-select" 
                  onClick={() => setShowProductList(!showProductList)}
                  style={{ 
                    cursor: "pointer", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    maxWidth: "100%",
                    background: "#fff"
                  }}
                >
                  <span style={{ color: form.productId ? "#1e293b" : "#94a3b8" }}>
                    {products.find(p => String(p.id) === form.productId)?.product_name || "Select Product"}
                  </span>
                  <span style={{ fontSize: "10px" }}>▼</span>
                </div>

                {showProductList && (
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
                    {/* SEARCH INPUT */}
                    <div style={{ position: "relative", marginBottom: "12px" }}>
                      <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                      <input
                        type="text"
                        placeholder="Search product..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
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
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((p) => (
                          <div
                            key={p.id}
                            className="drop-item"
                            onClick={() => {
                              setForm(prev => ({ ...prev, productId: String(p.id) }));
                              setShowProductList(false);
                            }}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "14px",
                              cursor: "pointer",
                              background: form.productId === String(p.id) ? "#f1f5f9" : "transparent"
                            }}
                          >
                            <span>{p.product_name}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: "center", padding: "12px", color: "#94a3b8", fontSize: "13px" }}>
                          No products found
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
                {editId ? "Cancel" : "Reset"}
              </button>
              <button type="submit" className="btn btn-save" disabled={saving}>
                {saving ? "Saving..." : (editId ? "Update" : "Save")}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* DATA TABLE CARD */}
      <div className="form-card">
        <div className="form-header" style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "20px" }}>
            <h3>Product Tax List</h3>
        </div>

        <div className="table-wrapper" style={{ boxShadow: "none", border: "none" }}>
            <table className="tax-table">
                <thead>
                    <tr>
                        <th>Product</th>
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
                                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{item.productName}</span>
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

export default ProductTax;
