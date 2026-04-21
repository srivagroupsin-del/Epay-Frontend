import { useState, useEffect } from "react";
import { Check, SquarePen, Trash2 } from "lucide-react";
import "./addTax.css";

// API Imports
import {
    getTaxes, createTax, deleteTax,
    getCategoryTaxes, createCategoryTax, deleteCategoryTax, updateCategoryTax,
    getProductTaxes, createProductTax, deleteProductTax, updateProductTax,
    type Tax, type TaxPayload, type CategoryTaxPayload, type ProductTaxPayload, type CategoryTax, type ProductTax
} from "../models/tax.api";
import { getCategories, type CategoryRow } from "../../category/models/category.api";
import { getProducts, type Product } from "../../../api/product.api";
import SearchableSelect from "../../../components/SearchableSelect/SearchableSelect";

type Tab = "create" | "set";
type SubTab = "category" | "product";

const TaxManagement = () => {
    // Tab Management
    const [activeTab, setActiveTab] = useState<Tab>("create");
    const [subTab, setSubTab] = useState<SubTab>("category");

    // Common State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit States
    const [editId, setEditId] = useState<number | null>(null);

    /* ── 1. TAX CREATE STATE ── */
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [taxForm, setTaxForm] = useState<TaxPayload>({
        name: "",
        value: "",
        status: "active",
    });

    /* ── 2. TAX SET STATE ── */
    const [categoryTaxes, setCategoryTaxes] = useState<CategoryTax[]>([]);
    const [productTaxes, setProductTaxes] = useState<ProductTax[]>([]);

    // Dropdown Data
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedCategoryForProduct, setSelectedCategoryForProduct] = useState<string | number>("");

    // Set Category Form
    const [categoryForm, setCategoryForm] = useState<CategoryTaxPayload>({
        category_id: 0,
        gst_variant_id: 0,
        hsn_code: "",
        status: "active"
    });

    // Set Product Form
    const [productForm, setProductForm] = useState<ProductTaxPayload>({
        product_id: 0,
        gst_variant_id: 0,
        hsn_code: "",
        status: "active"
    });

    const [isCustomCategoryTax, setIsCustomCategoryTax] = useState(false);
    const [isCustomProductTax, setIsCustomProductTax] = useState(false);
    const [customCategoryPercent, setCustomCategoryPercent] = useState("");
    const [customProductPercent, setCustomProductPercent] = useState("");

    // Fetch Initial Data
    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [taxList, categoryList, catTaxes, prodTaxes, productsRes] = await Promise.all([
                getTaxes(),
                getCategories(),
                getCategoryTaxes(),
                getProductTaxes(),
                getProducts()
            ]);
            setTaxes(Array.isArray(taxList) ? taxList : []);
            setCategories(Array.isArray(categoryList) ? categoryList : []);
            setCategoryTaxes(Array.isArray(catTaxes) ? catTaxes : []);
            setProductTaxes(Array.isArray(prodTaxes) ? prodTaxes : []);
            setAllProducts(Array.isArray(productsRes) ? productsRes : []);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Load products when category changes in product set form
    useEffect(() => {
        const loadProducts = async () => {
            if (selectedCategoryForProduct) {
                const prods = await getProducts({ primary_id: selectedCategoryForProduct });
                setFilteredProducts(prods);
            } else {
                setFilteredProducts([]);
            }
        };
        loadProducts();
    }, [selectedCategoryForProduct]);

    /* ── HANDLERS ── */

    const resetForms = () => {
        setTaxForm({ name: "", value: "", status: "active" });
        setCategoryForm({ category_id: 0, gst_variant_id: 0, hsn_code: "", status: "active" });
        setProductForm({ product_id: 0, gst_variant_id: 0, hsn_code: "", status: "active" });
        setIsCustomCategoryTax(false);
        setIsCustomProductTax(false);
        setCustomCategoryPercent("");
        setCustomProductPercent("");
        setEditId(null);
    };

    // Tax Create Submit
    const handleTaxCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taxForm.name || !taxForm.value) return alert("Please fill all fields");
        try {
            setSaving(true);
            await createTax(taxForm);
            alert("Tax saved successfully");
            resetForms();
            const list = await getTaxes();
            setTaxes(list);
        } catch (err) {
            alert("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    // Category Tax Submit
    const handleCategoryTaxSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryForm.category_id || !categoryForm.gst_variant_id) return alert("Please select category and tax");
        try {
            setSaving(true);
            const payload = {
                ...categoryForm,
                gst_value: isCustomCategoryTax ? customCategoryPercent : taxes.find(t => t.id === categoryForm.gst_variant_id)?.value
            };
            if (editId) {
                await updateCategoryTax(editId, payload as any);
                alert("Category Tax updated");
            } else {
                await createCategoryTax(payload as any);
                alert("Category Tax mapped");
            }
            resetForms();
            const list = await getCategoryTaxes();
            setCategoryTaxes(list);
        } catch (err) {
            alert("Failed to save category tax");
        } finally {
            setSaving(false);
        }
    };

    // Product Tax Submit
    const handleProductTaxSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productForm.product_id || !productForm.gst_variant_id) return alert("Please select product and tax");
        try {
            setSaving(true);
            const payload = {
                ...productForm,
                gst_value: isCustomProductTax ? customProductPercent : taxes.find(t => t.id === productForm.gst_variant_id)?.value
            };
            if (editId) {
                await updateProductTax(editId, payload as any);
                alert("Product Tax updated");
            } else {
                await createProductTax(payload as any);
                alert("Product Tax mapped");
            }
            resetForms();
            const list = await getProductTaxes();
            setProductTaxes(list);
        } catch (err) {
            alert("Failed to save product tax");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTax = async (id: number) => {
        if (!window.confirm("Delete this tax?")) return;
        try {
            await deleteTax(id);
            setTaxes(prev => prev.filter(t => t.id !== id));
        } catch (err) { alert("Delete failed"); }
    };

    const handleDeleteCategoryTax = async (id: number) => {
        if (!window.confirm("Remove this mapping?")) return;
        try {
            await deleteCategoryTax(id);
            setCategoryTaxes(prev => prev.filter(t => t.id !== id));
        } catch (err) { alert("Delete failed"); }
    };

    const handleDeleteProductTax = async (id: number) => {
        if (!window.confirm("Remove this mapping?")) return;
        try {
            await deleteProductTax(id);
            setProductTaxes(prev => prev.filter(t => t.id !== id));
        } catch (err) { alert("Delete failed"); }
    };

    const handleEditCategoryTax = (ct: CategoryTax) => {
        setEditId(ct.id);
        setCategoryForm({
            category_id: ct.category_id,
            gst_variant_id: ct.gst_variant_id,
            hsn_code: ct.hsn_code || "",
            status: ct.status === "inactive" ? "inactive" : "active"
        });
    };

    const handleEditProductTax = (pt: ProductTax) => {
        setEditId(pt.id);
        setProductForm({
            product_id: pt.product_id,
            gst_variant_id: pt.gst_variant_id,
            hsn_code: pt.hsn_code || "",
            status: pt.status === "inactive" ? "inactive" : "active"
        });
        // We'd ideally set category selection here too if we known it
    };

    /* ── RENDER HELPERS ── */

    const renderTaxCreate = () => (
        <>
            <div className="unit-type-card">
                <form onSubmit={handleTaxCreateSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "25px" }}>
                        <div className="form-group">
                            <label>Tax Name</label>
                            <input
                                type="text"
                                placeholder="Enter Tax Name"
                                value={taxForm.name}
                                onChange={e => setTaxForm({ ...taxForm, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            
                            <label>Tax Percentage (%)</label>
                            
                            <input
                                type="text"
                                placeholder="Enter Tax Value (%)"
                                value={taxForm.value}
                                onChange={e => setTaxForm({ ...taxForm, value: e.target.value })}
                            />
                           
                        </div>
                    </div>

                    <div className="status-row-fixed">
                        <span className="status-label-fixed">Status</span>
                        <div
                            className={`blue-square-checkbox ${taxForm.status === "inactive" ? "inactive" : ""}`}
                            onClick={() => setTaxForm({ ...taxForm, status: taxForm.status === "active" ? "inactive" : "active" })}
                        >
                            {taxForm.status === "active" && <Check size={24} />}
                        </div>
                    </div>

                    <div className="form-actions-centered">
                        <button type="submit" className="btn-save-unit" disabled={saving}>
                            {saving ? "Saving..." : "Save Tax"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="tax-list-section">
                <div className="tax-list-card">
                    <h3>Tax List</h3>
                    <table className="redesign-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Tax Name</th>
                                <th>Tax Percentage (%)</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {taxes.map((t, i) => (
                                <tr key={t.id}>
                                    <td>{i + 1}</td>
                                    <td>{t.name}</td>
                                    <td>{t.value}%</td>
                                    <td>
                                        <span className={`status-badge ${t.status === "active" || t.status === "1" || t.status === 1 ? "active" : "inactive"}`}>
                                            {t.status === "active" || t.status === "1" || t.status === 1 ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-icons">
                                            <button className="btn-icon-delete" onClick={() => handleDeleteTax(t.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    const renderTaxSetCategory = () => (
        <>
            <div className="unit-type-card">
                <form onSubmit={handleCategoryTaxSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "25px", alignItems: "flex-start" }}>
                        <SearchableSelect
                            label="Category"
                            placeholder="Select Category"
                            value={categoryForm.category_id}
                            options={categories.map(c => ({ id: c.id, label: c.category_name }))}
                            onChange={(val) => setCategoryForm({ ...categoryForm, category_id: Number(val) })}
                        />
                        <SearchableSelect
                            label="Tax Name"
                            placeholder="Select Tax"
                            value={categoryForm.gst_variant_id}
                            options={taxes.map(t => ({ id: t.id, label: t.name }))}
                            onChange={(val) => {
                                const tax = taxes.find(t => t.id === Number(val));
                                setCategoryForm({ ...categoryForm, gst_variant_id: Number(val), hsn_code: tax?.value || "" });
                            }}
                        />
                        <div className="form-group">
                            <label>Tax Percentage</label>
                            <div className="suffix-input-wrapper">
                                <input
                                    type="text"
                                    readOnly={!isCustomCategoryTax}
                                    placeholder={isCustomCategoryTax ? "Enter %" : "Auto-filled"}
                                    value={isCustomCategoryTax ? customCategoryPercent : (taxes.find(t => t.id === categoryForm.gst_variant_id)?.value || "0")}
                                    onChange={e => setCustomCategoryPercent(e.target.value)}
                                />
                                <span className="suffix">%</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "30px", marginBottom: "25px" }}>
                        <div className="status-row-fixed">
                            <span className="status-label-fixed">Status</span>
                            <div
                                className={`blue-square-checkbox ${categoryForm.status === "inactive" ? "inactive" : ""}`}
                                onClick={() => setCategoryForm({ ...categoryForm, status: categoryForm.status === "active" ? "inactive" : "active" })}
                            >
                                {categoryForm.status === "active" && <Check size={24} />}
                            </div>
                        </div>

                        <div className="status-row-fixed">
                            <span className="status-label-fixed">Custom Tax</span>
                            <div
                                className={`blue-square-checkbox ${!isCustomCategoryTax ? "inactive" : ""}`}
                                onClick={() => setIsCustomCategoryTax(!isCustomCategoryTax)}
                            >
                                {isCustomCategoryTax && <Check size={24} />}
                            </div>
                        </div>
                    </div>

                    <div className="form-actions-centered">
                        <button type="submit" className="btn-save-unit" disabled={saving}>
                            {editId ? "Update Category Tax" : "Save Category Tax"}
                        </button>
                        {editId && <button type="button" className="btn-reset-unit" onClick={resetForms}>Cancel</button>}
                    </div>
                </form>
            </div>

            <div className="tax-list-section">
                <div className="tax-list-card">
                    <table className="redesign-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Category Name</th>
                                <th>Tax Name</th>
                                <th>Tax Percentage (%)</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoryTaxes.map((ct, i) => (
                                <tr key={ct.id}>
                                    <td>{i + 1}</td>
                                    <td>{ct.category_name}</td>
                                    <td>{ct.variant_name || ct.name || ct.tax || taxes.find(t => t.id === ct.gst_variant_id)?.name || "N/A"}</td>
                                    <td>
                                        {(() => {
                                            const val = ct.gst_value || ct.value || ct.percentage || ct.gst_percent || ct.tax_percent || ct.gst || ct.tax || taxes.find(t => t.id === ct.gst_variant_id)?.value || "0";
                                            return String(val).endsWith("%") ? val : `${val}%`;
                                        })()}
                                    </td>
                                    <td>
                                        <div className="action-icons">
                                            <button className="btn-icon-edit" onClick={() => handleEditCategoryTax(ct)}><SquarePen size={16} /></button>
                                            <button className="btn-icon-delete" onClick={() => handleDeleteCategoryTax(ct.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    const renderTaxSetProduct = () => (
        <>
            <div className="unit-type-card">
                <form onSubmit={handleProductTaxSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px", alignItems: "flex-start" }}>
                        <SearchableSelect
                            label="Category"
                            placeholder="Select Category"
                            value={selectedCategoryForProduct}
                            options={categories.map(c => ({ id: c.id, label: c.category_name }))}
                            onChange={(val) => setSelectedCategoryForProduct(val)}
                        />
                        <SearchableSelect
                            label="Product"
                            placeholder="Select Product"
                            value={productForm.product_id}
                            options={filteredProducts.map(p => ({ id: p.id, label: p.product_name }))}
                            onChange={(val) => setProductForm({ ...productForm, product_id: Number(val) })}
                        />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px", alignItems: "flex-start" }}>
                        <SearchableSelect
                            label="Tax Name"
                            placeholder="Select Tax"
                            value={productForm.gst_variant_id}
                            options={taxes.map(t => ({ id: t.id, label: t.name }))}
                            onChange={(val) => {
                                const tax = taxes.find(t => t.id === Number(val));
                                setProductForm({ ...productForm, gst_variant_id: Number(val), hsn_code: tax?.value || "" });
                            }}
                        />
                        <div className="form-group">
                            <label>Tax Percentage</label>
                            <div className="suffix-input-wrapper">
                                <input
                                    type="text"
                                    readOnly={!isCustomProductTax}
                                    placeholder={isCustomProductTax ? "Enter %" : "Auto-filled"}
                                    value={isCustomProductTax ? customProductPercent : (taxes.find(t => t.id === productForm.gst_variant_id)?.value || "0")}
                                    onChange={e => setCustomProductPercent(e.target.value)}
                                />
                                <span className="suffix">%</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "30px", marginBottom: "25px" }}>
                        <div className="status-row-fixed">
                            <span className="status-label-fixed">Status</span>
                            <div
                                className={`blue-square-checkbox ${productForm.status === "inactive" ? "inactive" : ""}`}
                                onClick={() => setProductForm({ ...productForm, status: productForm.status === "active" ? "inactive" : "active" })}
                            >
                                {productForm.status === "active" && <Check size={24} />}
                            </div>
                        </div>

                        <div className="status-row-fixed">
                            <span className="status-label-fixed">Custom Tax</span>
                            <div
                                className={`blue-square-checkbox ${!isCustomProductTax ? "inactive" : ""}`}
                                onClick={() => setIsCustomProductTax(!isCustomProductTax)}
                            >
                                {isCustomProductTax && <Check size={24} />}
                            </div>
                        </div>
                    </div>

                    <div className="form-actions-centered">
                        <button type="submit" className="btn-save-unit" disabled={saving}>
                            {editId ? "Update Product Tax" : "Save Product Tax"}
                        </button>
                        {editId && <button type="button" className="btn-reset-unit" onClick={resetForms}>Cancel</button>}
                    </div>
                </form>
            </div>

            <div className="tax-list-section">
                <div className="tax-list-card">
                    <table className="redesign-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Category Name</th>
                                <th>Product Name</th>
                                <th>Tax Name</th>
                                <th>Tax Percentage (%)</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productTaxes.map((pt, i) => (
                                <tr key={pt.id}>
                                    <td>{i + 1}</td>
                                    <td>
                                        {(() => {
                                            const prod = allProducts.find(p => String(p.id) === String(pt.product_id)) as any;
                                            return pt.category_name || prod?.primaryName || prod?.primary_category_name || prod?.category_name || "—";
                                        })()}
                                    </td>
                                    <td>{pt.product_name}</td>
                                    <td>{pt.variant_name || pt.name || pt.tax || taxes.find(t => String(t.id) === String(pt.gst_variant_id))?.name || "N/A"}</td>
                                    <td>
                                        {(() => {
                                            const val = pt.gst_value || pt.value || pt.percentage || pt.gst_percent || pt.tax_percent || pt.gst || pt.tax || taxes.find(t => t.id === pt.gst_variant_id)?.value || "0";
                                            return String(val).endsWith("%") ? val : `${val}%`;
                                        })()}
                                    </td>
                                    <td>
                                        <div className="action-icons">
                                            <button className="btn-icon-edit" onClick={() => handleEditProductTax(pt)}><SquarePen size={16} /></button>
                                            <button className="btn-icon-delete" onClick={() => handleDeleteProductTax(pt.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    return (
        <div className="add-unit-type-container">
            <div className="add-unit-type-header">
                <h2>Tax Management</h2>
            </div>

            <div className="tax-tabs-container">
                <button
                    className={`tax-tab-btn ${activeTab === "create" ? "active" : ""}`}
                    onClick={() => { setActiveTab("create"); resetForms(); }}
                >
                    Tax Create
                </button>
                <button
                    className={`tax-tab-btn ${activeTab === "set" ? "active" : ""}`}
                    onClick={() => { setActiveTab("set"); resetForms(); }}
                >
                    Tax Set
                </button>
            </div>

            {activeTab === "create" ? (
                renderTaxCreate()
            ) : (
                <>
                    <div className="sub-tabs-container">
                        <div
                            className={`sub-tab-btn ${subTab === "category" ? "active" : ""}`}
                            onClick={() => { setSubTab("category"); resetForms(); }}
                        >
                            Category
                        </div>
                        <div
                            className={`sub-tab-btn ${subTab === "product" ? "active" : ""}`}
                            onClick={() => { setSubTab("product"); resetForms(); }}
                        >
                            Product
                        </div>
                    </div>
                    {loading ? <p>Loading...</p> : (subTab === "category" ? renderTaxSetCategory() : renderTaxSetProduct())}
                </>
            )}
        </div>
    );
};

export default TaxManagement;
