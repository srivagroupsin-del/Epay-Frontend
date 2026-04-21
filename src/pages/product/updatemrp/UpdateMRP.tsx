import { useEffect, useState } from "react";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import {
    getProducts,
    updateProduct,
    updateProductMRP,
    deleteProduct,
    type Product,
} from "../../../api/product.api";
import { Save, CheckCircle, Edit2, X, Search, Trash2 } from "lucide-react";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import "./UpdateMRP.css";

const UpdateMRP = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { showLoader, hideLoader } = useLoading();
    const { showDeleteSuccess } = useSuccessPopup();

    // Filters
    const [search, setSearch] = useState("");
    const [limit, setLimit] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpInput, setJumpInput] = useState("1");

    const countOptions = [10, 20, 50, 100, 250, 500];

    const [changes, setChanges] = useState<{ [key: string | number]: number }>({});
    const [editingId, setEditingId] = useState<number | string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});
    const [savingId, setSavingId] = useState<number | string | null>(null);
    const [savedId, setSavedId] = useState<number | string | null>(null);
    const [mrpError, setMrpError] = useState<{ [key: string | number]: string }>({});

    const handleMrpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "-" || e.key === "e") {
            e.preventDefault();
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            showLoader("Loading products, please wait...");
            const prodData = await getProducts();
            const normalizedProducts = (prodData || []).map((p: any) => ({
                ...p,
                id: p.id || p._id
            }));
            setProducts(normalizedProducts);
        } catch (err) {
            console.error("Failed to load products:", err);
        } finally {
            setLoading(false);
            hideLoader();
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Sync jump input with currentPage
    useEffect(() => {
        setJumpInput(String(currentPage));
    }, [currentPage]);

    const handleInputChange = (field: keyof Product, value: any) => {
        if (field === 'mrp') {
            const numValue = Number(value);
            if (numValue < 0) {
                setMrpError(prev => ({ ...prev, [editingId as any]: "MRP price cannot be negative." }));
                return;
            } else {
                setMrpError(prev => {
                    const next = { ...prev };
                    delete next[editingId as any];
                    return next;
                });
            }
        }
        setEditForm(prev => ({
            ...prev,
            [field]: field === 'mrp' ? Number(value) : value
        }));
        setSavedId(null);
    };

    const startEditing = (product: Product) => {
        setEditingId(product.id);
        setEditForm(product);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSave = async (product: Product) => {
        const isQuickMrpUpdate = editingId !== product.id;
        const newMrp = isQuickMrpUpdate ? changes[product.id] : editForm.mrp;

        if (mrpError[product.id]) {
            alert(mrpError[product.id]);
            return;
        }

        if (newMrp === undefined || newMrp === null || Number(newMrp) < 0) {
            alert("Please enter a valid MRP (must be 0 or positive)");
            return;
        }

        try {
            setSavingId(product.id);

            if (isQuickMrpUpdate) {
                // Use the specialized MRP update API
                await updateProductMRP(product.id, Number(newMrp));

                setProducts(prev => prev.map(p =>
                    p.id === product.id ? { ...p, mrp: Number(newMrp) } : p
                ));

                const newChanges = { ...changes };
                delete newChanges[product.id];
                setChanges(newChanges);
            } else {
                // Use full product update API
                const formToSend: any = {
                    product_name: editForm.product_name,
                    mrp: String(editForm.mrp),
                };

                await updateProduct(product.id, formToSend);

                setProducts(prev => prev.map(p =>
                    p.id === product.id ? { ...p, ...editForm, mrp: Number(editForm.mrp) } : p
                ));

                setEditingId(null);
                setEditForm({});
            }

            setSavedId(product.id);
            setTimeout(() => setSavedId(null), 3000);

        } catch (err: any) {
            alert(`Update failed: ${err.message}`);
        } finally {
            setSavingId(null);
        }
    };

    const handleDelete = async (id: number | string) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            await deleteProduct(id);
            setProducts(prev => prev.filter(p => (p.id || (p as any)._id) !== id));
            showDeleteSuccess("Product has been deleted successfully.", "Deleted Successfully!");
        } catch (err: any) {
            alert(`Delete failed: ${err.message}`);
        }
    };

    const filteredProducts = products
        .filter(p => {
            const term = search.trim().toLowerCase();
            if (!term) return true;

            return String(p.product_name || "").toLowerCase().includes(term) ||
                String(p.model || "").toLowerCase().includes(term) ||
                String(p.primary_category || "").toLowerCase().includes(term) ||
                String(p.secondary_category || "").toLowerCase().includes(term) ||
                String(p.brands || "").toLowerCase().includes(term);
        })
        .sort((a, b) =>
            String(a.product_name || "").localeCompare(String(b.product_name || ""), undefined, { sensitivity: 'base' })
        );

    const totalPages = Math.ceil(filteredProducts.length / limit);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * limit,
        currentPage * limit
    );

    const handleJumpChange = (val: string) => {
        if (val === "") {
            setJumpInput("");
            return;
        }
        if (!/^\d+$/.test(val)) return;

        setJumpInput(val);
        const page = Number(val);
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    if (loading) return <div className="p-8 text-center font-semibold">Loading data...</div>;

    return (
        <div className="mrp-update-container">
            <div className="mrp-card">
                <div className="mrp-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <h2>Add MRP Update</h2>
                    </div>
                </div>

                {/* FILTERS SECTION */}
                <div className="filters-row">

                    {/* PRODUCT SEARCH */}
                    <div className="mrp-floating-field" style={{ width: '400px' }}>
                        <label>PRODUCT SEARCH</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="custom-select-trigger"
                                placeholder="Search by name, model, category..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                style={{ paddingLeft: '40px' }}
                            />
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        </div>
                    </div>

                    {/* LIMIT */}
                    <div className="mrp-floating-field" style={{ width: '100px' }}>
                        <label>Entries</label>
                        <select
                            className="custom-select-trigger"
                            value={limit}
                            onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                        >
                            {countOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* TABLE AREA */}
                <div className="mapping-table-wrapper" style={{ maxHeight: '550px' }}>
                    <table className="mapping-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>#</th>
                                <th style={{ width: '20%' }}>Product Name</th>
                                <th style={{ width: '12%' }}>Primary</th>
                                <th style={{ width: '12%' }}>Secondary</th>
                                <th style={{ width: '12%' }}>Brand</th>
                                <th style={{ width: '10%' }}>Code/Model</th>
                                <th style={{ width: '80px' }}>Image</th>
                                <th style={{ width: '10%' }}>Old MRP</th>
                                <th style={{ width: '15%' }}>New MRP</th>
                                <th style={{ width: '100px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProducts.map((p: any, i) => {
                                // Robust field lookup for category and brand names
                                const displayPrimary = p.primary_category || p.primaryName || p.primary_category_name || "—";
                                const displaySecondary = p.secondary_category || p.secondaryName || p.secondary_category_name || "—";
                                const displayBrand = p.brands || p.brandName || p.brand_name || "—";
                                const imgKey = p.base_image || p.image || p.img;

                                return (
                                    <tr key={p.id}>
                                        <td>{(currentPage - 1) * limit + i + 1}</td>
                                        <td style={{ fontWeight: '600' }}>
                                            {editingId === p.id ? (
                                                <input
                                                    className="table-edit-input"
                                                    value={editForm.product_name || ""}
                                                    onChange={(e) => handleInputChange("product_name", e.target.value)}
                                                />
                                            ) : p.product_name}
                                        </td>
                                        <td>{displayPrimary}</td>
                                        <td>{displaySecondary}</td>
                                        <td>{displayBrand}</td>
                                        <td>
                                            {editingId === p.id ? (
                                                <input
                                                    className="table-edit-input"
                                                    value={editForm.model || ""}
                                                    onChange={(e) => handleInputChange("model", e.target.value)}
                                                />
                                            ) : (p.model || "—")}
                                        </td>
                                        <td>
                                            {imgKey ? (
                                                <img
                                                    src={`${IMAGE_BASE_URL}/${imgKey}`}
                                                    className="product-thumb"
                                                    alt="Product"
                                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                                />
                                            ) : (
                                                <div className="no-img-placeholder" style={{ fontSize: '10px', color: '#94a3b8' }}>No Img</div>
                                            )}
                                        </td>
                                        <td style={{ color: "#64748b" }}>₹{p.mrp}</td>
                                        <td>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="number"
                                                    className="table-edit-input"
                                                    style={{ border: (changes[p.id] !== undefined || editingId === p.id) && mrpError[p.id] ? '1px solid #ef4444' : (changes[p.id] !== undefined ? '1px solid #323da7' : undefined) }}
                                                    value={editingId === p.id ? (editForm.mrp || "") : (changes[p.id] !== undefined ? changes[p.id] : "")}
                                                    placeholder="Set New"
                                                    onKeyDown={handleMrpKeyDown}
                                                    min="0"
                                                    step="any"
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (editingId === p.id) {
                                                            handleInputChange("mrp", val);
                                                        } else {
                                                            if (Number(val) < 0) {
                                                                setMrpError(prev => ({ ...prev, [p.id]: "MRP price cannot be negative." }));
                                                                return;
                                                            } else {
                                                                setMrpError(prev => {
                                                                    const next = { ...prev };
                                                                    delete next[p.id];
                                                                    return next;
                                                                });
                                                            }
                                                            setChanges(prev => ({ ...prev, [p.id]: Number(val) }));
                                                            setSavedId(null);
                                                        }
                                                    }}
                                                />
                                                {mrpError[p.id] && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px', position: 'absolute', bottom: '-15px', left: 0, whiteSpace: 'nowrap', zIndex: 10 }}>{mrpError[p.id]}</div>}
                                                {(changes[p.id] !== undefined && !mrpError[p.id]) && <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#323da7' }}>✎</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {savingId === p.id ? (
                                                    <span className="status-loading">Saving..</span>
                                                ) : savedId === p.id ? (
                                                    <span className="status-saved"><CheckCircle size={14} /> Done</span>
                                                ) : editingId === p.id ? (
                                                    <div style={{ display: 'flex', gap: '12px' }}>
                                                        <button className="btn-icon-save" onClick={() => handleSave(p)} title="Save"><Save size={16} /></button>
                                                        <button className="btn-icon-cancel" onClick={cancelEditing} title="Cancel"><X size={16} /></button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                        <button className="btn-icon-edit" onClick={() => startEditing(p)} title="Edit Row"><Edit2 size={16} /></button>
                                                        <button className="btn-icon-delete" onClick={() => handleDelete(p.id)} title="Delete Row"><Trash2 size={16} /></button>
                                                        {(changes[p.id] !== undefined && changes[p.id] !== p.mrp) && (
                                                            <button className="btn-save-mapping" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleSave(p)}>Save</button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="text-center p-12" style={{ color: '#94a3b8' }}>No products match your search</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION SECTION */}
                <div className="pagination-wrapper">
                    <div className="pagination-info">
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, filteredProducts.length)} of {filteredProducts.length} entries
                    </div>

                    <div className="pagination-right-group">
                        <div className="page-jump-container">
                            <span>Go to Page:</span>
                            <input
                                type="text"
                                className="page-jump-input"
                                value={jumpInput}
                                onChange={(e) => handleJumpChange(e.target.value)}
                                placeholder="Page"
                            />
                        </div>

                        <div className="pagination-list">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="pagination-btn pagination-arrow">«</button>
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="pagination-btn pagination-arrow">‹</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(pageNum => pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1)
                                .map((pageNum, idx, arr) => {
                                    const els = [];
                                    if (idx > 0 && pageNum - arr[idx - 1] > 1) els.push(<span key={`dots-${pageNum}`} className="pagination-dots">...</span>);
                                    els.push(
                                        <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}>{pageNum}</button>
                                    );
                                    return els;
                                })}
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="pagination-btn pagination-arrow">›</button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="pagination-btn pagination-arrow">»</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateMRP;
