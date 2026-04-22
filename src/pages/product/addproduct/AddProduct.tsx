import { useState, useEffect, useRef, useMemo } from "react";
import { Upload, ArrowLeft, X, ChevronDown, Search, Plus, Scan } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createProduct, type ProductCreatePayload } from "../../../api/product.api";
import { useMapping } from "../../../context/MappingContext";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import QRScannerModal from "../../../components/qrscanner/QRScannerModal";
import DynamicProductFields from "../../../components/product/DynamicProductFields";
import { MultitabConfigApi } from "../../../api/multitabConfig.api";
import "./AddProduct.css";

interface SelectedMapping {
    mapping_id: number;
    primary_id: number;
    primary_name: string;
    secondary_id: number;
    secondary_name: string;
    brand_id: number;
    brand_name: string;
    category_name: string;
}

const AddProduct = () => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const { showLoader, hideLoader } = useLoading();
    const { showSuccess } = useSuccessPopup();

    // Consume Hierarchical Mapping Data
    const { categoryData, mappings, loading, refreshMappings } = useMapping();

    // Mapping Selection Logic
    const [selectedMappings, setSelectedMappings] = useState<SelectedMapping[]>([]);
    const [dynamicFieldValues, setDynamicFieldValues] = useState<any[]>([]);
    const [fieldsByCategory, setFieldsByCategory] = useState<any>({});
    const [isScanning, setIsScanning] = useState(false);

    // UI state for the current selection being made
    const [selection, setSelection] = useState({
        mapping_id: 0,
        primary_id: 0,
        primary_name: "",
        secondary_id: 0,
        secondary_name: "",
        brand_id: 0,
        brand_name: "",
        category_name: "",
    });

    // Form state
    const [form, setForm] = useState({
        productName: "",
        model: "",
        series: "",
        alternativeNames: [""] as string[],
        description: "",
        info: "",
        note: "",
        mrp: "",
        status: "active",
        optionSet: false,
        image: null as File | null,
    });

    const [showScanner, setShowScanner] = useState(false);

    const [preview, setPreview] = useState<string | undefined>(undefined);
    const [filename, setFilename] = useState<string | null>(null);

    // Dropdown UI State
    const [showBrandList, setShowBrandList] = useState(false);
    const [showPrimaryList, setShowPrimaryList] = useState(false);
    const [showSecondaryList, setShowSecondaryList] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const brandRef = useRef<HTMLDivElement>(null);
    const primaryRef = useRef<HTMLDivElement>(null);
    const secondaryRef = useRef<HTMLDivElement>(null);

    const [mrpError, setMrpError] = useState("");

    /* ---------------- INITIAL SETUP ---------------- */

    useEffect(() => {
        if (loading) {
            showLoader("Loading category & brand data...");
        } else {
            hideLoader();
        }
    }, [loading]);

    useEffect(() => {
        refreshMappings();
    }, [refreshMappings]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (brandRef.current && !brandRef.current.contains(e.target as Node)) setShowBrandList(false);
            if (primaryRef.current && !primaryRef.current.contains(e.target as Node)) setShowPrimaryList(false);
            if (secondaryRef.current && !secondaryRef.current.contains(e.target as Node)) setShowSecondaryList(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 🔥 Batch Fetch Dynamic Fields
    useEffect(() => {
        const categoryIds = Array.from(new Set(selectedMappings.map(m => m.secondary_id || m.primary_id)));
        if (categoryIds.length === 0) {
            setFieldsByCategory({});
            return;
        }

        const fetchFields = async () => {
            try {
                const data = await MultitabConfigApi.getDynamicFields(categoryIds as any);
                setFieldsByCategory(data || {});
            } catch (err) {
                console.error("Failed to fetch dynamic fields", err);
            }
        };
        fetchFields();
    }, [selectedMappings]);
    
    // 🟢 Barcode Scanner Support (Global Listener)
    useEffect(() => {
        let scannerBuffer = "";
        let lastKeyTime = Date.now();

        const handler = (e: KeyboardEvent) => {
            const now = Date.now();
            if (now - lastKeyTime > 100) scannerBuffer = "";
            lastKeyTime = now;

            if (e.key === "Enter") {
                if (scannerBuffer.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    setIsScanning(true);
                    const scannedValue = scannerBuffer;
                    scannerBuffer = "";

                    const activeEl = document.activeElement as HTMLElement;
                    const mappingId = activeEl?.getAttribute("data-mapping-id");
                    const fieldId = activeEl?.getAttribute("data-field-id");

                    if (mappingId && fieldId) {
                        setDynamicFieldValues(prev => {
                            const updated = [...prev];
                            const mId = Number(mappingId);
                            const fId = Number(fieldId);
                            
                            const idx = updated.findIndex(v => v.mapping_id === mId && v.field_id === fId);
                            if (idx > -1) {
                                updated[idx] = { ...updated[idx], value: scannedValue };
                            } else {
                                updated.push({
                                    mapping_id: mId,
                                    field_id: fId,
                                    value: scannedValue
                                });
                            }
                            return updated;
                        });
                    } else if (activeEl?.getAttribute("name") === "model") {
                        setForm(prev => ({ ...prev, model: scannedValue }));
                    }
                    
                    setTimeout(() => setIsScanning(false), 300);
                }
            } else if (e.key.length === 1) {
                scannerBuffer += e.key;
            }
        };

        window.addEventListener("keydown", handler, true);
        return () => window.removeEventListener("keydown", handler, true);
    }, [selectedMappings, fieldsByCategory]);

    /* ---------------- CASCADING DROPDOWN LOGIC ---------------- */

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

    /* ---------------- HANDLERS ---------------- */

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        if (name === "mrp") {
            const numValue = Number(value);
            if (numValue < 0) {
                setMrpError("MRP price cannot be negative.");
                return;
            } else {
                setMrpError("");
            }
        } else if (name === "optionSet") {
            const checked = (e.target as HTMLInputElement).checked;
            setForm(prev => ({ ...prev, optionSet: checked }));
            return;
        }

        setForm(prev => ({ ...prev, [name]: value }));
    };




    const handleAlternativeNameChange = (index: number, value: string) => {
        const newNames = [...form.alternativeNames];
        newNames[index] = value;
        setForm(prev => ({ ...prev, alternativeNames: newNames }));
    };

    const addAlternativeName = () => {
        setForm(prev => ({ ...prev, alternativeNames: [...prev.alternativeNames, ""] }));
    };

    const removeAlternativeName = (index: number) => {
        if (form.alternativeNames.length > 1) {
            const newNames = form.alternativeNames.filter((_, i) => i !== index);
            setForm(prev => ({ ...prev, alternativeNames: newNames }));
        }
    };

    const handleMrpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "-" || e.key === "e") {
            e.preventDefault();
        }
    };

    const handlePrimarySelect = (id: number, name: string) => {
        setSelection({
            mapping_id: 0,
            primary_id: id,
            primary_name: name,
            secondary_id: 0,
            secondary_name: "",
            brand_id: 0,
            brand_name: "",
            category_name: "",
        });
        setShowPrimaryList(false);
        setSearchTerm("");
    };

    const handleSecondarySelect = (id: number, name: string) => {
        setSelection(prev => ({
            ...prev,
            mapping_id: 0,
            secondary_id: id,
            secondary_name: name,
            brand_id: 0,
            brand_name: "",
            category_name: name,
        }));
        setShowSecondaryList(false);
        setSearchTerm("");
    };

    const handleBrandSelect = (id: number, name: string) => {
        setSelection(prev => ({
            ...prev,
            mapping_id: 0,
            brand_id: id,
            brand_name: name,
            category_name: prev.secondary_name || prev.primary_name,
        }));
        setShowBrandList(false);
        setSearchTerm("");
    };



    const handleAddMapping = () => {
        if (!selection.primary_id || !selection.brand_id) {
            alert("Please select Primary Category and Brand.");
            return;
        }

        // Prevent duplicates
        const isDuplicate = selectedMappings.some(m =>
            m.primary_id === selection.primary_id &&
            m.secondary_id === selection.secondary_id &&
            m.brand_id === selection.brand_id
        );

        if (isDuplicate) {
            alert("Mapping already added.");
            return;
        }

        // Find real mapping_id from context
        const mappingObj = mappings.find(m =>
            m.primaryId === selection.primary_id &&
            m.secondaryId === selection.secondary_id &&
            String(m.brandId).split(',').map(s => s.trim()).includes(String(selection.brand_id))
        );
        
        if (!mappingObj?.mappingId) {
            alert("This Category and Brand combination has not been mapped in Settings. Please map it first.");
            return;
        }

        const mappingId = mappingObj.mappingId;

        setSelectedMappings(prev => [...prev, {
            ...selection,
            mapping_id: mappingId,
            category_name: selection.secondary_name || selection.primary_name
        }]);

        setSelection({
            mapping_id: 0,
            primary_id: 0,
            primary_name: "",
            secondary_id: 0,
            secondary_name: "",
            brand_id: 0,
            brand_name: "",
            category_name: "",
        });
    };

    const handleRemoveMapping = (index: number) => {
        setSelectedMappings(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        const selectedFile = files ? files[0] : null;
        setForm(prev => ({ ...prev, image: selectedFile }));

        if (selectedFile) {
            setFilename(selectedFile.name);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
        } else {
            setFilename(null);
            setPreview(undefined);
        }
    };

    const handleDeleteImage = () => {
        setPreview(undefined);
        setFilename(null);
        setForm(prev => ({ ...prev, image: null }));
        const fileInput = document.getElementById("productImage") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isScanning) return; // Block scanner-triggered submit
        
        if (!form.productName) {
            alert("Product Name is required");
            return;
        }
        if (selectedMappings.length === 0) {
            alert("At least one category-brand mapping is required");
            return;
        }
        if (mrpError) {
            alert(mrpError);
            return;
        }
        if (!form.mrp || Number(form.mrp) < 0) {
            alert("MRP is required and cannot be negative");
            return;
        }

        try {
            setSaving(true);
            showLoader("Creating product, please wait...");

            const payload: ProductCreatePayload = {
                product_name: form.productName,
                description: form.description || "",
                info: form.info || "",
                status: form.status,
                mappings: selectedMappings.map(m => ({
                    primary_id: m.primary_id,
                    secondary_id: m.secondary_id,
                    brand_id: m.brand_id
                })),
                model: form.model || undefined,
                series: form.series || undefined,
                alternative_names: form.alternativeNames.filter(n => n.trim()),
                option_set: form.optionSet ? 1 : 0,
                mrp: form.mrp ? Number(form.mrp) : undefined,
                note: form.note || undefined,
                image: form.image,
                dynamic_fields: (dynamicFieldValues || []).map((f: any) => ({
                    mapping_id: f.mapping_id,
                    field_id: f.field_id,
                    value: f.value ?? ""
                })),
            };

            await createProduct(payload);
            showSuccess("Product created successfully.", "Saved Successfully!");
            navigate("/products");
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to create product");
        } finally {
            setSaving(false);
            hideLoader();
        }
    };

    if (loading) return null; // Overlay handles the loading state

    return (
        <div className="add-product-container">
            <form className="product-form-card" onSubmit={handleSubmit}>

                {/* HEADER */}
                <div className="product-form-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button type="button" onClick={() => navigate("/products")} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}>
                            <ArrowLeft size={22} />
                        </button>
                        <h2>Add New Product</h2>
                    </div>
                    <p className="subtitle">Fill in the details below to add a product to your inventory</p>
                </div>

                {/* MAPPING SELECTION SECTION */}
                <div className="mapping-selection-section" style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
                    {/* <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#1e293b' }}>Category & Brand Mappings</h3> */}

                    <div className="product-form-grid" style={{ marginBottom: '15px' }}>
                        {/* PRIMARY CATEGORY */}
                        <div className={`inline-form-field ${showPrimaryList ? 'active' : ''}`} ref={primaryRef}>
                            <div className="custom-dropdown">
                                <label>Primary Category</label>
                                <div className="custom-select-trigger" onClick={() => setShowPrimaryList(!showPrimaryList)}>
                                    <span className={!selection.primary_id ? "placeholder-text" : ""}>
                                        {selection.primary_id ? selection.primary_name : "Select Primary..."}
                                    </span>
                                    <ChevronDown size={14} color="#64748b" />
                                </div>
                                {showPrimaryList && (
                                    <div className="custom-select-options">
                                        <div className="dropdown-search-wrapper">
                                            <div className="search-icon-inside"><Search size={14} /></div>
                                            <input
                                                className="dropdown-search-input"
                                                placeholder="Search category..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                                autoFocus
                                            />
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

                        {/* SECONDARY CATEGORY */}
                        <div className={`inline-form-field ${showSecondaryList ? 'active' : ''}`} ref={secondaryRef}>
                            <div className="custom-dropdown">
                                <label>Secondary Category</label>
                                <div
                                    className={`custom-select-trigger ${!selection.primary_id ? 'disabled' : ''}`}
                                    onClick={() => { if (selection.primary_id) setShowSecondaryList(!showSecondaryList); }}
                                >
                                    <span className={!selection.secondary_id ? "placeholder-text" : ""}>
                                        {selection.secondary_id ? selection.secondary_name : "Select Secondary..."}
                                    </span>
                                    <ChevronDown size={14} color="#64748b" />
                                </div>
                                {showSecondaryList && (
                                    <div className="custom-select-options">
                                        <div className="dropdown-search-wrapper">
                                            <div className="search-icon-inside"><Search size={14} /></div>
                                            <input
                                                className="dropdown-search-input"
                                                placeholder="Search secondary..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                                autoFocus
                                            />
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

                        {/* BRAND */}
                        <div className={`inline-form-field ${showBrandList ? 'active' : ''}`} ref={brandRef}>
                            <div className="custom-dropdown">
                                <label>Brand</label>
                                <div
                                    className={`custom-select-trigger ${!selection.primary_id ? 'disabled' : ''}`}
                                    onClick={() => { if (selection.primary_id) setShowBrandList(!showBrandList); }}
                                >
                                    <span className={!selection.brand_id ? "placeholder-text" : ""}>
                                        {selection.brand_id ? selection.brand_name : "Select Brand..."}
                                    </span>
                                    <ChevronDown size={14} color="#64748b" />
                                </div>
                                {showBrandList && (
                                    <div className="custom-select-options">
                                        <div className="dropdown-search-wrapper">
                                            <div className="search-icon-inside"><Search size={14} /></div>
                                            <input
                                                className="dropdown-search-input"
                                                placeholder="Search brand..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                                autoFocus
                                            />
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
                            <button
                                type="button"
                                onClick={handleAddMapping}
                                style={{
                                    height: '42px',
                                    padding: '0 20px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    width: '100%'
                                }}
                            >
                                Add Mapping
                            </button>
                        </div>
                    </div>

                    {/* SELECTED MAPPINGS LIST */}
                    <div className="selected-mappings-dynamic" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {selectedMappings.map((m, idx) => (
                            <div key={idx} style={{ padding: '16px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1e293b' }}>
                                        <span style={{ fontWeight: '600' }}>{m.primary_name}</span>
                                        {m.secondary_name && <><ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} /> <span>{m.secondary_name}</span></>}
                                        <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} />
                                        <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{m.brand_name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMapping(idx)}
                                        style={{ background: '#fef2f2', border: 'none', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#ef4444' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <DynamicProductFields 
                                    mapping_id={m.mapping_id}
                                    fields={[
                                        ...(fieldsByCategory.global || []),
                                        ...(fieldsByCategory[m.secondary_id || m.primary_id] || [])
                                    ]}
                                    dynamicFields={dynamicFieldValues}
                                    setDynamicFields={setDynamicFieldValues}
                                />
                            </div>
                        ))}
                        {selectedMappings.length === 0 && (
                            <p style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>No mappings added yet. Select and click Add Mapping.</p>
                        )}
                    </div>
                </div>

                {/* FORM GRID */}
                <div className="product-form-grid">
                    <div className="inline-form-field" style={{ zIndex: 0 }}>
                        <label>Product Name *</label>
                        <input
                            name="productName"
                            placeholder="Enter Product Name..."
                            value={form.productName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="inline-form-field" style={{ zIndex: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label>Model / Code</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginBottom: '4px' }}>
                                <input
                                    type="checkbox"
                                    name="optionSet"
                                    checked={form.optionSet}
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

                    <div className="inline-form-field" style={{ zIndex: 0 }}>
                        <label>Series</label>
                        <input
                            name="series"
                            placeholder="Enter Series..."
                            value={form.series}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="inline-form-field" style={{ zIndex: 0 }}>
                        <label>Alternative Name</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {form.alternativeNames.map((name, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input
                                        placeholder="Enter Alternative Name..."
                                        value={name}
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

                    <div className="inline-form-field" style={{ zIndex: 0 }}>
                        <label>MRP (₹) *</label>
                        <input
                            name="mrp"
                            type="number"
                            placeholder="0.00"
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

                    <div className="inline-form-field full-width" style={{ zIndex: 0 }}>
                        <label>Short Description</label>
                        <textarea
                            name="description"
                            placeholder="Enter a brief description of the product..."
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    <div className="inline-form-field" style={{ zIndex: 0 }}>
                        <label>Additional Info</label>
                        <textarea
                            name="info"
                            placeholder="Enter technical info or specifications..."
                            value={form.info}
                            onChange={handleChange}
                            rows={4}
                        />
                    </div>

                    <div className="inline-form-field" style={{ zIndex: 0 }}>
                        <label>Notes</label>
                        <textarea
                            name="note"
                            placeholder="Any internal notes..."
                            value={form.note}
                            onChange={handleChange}
                            rows={4}
                        />
                    </div>

                    {/* IMAGE UPLOAD SECTION */}
                    <div className="product-image-section" style={{ zIndex: 0 }}>
                        <div className="image-status-flex">
                            <div className="image-preview-box">
                                {preview ? (
                                    <>
                                        <img src={preview} alt="Product Preview" />
                                        <button type="button" className="delete-btn" onClick={handleDeleteImage} title="Remove image">
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="empty-placeholder" onClick={() => document.getElementById("productImage")?.click()} />
                                )}
                            </div>

                            <div className="image-upload-controls">
                                <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Product Image</label>
                                <input type="file" id="productImage" accept="image/*" hidden onChange={handleFileChange} />
                                <label htmlFor="productImage" className="upload-button-label">
                                    <Upload size={18} /> {preview ? "Change Image" : "Upload Image"}
                                </label>
                                {filename && <span className="filename-display">{filename}</span>}
                            </div>

                            <div className="inline-form-field status-section" style={{ marginLeft: 'auto', minWidth: '150px' }}>
                                <label>Status</label>
                                <select name="status" value={form.status} onChange={handleChange}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="product-form-actions">
                    <button type="button" className="btn-cancel" onClick={() => navigate("/products")}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-submit" disabled={saving}>
                        {saving ? "Saving..." : "Create Product"}
                    </button>
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

export default AddProduct;
