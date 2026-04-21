import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link, useLocation } from "react-router-dom";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import {
    getProducts,
    deleteProduct,
    type Product,
} from "../../../api/product.api";
import {
    SquarePen,
    Trash2,
    QrCode,
    X,
} from "lucide-react";
import QRCode from "react-qr-code";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import { useDeleteConfirm } from "../../../context/DeleteConfirmContext";
import "./ViewProduct.css";

const ViewProduct = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Read page from URL on mount
    const urlPage = Number(searchParams.get("page")) || 1;

    const location = useLocation();
    const [products, setProducts] = useState<Product[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const { showLoader, hideLoader } = useLoading();
    const { showDeleteSuccess } = useSuccessPopup();
    const { confirmDelete } = useDeleteConfirm();
    
    // Filters State
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("All Brands");
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [selectedStatus, setSelectedStatus] = useState("Status");

    const [limit, setLimit] = useState(20);
    const [currentPage, setCurrentPage] = useState(urlPage);
    const [jumpInput, setJumpInput] = useState(String(urlPage));

    // Meta-data for dependent dropdowns
    const [allProductsMeta, setAllProductsMeta] = useState<Product[]>([]);

    // Debounce search input and Reset Selection
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            // reset logic: When search changes, reset brand and category
            setSelectedBrand("All Brands");
            setSelectedCategory("All Categories");
            setCurrentPage(1); 
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const [showQR, setShowQR] = useState<Product | null>(null);

    useEffect(() => {
        setSearchParams({ page: String(currentPage) }, { replace: true });
        setJumpInput(String(currentPage));
    }, [currentPage, setSearchParams]);

    // Main data fetcher
    useEffect(() => {
        loadData();
    }, [currentPage, limit, debouncedSearch, selectedBrand, selectedCategory, selectedStatus, location.key]);

    // Initial meta-fetch for filters
    useEffect(() => {
        const fetchMeta = async () => {
            try {
                // Fetch products without pagination to get unique filter values
                const response = await getProducts();
                const data = response.products || response.data || (Array.isArray(response) ? response : []);
                setAllProductsMeta(data);
            } catch (err) {
                console.error("Failed to fetch meta-data", err);
            }
        };
        fetchMeta();
    }, []);

    // 🔹 1. Products filtered by Search only (for Brand List)
    const productsBySearch = useMemo(() => {
        const term = debouncedSearch.trim().toLowerCase();
        if (!term) return allProductsMeta;
        return allProductsMeta.filter(p => 
            String(p.product_name || "").toLowerCase().includes(term) ||
            String(p.model || "").toLowerCase().includes(term)
        );
    }, [allProductsMeta, debouncedSearch]);

    // 🔹 2. Dynamic Brand Dropdown (Depends on Search)
    const brandOptions = useMemo(() => {
        // Use p.brands as primary source per user request
        const uniqueBrands = [...new Set(productsBySearch.map(p => p.brands).filter(Boolean))];
        return ["All Brands", ...uniqueBrands.sort()];
    }, [productsBySearch]);

    // 🔹 3. Products filtered by Search + Brand (for Category List)
    const productsBySearchAndBrand = useMemo(() => {
        const data = productsBySearch;
        if (selectedBrand === "All Brands") return data;
        return data.filter(p => p.brands === selectedBrand);
    }, [productsBySearch, selectedBrand]);

    // 🔹 4. Category Dropdown Dependency (Depends on Search + Brand)
    const filteredCategories = useMemo(() => {
        // Use p.categories as primary source per user request
        const uniqueCategories = [...new Set(productsBySearchAndBrand.map(p => p.categories).filter(Boolean))];
        return ["All Categories", ...uniqueCategories.sort()];
    }, [productsBySearchAndBrand]);

    // When Brand changes: Reset category to "All Categories"
    const handleBrandChange = (brand: string) => {
        setSelectedBrand(brand);
        setSelectedCategory("All Categories");
        setCurrentPage(1);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            showLoader("Loading products, please wait...");
            const response = await getProducts({
                page: currentPage,
                limit: limit,
                search: debouncedSearch,
                brand: selectedBrand === "All Brands" ? "" : selectedBrand,
                category: selectedCategory === "All Categories" ? "" : selectedCategory,
                status: (selectedStatus === "" || selectedStatus === "Status" || selectedStatus === "All Status") ? "" : selectedStatus
            });
            
            // Handle different possible API response structures
            const data = response.products || response.data || (Array.isArray(response) ? response : []);
            const total = response.total !== undefined ? response.total : (response.count !== undefined ? response.count : (Array.isArray(response) ? response.length : 0));
            
            // Sort alphabetically (A-Z) and numerically
            const sortedData = data.sort((a: any, b: any) => 
                String(a.product_name || "").localeCompare(String(b.product_name || ""), undefined, { numeric: true, sensitivity: 'base' })
            );

            const normalized = sortedData.map((p: any) => ({ ...p, id: p.id || p._id }));
            setProducts(normalized);
            setTotalItems(total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            hideLoader();
        }
    };

    const handleDelete = (id: number | string) => {
        confirmDelete(async () => {
            try {
                showLoader("Deleting product...");
                await deleteProduct(id);
                showDeleteSuccess("Product has been deleted successfully.", "Deleted Successfully!");
                setProducts(prev => prev.filter(p => p.id !== id));
            } catch {
                alert("Delete failed");
            } finally {
                hideLoader();
            }
        });
    };

    const totalPages = Math.ceil(totalItems / limit);
    
    // With server-side pagination, 'products' already contains the paginated set
    const paginatedProducts = products;

    const handleJumpChange = (val: string) => {
        if (val === "") {
            setJumpInput("");
            return;
        }
        if (!/^\d+$/.test(val)) return;

        setJumpInput(val);
        const p = Number(val);
        if (p >= 1 && p <= totalPages) {
            setCurrentPage(p);
        }
    };

    // Safety: Reset current page if out of bounds
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    if (loading) return <div className="p-8 text-center font-semibold">Loading product data...</div>;

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        View Product List 
                        <span style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            background: '#e2e8f0', 
                            color: '#475569', 
                            padding: '4px 12px', 
                            borderRadius: '20px',
                            marginTop: '4px'
                        }}>
                            {totalItems} Total Entries
                        </span>
                    </h2>
                </div>
                <Link to="/product/add" className="btn primary" style={{ textDecoration: 'none' }}>
                    Add New Product
                </Link>
            </div>

            <div className="filters-row" style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '25px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', flexWrap: 'wrap' }}>

                {/* SEARCH INPUT */}
                <div className="filter" style={{ flex: 1, minWidth: '300px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>PRODUCT SEARCH</label>
                    <input
                        placeholder="Type product name or model..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); }}
                        style={{
                            width: '100%',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '0 15px',
                            fontSize: '14px',
                            height: '45px',
                            outline: 'none',
                            background: '#fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                            transition: 'all 0.2s'
                        }}
                    />
                </div>

                {/* BRAND FILTER */}
                <div className="filter">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>BRAND</label>
                    <select
                        value={selectedBrand}
                        onChange={e => handleBrandChange(e.target.value)}
                        style={{
                            padding: "0 12px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "14px",
                            height: '45px',
                            minWidth: '150px',
                            color: '#1e293b',
                            background: '#fff',
                            outline: 'none',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        {brandOptions.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                {/* CATEGORY FILTER */}
                <div className="filter">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>CATEGORY</label>
                    <select
                        value={selectedCategory}
                        onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                        style={{
                            padding: "0 12px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "14px",
                            height: '45px',
                            minWidth: '150px',
                            color: '#1e293b',
                            background: '#fff',
                            outline: 'none',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        {filteredCategories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {/* STATUS FILTER */}
                <div className="filter">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>STATUS</label>
                    <select
                        value={selectedStatus}
                        onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                        style={{
                            padding: "0 12px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "14px",
                            height: '45px',
                            minWidth: '120px',
                            color: '#1e293b',
                            background: '#fff',
                            outline: 'none',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        <option value="Status">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div className="filter">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>SHOW</label>
                    <input
                        type="number"
                        min="1"
                        max="10000"
                        defaultValue={limit}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                const val = Number((e.target as HTMLInputElement).value);
                                if (val > 0) {
                                    setLimit(val);
                                    setCurrentPage(1);
                                }
                            }
                        }}
                        onBlur={e => {
                            const val = Number((e.target as HTMLInputElement).value);
                            if (val > 0 && val !== limit) {
                                setLimit(val);
                                setCurrentPage(1);
                            }
                        }}
                        style={{
                            padding: "0 12px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "14px",
                            height: '45px',
                            width: '80px',
                            color: '#1e293b',
                            background: '#fff',
                            outline: 'none',
                            fontWeight: '600',
                            textAlign: 'center'
                        }}
                    />
                </div>
            </div>

            {/* QR CODE MODAL */}
            {showQR && (
                <div className="qr-modal-overlay" onClick={() => setShowQR(null)}>
                    <div className="qr-modal" onClick={e => e.stopPropagation()}>
                        <div className="qr-header">
                            <h3>Product QR Identity</h3>
                            <button onClick={() => setShowQR(null)}><X size={20} /></button>
                        </div>
                        <div className="qr-content" id="print-area">
                            <div className="qr-code-wrapper">
                                <QRCode
                                    value={`Product: ${showQR.product_name}\nModel: ${showQR.model || 'N/A'}\nMRP: ₹${showQR.mrp || 0}\nBrand: ${showQR.brands || 'N/A'}`}
                                    size={180}
                                    level="H"
                                />
                            </div>
                            <div className="qr-info">
                                <h4>{showQR.product_name}</h4>
                                <p>Model: {showQR.model || "—"}</p>
                                <div className="qr-price-tag">₹{showQR.mrp || 0}</div>
                            </div>
                        </div>
                        <div className="qr-actions">
                            <button className="btn-qr-action btn-qr-print" onClick={() => window.print()}>
                                Print QR
                            </button>
                            <button className="btn-qr-action btn-qr-close" onClick={() => setShowQR(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {!loading && (
                <div style={{ 
                    padding: '0 5px 15px 5px', 
                    fontSize: '14px', 
                    color: '#64748b', 
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{ 
                        display: 'inline-block', 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: '#323da7' 
                    }}></span>
                    Total Entries: {totalItems}
                </div>
            )}


            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="table-wrapper">
                    <table className="product-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>PRODUCT</th>
                                <th>CATEGORY</th>
                                <th>BRAND</th>
                                <th>MODEL</th>
                                <th>MRP</th>
                                <th>PHOTO</th>
                                <th>STATUS</th>
                                <th className="text-center">ACTION</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedProducts.map((p: any, i) => {
                                // Use stored names directly from API response
                                const displayCategory = p.categories || "—";
                                const displayBrand = p.brands || "—";

                                return (
                                    <tr key={p.id}>
                                        <td>{(currentPage - 1) * limit + i + 1}</td>
                                        <td style={{ fontWeight: 500, color: "#111" }}>{p.product_name}</td>
                                        <td>{displayCategory}</td>
                                        <td>{displayBrand}</td>
                                        <td>{p.model || "—"}</td>

                                        {/* LIVE PRICE */}
                                        <td style={{ fontWeight: 600, color: "#323da7" }}>
                                            ₹{p.mrp || p.price || 0}
                                        </td>

                                        <td>
                                            {(() => {
                                                const rawImgKey = p.base_image || p.image || p.img;
                                                const imgKey = rawImgKey ? rawImgKey.replace(/^(\/?uploads\/|\/)/, '') : null;
                                                return imgKey ? (
                                                    <img
                                                        src={`${IMAGE_BASE_URL}/${imgKey}`}
                                                        className="thumb"
                                                        alt={p.product_name}
                                                    />
                                                ) : (
                                                    <div className="no-image-placeholder">No Image</div>
                                                );
                                            })()}
                                        </td>

                                        <td>
                                            <span className={`status-badge ${p.status === 'active' ? 'active' : 'inactive'}`}>
                                                {p.status}
                                            </span>
                                        </td>

                                        <td className="text-center">
                                            <div className="action-btns" style={{ justifyContent: 'center' }}>
                                                <a
                                                    href={`/products/edit/${p.id}?page=${currentPage}`}
                                                    className="btn-icon-action edit"
                                                    title="Edit"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        navigate(`/products/edit/${p.id}?page=${currentPage}`, { state: p });
                                                    }}
                                                >
                                                    <SquarePen size={24} />
                                                </a>

                                                <button
                                                    className="btn-icon-action qr"
                                                    title="QR Code"
                                                    onClick={() => setShowQR(p)}
                                                >
                                                    <QrCode size={24} />
                                                </button>

                                                <button
                                                    className="btn-icon-action delete"
                                                    title="Delete"
                                                    onClick={() => handleDelete(p.id)}
                                                >
                                                    <Trash2 size={24} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={10} style={{ textAlign: "center", padding: "40px" }}>
                                        No Data Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PAGINATION */}
            {!loading && totalItems > 0 && (
                <div className="table-footer-responsive">
                    <div className="entries-info">
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} entries
                    </div>

                    <div className="pagination-group-right">
                        <div className="page-jump-box">
                            <span>Go to Page:</span>
                            <input
                                type="text"
                                className="jump-input-field"
                                value={jumpInput}
                                onChange={(e) => handleJumpChange(e.target.value)}
                            />
                        </div>

                        <div className="pagination-container">
                            <button
                                className="pagination-arrow"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                            >
                                ≪
                            </button>
                            <div className="pagination-numbers">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(pageNum =>
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        Math.abs(pageNum - currentPage) <= 1
                                    )
                                    .map((pageNum, idx, arr) => {
                                        const elements = [];
                                        if (idx > 0 && pageNum - arr[idx - 1] > 1) {
                                            elements.push(<span key={`dots-${pageNum}`} className="pagination-dots">...</span>);
                                        }
                                        elements.push(
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                        return elements;
                                    })}
                            </div>
                            <button
                                className="pagination-arrow"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                            >
                                ≫
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewProduct;
