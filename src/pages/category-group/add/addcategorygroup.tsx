import React, { useState, useEffect, useMemo, useRef } from "react";
import "./addcategorygroup.css";
import { ArrowLeft, Loader2, ChevronDown, X, Search, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCategories, type CategoryRow } from "../../category/models/category.api";
import { assignCategoriesToGroup, getCategoryGroups, type CategoryGroupRow } from "../../category/models/categoryGroup.api";
import { getSectorTitles, type SectorTitle } from "../../../api/sectorTitle.api";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import { getSubSubSectors, type SubSectorRow } from "../../subsector/models/subSectors.api";
import { getSectors, type Sector } from "../../../api/sectors.api";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";

const CategoryGroup: React.FC = () => {
    const navigate = useNavigate();
    const { showLoader, hideLoader } = useLoading();
    const { showSuccess } = useSuccessPopup();

    // 🔹 Data States
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [sectorTitles, setSectorTitles] = useState<SectorTitle[]>([]);
    const [allSectors, setAllSectors] = useState<Sector[]>([]);
    const [allSubSectors, setAllSubSectors] = useState<SubSectorRow[]>([]);
    const [categoryGroups, setCategoryGroups] = useState<CategoryGroupRow[]>([]);

    const [loading, setLoading] = useState(false);

    // 🔹 Selection States (IDs)
    const [sectorTitleId, setSectorTitleId] = useState("");
    const [sectorId, setSectorId] = useState("");
    const [subSectorId, setSubSectorId] = useState("");

    // 🔹 Dropdown Visibility
    const [showTitleList, setShowTitleList] = useState(false);
    const [showSectorList, setShowSectorList] = useState(false);
    const [showSubSectorList, setShowSubSectorList] = useState(false);
    const [showGroupList, setShowGroupList] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // 🔹 Search States
    const [titleSearch, setTitleSearch] = useState("");
    const [sectorSearch, setSectorSearch] = useState("");
    const [subSearch, setSubSearch] = useState("");
    const [groupSearch, setGroupSearch] = useState("");
    const [categoryModalSearch, setCategoryModalSearch] = useState("");

    // 🔹 Refs for Click Outside
    const titleRef = useRef<HTMLDivElement>(null);
    const sectorRef = useRef<HTMLDivElement>(null);
    const subRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);

    // 🔹 Form State
    const [formData, setFormData] = useState({
        name: "",
        category_ids: [] as number[],
        category_level: "primary",
        // info: "",
        // description: "",
        status: "active" as "active" | "inactive",
        category_group_id: "" as string | number
    });
    const [displayedCategories, setDisplayedCategories] = useState<CategoryRow[]>([]);
    // const [imageFile, setImageFile] = useState<File | null>(null);
    // const [imagePreview, setImagePreview] = useState<string | null>(null);

    // 🔹 Load Initial Data
    useEffect(() => {
        const loadInitialData = async () => {
            showLoader("Loading form data, please wait...");
            try {
                const [cats, titles, sectors, subRows, categoryGroupsData] = await Promise.all([
                    getCategories(),
                    getSectorTitles(),
                    getSectors(),
                    getSubSubSectors(),
                    getCategoryGroups()
                ]);

                setCategories(Array.isArray(cats) ? cats : []);
                setSectorTitles(Array.isArray(titles) ? titles : []);
                setAllSectors(Array.isArray(sectors) ? sectors : []);
                setAllSubSectors(Array.isArray(subRows) ? subRows : []);
                setCategoryGroups(Array.isArray(categoryGroupsData) ? categoryGroupsData : []);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                hideLoader();
            }
        };
        loadInitialData();
    }, []);

    // 🔹 Click Outside Handlers
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (titleRef.current && !titleRef.current.contains(event.target as Node)) setShowTitleList(false);
            if (sectorRef.current && !sectorRef.current.contains(event.target as Node)) setShowSectorList(false);
            if (subRef.current && !subRef.current.contains(event.target as Node)) setShowSubSectorList(false);
            if (groupRef.current && !groupRef.current.contains(event.target as Node)) setShowGroupList(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 🔹 Filtering & Sorting Logic (A-Z)
    const filteredTitleOptions = useMemo(() => {
        const search = titleSearch.trim().toLowerCase();
        return sectorTitles
            .filter(t => {
                if (!search) return true;
                return t.title.toLowerCase().startsWith(search);
            })
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [sectorTitles, titleSearch]);

    const currentFilteredSectors = useMemo(() => {
        if (!sectorTitleId) return [];
        return allSectors.filter(s => String(s.sector_title_id) === String(sectorTitleId));
    }, [allSectors, sectorTitleId]);

    const filteredSectorOptions = useMemo(() => {
        const search = sectorSearch.trim().toLowerCase();
        return currentFilteredSectors
            .filter(s => {
                const name = (s.sector_name || s.name || "").toLowerCase();
                if (!search) return true;
                return name.startsWith(search);
            })
            .sort((a, b) => (a.sector_name || a.name || "").localeCompare(b.sector_name || b.name || ""));
    }, [currentFilteredSectors, sectorSearch]);

    const currentFilteredSubSectors = useMemo(() => {
        if (!sectorId) return [];
        return allSubSectors.filter(ss => String(ss.sector_id) === String(sectorId));
    }, [allSubSectors, sectorId]);

    const filteredSubSectorOptions = useMemo(() => {
        const search = subSearch.trim().toLowerCase();
        return currentFilteredSubSectors
            .filter(ss => {
                const name = (ss.sub_sector_name || "").toLowerCase();
                if (!search) return true;
                return name.startsWith(search);
            })
            .sort((a, b) => (a.sub_sector_name || "").localeCompare(b.sub_sector_name || ""));
    }, [currentFilteredSubSectors, subSearch]);

    const filteredGroupOptions = useMemo(() => {
        const search = groupSearch.trim().toLowerCase();
        return categoryGroups
            .filter(g => {
                const name = (g.name || "").toLowerCase();
                if (!search) return true;
                return name.startsWith(search);
            })
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [categoryGroups, groupSearch]);

    // 🔹 Category Filtering (Final list to show in Modal)
    const filteredCategoriesForModal = useMemo(() => {
        const search = categoryModalSearch.trim().toLowerCase();
        return categories.filter(c => {
            const matchesTitle = !sectorTitleId || String(c.sector_title_id) === String(sectorTitleId);
            const matchesSector = !sectorId || String(c.sector_id) === String(sectorId);
            const matchesSub = !subSectorId || String(c.sub_sector_id) === String(subSectorId);

            const name = c.category_name.toLowerCase();
            const matchesSearch = !search || name.startsWith(search);

            return matchesTitle && matchesSector && matchesSub && matchesSearch;
        }).sort((a, b) => a.category_name.localeCompare(b.category_name));
    }, [categories, sectorTitleId, sectorId, subSectorId, categoryModalSearch]);

    // 🔹 Handlers
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
        setShowCategoryModal(false);
    };

    // const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     if (e.target.files && e.target.files[0]) {
    //         const file = e.target.files[0];
    //         setImageFile(file);
    //         const reader = new FileReader();
    //         reader.onloadend = () => setImagePreview(reader.result as string);
    //         reader.readAsDataURL(file);
    //     }
    // };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.category_group_id || formData.category_ids.length === 0) {
            alert("Please select a Category Group Title & at least one Category");
            return;
        }

        setLoading(true);
        showLoader("Saving category group, please wait...");
        try {
            await assignCategoriesToGroup({
                category_group_id: Number(formData.category_group_id),
                category_ids: formData.category_ids,
            });

            showSuccess("Category Group Mapping created successfully.", "Saved Successfully!");
            navigate("/category-groups");
        } catch (error) {
            console.error(error);
            alert("Failed to create category group ❌");
        } finally {
            setLoading(false);
            hideLoader();
        }
    };

    return (
        <div className="category-page">
            <div className="content">
                {/* Header Section */}
                <div className="header-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => navigate("/category-groups")} className="back-btn">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1>Add Category Group</h1>
                            <p>Choose items and click View to display selections</p>
                        </div>
                    </div>
                </div>

                <form className="form-card" onSubmit={handleSubmit}>
                    {/* Cascading Filters Grid */}
                    {/* Category Group Title Select */}
                    <div className="form-grid">
                        <div className={`form-group ${showGroupList ? 'active' : ''}`} ref={groupRef}>
                            <label>Category Group Title *</label>
                            <div className="custom-dropdown-trigger" onClick={() => setShowGroupList(!showGroupList)}>
                                <span>{categoryGroups.find(g => String(g.id) === String(formData.category_group_id))?.name || "Select Category Group Title"}</span>
                                <ChevronDown size={18} />
                            </div>
                            {showGroupList && (
                                <div className="custom-dropdown-menu">
                                    <div className="dropdown-search-wrapper">
                                        <Search size={14} className="search-icon" />
                                        <input
                                            type="text"
                                            className="dropdown-search-input"
                                            placeholder="Search group..."
                                            value={groupSearch}
                                            onChange={(e) => setGroupSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="dropdown-items">
                                        {filteredGroupOptions.length > 0 ? filteredGroupOptions.map(item => (
                                            <div key={item.id} className="dropdown-item" onClick={() => {
                                                setFormData({ ...formData, category_group_id: item.id });
                                                setShowGroupList(false);
                                                setGroupSearch("");
                                            }}>
                                                {item.name}
                                            </div>
                                        )) : <div className="dropdown-item disabled">No groups found</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Sector Title Dropdown */}
                        <div className={`form-group ${showTitleList ? 'active' : ''}`} ref={titleRef}>

                            <label>Sector Title</label>
                            <div className="custom-dropdown-trigger" onClick={() => setShowTitleList(!showTitleList)}>
                                <span>{sectorTitles.find(t => String(t.id) === sectorTitleId)?.title || "Select Sector Title"}</span>
                                <ChevronDown size={18} />
                            </div>
                            {showTitleList && (
                                <div className="custom-dropdown-menu">
                                    <div className="dropdown-search-wrapper">
                                        <Search size={14} className="search-icon" />
                                        <input
                                            type="text"
                                            className="dropdown-search-input"
                                            placeholder="Search title..."
                                            value={titleSearch}
                                            onChange={(e) => setTitleSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="dropdown-items">
                                        {filteredTitleOptions.length > 0 ? filteredTitleOptions.map(item => (
                                            <div key={item.id} className="dropdown-item" onClick={() => {
                                                setSectorTitleId(String(item.id));
                                                setSectorId("");
                                                setSubSectorId("");
                                                setShowTitleList(false);
                                                setTitleSearch("");
                                            }}>
                                                {item.title}
                                            </div>
                                        )) : <div className="dropdown-item disabled">No titles found</div>}
                                    </div>
                                </div>
                            )}
                        </div>



                        {/* Sector Dropdown */}
                        <div className={`form-group ${showSectorList ? 'active' : ''}`} ref={sectorRef}>
                            <label>Sector</label>
                            <div className={`custom-dropdown-trigger ${!sectorTitleId ? 'disabled' : ''}`}
                                onClick={() => sectorTitleId && setShowSectorList(!showSectorList)}>
                                <span>{filteredSectorOptions.find(s => String(s.id) === sectorId)?.sector_name || "Select Sector"}</span>
                                <ChevronDown size={18} />
                            </div>
                            {showSectorList && (
                                <div className="custom-dropdown-menu">
                                    <div className="dropdown-search-wrapper">
                                        <Search size={14} className="search-icon" />
                                        <input
                                            type="text"
                                            className="dropdown-search-input"
                                            placeholder="Search sector..."
                                            value={sectorSearch}
                                            onChange={(e) => setSectorSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="dropdown-items">
                                        {filteredSectorOptions.length > 0 ? filteredSectorOptions.map(item => (
                                            <div key={item.id} className="dropdown-item" onClick={() => {
                                                setSectorId(String(item.id));
                                                setSubSectorId("");
                                                setShowSectorList(false);
                                                setSectorSearch("");
                                            }}>
                                                {item.sector_name || item.name}
                                            </div>
                                        )) : <div className="dropdown-item disabled">No sectors found</div>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SubSector Dropdown */}
                        <div className={`form-group ${showSubSectorList ? 'active' : ''}`} ref={subRef}>
                            <label>SubSector</label>
                            <div className={`custom-dropdown-trigger ${!sectorId ? 'disabled' : ''}`}
                                onClick={() => sectorId && setShowSubSectorList(!showSubSectorList)}>
                                <span>{filteredSubSectorOptions.find(ss => String(ss.id) === subSectorId)?.sub_sector_name || "Select SubSector"}</span>
                                <ChevronDown size={18} />
                            </div>
                            {showSubSectorList && (
                                <div className="custom-dropdown-menu">
                                    <div className="dropdown-search-wrapper">
                                        <Search size={14} className="search-icon" />
                                        <input
                                            type="text"
                                            className="dropdown-search-input"
                                            placeholder="Search subsector..."
                                            value={subSearch}
                                            onChange={(e) => setSubSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="dropdown-items">
                                        {filteredSubSectorOptions.length > 0 ? filteredSubSectorOptions.map(item => (
                                            <div key={item.id} className="dropdown-item" onClick={() => {
                                                setSubSectorId(String(item.id));
                                                setShowSubSectorList(false);
                                                setSubSearch("");
                                            }}>
                                                {item.sub_sector_name}
                                            </div>
                                        )) : <div className="dropdown-item disabled">No subsectors found</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Category Selector Pop-up Trigger */}
                    <div className="form-group">
                        <label>Category *</label>
                        <div className="dropdown-with-action">
                            <div className="custom-dropdown-trigger" onClick={() => setShowCategoryModal(true)}>
                                <span>{formData.category_ids.length > 0 ? `${formData.category_ids.length} items checked` : "Select categories..."}</span>
                                <ChevronDown size={18} />
                            </div>
                            <button type="button" className="view-action-btn" onClick={handleViewSelections}>View Items</button>
                        </div>
                    </div>


                    {/* Selected Categories Display */}
                    <div className="selected-items-display">
                        <div className="section-header">
                            <h3>Selected Categories</h3>
                            {displayedCategories.length > 0 && <span className="count-badge">{displayedCategories.length} Items Selected</span>}
                        </div>

                        {displayedCategories.length > 0 ? (
                            <div className="table-container">
                                <table className="selection-table">
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Category Name</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayedCategories.map(cat => (
                                            <tr key={cat.id}>
                                                <td>
                                                    <div className="table-img">
                                                        {cat.image ? (
                                                            <img src={`${IMAGE_BASE_URL}/${cat.image}`} alt={cat.category_name} />
                                                        ) : (
                                                            <div className="img-placeholder">{cat.category_name.charAt(0)}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="item-name">
                                                        <strong>{cat.category_name}</strong>
                                                        <span className="sub-text">{cat.category_type}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${cat.status || 'active'}`}>
                                                        {cat.status || 'active'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        type="button"
                                                        className="remove-item-btn"
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                category_ids: prev.category_ids.filter(id => id !== cat.id)
                                                            }));
                                                            setDisplayedCategories(prev => prev.filter(c => c.id !== cat.id));
                                                        }}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-table-state">
                                <p>No categories selected. Click 'View Items' after making your selection in the modal.</p>
                            </div>
                        )}
                    </div>
                    <div className="status-box">
                        <div className="form-group">
                            <label>Status</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: (e.target.value as "active" | "inactive") })}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>


                    <div className="form-footer">
                        <button type="button" className="reset-btn" onClick={() => navigate("/category-groups")}>Cancel</button>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={18} /> : "Save Group"}
                        </button>
                    </div>
                </form>
            </div>

            {/* 🔹 Enhanced Category Pop-up Modal */}
            {showCategoryModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Select Categories</h2>
                            <button className="close-modal" onClick={() => setShowCategoryModal(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-search">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search Categories..."
                                value={categoryModalSearch}
                                onChange={(e) => setCategoryModalSearch(e.target.value)}
                            />
                        </div>
                        <div className="modal-body">
                            {filteredCategoriesForModal.length > 0 ? (
                                <div className="category-checklist">
                                    {filteredCategoriesForModal.map(cat => (
                                        <div key={cat.id} className="checklist-item" onClick={() => handleCategoryToggle(cat.id)}>
                                            <input
                                                type="checkbox"
                                                checked={formData.category_ids.includes(cat.id)}
                                                onChange={() => { }} // Handled by div onClick
                                            />
                                            <span>{cat.category_name}</span>
                                            {formData.category_ids.includes(cat.id) && <Check size={16} color="#22c55e" style={{ marginLeft: 'auto' }} />}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-data">
                                    <p>No categories found matching your search or filters.</p>
                                    <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>Try adjusting Sector/SubSector filters on the main form.</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="confirm-btn" onClick={handleViewSelections}>View Selected Items</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryGroup;