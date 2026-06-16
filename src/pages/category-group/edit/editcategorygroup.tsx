import React, { useState, useEffect, useMemo, useRef } from "react";
import "../Add/addcategorygroup.css";
import { ArrowLeft, Upload, Loader2, Image as ImageIcon, ChevronDown } from "lucide-react";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import { getCategories, type CategoryRow } from "../../category/models/category.api";
import { getCategoryGroupById, updateCategoryGroup, getCategoryGroupMappingsByGroup, assignCategoriesToGroup, type CategoryGroupMapping, type CategoryGroupRow } from "../../category/models/categoryGroup.api";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";

const EditCategoryGroup: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { showLoader, hideLoader } = useLoading();
    const { showSuccess } = useSuccessPopup();
    const [searchParams] = useSearchParams();
    const page = searchParams.get("page") || "1";
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);

    // Initial group state from navigation if available
    const [groupData, setGroupData] = useState<CategoryGroupRow | null>(location.state as CategoryGroupRow || null);

    // Dropdown States
    const [showDropdown, setShowDropdown] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        category_ids: [] as number[],
        category_level: "primary",
        info: "",
        description: "",
        status: "active" as "active" | "inactive"
    });
    const [displayedCategories, setDisplayedCategories] = useState<CategoryRow[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            setFetchingData(true);
            showLoader("Loading category group data...");
            try {
                const cats = await getCategories();
                const categoriesList = Array.isArray(cats) ? cats : [];
                setCategories(categoriesList);

                let currentGroup = groupData;
                if (!currentGroup && id) {
                    currentGroup = await getCategoryGroupById(Number(id));
                    setGroupData(currentGroup);
                }

                if (currentGroup) {
                    setFormData(prev => ({
                        ...prev,
                        name: currentGroup!.name,
                        info: currentGroup!.info || "",
                        description: currentGroup!.description || "",
                        status: currentGroup!.status
                    }));
                    if (currentGroup.image) {
                        setImagePreview(`${IMAGE_BASE_URL}/${currentGroup.image}`);
                    }

                    const mappings = await getCategoryGroupMappingsByGroup(Number(id));
                    const groupMappings = mappings.filter((m: CategoryGroupMapping) => m.is_active !== 0);
                    if (groupMappings.length > 0) {
                        const mappedIds = groupMappings.map((m: CategoryGroupMapping) => m.category_id);
                        setFormData(prev => ({
                            ...prev,
                            category_ids: mappedIds,
                            category_level: groupMappings[0].category_level || "primary"
                        }));

                        const initialSelected = categoriesList.filter(c => mappedIds.includes(c.id));
                        setDisplayedCategories(initialSelected);
                    }
                }
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setFetchingData(false);
                hideLoader();
            }
        };
        loadInitialData();
    }, [id, groupData]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCategories = useMemo(() => {
        return categories
            .filter(cat =>
                cat.category_name.toLowerCase().includes(categorySearch.toLowerCase())
            )
            .sort((a, b) => a.category_name.localeCompare(b.category_name));
    }, [categories, categorySearch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryToggle = (id: number) => {
        setFormData(prev => {
            const currentIds = prev.category_ids;
            if (currentIds.includes(id)) {
                return { ...prev, category_ids: currentIds.filter(i => i !== id) };
            } else {
                return { ...prev, category_ids: [...currentIds, id] };
            }
        });
    };

    const handleViewSelections = () => {
        const selected = categories.filter(c => formData.category_ids.includes(c.id));
        setDisplayedCategories(selected);
        setShowDropdown(false);
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
        if (!id || !formData.name || formData.category_ids.length === 0) {
            alert("Please fill in required fields (Name & at least one Category)");
            return;
        }

        setLoading(true);
        showLoader("Updating category group...");
        try {
            const submitData = new FormData();
            submitData.append("name", formData.name);
            submitData.append("info", formData.info);
            submitData.append("description", formData.description);
            submitData.append("status", formData.status);
            if (imageFile) {
                submitData.append("image", imageFile);
            }

            await updateCategoryGroup(Number(id), submitData);

            await assignCategoriesToGroup({
                category_group_id: Number(id),
                category_ids: formData.category_ids,
            });

            showSuccess("Category group has been updated.", "Successfully Updated!");
            navigate(`/category-groups?page=${page}`);
        } catch (error) {
            console.error("Failed to update category group", error);
            alert("Failed to update category group ❌");
        } finally {
            setLoading(false);
            hideLoader();
        }
    };

    if (fetchingData) return null;

    const triggerLabel = formData.category_ids.length > 0
        ? `${formData.category_ids.length} items selected`
        : "Select items...";

    return (
        <div className="category-page">
            <div className="content">
                {/* 🔹 Header */}
                <div className="header-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => navigate(`/category-groups?page=${page}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                            <ArrowLeft size={24} color="#0f172a" />
                        </button>
                        <div>
                            <h1>Edit Category Group</h1>
                            <p>Choose items and click View to display selections</p>
                        </div>
                    </div>
                </div>

                <form className="form-card" onSubmit={handleSubmit}>
                    {/* 🔹 Selection Grid */}
                    <div className="form-grid">
                        <div className="form-group" ref={dropdownRef}>
                            <label>Category *</label>
                            <div className="dropdown-with-action">
                                <div className="custom-dropdown-container">
                                    <button
                                        type="button"
                                        className="custom-dropdown-trigger"
                                        onClick={() => setShowDropdown(!showDropdown)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input type="checkbox" checked={formData.category_ids.length > 0} readOnly style={{ pointerEvents: 'none' }} />
                                            <span>{triggerLabel}</span>
                                        </div>
                                        <ChevronDown size={18} color="#64748b" />
                                    </button>

                                    {showDropdown && (
                                        <div className="custom-dropdown-menu">
                                            <div className="dropdown-search-wrapper">
                                                <input
                                                    type="text"
                                                    className="dropdown-search-input"
                                                    placeholder="Search Category..."
                                                    value={categorySearch}
                                                    onChange={(e) => setCategorySearch(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="dropdown-items">
                                                {filteredCategories.length > 0 ? (
                                                    filteredCategories.map(cat => (
                                                        <div
                                                            key={cat.id}
                                                            className={`dropdown-item ${formData.category_ids.includes(cat.id) ? "selected" : ""}`}
                                                            onClick={() => handleCategoryToggle(cat.id)}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.category_ids.includes(cat.id)}
                                                                onChange={() => { }} // Handled by div onClick
                                                            />
                                                            {cat.category_name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="dropdown-item" style={{ color: '#94a3b8', cursor: 'default' }}>No categories found</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button type="button" className="view-action-btn" onClick={handleViewSelections}>
                                    View
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Category Level *</label>
                            <select
                                name="category_level"
                                value={formData.category_level}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="primary">Primary</option>
                                <option value="secondary">Secondary</option>
                                <option value="sub">Sub</option>
                            </select>
                        </div>
                    </div>

                    {/* 📋 Selected Items Card */}
                    <div className="selected-items-display">
                        <h3>Selected Items</h3>
                        {displayedCategories.length > 0 ? (
                            <ul className="selected-list">
                                {displayedCategories.map(cat => (
                                    <li key={cat.id}>{cat.category_name}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="empty-selection">No items selected to view.</p>
                        )}
                    </div>

                    {/* 🔹 Name & Info Grid */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Category Group Name *</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter Category Group Name..."
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Info</label>
                            <input
                                type="text"
                                name="info"
                                placeholder="Enter Info..."
                                value={formData.info}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* 🔹 Description */}
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            placeholder="Enter Description..."
                            value={formData.description}
                            onChange={handleInputChange}
                        ></textarea>
                    </div>

                    {/* 🖼️ Upload & Status Section */}
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
                                <h4>Category Group Image</h4>
                                <button type="button" className="upload-btn" onClick={() => document.getElementById('image-upload')?.click()}>
                                    <Upload size={18} />
                                    Upload Image
                                </button>
                                <input
                                    type="file"
                                    id="image-upload"
                                    style={{ display: 'none' }}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        <div className="status-box">
                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" value={formData.status} onChange={handleInputChange}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 🔘 Footer Buttons */}
                    <div className="form-footer">
                        <button type="button" className="reset-btn" onClick={() => navigate(`/category-groups?page=${page}`)}>Cancel</button>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={18} /> : "Update"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCategoryGroup;
