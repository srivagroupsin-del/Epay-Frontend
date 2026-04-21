import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import { Upload, ArrowLeft, X } from "lucide-react";
import { getBrandById, updateBrand, type Brand } from "../../../api/brand.api";
import "../../product/addproduct/AddProduct.css";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useBrandStore } from "../../../store/useBrandStore";


type BrandForm = {

    brandName: string;
    description: string;
    info: string;
    note: string;
    systemNote: string;
    iconText: string;
    link: string;
    status: "active" | "inactive";
    image?: File | null;
};

const EditBrand = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showLoader, hideLoader } = useLoading();
    const { showSuccess } = useSuccessPopup();
    const page = searchParams.get("page") || "1";

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<BrandForm>({
        brandName: "",
        description: "",
        info: "",
        note: "",
        systemNote: "",
        iconText: "",
        link: "",
        status: "active",
        image: null,
    });

    const [preview, setPreview] = useState<string | null>(null);
    const [filename, setFilename] = useState<string | null>(null);


    /* ======================
       LOAD DATA
    ====================== */
    useEffect(() => {
        if (!id) return;

        const loadBrand = async () => {
            showLoader("Loading brand data...");
            try {
                setLoading(true);
                const data: Brand = await getBrandById(id);

                setForm({
                    brandName: data.brand_name || "",
                    description: data.description || "",
                    info: data.info || "",
                    note: data.note || "",
                    systemNote: data.system_note || "",
                    iconText: data.icon_text || "",
                    link: data.link || "",
                    status: data.status,
                    image: null,
                });

                if (data.image) {
                    setPreview(`${IMAGE_BASE_URL}/${data.image}`);
                }

            } catch (err) {
                console.error("Failed to load brand", err);
                alert("Failed to load brand details");
                navigate(`/brands?page=${page}`);
            } finally {
                setLoading(false);
                hideLoader();
            }
        };

        loadBrand();
    }, [id, navigate]);

    /* ======================
       HANDLERS
    ====================== */
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (file: File | null) => {
        setForm(prev => ({ ...prev, image: file }));

        if (file) {
            setFilename(file.name);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilename(null);
            // If reverting to original image, we might want to reload it, but for now just clear local preview if cancelled
            // Ideally we check if we want to show the original image again.
            // But simpler: if cleared, no image update. 
        }
    };

    const handleDeleteImage = () => {
        setPreview(null);
        setFilename(null);
        setForm(prev => ({ ...prev, image: null }));
        const fileInput = document.getElementById("brandImage") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    };

    /* ======================
       SUBMIT
    ====================== */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.brandName) {
            alert("Brand Name is required");
            return;
        }

        try {
            setSaving(true);
            showLoader("Updating brand...");
            await updateBrand(id!, form);
            showSuccess("Brand details have been updated successfully.", "Successfully Updated!");
            navigate(`/brands?page=${page}`);
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to update brand");
        } finally {
            setSaving(false);
            hideLoader();
        }
    };

    if (loading) return null;

    return (
        <div className="page-container">
            <GlobalStoreHeader />

            <form className="form-card" onSubmit={handleSubmit}>

                {/* HEADER */}
                <div className="form-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button type="button" className="btn-back" onClick={() => navigate(`/brands?page=${page}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <ArrowLeft size={20} color="#111" />
                        </button>
                        <h2>Edit Brand</h2>
                    </div>

                    <p className="subtitle">Update brand details</p>
                </div>

                {/* GRID */}
                <div className="form-grid">

                    <div className="inline-form-field">
                        <label>Brand Name</label>
                        <input
                            name="brandName"
                            placeholder="Enter Brand Name..."
                            value={form.brandName}
                            onChange={(e) => {
                                handleChange(e);
                                useBrandStore.getState().setBrand(e.target.value);
                            }}

                        />
                    </div>

                    <div className="inline-form-field">
                        <label>Link</label>
                        <input
                            name="link"
                            placeholder="Enter Link..."
                            value={form.link}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="inline-form-field">
                        <label>Description</label>
                        <textarea
                            name="description"
                            placeholder="Enter Description..."
                            value={form.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="inline-form-field">
                        <label>Info</label>
                        <textarea
                            name="info"
                            placeholder="Enter Info..."
                            value={form.info}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="inline-form-field">
                        <label>Note</label>
                        <textarea
                            name="note"
                            placeholder="Enter Note..."
                            value={form.note}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="inline-form-field">
                        <label>System Note</label>
                        <textarea
                            name="systemNote"
                            placeholder="Enter System Note..."
                            value={form.systemNote}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="inline-form-field">
                        <label>Icon Text</label>
                        <input
                            name="iconText"
                            placeholder="Enter Icon Text..."
                            value={form.iconText}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Main Image + Status Row */}
                    {/* Main Image + Status Row */}
                    <div className="product-image-section">
                        <div className="image-status-flex">
                            <div className="image-preview-box">
                                {preview ? (
                                    <>
                                        <img src={preview} alt="Preview" />
                                        <button
                                            type="button"
                                            className="delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteImage();
                                            }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="empty-placeholder" onClick={() => document.getElementById("brandImage")?.click()} />
                                )}
                            </div>

                            <div className="image-upload-controls">
                                <label style={{ fontSize: '14px', fontWeight: '600' }}>Brand Image</label>
                                <input
                                    type="file"
                                    id="brandImage"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                />
                                <label htmlFor="brandImage" className="upload-button-label">
                                    <Upload size={18} /> {preview ? "Change Image" : "Upload Image"}
                                </label>
                                {filename && <span className="filename-display">{filename}</span>}
                            </div>

                            <div className="inline-form-field status-section" style={{ marginLeft: "auto", minWidth: "150px" }}>
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
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn ghost"
                        style={{ border: 'none', background: '#ccc', color: '#333' }}
                        onClick={() => navigate(`/brands?page=${page}`)}
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        className="btn primary"
                        disabled={saving}
                    >
                        {saving ? "Updating..." : "Update Brand"}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default EditBrand;
