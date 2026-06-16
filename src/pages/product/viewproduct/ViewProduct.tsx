import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams, Link, useLocation } from "react-router-dom";
import { IMAGE_BASE_URL, BASE_URL } from "../../../base_api/api_list";
import {
    getProducts,
    deleteProduct,
    getProductById,
    generateProductBarcode,
    type Product,
} from "../../../api/product.api";
import { getCategories } from "../../../api/category.api";
import { getBrands } from "../../../api/brand.api";
import { getBrandMapping } from "../../../api/brandMapping.api";
import {
    SquarePen,
    Trash2,
    QrCode,
    X,
    RotateCcw,
} from "lucide-react";
import { Select } from "antd";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import { useDeleteConfirm } from "../../../context/DeleteConfirmContext";
import { MultitabContentLoader } from "../../../components/multitab/MultitabContentLoader";
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
    const [selectedPrimary, setSelectedPrimary] = useState("All Primary Categories");
    const [selectedSecondary, setSelectedSecondary] = useState("All Secondary Categories");
    const [selectedStatus, setSelectedStatus] = useState("Status");

    const [limit, setLimit] = useState(20);
    const [currentPage, setCurrentPage] = useState(urlPage);
    const [jumpInput, setJumpInput] = useState(String(urlPage));

    // Meta-data for dependent dropdowns
    const [allCategories, setAllCategories] = useState<any[]>([]);
    const [allBrands, setAllBrands] = useState<any[]>([]);
    const [categoryBrandMappings, setCategoryBrandMappings] = useState<any[]>([]);

    // Debounce search input and Reset Selection
    const isFirstMount = useRef(true);
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            // reset logic: When search changes, reset all dropdowns
            setSelectedBrand("All Brands");
            setSelectedPrimary("All Primary Categories");
            setSelectedSecondary("All Secondary Categories");
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const [showQR, setShowQR] = useState<any | null>(null);
    const [selectedBarcode, setSelectedBarcode] = useState<any>(null);

    const handleShowQR = async (product: any) => {
        try {
            showLoader("Loading barcodes...");
            const pData = await getProductById(product.id);
            const fullProduct = pData.data || pData;
            setShowQR(fullProduct);
            if (fullProduct.barcodes && fullProduct.barcodes.length > 0) {
                setSelectedBarcode(fullProduct.barcodes[0]);
            } else {
                setSelectedBarcode(null);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to load product details for QR code");
        } finally {
            hideLoader();
        }
    };

    const handleGenerateBarcode = async (categoryId?: number) => {
        try {
            showLoader("Generating barcode...");
            const res = await generateProductBarcode(showQR.id, categoryId);
            const pData = await getProductById(showQR.id);
            const fullProduct = pData.data || pData;
            setShowQR(fullProduct);
            const generated = fullProduct.barcodes?.find((b: any) => b.category_id === res.category_id);
            if (generated) {
                setSelectedBarcode(generated);
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to generate barcode");
        } finally {
            hideLoader();
        }
    };

    useEffect(() => {
        setSearchParams({ page: String(currentPage) }, { replace: true });
        setJumpInput(String(currentPage));
    }, [currentPage, setSearchParams]);

    // Main data fetcher
    useEffect(() => {
        loadData();
    }, [currentPage, limit, debouncedSearch, selectedBrand, selectedPrimary, selectedSecondary, selectedStatus, location.key]);

    // Initial meta-fetch for filters
    useEffect(() => {
        const fetchMeta = async () => {
            try {
                // Fetch ONLY categories, brands, and category-brand mappings
                const [cats, brnds, mappings] = await Promise.all([
                    getCategories(),
                    getBrands(),
                    getBrandMapping()
                ]);
                setAllCategories(Array.isArray(cats) ? cats : []);
                setAllBrands(Array.isArray(brnds) ? brnds : []);
                setCategoryBrandMappings(Array.isArray(mappings) ? mappings : []);
            } catch (err) {
                console.error("Failed to fetch categories, brands or mappings", err);
            }
        };
        fetchMeta();
    }, []);

    // 🔹 1. Dynamic Primary Category Dropdown
    const primaryOptions = useMemo(() => {
        const primaryCats = allCategories.filter(c => c.parent_category_id === null || c.category_type === 'primary');
        const names = [...new Set(primaryCats.map(c => c.category_name).filter(Boolean))];
        return ["All Primary Categories", ...names.sort()];
    }, [allCategories]);

    // 🔹 2. Dynamic Secondary Category Dropdown (Dependent on Primary)
    const secondaryOptions = useMemo(() => {
        let secondaryCats = allCategories.filter(c => c.parent_category_id !== null || c.category_type === 'secondary');
        if (selectedPrimary !== "All Primary Categories") {
            secondaryCats = secondaryCats.filter(c => c.parent_category_name === selectedPrimary);
        }
        const names = [...new Set(secondaryCats.map(c => c.category_name).filter(Boolean))];
        return ["All Secondary Categories", ...names.sort()];
    }, [allCategories, selectedPrimary]);

    // 🔹 3. Dynamic Brand Dropdown (Dependent on Category)
    const brandOptions = useMemo(() => {
        if (selectedSecondary !== "All Secondary Categories") {
            const matchedBrands = new Set<string>();
            for (const item of categoryBrandMappings) {
                for (const sec of item.secondaries || []) {
                    if (sec.secondary_name === selectedSecondary) {
                        for (const b of sec.brands || []) {
                            if (b.brand_name) matchedBrands.add(b.brand_name);
                        }
                    }
                }
            }
            const names = Array.from(matchedBrands);
            return ["All Brands", ...names.sort()];
        }
        
        if (selectedPrimary !== "All Primary Categories") {
            const matchedBrands = new Set<string>();
            for (const item of categoryBrandMappings) {
                if (item.primary_name === selectedPrimary) {
                    for (const b of item.brands || []) {
                        if (b.brand_name) matchedBrands.add(b.brand_name);
                    }
                    for (const sec of item.secondaries || []) {
                        for (const b of sec.brands || []) {
                            if (b.brand_name) matchedBrands.add(b.brand_name);
                        }
                    }
                }
            }
            const names = Array.from(matchedBrands);
            return ["All Brands", ...names.sort()];
        }

        const names = [...new Set(allBrands.map(b => b.brand_name).filter(Boolean))];
        return ["All Brands", ...names.sort()];
    }, [allBrands, categoryBrandMappings, selectedPrimary, selectedSecondary]);

    const handlePrimaryChange = (val: string) => {
        setSelectedPrimary(val);
        setSelectedSecondary("All Secondary Categories");
        setSelectedBrand("All Brands");
        setCurrentPage(1);
    };

    const handleSecondaryChange = (val: string) => {
        setSelectedSecondary(val);
        setSelectedBrand("All Brands");
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setSearch("");
        setDebouncedSearch("");
        setSelectedBrand("All Brands");
        setSelectedPrimary("All Primary Categories");
        setSelectedSecondary("All Secondary Categories");
        setSelectedStatus("Status");
        setLimit(20);
        setCurrentPage(1);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await getProducts({
                page: currentPage,
                limit: limit,
                search: debouncedSearch,
                brand: selectedBrand === "All Brands" ? "" : selectedBrand,
                primary_category: selectedPrimary === "All Primary Categories" ? "" : selectedPrimary,
                secondary_category: selectedSecondary === "All Secondary Categories" ? "" : selectedSecondary,
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

    return (
        <div className="page-container">
            <MultitabContentLoader menuTitle="Products">
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

                {/* PRIMARY CATEGORY FILTER */}
                <div className="filter">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>PRIMARY CATEGORY</label>
                    <Select
                        showSearch
                        value={selectedPrimary}
                        onChange={val => handlePrimaryChange(val)}
                        style={{ minWidth: '180px', height: '45px' }}
                        options={primaryOptions.map(c => ({ value: c, label: c }))}
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    />
                </div>

                {/* SECONDARY CATEGORY FILTER */}
                <div className="filter">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>SECONDARY CATEGORY</label>
                    <Select
                        showSearch
                        value={selectedSecondary}
                        onChange={val => handleSecondaryChange(val)}
                        style={{ minWidth: '180px', height: '45px' }}
                        options={secondaryOptions.map(c => ({ value: c, label: c }))}
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    />
                </div>

                {/* BRAND FILTER */}
                <div className="filter">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>BRAND</label>
                    <Select
                        showSearch
                        value={selectedBrand}
                        onChange={val => { setSelectedBrand(val); setCurrentPage(1); }}
                        style={{ minWidth: '150px', height: '45px' }}
                        options={brandOptions.map(b => ({ value: b, label: b }))}
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    />
                </div>

                {/* STATUS FILTER */}
                <div className="filter">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>STATUS</label>
                    <Select
                        value={selectedStatus}
                        onChange={val => { setSelectedStatus(val); setCurrentPage(1); }}
                        style={{ minWidth: '120px', height: '45px' }}
                        options={[
                            { value: "Status", label: "All Status" },
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Inactive" }
                        ]}
                    />
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

                {/* RESET BUTTON */}
                <div className="filter" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                        onClick={handleResetFilters}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            height: '45px',
                            padding: '0 20px',
                            border: 'none',
                            borderRadius: '10px',
                            background: '#e2e8f0',
                            color: '#475569',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#cbd5e1'; e.currentTarget.style.color = '#1e293b'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
                    >
                        <RotateCcw size={16} />
                        Reset Filters
                    </button>
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
                            {showQR.barcodes && showQR.barcodes.length > 0 && (
                                <div style={{ marginBottom: "15px", width: "100%", zIndex: 9999 }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>
                                        SELECT CATEGORY BARCODE
                                    </label>
                                    <Select
                                        value={selectedBarcode?.category_id}
                                        onChange={(val) => {
                                            const found = showQR.barcodes.find((b: any) => b.category_id === val);
                                            setSelectedBarcode(found);
                                        }}
                                        style={{ width: "100%", height: "40px" }}
                                        options={showQR.barcodes.map((b: any) => ({
                                            value: b.category_id,
                                            label: `${b.category_name}: ${b.barcode}`
                                        }))}
                                    />
                                </div>
                            )}

                            <div className="qr-code-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "180px", marginBottom: "15px" }}>
                                {selectedBarcode ? (
                                    <img
                                        src={`${BASE_URL.replace(/\/+$/, "")}/products/qrc/${encodeURIComponent(selectedBarcode.barcode)}`}
                                        alt="Backend QR Code"
                                        style={{ width: "180px", height: "180px" }}
                                    />
                                ) : showQR.model ? (
                                    <img
                                        src={`${BASE_URL.replace(/\/+$/, "")}/products/qrc/${encodeURIComponent(showQR.model)}`}
                                        alt="Backend QR Code (Model)"
                                        style={{ width: "180px", height: "180px" }}
                                    />
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center" }}>
                                        <div style={{ fontSize: "14px", color: "#ef4444", fontWeight: "600" }}>
                                            No barcode or model code available to generate QR
                                        </div>
                                        {showQR.mappings && showQR.mappings.length > 0 ? (
                                            <button
                                                className="btn primary"
                                                onClick={() => handleGenerateBarcode(showQR.mappings[0].category_id)}
                                                style={{ padding: "8px 16px", fontSize: "14px", border: "none", borderRadius: "8px", background: "#3b82f6", color: "#fff", fontWeight: "600", cursor: "pointer" }}
                                            >
                                                Generate Barcode
                                            </button>
                                        ) : (
                                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                                                Map this product to a category to generate a barcode
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {selectedBarcode && (
                                <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
                                    <button
                                        onClick={() => handleGenerateBarcode(selectedBarcode.category_id)}
                                        style={{
                                            background: "#f1f5f9",
                                            border: "1px solid #cbd5e1",
                                            color: "#475569",
                                            padding: "6px 12px",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
                                        onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
                                    >
                                        Regenerate Barcode
                                    </button>
                                </div>
                            )}
                            <div className="qr-info">
                                <h4>{showQR.product_name}</h4>
                                <p>Model: {showQR.model || "—"}</p>
                                <p>Brand: {showQR.brands || "—"}</p>
                                {selectedBarcode && (
                                    <p style={{ fontWeight: "600", color: "#2563eb", marginTop: "8px" }}>
                                        Category: {selectedBarcode.category_name} ({selectedBarcode.barcode})
                                    </p>
                                )}
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
                                const displayCategory = p.secondary_category || p.primary_category || p.categories || "—";
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
                                                    onClick={() => handleShowQR(p)}
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
            </MultitabContentLoader>
        </div>
    );
};

export default ViewProduct;
