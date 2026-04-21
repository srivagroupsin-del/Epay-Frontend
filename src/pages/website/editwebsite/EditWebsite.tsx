import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Check, ChevronLeft, Upload, X } from "lucide-react";

import "../addwebsite/addWebsite.css"; // Reuse AddWebsite styles
import { updateWebsite, getWebsites } from "../models/website.api";
import type { WebsitePayload } from "../models/website.api";
import { http } from "../../../base_api/base_api";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";

type Sector = {
    id: number;
    name: string;
};

const CATEGORIES = [
    "E-commerce",
    "News",
    "Location",
    "Blog",
    "Real Estate",
    "Service",
    "Finance"
];

const EditWebsite = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const page = searchParams.get("page") || "1";

    const [sectors, setSectors] = useState<Sector[]>([]);
    const [form, setForm] = useState<WebsitePayload>({
        sector_id: "",
        title: "",
        name: "",
        url: "",
        categories: [],
        status: "active",
        image: null,
    });
    const [preview, setPreview] = useState<string | null>(null);


    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    /* LOAD SECTORS & WEBSITE DATA */
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load sectors
                const sectorRes = await http("/sectors");
                const sectorRows = sectorRes.data ?? sectorRes;
                setSectors(sectorRows.map((s: any) => ({
                    id: s.id,
                    name: s.sector_name ?? s.name,
                })));

                // Load website data
                const websitesRes = await getWebsites();
                const website = websitesRes.find(w => w.id === Number(id));

                if (website) {
                    setForm({
                        sector_id: website.sector_id,
                        title: website.title,
                        name: website.name,
                        url: website.url,
                        categories: [], // Assuming categories might need separate fetch or parsing if stored as string JSON
                        status: website.status,
                        image: null,
                    });

                    if (website.image) {
                        setPreview(`${IMAGE_BASE_URL}/${website.image}`);
                    }

                    // If categories are stored as a JSON string in the DB, parse it here
                    // This depends on how the backend returns them
                } else {
                    alert("Website not found");
                    navigate(`/websites?page=${page}`);
                }
            } catch (error) {
                console.error("Load Error:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [id, navigate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setForm(prev => ({ ...prev, image: file }));
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleCategory = (cat: string) => {
        setForm(prev => ({
            ...prev,
            categories: prev.categories.includes(cat)
                ? prev.categories.filter(c => c !== cat)
                : [...prev.categories, cat]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.sector_id) {
            alert("Please select Sector");
            return;
        }

        if (!form.title.trim()) {
            alert("Title is required");
            return;
        }

        try {
            setSaving(true);
            await updateWebsite(Number(id), form);
            alert("Website updated successfully ✅");
            navigate(`/websites?page=${page}`);
        } catch (error: any) {
            alert(error.message || "Failed to update website ❌");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="add-website-container"><p>Loading...</p></div>;

    return (
        <div className="add-website-container">
            <div className="add-website-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button className="btn-icon-edit" onClick={() => navigate(`/websites?page=${page}`)} style={{ background: "#e0e0e0", color: "#333" }}>
                        <ChevronLeft size={20} />
                    </button>
                    <h2>Edit Website</h2>
                </div>

                <button className="btn-add-new-web" onClick={() => navigate("/website/add")}>
                    <Plus size={18} /> Add New Web
                </button>
            </div>

            <div className="website-card">
                <form onSubmit={handleSubmit}>
                    <div className="row-grid">
                        <div className="form-field-group">
                            <label>Sector</label>
                            <select
                                name="sector_id"
                                value={form.sector_id}
                                onChange={handleChange}
                            >
                                <option value="">Select Sector</option>
                                {sectors.map(sec => (
                                    <option key={sec.id} value={sec.id}>
                                        {sec.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-field-group">
                            <label>Title</label>
                            <input
                                type="text"
                                name="title"
                                placeholder="Enter Title"
                                value={form.title}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="categories-section">
                        <h3>Website</h3>
                        <div className="categories-grid">
                            {CATEGORIES.map(cat => (
                                <div
                                    key={cat}
                                    className="category-item"
                                    onClick={() => toggleCategory(cat)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={form.categories.includes(cat)}
                                        readOnly
                                    />
                                    <span>{cat}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="status-section" style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                        <div className="form-field-group">
                            <label className="status-label">Status</label>
                            <div
                                className={`custom-status-checkbox ${form.status === "inactive" ? "inactive" : ""}`}
                                onClick={() => setForm(prev => ({
                                    ...prev,
                                    status: prev.status === "active" ? "inactive" : "active"
                                }))}
                            >
                                {form.status === "active" && <Check size={24} />}
                            </div>
                        </div>

                        <div className="form-field-group">
                            <label>Website Image</label>
                            <div className="file-input-wrapper">
                                <input type="file" id="websiteImage" hidden onChange={handleFileChange} />
                                <label htmlFor="websiteImage" className="btn-upload-file">
                                    <Upload size={16} /> Choose File
                                </label>
                                <div className="image-preview-container">
                                    <img src={preview || ""} alt="Preview" className={!preview ? "placeholder-img" : ""} />
                                    {preview && (
                                        <button
                                            type="button"
                                            className="btn-remove-image"
                                            onClick={() => {
                                                setForm(prev => ({ ...prev, image: null }));
                                                setPreview(null);
                                            }}
                                            title="Remove Image"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-action-buttons">
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? "Updating..." : "Update Website"}
                        </button>
                        <button type="button" className="btn-reset" onClick={() => navigate(`/websites?page=${page}`)}>
                            Back to List
                        </button>
                        <button type="button" className="btn-cancel" onClick={() => navigate(`/websites?page=${page}`)}>
                            Cancel
                        </button>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditWebsite;
