import { useState, useEffect } from "react";
import { Check, Trash2 } from "lucide-react";
import "./offer.css";

// API Imports
import { 
    getOffers, createOffer, deleteOffer, 
    getCategoryOffers, createCategoryOffer, deleteCategoryOffer,
    getProductOffers, createProductOffer, deleteProductOffer,
    type Offer, type OfferPayload, type CategoryOfferPayload, type ProductOfferPayload, type CategoryOffer, type ProductOffer
} from "../models/offer.api";
import { getCategories, type CategoryRow } from "../../category/models/category.api";
import { getProducts, type Product } from "../../../api/product.api";
import SearchableSelect from "../../../components/SearchableSelect/SearchableSelect";

type Tab = "create" | "set";
type SubTab = "category" | "product";

const OfferManagement = () => {
    // Tab Management
    const [activeTab, setActiveTab] = useState<Tab>("create");
    const [subTab, setSubTab] = useState<SubTab>("category");

    // Common State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    /* ── 1. OFFER CREATE STATE ── */
    const [offers, setOffers] = useState<Offer[]>([]);
    const [offerForm, setOfferForm] = useState<OfferPayload>({
        name: "",
        description: "",
        status: "active",
    });

    /* ── 2. OFFER SET STATE ── */
    const [categoryOffers, setCategoryOffers] = useState<CategoryOffer[]>([]);
    const [productOffers, setProductOffers] = useState<ProductOffer[]>([]);
    
    // Dropdown Data
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedCategoryForProduct, setSelectedCategoryForProduct] = useState<string | number>("");

    // Set Category Form
    const [categoryForm, setCategoryForm] = useState<CategoryOfferPayload>({
        category_id: 0,
        offer_id: 0,
        status: "active"
    });

    // Set Product Form
    const [productForm, setProductForm] = useState<ProductOfferPayload>({
        product_id: 0,
        offer_id: 0,
        status: "active"
    });

    // Fetch Initial Data
    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [offerList, categoryList, catOffers, prodOffers, productsRes] = await Promise.all([
                getOffers(),
                getCategories(),
                getCategoryOffers(),
                getProductOffers(),
                getProducts()
            ]);
            setOffers(Array.isArray(offerList) ? offerList : []);
            setCategories(Array.isArray(categoryList) ? categoryList : []);
            setCategoryOffers(Array.isArray(catOffers) ? catOffers : []);
            setProductOffers(Array.isArray(prodOffers) ? prodOffers : []);
            setAllProducts(Array.isArray(productsRes) ? productsRes : []);
        } catch (err) {
            console.error("Error fetching offer data:", err);
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
        setOfferForm({ name: "", description: "", status: "active" });
        setCategoryForm({ category_id: 0, offer_id: 0, status: "active" });
        setProductForm({ product_id: 0, offer_id: 0, status: "active" });
    };

    const handleOfferCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!offerForm.name) return alert("Please fill at least the name");
        try {
            setSaving(true);
            await createOffer(offerForm);
            alert("Offer created successfully");
            resetForms();
            const list = await getOffers();
            setOffers(list);
        } catch (err) { alert("Failed to save offer"); } finally { setSaving(false); }
    };

    const handleCategoryOfferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryForm.category_id || !categoryForm.offer_id) return alert("Please select category and offer");
        try {
            setSaving(true);
            await createCategoryOffer(categoryForm);
            alert("Category Offer mapped");
            resetForms();
            const list = await getCategoryOffers();
            setCategoryOffers(list);
        } catch (err) { alert("Failed to save mapping"); } finally { setSaving(false); }
    };

    const handleProductOfferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productForm.product_id || !productForm.offer_id) return alert("Please select product and offer");
        try {
            setSaving(true);
            await createProductOffer(productForm);
            alert("Product Offer mapped");
            resetForms();
            const list = await getProductOffers();
            setProductOffers(list);
        } catch (err) { alert("Failed to save mapping"); } finally { setSaving(false); }
    };

    const handleDeleteOffer = async (id: number) => {
        if (!window.confirm("Delete this offer?")) return;
        await deleteOffer(id);
        setOffers(prev => prev.filter(o => o.id !== id));
    };

    const handleDeleteCategoryOffer = async (id: number) => {
        if (!window.confirm("Remove this mapping?")) return;
        await deleteCategoryOffer(id);
        setCategoryOffers(prev => prev.filter(o => o.id !== id));
    };

    const handleDeleteProductOffer = async (id: number) => {
        if (!window.confirm("Remove this mapping?")) return;
        await deleteProductOffer(id);
        setProductOffers(prev => prev.filter(o => o.id !== id));
    };

    /* ── RENDER HELPERS ── */

    const renderOfferCreate = () => (
        <>
            <div className="unit-type-card">
                <form onSubmit={handleOfferCreateSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px", marginBottom: "25px", alignItems: "flex-end" }}>
                        <div className="form-group">
                            <label>Offer Name</label>
                            <input 
                                type="text" 
                                placeholder="Diwali Special" 
                                value={offerForm.name}
                                onChange={e => setOfferForm({...offerForm, name: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Description / Conditions</label>
                            <input 
                                type="text" 
                                placeholder="Buy 2 Get 1 Free on all Electronics" 
                                value={offerForm.description}
                                onChange={e => setOfferForm({...offerForm, description: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="status-row-fixed">
                        <span className="status-label-fixed">Status</span>
                        <div 
                            className={`blue-square-checkbox ${offerForm.status === "inactive" ? "inactive" : ""}`}
                            onClick={() => setOfferForm({...offerForm, status: offerForm.status === "active" ? "inactive" : "active"})}
                        >
                            {offerForm.status === "active" && <Check size={24} />}
                        </div>
                    </div>

                    <div className="form-actions-centered">
                        <button type="submit" className="btn-save-unit" disabled={saving}>Save Offer</button>
                    </div>
                </form>
            </div>

            <div className="tax-list-section">
                <div className="tax-list-card">
                    <table className="redesign-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Offer Name</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.map((o, i) => (
                                <tr key={o.id}>
                                    <td>{i + 1}</td>
                                    <td>{o.name}</td>
                                    <td>{o.description}</td>
                                    <td>
                                        <span className={`status-badge ${o.status === "active" || o.status === 1 ? "active" : "inactive"}`}>
                                            {o.status === "active" || o.status === 1 ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn-icon-delete" onClick={() => handleDeleteOffer(o.id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    const renderOfferSetCategory = () => (
        <>
            <div className="unit-type-card">
                <form onSubmit={handleCategoryOfferSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px", alignItems: "flex-start" }}>
                        <SearchableSelect 
                            label="Category"
                            placeholder="Select Category"
                            value={categoryForm.category_id}
                            options={categories.map(c => ({ id: c.id, label: c.category_name }))}
                            onChange={(val) => setCategoryForm({...categoryForm, category_id: Number(val)})}
                        />
                        <SearchableSelect 
                            label="Offer Name"
                            placeholder="Select Offer"
                            value={categoryForm.offer_id}
                            options={offers.filter(o => o.status === "active" || o.status === 1).map(o => ({ id: o.id, label: o.name }))}
                            onChange={(val) => setCategoryForm({...categoryForm, offer_id: Number(val)})}
                        />
                    </div>
                    <div className="form-actions-centered">
                        <button type="submit" className="btn-save-unit" disabled={saving}>Save Category Offer</button>
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
                                <th>Offer Name</th>
                                <th>Offer Details</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoryOffers.map((co, i) => (
                                <tr key={co.id}>
                                    <td>{i + 1}</td>
                                    <td>{co.category_name || "—"}</td>
                                    <td>{co.offer_name || "—"}</td>
                                    <td>{co.offer_description || "—"}</td>
                                    <td>
                                        <button className="btn-icon-delete" onClick={() => handleDeleteCategoryOffer(co.id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    const renderOfferSetProduct = () => (
        <>
            <div className="unit-type-card">
                <form onSubmit={handleProductOfferSubmit}>
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginBottom: "25px", alignItems: "flex-start" }}>
                        <SearchableSelect 
                            label="Offer Name"
                            placeholder="Select Offer"
                            value={productForm.offer_id}
                            options={offers.filter(o => o.status === "active" || o.status === 1).map(o => ({ id: o.id, label: o.name }))}
                            onChange={(val) => setProductForm({...productForm, offer_id: Number(val)})}
                        />
                    </div>
                    <div className="form-actions-centered">
                        <button type="submit" className="btn-save-unit" disabled={saving}>Save Product Offer</button>
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
                                <th>Offer Name</th>
                                <th>Offer Details</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productOffers.map((po, i) => (
                                <tr key={po.id}>
                                    <td>{i + 1}</td>
                                    <td>{po.category_name || (allProducts.find(p => String(p.id) === String(po.product_id)) as any)?.primaryName || "—"}</td>
                                    <td>{po.product_name || "—"}</td>
                                    <td>{po.offer_name || "—"}</td>
                                    <td>{po.offer_description || "—"}</td>
                                    <td>
                                        <button className="btn-icon-delete" onClick={() => handleDeleteProductOffer(po.id)}><Trash2 size={16} /></button>
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
                <h2>Offer Management</h2>
            </div>
            {loading ? (
                <div style={{ textAlign: "center", padding: "50px" }}>
                    <h3>Fetching Offer Data...</h3>
                </div>
            ) : (
                <>
                    <div className="tax-tabs-container">
                        <button className={`tax-tab-btn ${activeTab === "create" ? "active" : ""}`} onClick={() => setActiveTab("create")}>Offer Create</button>
                        <button className={`tax-tab-btn ${activeTab === "set" ? "active" : ""}`} onClick={() => setActiveTab("set")}>Offer Set</button>
                    </div>
                    {activeTab === "create" ? renderOfferCreate() : (
                        <>
                            <div className="sub-tabs-container">
                                <div className={`sub-tab-btn ${subTab === "category" ? "active" : ""}`} onClick={() => setSubTab("category")}>Category</div>
                                <div className={`sub-tab-btn ${subTab === "product" ? "active" : ""}`} onClick={() => setSubTab("product")}>Product</div>
                            </div>
                            {subTab === "category" ? renderOfferSetCategory() : renderOfferSetProduct()}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default OfferManagement;
