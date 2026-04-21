import { useState, useEffect } from "react";
import { Check, Trash2 } from "lucide-react";
import "./discount.css";

// API Imports
import { 
    getDiscounts, createDiscount, deleteDiscount, 
    getCategoryDiscounts, createCategoryDiscount, deleteCategoryDiscount,
    getProductDiscounts, createProductDiscount, deleteProductDiscount,
    type Discount, type DiscountPayload, type CategoryDiscountPayload, type ProductDiscountPayload, type CategoryDiscount, type ProductDiscount
} from "../models/discount.api";
import { getCategories, type CategoryRow } from "../../category/models/category.api";
import { getProducts, type Product } from "../../../api/product.api";
import SearchableSelect from "../../../components/SearchableSelect/SearchableSelect";

type Tab = "create" | "set";
type SubTab = "category" | "product";

const DiscountManagement = () => {
    // Tab Management
    const [activeTab, setActiveTab] = useState<Tab>("create");
    const [subTab, setSubTab] = useState<SubTab>("category");

    // Common State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    /* ── 1. DISCOUNT CREATE STATE ── */
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [discountForm, setDiscountForm] = useState<DiscountPayload>({
        name: "",
        value: "",
        type: "percentage",
        status: "active",
    });



    /* ── 2. DISCOUNT SET STATE ── */
    const [categoryDiscounts, setCategoryDiscounts] = useState<CategoryDiscount[]>([]);
    const [productDiscounts, setProductDiscounts] = useState<ProductDiscount[]>([]);
    
    // Dropdown Data
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedCategoryForProduct, setSelectedCategoryForProduct] = useState<string | number>("");

    // Set Category Form
    const [categoryForm, setCategoryForm] = useState<CategoryDiscountPayload>({
        category_id: 0,
        discount_id: 0,
        status: "active"
    });

    // Set Product Form
    const [productForm, setProductForm] = useState<ProductDiscountPayload>({
        product_id: 0,
        discount_id: 0,
        status: "active"
    });

    // Fetch Initial Data
    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [discountList, categoryList, catDiscounts, prodDiscounts, productsRes] = await Promise.all([
                getDiscounts(),
                getCategories(),
                getCategoryDiscounts(),
                getProductDiscounts(),
                getProducts()
            ]);
            setDiscounts(Array.isArray(discountList) ? discountList : []);
            setCategories(Array.isArray(categoryList) ? categoryList : []);
            setCategoryDiscounts(Array.isArray(catDiscounts) ? catDiscounts : []);
            setProductDiscounts(Array.isArray(prodDiscounts) ? prodDiscounts : []);
            setAllProducts(Array.isArray(productsRes) ? productsRes : []);
        } catch (err) {
            console.error("Error fetching discount data:", err);
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
        setDiscountForm({ name: "", value: "", type: "percentage", status: "active" });
        setCategoryForm({ category_id: 0, discount_id: 0, status: "active" });
        setProductForm({ product_id: 0, discount_id: 0, status: "active" });
    };

    const handleDiscountCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!discountForm.name || !discountForm.value) return alert("Please fill all fields");
        try {
            setSaving(true);
            await createDiscount(discountForm);
            alert("Discount created successfully");
            resetForms();
            const list = await getDiscounts();
            setDiscounts(list);
        } catch (err) { alert("Failed to save"); } finally { setSaving(false); }
    };

    const handleCategoryDiscountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryForm.category_id || !categoryForm.discount_id) return alert("Please fill all fields");
        try {
            setSaving(true);
            await createCategoryDiscount(categoryForm);
            alert("Category Discount mapped");
            resetForms();
            const list = await getCategoryDiscounts();
            setCategoryDiscounts(list);
        } catch (err) { alert("Failed to save"); } finally { setSaving(false); }
    };

    const handleProductDiscountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productForm.product_id || !productForm.discount_id) return alert("Please fill all fields");
        try {
            setSaving(true);
            await createProductDiscount(productForm);
            alert("Product Discount mapped");
            resetForms();
            const list = await getProductDiscounts();
            setProductDiscounts(list);
        } catch (err) { alert("Failed to save"); } finally { setSaving(false); }
    };

    const handleDeleteDiscount = async (id: number) => {
        if (!window.confirm("Delete this discount?")) return;
        await deleteDiscount(id);
        setDiscounts(prev => prev.filter(d => d.id !== id));
    };

    const handleDeleteCategoryDiscount = async (id: number) => {
        if (!window.confirm("Remove this mapping?")) return;
        await deleteCategoryDiscount(id);
        setCategoryDiscounts(prev => prev.filter(d => d.id !== id));
    };

    const handleDeleteProductDiscount = async (id: number) => {
        if (!window.confirm("Remove this mapping?")) return;
        await deleteProductDiscount(id);
        setProductDiscounts(prev => prev.filter(d => d.id !== id));
    };

    /* ── RENDER HELPERS ── */

    const renderDiscountCreate = () => (
        <>
            <div className="unit-type-card">
                <form onSubmit={handleDiscountCreateSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "20px", marginBottom: "25px", alignItems: "flex-end" }}>
                        <div className="form-group">
                            <label>Discount Name</label>
                            <input 
                                type="text" 
                                placeholder="Summer Sale" 
                                value={discountForm.name}
                                onChange={e => setDiscountForm({...discountForm, name: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Discount Value</label>
                            <div className="suffix-input-wrapper">
                                <input 
                                    type="text" 
                                    placeholder={discountForm.type === "percentage" ? "10" : "50"} 
                                    value={discountForm.value}
                                    onChange={e => setDiscountForm({...discountForm, value: e.target.value})}
                                />
                                <div className="symbol-toggle-group">
                                    <button 
                                        type="button"
                                        className={`symbol-btn ${discountForm.type === "percentage" ? "active" : ""}`}
                                        onClick={() => setDiscountForm({...discountForm, type: "percentage"})}
                                    >
                                        %
                                    </button>
                                    <button 
                                        type="button"
                                        className={`symbol-btn ${discountForm.type === "flat" ? "active" : ""}`}
                                        onClick={() => setDiscountForm({...discountForm, type: "flat"})}
                                    >
                                        ₹
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="status-row-fixed">
                        <span className="status-label-fixed">Status</span>
                        <div 
                            className={`blue-square-checkbox ${discountForm.status === "inactive" ? "inactive" : ""}`}
                            onClick={() => setDiscountForm({...discountForm, status: discountForm.status === "active" ? "inactive" : "active"})}
                        >
                            {discountForm.status === "active" && <Check size={24} />}
                        </div>
                    </div>

                    <div className="form-actions-centered">
                        <button type="submit" className="btn-save-unit" disabled={saving}>Save Discount</button>
                    </div>
                </form>
            </div>

            <div className="tax-list-section">
                <div className="tax-list-card">
                    <table className="redesign-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Discount Name</th>
                                <th>Value</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discounts.map((d, i) => (
                                <tr key={d.id}>
                                    <td>{i + 1}</td>
                                    <td>{d.name}</td>
                                    <td>{d.value}{d.type === "percentage" ? "%" : "₹"}</td>
                                    <td>{d.type === "percentage" ? "Percentage" : "Flat"}</td>
                                    <td>
                                        <span className={`status-badge ${d.status === "active" || d.status === 1 ? "active" : "inactive"}`}>
                                            {d.status === "active" || d.status === 1 ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn-icon-delete" onClick={() => handleDeleteDiscount(d.id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    const renderDiscountSetCategory = () => (
        <>
            <div className="unit-type-card">
                <form onSubmit={handleCategoryDiscountSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "25px", alignItems: "flex-start" }}>
                        <SearchableSelect 
                            label="Category"
                            placeholder="Select Category"
                            value={categoryForm.category_id}
                            options={categories.map(c => ({ id: c.id, label: c.category_name }))}
                            onChange={(val) => setCategoryForm({...categoryForm, category_id: Number(val)})}
                        />
                        <SearchableSelect 
                            label="Discount Name"
                            placeholder="Select Discount"
                            value={categoryForm.discount_id}
                            options={discounts.filter(d => d.status === "active" || d.status === 1).map(d => ({ id: d.id, label: d.name }))}
                            onChange={(val) => setCategoryForm({...categoryForm, discount_id: Number(val)})}
                        />
                        <div className="form-group">
                            <label>Discount Value</label>
                            <div className="suffix-input-wrapper">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={discounts.find(d => d.id === categoryForm.discount_id)?.value || "0"} 
                                />
                                <span className="suffix">{discounts.find(d => d.id === categoryForm.discount_id)?.type === "percentage" ? "%" : "₹"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="form-actions-centered">
                        <button type="submit" className="btn-save-unit" disabled={saving}>Save Category Discount</button>
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
                                <th>Discount Name</th>
                                <th>Value</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoryDiscounts.map((cd, i) => (
                                <tr key={cd.id}>
                                    <td>{i + 1}</td>
                                    <td>{cd.category_name || "—"}</td>
                                    <td>{cd.discount_name || "—"}</td>
                                    <td>{cd.discount_value}{cd.discount_type === "percentage" || cd.discount_type === "Percentage" ? "%" : "₹"}</td>
                                    <td>
                                        <button className="btn-icon-delete" onClick={() => handleDeleteCategoryDiscount(cd.id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    const renderDiscountSetProduct = () => (
        <>
            <div className="unit-type-card">
                <form onSubmit={handleProductDiscountSubmit}>
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
                            onChange={(val) => setProductForm({...productForm, product_id: Number(val)})}
                        />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "25px", alignItems: "flex-start" }}>
                        <SearchableSelect 
                            label="Discount Name"
                            placeholder="Select Discount"
                            value={productForm.discount_id}
                            options={discounts.filter(d => d.status === "active" || d.status === 1).map(d => ({ id: d.id, label: d.name }))}
                            onChange={(val) => setProductForm({...productForm, discount_id: Number(val)})}
                        />
                        <div className="form-group">
                            <label>Discount Value</label>
                            <div className="suffix-input-wrapper">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={discounts.find(d => d.id === productForm.discount_id)?.value || "0"} 
                                />
                                <span className="suffix">{discounts.find(d => d.id === productForm.discount_id)?.type === "percentage" ? "%" : "₹"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="form-actions-centered">
                        <button type="submit" className="btn-save-unit" disabled={saving}>Save Product Discount</button>
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
                                <th>Discount Name</th>
                                <th>Value</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productDiscounts.map((pd, i) => (
                                <tr key={pd.id}>
                                    <td>{i + 1}</td>
                                    <td>{pd.category_name || (allProducts.find(p => String(p.id) === String(pd.product_id)) as any)?.primaryName || "—"}</td>
                                    <td>{pd.product_name || "—"}</td>
                                    <td>{pd.discount_name || "—"}</td>
                                    <td>{pd.discount_value}{pd.discount_type === "percentage" || pd.discount_type === "Percentage" ? "%" : "₹"}</td>
                                    <td>
                                        <button className="btn-icon-delete" onClick={() => handleDeleteProductDiscount(pd.id)}><Trash2 size={16} /></button>
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
                <h2>Discount Management</h2>
            </div>
            {loading ? (
                <div style={{ textAlign: "center", padding: "50px" }}>
                    <h3>Fetching Discount Data...</h3>
                </div>
            ) : (
                <>
                    <div className="tax-tabs-container">
                        <button className={`tax-tab-btn ${activeTab === "create" ? "active" : ""}`} onClick={() => setActiveTab("create")}>Discount Create</button>
                        <button className={`tax-tab-btn ${activeTab === "set" ? "active" : ""}`} onClick={() => setActiveTab("set")}>Discount Set</button>
                    </div>
                    {activeTab === "create" ? renderDiscountCreate() : (
                        <>
                            <div className="sub-tabs-container">
                                <div className={`sub-tab-btn ${subTab === "category" ? "active" : ""}`} onClick={() => setSubTab("category")}>Category</div>
                                <div className={`sub-tab-btn ${subTab === "product" ? "active" : ""}`} onClick={() => setSubTab("product")}>Product</div>
                            </div>
                            {subTab === "category" ? renderDiscountSetCategory() : renderDiscountSetProduct()}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default DiscountManagement;
