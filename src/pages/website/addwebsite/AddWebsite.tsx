import { useState, useEffect } from "react";
import { Plus, Check, Upload, X } from "lucide-react";

import "./addWebsite.css";
import { createWebsite } from "../models/website.api";
import type { WebsitePayload } from "../models/website.api";
import { http } from "../../../base_api/base_api";

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

const AddWebsite = () => {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [form, setForm] = useState<WebsitePayload>({
        sector_id: "",
        title: "",
        name: "", // Internal name or mapping field
        url: "",  // Default URL
        categories: [],
        status: "active",
        image: null,
    });
    const [preview, setPreview] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);

    /* LOAD SECTORS */
    useEffect(() => {
        http("/sectors")
            .then(json => {
                const rows = json.data ?? json;
                setSectors(
                    rows.map((s: any) => ({
                        id: s.id,
                        name: s.sector_name ?? s.name,
                    }))
                );
            });
    }, []);

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
    const resetForm = () => {
        setForm({
            sector_id: "",
            title: "",
            name: "",
            url: "",
            categories: [],
            status: "active",
            image: null,
        });
        setPreview(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setForm(prev => ({ ...prev, image: file }));
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
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
            await createWebsite(form);
            alert("Website saved successfully ✅");
            resetForm();
        } catch (error: any) {
            alert(error.message || "Failed to save website ❌");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="add-website-container">
            <div className="add-website-header">
                <h2>Add Website</h2>
                <button className="btn-add-new-web">
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
                            {saving ? "Saving..." : "Save Website"}
                        </button>
                        <button type="button" className="btn-reset" onClick={resetForm}>
                            Reset
                        </button>
                        <button type="button" className="btn-cancel">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddWebsite;
