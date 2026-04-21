import { useState, useEffect, useRef, useMemo } from "react";
import { Upload, ArrowLeft, X, ChevronDown, Search, Plus, Scan } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import {
    getProductById,
    updateProduct,
    type ProductForm
} from "../../../api/product.api";
import { useMapping } from "../../../context/MappingContext";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import QRScannerModal from "../../../components/qrscanner/QRScannerModal";

// Reuse styles from AddProduct
import "../addproduct/AddProduct.css";

interface SelectedMapping {
    primary_id: number;
    primary_name: string;
    secondary_id: number;
    secondary_name: string;
    brand_id: number;
    brand_name: string;
}

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showLoader, hideLoader } = useLoading();
    const { showSuccess } = useSuccessPopup();
    const [searchParams] = useSearchParams();
    const page = searchParams.get("page") || "1";

    // Mapping Context
    const { categoryData, loading: mappingsLoading, refreshMappings } = useMapping();

    // UI States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedMappings, setSelectedMappings] = useState<SelectedMapping[]>([]);

    // UI state for the current selection being made in dropdowns
    const [selection, setSelection] = useState({
        primary_id: 0,
        primary_name: "",
        secondary_id: 0,
        secondary_name: "",
        brand_id: 0,
        brand_name: "",
    });

    // Form Basic Info
    const [form, setForm] = useState<ProductForm>({
        product_name: "",
        model: "",
        series: "",
        alternative_names: [""],
        description: "",
        info: "",
        note: "",
        mrp: "",
        status: "active",
        image: undefined,
    });

    const [preview, setPreview] = useState<string | null>(null);
    const [filename, setFilename] = useState<string | null>(null);
    const [showScanner, setShowScanner] = useState(false);

    // Dropdown UI Visibility
    const [showBrandList, setShowBrandList] = useState(false);
    const [showPrimaryList, setShowPrimaryList] = useState(false);
    const [showSecondaryList, setShowSecondaryList] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const brandRef = useRef<HTMLDivElement>(null);
    const primaryRef = useRef<HTMLDivElement>(null);
    const secondaryRef = useRef<HTMLDivElement>(null);

    const [mrpError, setMrpError] = useState("");

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (brandRef.current && !brandRef.current.contains(e.target as Node)) setShowBrandList(false);
            if (primaryRef.current && !primaryRef.current.contains(e.target as Node)) setShowPrimaryList(false);
            if (secondaryRef.current && !secondaryRef.current.contains(e.target as Node)) setShowSecondaryList(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /* ---------------- INITIAL DATA LOADING ---------------- */
    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            showLoader("Loading product data...");
            try {
                await refreshMappings();

                if (!id) return;
                const pData = await getProductById(id);
                const product = pData.data || pData;

                setForm({
                    product_name: product.product_name || "",
                    model: product.model || "",
                    series: product.series || "",
                    alternative_names: Array.isArray(product.alternative_names)
                        ? (product.alternative_names.length === 0 ? [""] : product.alternative_names)
                        : (product.alternative_name
                            ? product.alternative_name.split(", ")
                            : [""]),
                    description: product.description || "",
                    info: product.info || "",
                    note: product.note || "",
                    mrp: product.mrp || "",
                    option_set: product.option_set ?? 0,
                    status: product.status || "active",
                    image: undefined,
                });

                // Resolve product mappings from backend data
                if (Array.isArray(product.mappings)) {
                    const resolved: SelectedMapping[] = product.mappings.map((m: any) => {
                        const isPrimary = m.category_type === "primary";
                        return {
                            primary_id: isPrimary ? Number(m.category_id) : Number(m.primary_category_id),
                            primary_name: isPrimary ? m.category_name : m.primary_category_name,
                            secondary_id: isPrimary ? 0 : Number(m.category_id),
                            secondary_name: isPrimary ? "" : m.category_name,
                            brand_id: Number(m.brand_id),
                            brand_name: m.brand_name
                        };
                    });

                    setSelectedMappings(resolved);

                    if (resolved.length > 0) {
                        setSelection({ ...resolved[0] });
                    }
                }

                // Image
                const rawImg = product.base_image;
                if (rawImg) {
                    const cleanKey = rawImg.startsWith("/") ? rawImg.substring(1) : rawImg;
                    setPreview(`${IMAGE_BASE_URL}/${cleanKey}`);
                    setFilename(cleanKey.split("/").pop() || cleanKey);
                }

            } catch (error) {
                console.error("Initialization failed", error);
            } finally {
                setLoading(false);
                hideLoader();
            }
        };

        initialize();
    }, [id]);


    /* ---------------- FILTERING LOGIC ---------------- */
    const primaryOptions = useMemo(() => {
        return categoryData
            .map(p => ({ id: p.primary_id, name: p.primary_name || "" }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [categoryData]);

    const secondaryOptions = useMemo(() => {
        if (!selection.primary_id) return [];
        const primary = categoryData.find(p => p.primary_id === selection.primary_id);
        const options = primary?.secondaries?.map(s => ({ id: s.secondary_id, name: s.secondary_name || "" })) || [];
        return options.sort((a, b) => a.name.localeCompare(b.name));
    }, [categoryData, selection.primary_id]);

    const brandOptions = useMemo(() => {
        if (!selection.primary_id) return [];
        const primary = categoryData.find(p => p.primary_id === selection.primary_id);
        if (!primary) return [];

        let options: { id: number; name: string }[] = [];

        // Case 1: Secondary Category is selected
        if (selection.secondary_id) {
            const secondary = primary.secondaries?.find(s => s.secondary_id === selection.secondary_id);
            options = secondary?.brands.map(b => ({ id: b.brand_id, name: b.brand_name || "" })) || [];
        }

        // Case 2: No Secondary selected OR Secondary has no brands -> Check Primary brands (Primary-only mapping)
        if (options.length === 0 && primary.brands) {
            options = primary.brands.map(b => ({ id: b.brand_id, name: b.brand_name || "" }));
        }

        return options.sort((a, b) => a.name.localeCompare(b.name));
    }, [categoryData, selection.primary_id, selection.secondary_id]);


    /* ---------------- EVENT HANDLERS ---------------- */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === "mrp") {
            const numValue = Number(value);
            if (numValue < 0) {
                setMrpError("MRP price cannot be negative.");
                return;
            } else {
                setMrpError("");
            }
        } else if (name === "option_set") {
            const checked = (e.target as HTMLInputElement).checked;
            setForm(prev => ({ ...prev, option_set: checked ? 1 : 0 }));
            return;
        }

        setForm(prev => ({ ...prev, [name]: value }));
    };


    const handleAlternativeNameChange = (index: number, value: string) => {
        setForm(prev => {
            const newNames = [...(prev.alternative_names || [])];
            newNames[index] = value;
            return { ...prev, alternative_names: newNames };
        });
    };

    const addAlternativeName = () => {
        setForm(prev => ({ 
            ...prev, 
            alternative_names: [...(prev.alternative_names || []), ""] 
        }));
    };

    const removeAlternativeName = (index: number) => {
        if ((form.alternative_names || []).length > 1) {
            setForm(prev => ({ 
                ...prev, 
                alternative_names: (prev.alternative_names || []).filter((_, i) => i !== index)
            }));
        }
    };

    const handleMrpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "-" || e.key === "e") {
            e.preventDefault();
        }
    };

    const handlePrimarySelect = (id: number, name: string) => {
        setSelection({
            primary_id: id,
            primary_name: name,
            secondary_id: 0,
            secondary_name: "",
            brand_id: 0,
            brand_name: "",
        });
        setShowPrimaryList(false);
        setSearchTerm("");
    };

    const handleSecondarySelect = (id: number, name: string) => {
        setSelection(prev => ({
            ...prev,
            secondary_id: id,
            secondary_name: name,
            brand_id: 0,
            brand_name: "",
        }));
        setShowSecondaryList(false);
        setSearchTerm("");
    };

    const handleBrandSelect = (id: number, name: string) => {
        setSelection(prev => ({
            ...prev,
            brand_id: id,
            brand_name: name,
        }));
        setShowBrandList(false);
        setSearchTerm("");
    };

    const handleAddMapping = () => {
        if (!selection.primary_id || !selection.brand_id) {
            alert("Please select Primary Category and Brand");
            return;
        }

        const isDuplicate = selectedMappings.some(m =>
            m.primary_id === selection.primary_id &&
            m.secondary_id === selection.secondary_id &&
            m.brand_id === selection.brand_id
        );

        if (isDuplicate) {
            alert("Mapping already added");
            return;
        }

        setSelectedMappings(prev => [...prev, { ...selection }]);

        setSelection({
            primary_id: 0,
            primary_name: "",
            secondary_id: 0,
            secondary_name: "",
            brand_id: 0,
            brand_name: "",
        });
    };

    const handleRemoveMapping = (index: number) => {
        setSelectedMappings(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (file) {
            setForm(prev => ({ ...prev, image: file }));
            setFilename(file.name);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteImage = () => {
        setPreview(null);
        setFilename(null);
        setForm(prev => ({ ...prev, image: null }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mrpError) {
            alert(mrpError);
            return;
        }
        if (!form.product_name || form.mrp === "" || Number(form.mrp) < 0 || selectedMappings.length === 0) {
            alert("Please fill all required fields correctly and add at least one mapping");
            return;
        }

        setSaving(true);
        showLoader("Updating product...");
        try {
            const { alternative_name: _, ...rest } = form;
            const payload = {
                ...rest,
                alternative_names: (form.alternative_names || []).filter(item => item.trim()),
                option_set: form.option_set ? 1 : 0,
                mappings: selectedMappings.map(m => ({
                    primary_id: m.primary_id,
                    secondary_id: m.secondary_id,
                    brand_id: m.brand_id
                }))
            };
            await updateProduct(id!, payload as any);
            showSuccess("Product has been updated.", "Successfully Updated!");
            navigate(`/products?page=${page}`);
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Update failed");
        } finally {
            setSaving(false);
            hideLoader();
        }
    };

    if (loading || mappingsLoading) return null;

    return (
        <div className="add-product-container">
            <form className="product-form-card" onSubmit={handleSubmit}>
                <div className="product-form-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button type="button" onClick={() => navigate(`/products?page=${page}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                            <ArrowLeft size={22} />
                        </button>
                        <h2>Edit Product</h2>
                    </div>
                </div>

                {/* Mapping UI */}
                <div className="mapping-selection-section" style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '16px', marginBottom: '32px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: '#1e293b' }}>Category & Brand Mappings</h3>
                    <div className="product-form-grid" style={{ marginBottom: '20px' }}>

                        <div className={`inline-form-field ${showPrimaryList ? 'active' : ''}`} ref={primaryRef}>
                            <div className="custom-dropdown">
                                <label>Primary Category</label>
                                <div className={`custom-select-trigger ${showPrimaryList ? 'active' : ''}`} onClick={() => setShowPrimaryList(!showPrimaryList)}>
                                    <span className={!selection.primary_id ? "placeholder-text" : ""}>{selection.primary_name || "Select Primary..."}</span>
                                    <ChevronDown size={14} />
                                </div>
                                {showPrimaryList && (
                                    <div className="custom-select-options">
                                        <div className="dropdown-search-wrapper">
                                            <div className="search-icon-inside"><Search size={14} /></div>
                                            <input className="dropdown-search-input" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()} autoFocus />
                                        </div>
                                        <div className="dropdown-items-list">
                                            {primaryOptions.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase())).map(o => (
                                                <div key={o.id} className="option-item" onClick={() => handlePrimarySelect(o.id, o.name)}>{o.name}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`inline-form-field ${showSecondaryList ? 'active' : ''}`} ref={secondaryRef}>
                            <div className="custom-dropdown">
                                <label>Secondary Category</label>
                                <div className={`custom-select-trigger ${showSecondaryList ? 'active' : ''} ${!selection.primary_id ? 'disabled' : ''}`} onClick={() => selection.primary_id && setShowSecondaryList(!showSecondaryList)}>
                                    <span className={!selection.secondary_id ? "placeholder-text" : ""}>{selection.secondary_name || "Select Secondary..."}</span>
                                    <ChevronDown size={14} />
                                </div>
                                {showSecondaryList && (
                                    <div className="custom-select-options">
                                        <div className="dropdown-search-wrapper">
                                            <div className="search-icon-inside"><Search size={14} /></div>
                                            <input className="dropdown-search-input" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()} autoFocus />
                                        </div>
                                        <div className="dropdown-items-list">
                                            {secondaryOptions.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase())).map(o => (
                                                <div key={o.id} className="option-item" onClick={() => handleSecondarySelect(o.id, o.name)}>{o.name}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`inline-form-field ${showBrandList ? 'active' : ''}`} ref={brandRef}>
                            <div className="custom-dropdown">
                                <label>Brand</label>
                                <div className={`custom-select-trigger ${showBrandList ? 'active' : ''} ${!selection.primary_id ? 'disabled' : ''}`} onClick={() => selection.primary_id && setShowBrandList(!showBrandList)}>
                                    <span className={!selection.brand_id ? "placeholder-text" : ""}>{selection.brand_name || "Select Brand..."}</span>
                                    <ChevronDown size={14} />
                                </div>
                                {showBrandList && (
                                    <div className="custom-select-options">
                                        <div className="dropdown-search-wrapper">
                                            <div className="search-icon-inside"><Search size={14} /></div>
                                            <input className="dropdown-search-input" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()} autoFocus />
                                        </div>
                                        <div className="dropdown-items-list">
                                            {brandOptions.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase())).map(o => (
                                                <div key={o.id} className="option-item" onClick={() => handleBrandSelect(o.id, o.name)}>{o.name}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="inline-form-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="button" onClick={handleAddMapping} style={{ height: '42px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: '600' }}>Add Mapping</button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedMappings.map((m, idx) => (
                            <div key={idx} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '5px 12px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{m.primary_name} {m.secondary_name && <>&gt; {m.secondary_name}</>} &gt; <b>{m.brand_name}</b></span>
                                <button type="button" onClick={() => handleRemoveMapping(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Fields */}
                <div className="product-form-grid">
                    <div className="inline-form-field"><label>Product Name *</label><input name="product_name" value={form.product_name} onChange={handleChange} required /></div>
                    <div className="inline-form-field">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label>Model / Code</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginBottom: '4px' }}>
                                <input
                                    type="checkbox"
                                    name="option_set"
                                    checked={!!form.option_set}
                                    onChange={handleChange}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Option set it</span>
                            </label>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                name="model"
                                placeholder="Enter Model or Code..."
                                value={form.model}
                                onChange={handleChange}
                                style={{ paddingRight: '45px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#2563eb',
                                    cursor: 'pointer',
                                    padding: '5px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                title="Scan Code"
                            >
                                <Scan size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="inline-form-field"><label>Series</label><input name="series" value={form.series} onChange={handleChange} /></div>
                    <div className="inline-form-field">
                        <label>Alternative Name</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(form.alternative_names || []).map((item, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input
                                        placeholder="Enter Alternative Name..."
                                        value={item}
                                        onChange={(e) => handleAlternativeNameChange(index, e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                       
                                        {index === 0 ? (
                                            <button
                                                type="button"
                                                onClick={addAlternativeName}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '8px',
                                                    backgroundColor: '#eff6ff',
                                                    color: '#2563eb',
                                                    border: '1px solid #bfdbfe',
                                                    cursor: 'pointer'
                                                }}
                                                title="Add another alternative name"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => removeAlternativeName(index)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '8px',
                                                    backgroundColor: '#fef2f2',
                                                    color: '#ef4444',
                                                    border: '1px solid #fee2e2',
                                                    cursor: 'pointer'
                                                }}
                                                title="Remove"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="inline-form-field">
                        <label>MRP (₹) *</label>
                        <input
                            name="mrp"
                            type="number"
                            value={form.mrp}
                            onChange={handleChange}
                            onKeyDown={handleMrpKeyDown}
                            required
                            min="0"
                            step="any"
                            style={{ borderColor: mrpError ? '#ef4444' : undefined }}
                        />
                        {mrpError && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{mrpError}</span>}
                    </div>
                    <div className="inline-form-field full-width"><label>Description</label><textarea name="description" value={form.description} onChange={handleChange} rows={2} /></div>
                    <div className="inline-form-field"><label>Info</label><textarea name="info" value={form.info} onChange={handleChange} rows={2} /></div>
                    <div className="inline-form-field"><label>Notes</label><textarea name="note" value={form.note} onChange={handleChange} rows={2} /></div>

                    <div className="product-image-section">
                        <div className="image-status-flex">
                            <div className="image-preview-box">
                                {preview ? <><img src={preview} alt="Preview" /><button type="button" className="delete-btn" onClick={handleDeleteImage}><X size={16} /></button></> : <div className="empty-placeholder" onClick={() => document.getElementById("productImage")?.click()} />}
                            </div>
                            <div className="image-upload-controls">
                                <label>Image</label>
                                <input type="file" id="productImage" hidden onChange={handleFileChange} accept="image/*" />
                                <label htmlFor="productImage" className="upload-button-label"><Upload size={18} /> {preview ? "Change" : "Upload"}</label>
                                {filename && <span className="filename-display">{filename}</span>}
                            </div>
                            <div className="inline-form-field" style={{ marginLeft: 'auto', minWidth: '120px' }}>
                                <label>Status</label>
                                <select name="status" value={form.status} onChange={handleChange}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="product-form-actions">
                    <button type="button" className="btn-cancel" onClick={() => navigate(`/products?page=${page}`)}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={saving}>{saving ? "Saving..." : "Update Product"}</button>
                </div>
            </form>

            <QRScannerModal
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScanSuccess={(value: string) => {
                    setForm(prev => ({ ...prev, model: value }));
                    setShowScanner(false);
                }}
            />
        </div>
    );
};

export default EditProduct;
