import React, { useState, useEffect, useCallback } from "react";
import { getCategories, CategoryRow } from "../../../api/category.api";
import { getProducts, Product } from "../../../api/product.api";

/* ─── Types ───────────────────────────────────────────────── */
interface SelectedProduct {
  id: number;
  product_name: string;
  mrp?: number;
  offerPrice: string; // per-product override (optional)
  primaryName?: string;
  secondaryName?: string;
}

interface SavePayload {
  category_id: number;
  category_name: string;
  student_offer_price: number;
  products: { product_id: number; product_name: string; offer_price: number }[];
}

/* ─── Styles ──────────────────────────────────────────────── */
const S = {
  page: {
    background: "#f1f5f9",
    minHeight: "100vh",
    padding: "32px 20px",
    fontFamily: "'Inter','Segoe UI',sans-serif",
  } as React.CSSProperties,

  card: {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
    padding: "32px",
    maxWidth: "860px",
    margin: "0 auto",
  } as React.CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "28px",
    paddingBottom: "20px",
    borderBottom: "2px solid #f1f5f9",
  } as React.CSSProperties,

  headerIcon: {
    width: 44,
    height: 44,
    background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#4f46e5",
    letterSpacing: "0.8px",
    marginBottom: "8px",
    textTransform: "uppercase" as const,
  },

  select: {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    background: "#fff",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    cursor: "pointer",
    transition: "border-color 0.15s",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    transition: "border-color 0.15s",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,

  priceWrap: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
  },

  pricePrefix: {
    position: "absolute" as const,
    left: "14px",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 600,
    pointerEvents: "none" as const,
  },

  priceInput: {
    paddingLeft: "28px",
  },

  divider: {
    height: "1px",
    background: "#f1f5f9",
    margin: "24px 0",
  } as React.CSSProperties,

  productGrid: {
    display: "grid",
    gap: "8px",
    maxHeight: "340px",
    overflowY: "auto" as const,
    paddingRight: "4px",
  } as React.CSSProperties,

  productRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1.5px solid #e2e8f0",
    background: "#f8fafc",
    transition: "all 0.15s",
    cursor: "pointer",
  } as React.CSSProperties,

  productRowSelected: {
    background: "#eef2ff",
    borderColor: "#a5b4fc",
  } as React.CSSProperties,

  checkbox: {
    width: "18px",
    height: "18px",
    accentColor: "#4f46e5",
    cursor: "pointer",
    flexShrink: 0,
  } as React.CSSProperties,

  badge: {
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "20px",
    background: "#f1f5f9",
    color: "#64748b",
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
  },

  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px 4px 12px",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#3730a3",
    fontWeight: 500,
  } as React.CSSProperties,

  chipRemove: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    border: "none",
    background: "#c7d2fe",
    color: "#3730a3",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1,
    padding: 0,
    flexShrink: 0,
  } as React.CSSProperties,

  saveBtn: {
    padding: "13px 36px",
    background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
    transition: "all 0.2s",
  } as React.CSSProperties,

  cancelBtn: {
    padding: "13px 28px",
    background: "transparent",
    color: "#64748b",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "15px",
    cursor: "pointer",
    transition: "all 0.2s",
  } as React.CSSProperties,

  spinner: {
    width: 18,
    height: 18,
    border: "2.5px solid #e0e7ff",
    borderTopColor: "#4f46e5",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  } as React.CSSProperties,

  toast: {
    position: "fixed" as const,
    bottom: "28px",
    right: "28px",
    padding: "14px 22px",
    borderRadius: "12px",
    fontWeight: 600,
    fontSize: "14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    zIndex: 9999,
    animation: "fadeUp 0.3s ease",
  } as React.CSSProperties,

  emptyBox: {
    textAlign: "center" as const,
    padding: "32px 20px",
    color: "#94a3b8",
    fontSize: "14px",
    border: "1.5px dashed #e2e8f0",
    borderRadius: "12px",
  } as React.CSSProperties,
};

/* ─── Component ───────────────────────────────────────────── */
const StudentOfferForm: React.FC = () => {
  // Lists
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Selections
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  // Global offer price
  const [globalOfferPrice, setGlobalOfferPrice] = useState<string>("");

  // UI state
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  /* ── Fetch categories ─────────────────────────────────── */
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.filter((c) => c.is_active === 1)))
      .catch(() => showToast("Failed to load categories", "error"))
      .finally(() => setLoadingCategories(false));
  }, []);

  /* ── Fetch products when category changes ─────────────── */
  useEffect(() => {
    if (!selectedCategoryId) {
      setAllProducts([]);
      setSelectedProducts([]);
      return;
    }

    const cat = categories.find((c) => c.id === Number(selectedCategoryId)) || null;
    setSelectedCategory(cat);

    setLoadingProducts(true);
    setSelectedProducts([]); // reset

    getProducts({ primary_id: selectedCategoryId })
      .then((json) => {
        const list: Product[] = Array.isArray(json) ? json : json.data ?? [];
        setAllProducts(list);

        // Auto-select ALL products in this category
        setSelectedProducts(
          list.map((p) => ({
            id: p.id,
            product_name: p.product_name,
            mrp: p.mrp,
            offerPrice: "",
            primaryName: p.primaryName ?? p.primary_category_name ?? "",
            secondaryName: p.secondaryName ?? p.secondary_category ?? "",
          }))
        );
      })
      .catch(() => showToast("Failed to load products", "error"))
      .finally(() => setLoadingProducts(false));
  }, [selectedCategoryId, categories]);

  /* ── Helpers ──────────────────────────────────────────── */
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const isSelected = useCallback(
    (id: number) => selectedProducts.some((p) => p.id === id),
    [selectedProducts]
  );

  const toggleProduct = (product: Product) => {
    if (isSelected(product.id)) {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      setSelectedProducts((prev) => [
        ...prev,
        {
          id: product.id,
          product_name: product.product_name,
          mrp: product.mrp,
          offerPrice: "",
          primaryName: product.primaryName ?? "",
          secondaryName: product.secondaryName ?? "",
        },
      ]);
    }
  };

  const removeSelected = (id: number) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const selectAll = () => {
    setSelectedProducts(
      filteredProducts.map((p) => ({
        id: p.id,
        product_name: p.product_name,
        mrp: p.mrp,
        offerPrice: "",
        primaryName: p.primaryName ?? "",
        secondaryName: p.secondaryName ?? "",
      }))
    );
  };

  const deselectAll = () => setSelectedProducts([]);

  const filteredProducts = allProducts.filter((p) =>
    p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Save ─────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!selectedCategoryId) {
      showToast("Please select a category", "error");
      return;
    }
    if (!globalOfferPrice || Number(globalOfferPrice) <= 0) {
      showToast("Please enter a valid Student Offer Price", "error");
      return;
    }
    if (selectedProducts.length === 0) {
      showToast("Please select at least one product", "error");
      return;
    }

    setSaving(true);
    try {
      const payload: SavePayload = {
        category_id: Number(selectedCategoryId),
        category_name: selectedCategory?.category_name ?? "",
        student_offer_price: Number(globalOfferPrice),
        products: selectedProducts.map((p) => ({
          product_id: p.id,
          product_name: p.product_name,
          offer_price: p.offerPrice ? Number(p.offerPrice) : Number(globalOfferPrice),
        })),
      };

      // 🔧 Replace with your real API call:
      // await saveStudentOffer(payload);
      console.log("📦 Student Offer Payload:", payload);

      showToast(
        `✅ Saved! ${selectedProducts.length} products under "${selectedCategory?.category_name}"`,
        "success"
      );
    } catch {
      showToast("Failed to save offer. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedCategoryId("");
    setSelectedCategory(null);
    setAllProducts([]);
    setSelectedProducts([]);
    setGlobalOfferPrice("");
    setSearch("");
  };

  /* ─── Render ──────────────────────────────────────────── */
  return (
    <>
      {/* Global keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .product-row:hover { background: #f1f5f9!important; border-color: #c7d2fe!important; }
        .product-row-sel:hover { background: #e0e7ff!important; }
        .save-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.4)!important; }
        .cancel-btn:hover { background: #f8fafc!important; }
        .chip-rm:hover { background: #a5b4fc!important; }
        select:focus, input:focus { border-color: #a5b4fc!important; }
      `}</style>

      <div style={S.page}>
        <div style={S.card}>

          {/* ── Header ── */}
          <div style={S.header}>
            <div style={S.headerIcon}>🎓</div>
            <div>
              <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#1e293b" }}>
                Student Offer Setup
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#64748b" }}>
                Select a category → auto-load products → set offer price → save
              </p>
            </div>
          </div>

          {/* ── Row: Category + Offer Price ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

            {/* Category Select */}
            <div>
              <div style={S.sectionLabel}>Category *</div>
              {loadingCategories ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "14px" }}>
                  <span style={S.spinner} />
                  Loading categories…
                </div>
              ) : (
                <select
                  style={S.select}
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                  <option value="">— Select Category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category_name}
                      {c.parent_category_name ? ` (${c.parent_category_name})` : ""}
                    </option>
                  ))}
                </select>
              )}
              {selectedCategory && (
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748b" }}>
                  🏷️ {selectedCategory.sector_name ?? "—"} &rsaquo; {selectedCategory.sub_sector_name ?? "—"} &rsaquo; {selectedCategory.category_name}
                </p>
              )}
            </div>

            {/* Global Student Offer Price */}
            <div>
              <div style={S.sectionLabel}>Student Offer Price (₹) *</div>
              <div style={S.priceWrap}>
                <span style={S.pricePrefix}>₹</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={globalOfferPrice}
                  onChange={(e) => setGlobalOfferPrice(e.target.value)}
                  style={{ ...S.input, ...S.priceInput }}
                />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748b" }}>
                Applied to all products unless overridden per product
              </p>
            </div>
          </div>

          <div style={S.divider} />

          {/* ── Product List ── */}
          <div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ ...S.sectionLabel, margin: 0 }}>
                  Products Under Category
                </div>
                {allProducts.length > 0 && (
                  <span style={{
                    ...S.badge,
                    background: "#eef2ff", color: "#4f46e5", fontWeight: 700,
                  }}>
                    {selectedProducts.length} / {allProducts.length} selected
                  </span>
                )}
              </div>

              {/* Select / Deselect All */}
              {allProducts.length > 0 && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={selectAll}
                    style={{
                      padding: "5px 14px", fontSize: "12px", fontWeight: 600,
                      border: "1.5px solid #c7d2fe", borderRadius: "8px",
                      background: "#eef2ff", color: "#4f46e5", cursor: "pointer",
                    }}
                  >
                    ✔ Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    style={{
                      padding: "5px 14px", fontSize: "12px", fontWeight: 600,
                      border: "1.5px solid #e2e8f0", borderRadius: "8px",
                      background: "#f8fafc", color: "#64748b", cursor: "pointer",
                    }}
                  >
                    ✖ Clear
                  </button>
                </div>
              )}
            </div>

            {/* Search */}
            {allProducts.length > 0 && (
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <span style={{
                  position: "absolute", left: "12px", top: "50%",
                  transform: "translateY(-50%)", color: "#94a3b8", fontSize: "15px",
                  pointerEvents: "none",
                }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search products…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ ...S.input, paddingLeft: "36px" }}
                />
              </div>
            )}

            {/* Product rows */}
            {loadingProducts ? (
              <div style={{ ...S.emptyBox, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <span style={S.spinner} />
                Loading products…
              </div>
            ) : !selectedCategoryId ? (
              <div style={S.emptyBox}>
                👆 Select a category above to load products
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={S.emptyBox}>
                {search ? `No products match "${search}"` : "No products found in this category"}
              </div>
            ) : (
              <div style={S.productGrid}>
                {filteredProducts.map((product) => {
                  const sel = isSelected(product.id);
                  return (
                    <div
                      key={product.id}
                      className={sel ? "product-row product-row-sel" : "product-row"}
                      style={{
                        ...S.productRow,
                        ...(sel ? S.productRowSelected : {}),
                      }}
                      onClick={() => toggleProduct(product)}
                    >
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => toggleProduct(product)}
                        style={S.checkbox}
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Product name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "13px", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {product.product_name}
                        </div>
                        {(product.secondaryName || product.primaryName) && (
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                            {[product.primaryName, product.secondaryName].filter(Boolean).join(" › ")}
                          </div>
                        )}
                      </div>

                      {/* MRP badge */}
                      {product.mrp != null && (
                        <span style={S.badge}>
                          MRP ₹{Number(product.mrp).toFixed(2)}
                        </span>
                      )}

                      {/* Remove button */}
                      {sel && (
                        <button
                          className="chip-rm"
                          style={{ ...S.chipRemove, background: "#fee2e2", color: "#dc2626" }}
                          onClick={(e) => { e.stopPropagation(); removeSelected(product.id); }}
                          title="Remove from offer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Selected chips summary ── */}
          {selectedProducts.length > 0 && (
            <>
              <div style={S.divider} />
              <div>
                <div style={{ ...S.sectionLabel, marginBottom: "12px" }}>
                  Selected Products ({selectedProducts.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedProducts.map((p) => (
                    <span key={p.id} style={S.chip}>
                      {p.product_name}
                      {p.mrp != null && (
                        <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: 400 }}>
                          · MRP ₹{Number(p.mrp).toFixed(0)}
                        </span>
                      )}
                      <button
                        className="chip-rm"
                        style={S.chipRemove}
                        onClick={() => removeSelected(p.id)}
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Offer Preview ── */}
          {selectedProducts.length > 0 && globalOfferPrice && (
            <>
              <div style={S.divider} />
              <div style={{
                background: "linear-gradient(135deg,#eef2ff,#faf5ff)",
                borderRadius: "12px",
                padding: "16px 20px",
                border: "1.5px solid #c7d2fe",
              }}>
                <div style={{ fontWeight: 700, color: "#3730a3", fontSize: "14px", marginBottom: "8px" }}>
                  🎓 Offer Summary
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
                  {[
                    { label: "Category", value: selectedCategory?.category_name ?? "—" },
                    { label: "Products", value: `${selectedProducts.length} items` },
                    { label: "Offer Price", value: `₹ ${Number(globalOfferPrice).toFixed(2)}` },
                  ].map((item) => (
                    <div key={item.label} style={{
                      background: "#fff", borderRadius: "10px", padding: "10px 14px",
                      border: "1px solid #e0e7ff",
                    }}>
                      <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "4px" }}>
                        {item.label.toUpperCase()}
                      </div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#3730a3" }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Action Buttons ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "28px" }}>
            <button
              className="cancel-btn"
              style={S.cancelBtn}
              onClick={handleReset}
              disabled={saving}
            >
              Reset
            </button>
            <button
              className="save-btn"
              style={S.saveBtn}
              onClick={handleSave}
              disabled={saving || !selectedCategoryId || !globalOfferPrice || selectedProducts.length === 0}
            >
              {saving ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ ...S.spinner, borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />
                  Saving…
                </span>
              ) : (
                "💾 Save Student Offer"
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            ...S.toast,
            background: toast.type === "success" ? "#166534" : "#991b1b",
            color: "#fff",
          }}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
};

export default StudentOfferForm;
