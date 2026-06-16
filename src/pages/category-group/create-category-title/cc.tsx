import React, { useState, useEffect } from "react";
import "./cc.css";
import { ArrowLeft, Upload, Loader2, Image as ImageIcon, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createCategoryGroup, getCategoryGroups, deleteCategoryGroup, type CategoryGroupRow } from "../../category/models/categoryGroup.api";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";

const CreateCategoryTitle: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const { showLoader, hideLoader } = useLoading();
    const { showSuccess, showDeleteSuccess } = useSuccessPopup();
    const [items, setItems] = useState<CategoryGroupRow[]>([]);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        info: "",
        status: "active" as "active" | "inactive",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const loadItems = async () => {
        setFetching(true);
        showLoader("Loading category group titles...");
        try {
            const data = await getCategoryGroups();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load category groups", error);
        } finally {
            setFetching(false);
            hideLoader();
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) {
            alert("Please enter a title");
            return;
        }

        setLoading(true);
        showLoader("Creating category group title...");
        try {
            const submitData = new FormData();
            submitData.append("name", formData.title); // API expects 'name'
            submitData.append("description", formData.description);
            submitData.append("info", formData.info);
            submitData.append("status", formData.status);
            if (imageFile) {
                submitData.append("image", imageFile);
            }

            await createCategoryGroup(submitData);
            showSuccess("Category Group Title created successfully.", "Saved Successfully!");

            // Reset form
            setFormData({
                title: "",
                description: "",
                info: "",
                status: "active",
            });
            setImageFile(null);
            setImagePreview(null);

            // Reload list
            loadItems();
        } catch (error) {
            console.error("Failed to create category group title", error);
            alert("Failed to create category group title ❌");
        } finally {
            setLoading(false);
            hideLoader();
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this title?")) return;
        try {
            showLoader("Deleting category group title...");
            await deleteCategoryGroup(id);
            setItems(prev => prev.filter(item => item.id !== id));
            showDeleteSuccess("Category Group Title has been deleted successfully.", "Deleted Successfully!");
        } catch (error) {
            console.error("Delete failed", error);
            alert("Delete failed ❌");
        } finally {
            hideLoader();
        }
    };

    return (
        <div className="create-title-page">
            <div className="content">
                {/* Header */}
                <div className="header-section">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            onClick={() => navigate("/category-groups")}
                            className="back-btn"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1>Create Category Group Title</h1>
                            <p>Add and manage master titles for category organization</p>
                        </div>
                    </div>
                </div>

                <form className="form-card" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Title *</label>
                            <input
                                type="text"
                                name="title"
                                placeholder="Enter Group Title (e.g., Electronics Group)"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            placeholder="Enter a brief description for this group..."
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={2}
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Additional Info</label>
                        <input
                            type="text"
                            name="info"
                            placeholder="Enter any extra details or notes..."
                            value={formData.info}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="upload-section-card">
                        <div className="upload-left">
                            <div className="preview-box">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" />
                                ) : (
                                    <ImageIcon size={40} className="placeholder-icon" />
                                )}
                            </div>
                            <div className="upload-info">
                                <h4>Group Image</h4>
                                <p>Upload a representative icon or image for this title</p>
                                <button
                                    type="button"
                                    className="upload-btn"
                                    onClick={() => document.getElementById("image-upload")?.click()}
                                >
                                    <Upload size={18} />
                                    Upload Image
                                </button>
                                <input
                                    type="file"
                                    id="image-upload"
                                    style={{ display: "none" }}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                "Save Title"
                            )}
                        </button>
                    </div>
                </form>

                {/* List Table */}
                <div className="list-section">
                    <div className="section-header">
                        <h2>Existing Category Group Titles</h2>
                        <span className="count-badge">{items.length} Items</span>
                    </div>

                    <div className="table-card-mini">
                        {fetching ? null : items.length > 0 ? (
                            <table className="mini-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Title</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="item-img">
                                                    {item.image ? (
                                                        <img src={`${IMAGE_BASE_URL}/${item.image}`} alt={item.name} />
                                                    ) : (
                                                        <div className="img-fallback">{item.name.charAt(0)}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="item-name-cell">
                                                    <strong>{item.name}</strong>
                                                    <p>{item.description || "No description"}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`mini-status ${item.status}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="mini-actions">
                                                    <button onClick={() => navigate(`/category-groups/edit/${item.id}`)} className="mini-btn edit">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="mini-btn delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="table-empty">
                                <p>No titles created yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateCategoryTitle;
