import React, { useState, useEffect, useCallback } from "react";

interface Category {
  id: number;
  category_name: string;
  is_active?: number | boolean;
}

interface Brand {
  id: number;
  brand_name: string;
  status: string;
}

interface Product {
  id: number;
  product_name: string;
  mrp?: number | null;
}

interface SavedOffer {
  id: string;
  primaryName: string;
  secondaryName: string;
  brandName: string;
  offerPrice: number;
  productsCount: number;
  productNames: string[];
}

// Sandbox-safe apiFetch resolver with automatic host detection fallback
let apiFetch: (path: string, options?: any) => Promise<any>;
try {
  apiFetch = require("api").apiFetch;
} catch (e) {
  const _getToken = () => localStorage.getItem("token") || "";
  const _apiBase = (() => {
    const origin = window.location.origin;
    return origin.includes("5173") || origin.includes("3000")
      ? origin.replace(/:\d+$/, ":5000") + "/api"
      : origin + "/api";
  })();
  apiFetch = async (path: string, options: any = {}) => {
    const res = await fetch(`${_apiBase}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${_getToken()}`,
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? json;
  };
}

/**
 * Student Offer Form Module
 * Includes Primary Category, Secondary Category, and Brand filters.
 * Saves entries locally to a test list instead of the database.
 */
const StudentOfferForm: React.FC = () => {
  // Dropdown options
  const [primaryCategories, setPrimaryCategories] = useState<Category[]>([]);
  const [secondaryCategories, setSecondaryCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Selected values
  const [primaryId, setPrimaryId] = useState<string>("");
  const [primaryName, setPrimaryName] = useState<string>("");
  
  const [secondaryId, setSecondaryId] = useState<string>("");
  const [secondaryName, setSecondaryName] = useState<string>("");

  const [brandId, setBrandId] = useState<string>("");
  const [brandName, setBrandName] = useState<string>("");

  // Product selection & pricing
  const [products, setProducts] = useState<Product[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [customPrices, setCustomPrices] = useState<Record<number, string>>({});
  const [mainOfferPrice, setMainOfferPrice] = useState<string>("");

  // Saved offers (Test List)
  const [savedOffers, setSavedOffers] = useState<SavedOffer[]>([]);

  // Loading & feedback states
  const [loadingPrimary, setLoadingPrimary] = useState<boolean>(true);
  const [loadingBrands, setLoadingBrands] = useState<boolean>(true);
  const [loadingProds, setLoadingProds] = useState<boolean>(false);
  
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Load Primary Categories and Brands on mount
  useEffect(() => {
    setLoadingPrimary(true);
    apiFetch("/categories/primary")
      .then((data: Category[]) => {
        setPrimaryCategories(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Failed to load primary categories.");
      })
      .finally(() => setLoadingPrimary(false));

    setLoadingBrands(true);
    apiFetch("/brands")
      .then((data: Brand[]) => {
        setBrands(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Failed to load brands.");
      })
      .finally(() => setLoadingBrands(false));
  }, []);

  // Load Secondary Categories when Primary Category selection changes
  useEffect(() => {
    if (!primaryId) {
      setSecondaryCategories([]);
      setSecondaryId("");
      setSecondaryName("");
      return;
    }

    apiFetch(`/categories/secondary/${primaryId}`)
      .then((data: Category[]) => {
        setSecondaryCategories(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Failed to load secondary categories.");
      });
  }, [primaryId]);

  // Load products based on Primary Category, Secondary Category, and Brand selection
  useEffect(() => {
    if (!primaryId && !brandId) {
      setProducts([]);
      setCheckedIds(new Set());
      setCustomPrices({});
      return;
    }

    setLoadingProds(true);
    setSuccessMessage("");
    setErrorMessage("");

    let url = `/products?limit=100`;
    if (primaryName) {
      url += `&primary_category=${encodeURIComponent(primaryName)}`;
    }
    if (secondaryName) {
      url += `&category=${encodeURIComponent(secondaryName)}`;
    }
    if (brandName) {
      url += `&brand=${encodeURIComponent(brandName)}`;
    }

    apiFetch(url)
      .then((data: any) => {
        const list: Product[] = Array.isArray(data) ? data : (data?.products ?? []);
        setProducts(list);
        // Auto-select all fetched products by default
        setCheckedIds(new Set(list.map((p) => p.id)));
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Failed to load products for selected filters.");
      })
      .finally(() => setLoadingProds(false));
  }, [primaryId, primaryName, secondaryId, secondaryName, brandId, brandName]);

  const isSelected = useCallback(
    (id: number) => checkedIds.has(id),
    [checkedIds]
  );

  const toggleProduct = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setCheckedIds(new Set(products.map((p) => p.id)));
  };

  const clearAll = () => {
    setCheckedIds(new Set());
  };

  const handlePrimaryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setPrimaryId(id);
    const selected = primaryCategories.find((c) => String(c.id) === id);
    setPrimaryName(selected ? selected.category_name : "");
    // Reset secondary category selection
    setSecondaryId("");
    setSecondaryName("");
  };

  const handleSecondaryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSecondaryId(id);
    const selected = secondaryCategories.find((c) => String(c.id) === id);
    setSecondaryName(selected ? selected.category_name : "");
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setBrandId(id);
    const selected = brands.find((b) => String(b.id) === id);
    setBrandName(selected ? selected.brand_name : "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryId) {
      setErrorMessage("Please select at least a primary category.");
      return;
    }
    
    const selectedProductsList = products.filter((p) => checkedIds.has(p.id));
    if (selectedProductsList.length === 0) {
      setErrorMessage("Please select at least one product.");
      return;
    }

    // Build pricing list for selected products
    const productOffers = selectedProductsList.map((p) => {
      const specificPrice = customPrices[p.id];
      const finalPrice = specificPrice !== undefined && specificPrice !== "" 
        ? Number(specificPrice) 
        : Number(mainOfferPrice || 0);
      return {
        product_id: p.id,
        product_name: p.product_name,
        offer_price: finalPrice,
      };
    });

    // Validate pricing values
    if (productOffers.some((p) => isNaN(p.offer_price) || p.offer_price <= 0)) {
      setErrorMessage("All selected products must have a valid offer price greater than 0.");
      return;
    }

    // Create the locally saved offer record (for test review list)
    const newOffer: SavedOffer = {
      id: Date.now().toString(),
      primaryName: primaryName,
      secondaryName: secondaryName || "All",
      brandName: brandName || "All",
      offerPrice: Number(mainOfferPrice || 0),
      productsCount: productOffers.length,
      productNames: productOffers.map((p) => `${p.product_name} (₹${p.offer_price})`),
    };

    setSavedOffers((prev) => [newOffer, ...prev]);
    setSuccessMessage(`Success! Offer added to the test list at the bottom.`);
    
    // Clear pricing inputs and selections for the next test
    setCheckedIds(new Set());
    setCustomPrices({});
    setMainOfferPrice("");
    setPrimaryId("");
    setPrimaryName("");
    setSecondaryId("");
    setSecondaryName("");
    setBrandId("");
    setBrandName("");
    setProducts([]);
  };

  return (
    <div style={{
      padding: "24px",
      background: "#fff",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      fontFamily: "system-ui, sans-serif",
      maxWidth: "460px",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      <h3 style={{ margin: "0 0 20px 0", color: "#1e293b", fontSize: "18px" }}>
        🎓 Student Offer Setup
      </h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        
        {/* Primary Category Dropdown */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "5px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            PRIMARY CATEGORY *
          </label>
          {loadingPrimary ? (
            <div style={{ fontSize: "13px", color: "#64748b", padding: "10px 0" }}>Loading primary categories...</div>
          ) : (
            <select
              value={primaryId}
              onChange={handlePrimaryChange}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", fontSize: "14px", boxSizing: "border-box" }}
              required
            >
              <option value="">Select Primary Category</option>
              {primaryCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Secondary Category Dropdown */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "5px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            SECONDARY CATEGORY (Optional)
          </label>
          <select
            value={secondaryId}
            onChange={handleSecondaryChange}
            disabled={!primaryId}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", fontSize: "14px", boxSizing: "border-box", opacity: !primaryId ? 0.6 : 1 }}
          >
            <option value="">Select Secondary Category</option>
            {secondaryCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Dropdown */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "5px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            BRAND (Optional)
          </label>
          {loadingBrands ? (
            <div style={{ fontSize: "13px", color: "#64748b", padding: "10px 0" }}>Loading brands...</div>
          ) : (
            <select
              value={brandId}
              onChange={handleBrandChange}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", fontSize: "14px", boxSizing: "border-box" }}
            >
              <option value="">Select Brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brand_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Default Offer Price Input */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "5px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            DEFAULT OFFER PRICE (₹)
          </label>
          <input
            type="number"
            value={mainOfferPrice}
            onChange={(e) => setMainOfferPrice(e.target.value)}
            placeholder="0.00"
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            min="0"
            step="0.01"
          />
          <small style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
            Applied to all selected products unless overridden below.
          </small>
        </div>

        {/* Products Checklist */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "5px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            SELECT PRODUCTS & CUSTOMIZE PRICES ({checkedIds.size} selected)
          </label>
          
          {products.length > 0 && (
            <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
              <button
                type="button"
                onClick={selectAll}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: "600",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  cursor: "pointer",
                  color: "#475569"
                }}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAll}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: "600",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  cursor: "pointer",
                  color: "#475569"
                }}
              >
                Clear All
              </button>
            </div>
          )}

          <div style={{
            maxHeight: "220px",
            overflowY: "auto",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            padding: "8px",
            background: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            boxSizing: "border-box"
          }}>
            {loadingProds ? (
              <div style={{ padding: "10px", color: "#64748b", fontSize: "13px", textAlign: "center" }}>
                Loading products...
              </div>
            ) : (!primaryId && !brandId) ? (
              <div style={{ padding: "10px", color: "#64748b", fontSize: "13px", textAlign: "center" }}>
                Select category or brand to list products
              </div>
            ) : products.length === 0 ? (
              <div style={{ padding: "10px", color: "#64748b", fontSize: "13px", textAlign: "center" }}>
                No products found matching filters
              </div>
            ) : (
              products.map((product) => {
                const checked = isSelected(product.id);
                return (
                  <label
                    key={product.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      background: checked ? "#eff6ff" : "transparent",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "#1e293b",
                      border: checked ? "1px solid #bfdbfe" : "1px solid transparent",
                      boxSizing: "border-box"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProduct(product.id)}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={product.product_name}>
                      {product.product_name}
                    </span>
                    {product.mrp && (
                      <span style={{ fontSize: "11px", color: "#64748b", marginRight: "5px", flexShrink: 0 }}>
                        MRP ₹{Number(product.mrp).toFixed(0)}
                      </span>
                    )}
                    <input
                      type="number"
                      value={customPrices[product.id] !== undefined ? customPrices[product.id] : mainOfferPrice}
                      onChange={(e) => {
                        setCustomPrices({
                          ...customPrices,
                          [product.id]: e.target.value
                        });
                      }}
                      placeholder="Price"
                      style={{
                        width: "80px",
                        padding: "4px 6px",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        background: "#fff",
                        boxSizing: "border-box"
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Error / Success Notifications */}
        {successMessage && (
          <div style={{ padding: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", color: "#166534", fontSize: "13px" }}>
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{ padding: "10px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", color: "#991b1b", fontSize: "13px" }}>
            {errorMessage}
          </div>
        )}

        {/* Submit / Add to List Button */}
        <button
          type="submit"
          disabled={!primaryId || checkedIds.size === 0}
          style={{
            background: "#4f46e5",
            color: "#fff",
            padding: "12px",
            borderRadius: "6px",
            border: "none",
            fontWeight: "700",
            cursor: (!primaryId || checkedIds.size === 0) ? "not-allowed" : "pointer",
            marginTop: "10px",
            boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)",
            opacity: (!primaryId || checkedIds.size === 0) ? 0.6 : 1
          }}
        >
          Add to Saved List
        </button>
      </form>

      {/* Local Saved Test List */}
      {savedOffers.length > 0 && (
        <div style={{ marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#1e293b", fontSize: "14px", fontWeight: "700" }}>
            📋 Saved Offers ({savedOffers.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {savedOffers.map((offer) => (
              <div
                key={offer.id}
                style={{
                  padding: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "12px",
                  position: "relative"
                }}
              >
                <button
                  type="button"
                  onClick={() => setSavedOffers((prev) => prev.filter((o) => o.id !== offer.id))}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "transparent",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
                    padding: 0,
                    lineHeight: 1
                  }}
                  title="Remove"
                >
                  ✕
                </button>
                <div style={{ fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                  Category: {offer.primaryName} {offer.secondaryName !== "All" && ` > ${offer.secondaryName}`}
                </div>
                <div style={{ color: "#64748b", marginBottom: "4px" }}>
                  Brand: {offer.brandName} | Offer Price: ₹{offer.offerPrice > 0 ? offer.offerPrice.toFixed(2) : "Customized"}
                </div>
                <div style={{ color: "#64748b", fontStyle: "italic", whiteSpace: "normal" }}>
                  Products ({offer.productsCount}): {offer.productNames.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentOfferForm;
