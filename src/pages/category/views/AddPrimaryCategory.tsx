import { useEffect, useState, useRef, useMemo } from "react";
import { Upload, X } from "lucide-react";
import { getCategories, type CategoryRow } from "../models/category.api";
import { http } from "../../../base_api/base_api";
import "../../product/addproduct/AddProduct.css";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import {
  getSubSubSectors,
  type SubSectorRow,
} from "../../subsector/models/subSectors.api";
import { getSectorTitles, type SectorTitle } from "../../../api/sectorTitle.api";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useBusinessStore } from "../../../store/useBusinessStore";
import { useCategoryStore } from "../../../store/useCategoryStore";

import "./addCategory.css";



/* =========================
   TYPES
========================= */
type Sector = {
  id: number;
  sector_name: string;
};

/* =========================
   COMPONENT
========================= */
const AddCategory = () => {
  /* =========================
     STATE
  ========================= */
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();
  const [sectorstitle, setSectorstitle] = useState<SectorTitle[]>([]);
  const [allSectors, setAllSectors] = useState<Sector[]>([]);
  const [filteredSectors, setFilteredSectors] = useState<Sector[]>([]);
  const [allSubSectors, setAllSubSectors] = useState<SubSectorRow[]>([]);
  const [filteredSubSectors, setFilteredSubSectors] = useState<SubSectorRow[]>([]);
  const [parentCategories, setParentCategories] = useState<CategoryRow[]>([]);
  const [allPrimaryCategories, setAllPrimaryCategories] = useState<CategoryRow[]>([]);

  const [sectorTitleId, setSectorTitleId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [subSectorId, setSubSectorId] = useState("");
  const [categoryType, setCategoryType] = useState<"Primary" | "Secondary">(
    "Primary"
  );
  const [parentCategoryId, setParentCategoryId] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [info, setInfo] = useState("");
  const [note, setNote] = useState("");
  const [systemNote, setSystemNote] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  // Searchable dropdown states
  const [showTitleList, setShowTitleList] = useState(false);
  const [showSectorList, setShowSectorList] = useState(false);
  const [showSubSectorList, setShowSubSectorList] = useState(false);
  const [showParentList, setShowParentList] = useState(false);

  const [titleSearch, setTitleSearch] = useState("");
  const [sectorSearch, setSectorSearch] = useState("");
  const [subSearch, setSubSearch] = useState("");
  const [parentSearch, setParentSearch] = useState("");

  const titleRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  /* =========================
     CLICK OUTSIDE
  ========================= */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (titleRef.current && !titleRef.current.contains(event.target as Node)) {
        setShowTitleList(false);
        setTitleSearch("");
      }
      if (sectorRef.current && !sectorRef.current.contains(event.target as Node)) {
        setShowSectorList(false);
        setSectorSearch("");
      }
      if (subRef.current && !subRef.current.contains(event.target as Node)) {
        setShowSubSectorList(false);
        setSubSearch("");
      }
      if (parentRef.current && !parentRef.current.contains(event.target as Node)) {
        setShowParentList(false);
        setParentSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================
     LOAD INITIAL DATA
  ========================= */
  useEffect(() => {
    const loadInitial = async () => {
      showLoader("Loading form data, please wait...");
      try {
        const [titles, sectorsRaw, subRows] = await Promise.all([
          getSectorTitles(),
          http("/sectors"),
          getSubSubSectors()
        ]);

        setSectorstitle(titles);
        setAllSectors(sectorsRaw.data ?? sectorsRaw);
        setAllSubSectors(subRows);
      } catch (e) {
        console.error("Failed to load initial data", e);
      } finally {
        hideLoader();
      }
    };
    loadInitial();
  }, []);

  /* =========================
     CASCADING LOGIC
  ========================= */

  // 1. Selector Title -> Filters Sectors
  useEffect(() => {
    if (!sectorTitleId) {
      setFilteredSectors([]);
    } else {
      const filtered = allSectors.filter(
        (s: any) => String(s.sector_title_id) === String(sectorTitleId)
      );
      setFilteredSectors(filtered);
    }
    // Auto reset lower
    setSectorId("");
    setSubSectorId("");
  }, [sectorTitleId, allSectors]);

  // 2. Sector -> Filters Sub Sectors
  useEffect(() => {
    if (!sectorId) {
      setFilteredSubSectors([]);
    } else {
      const filtered = allSubSectors.filter(
        ss => String(ss.sector_id) === String(sectorId)
      );
      setFilteredSubSectors(filtered);
    }
    // Auto reset lower
    setSubSectorId("");
  }, [sectorId, allSubSectors]);

  // 3. Sub Sector -> Filters Parent Categories
  useEffect(() => {
    if (!subSectorId) {
      setParentCategories([]);
    } else {
      const filtered = allPrimaryCategories.filter(
        c => String(c.sub_sector_id) === String(subSectorId)
      );
      setParentCategories(filtered);
    }
    setParentCategoryId("");
  }, [subSectorId, allPrimaryCategories]);

  /* =========================
     LOAD PRIMARY CATEGORIES
  ========================= */
  useEffect(() => {
    const loadParents = async () => {
      try {
        const categories = await getCategories();
        const primary = categories.filter(
          c => c.category_type?.toLowerCase() === "primary"
        );
        setAllPrimaryCategories(primary);
        // Initial filter if subSectorId exists (e.g. during edit, though this is Add)
        if (subSectorId) {
          setParentCategories(primary.filter(c => String(c.sub_sector_id) === String(subSectorId)));
        } else {
          setParentCategories([]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadParents();
  }, []);

  /* =========================
     RESET
  ========================= */
  const resetForm = () => {
    setSectorTitleId("");
    setSectorId("");
    setSubSectorId("");
    setCategoryType("Primary");
    setParentCategoryId("");
    setCategoryName("");
    setDescription("");
    setInfo("");
    setNote("");
    setSystemNote("");
    setStatus("active");
    setImage(null);
    setPreview(null);
    setFilename(null);
  };

  /* =========================
     SAVE
  ========================= */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sectorTitleId || !sectorId || !categoryName) {
      alert("Sector Title, Sector, and Category Name are required");
      return;
    }

    if (categoryType === "Secondary" && !parentCategoryId) {
      alert("Parent Category is required");
      return;
    }

    const formData = new FormData();
    formData.append("sector_title_id", sectorTitleId);
    formData.append("sector_id", sectorId);

    if (subSectorId) {
      formData.append("sub_sector_id", subSectorId);
    }

    formData.append("category_type", categoryType);
    formData.append("category_name", categoryName);
    formData.append("description", description);
    formData.append("info", info);
    formData.append("note", note);
    formData.append("system_note", systemNote);
    formData.append("status", status);
    formData.append("is_enabled", status === "active" ? "1" : "0");
    formData.append("is_active", status === "active" ? "1" : "0");

    if (categoryType === "Secondary") {
      formData.append("parent_category_id", parentCategoryId);
    }

    if (image) {
      formData.append("image", image);
    }

    try {
      showLoader("Saving category, please wait...");
      await http("/categories", {
        method: "POST",
        body: formData,
      });

      showSuccess("Category has been added successfully.", "Saved Successfully!");
      resetForm();
    } catch (err: any) {
      console.error("BACKEND ERROR:", err);
      alert(err.message || "Save failed");
    } finally {
      hideLoader();
    }
  };

  /* =========================
     UI
  ========================= */
  /* ======================
     FILTERED DROPDOWN LISTS (A-Z)
  ====================== */
  const filteredTitleOptions = useMemo(() => {
    const unique = new Map<string, SectorTitle>();
    for (const t of sectorstitle) {
      if (t.title.toLowerCase().startsWith(titleSearch.toLowerCase()) && !unique.has(t.title.toLowerCase())) {
        unique.set(t.title.toLowerCase(), t);
      }
    }
    return Array.from(unique.values()).sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
  }, [sectorstitle, titleSearch]);

  const filteredSectorOptions = useMemo(() => {
    const unique = new Map<string, Sector>();
    for (const s of filteredSectors) {
      if (s.sector_name.toLowerCase().startsWith(sectorSearch.toLowerCase()) && !unique.has(s.sector_name.toLowerCase())) {
        unique.set(s.sector_name.toLowerCase(), s);
      }
    }
    return Array.from(unique.values()).sort((a, b) => a.sector_name.localeCompare(b.sector_name, undefined, { sensitivity: 'base' }));
  }, [filteredSectors, sectorSearch]);

  const filteredSubSectorOptions = useMemo(() => {
    const unique = new Map<string, SubSectorRow>();
    for (const ss of filteredSubSectors) {
      const name = ss.sub_sector_name || "";
      if (name.toLowerCase().startsWith(subSearch.toLowerCase()) && !unique.has(name.toLowerCase())) {
        unique.set(name.toLowerCase(), ss);
      }
    }
    return Array.from(unique.values()).sort((a, b) => (a.sub_sector_name || "").localeCompare(b.sub_sector_name || "", undefined, { sensitivity: 'base' }));
  }, [filteredSubSectors, subSearch]);

  const filteredParentOptions = useMemo(() => {
    const unique = new Map<string, CategoryRow>();
    for (const pc of parentCategories) {
      if (pc.category_name.toLowerCase().startsWith(parentSearch.toLowerCase()) && !unique.has(pc.category_name.toLowerCase())) {
        unique.set(pc.category_name.toLowerCase(), pc);
      }
    }
    return Array.from(unique.values()).sort((a, b) => a.category_name.localeCompare(b.category_name, undefined, { sensitivity: 'base' }));
  }, [parentCategories, parentSearch]);

  return (
    <div className="page-container">
      <GlobalStoreHeader />

      <form onSubmit={handleSave} className="form-card">
        {/* HEADER */}
        <div className="form-header">
          <h2>Add Category</h2>
          <p className="subtitle">Create and manage categories with cascading filters</p>
        </div>

        {/* GRID */}
        <div className="form-grid">
          {/* SECTOR TITLE */}
          <div className="inline-form-field" ref={titleRef} style={{ zIndex: showTitleList ? 100 : undefined }}>
            <label>Sector Title *</label>
            <div
              className="custom-select-trigger"
              onClick={() => setShowTitleList(!showTitleList)}
            >
              <span>
                {sectorstitle.find(st => String(st.id) === sectorTitleId)?.title || "Select Sector Title"}
              </span>
              <span>▼</span>
            </div>

            {showTitleList && (
              <div className="custom-select-options">
                <div className="dropdown-search-wrapper">
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
                <div className="dropdown-items-list">
                  {filteredTitleOptions.map(item => (
                    <div
                      key={item.id}
                      className="option-item"
                      onClick={() => {
                        setSectorTitleId(String(item.id));
                        useBusinessStore.getState().setBusiness(item.title);
                        setShowTitleList(false);
                        setTitleSearch("");
                      }}
                    >
                      {item.title}
                    </div>
                  ))}
                  {filteredTitleOptions.length === 0 && (
                    <div className="option-item empty">No Data Found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTOR */}
          <div className="inline-form-field" ref={sectorRef} style={{ zIndex: showSectorList ? 100 : undefined }}>
            <label>Sector *</label>
            <div
              className={`custom-select-trigger ${!sectorTitleId ? 'disabled' : ''}`}
              onClick={() => { if (sectorTitleId) setShowSectorList(!showSectorList) }}
            >
              <span>
                {!sectorTitleId
                  ? "Select Sector Title First"
                  : (filteredSectors.find(s => String(s.id) === sectorId)?.sector_name || "Select Sector")
                }
              </span>
              <span>▼</span>
            </div>

            {showSectorList && (
              <div className="custom-select-options">
                <div className="dropdown-search-wrapper">
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
                <div className="dropdown-items-list">
                  {filteredSectorOptions.map(item => (
                    <div
                      key={item.id}
                      className="option-item"
                      onClick={() => {
                        setSectorId(String(item.id));
                        useBusinessStore.getState().setBusiness(item.sector_name);
                        setShowSectorList(false);
                        setSectorSearch("");
                      }}
                    >
                      {item.sector_name}
                    </div>
                  ))}
                  {filteredSectorOptions.length === 0 && (
                    <div className="option-item empty">No Data Found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SUB SECTOR */}
          <div className="inline-form-field" ref={subRef} style={{ zIndex: showSubSectorList ? 100 : undefined }}>
            <label>Sub Sector *</label>
            <div
              className={`custom-select-trigger ${!sectorId ? 'disabled' : ''}`}
              onClick={() => { if (sectorId) setShowSubSectorList(!showSubSectorList) }}
            >
              <span>
                {!sectorId
                  ? "Select Sector First"
                  : (filteredSubSectors.find(ss => String(ss.id) === subSectorId)?.sub_sector_name || "Select Sub Sector")
                }
              </span>
              <span>▼</span>
            </div>

            {showSubSectorList && (
              <div className="custom-select-options">
                <div className="dropdown-search-wrapper">
                  <input
                    type="text"
                    className="dropdown-search-input"
                    placeholder="Search sub sector..."
                    value={subSearch}
                    onChange={(e) => setSubSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
                <div className="dropdown-items-list">
                  {filteredSubSectorOptions.map(item => (
                    <div
                      key={item.id}
                      className="option-item"
                      onClick={() => {
                        setSubSectorId(String(item.id));
                        useBusinessStore.getState().setBusiness(item.sub_sector_name || "N/A");
                        setShowSubSectorList(false);
                        setSubSearch("");
                      }}
                    >
                      {item.sub_sector_name || "N/A"}
                    </div>
                  ))}
                  {filteredSubSectorOptions.length === 0 && (
                    <div className="option-item empty">No Data Found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CATEGORY TYPE */}
          <div className="inline-form-field">
            <label>Category Type</label>
            <select
              value={categoryType}
              onChange={e => {
                setCategoryType(e.target.value as any);
                setParentCategoryId("");
              }}
            >
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>

          {/* CATEGORY NAME */}
          <div className="inline-form-field">
            <label>Category Name *</label>
            <input
              placeholder="Enter Category Name..."
              value={categoryName}
              onChange={e => {
                setCategoryName(e.target.value);
                useCategoryStore.getState().setCategory(e.target.value);
              }}
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div className="inline-form-field">
            <label>Description</label>
            <textarea
              placeholder="Enter Description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* PARENT CATEGORY */}
          {categoryType === "Secondary" && (
            <div className="inline-form-field" ref={parentRef} style={{ zIndex: showParentList ? 100 : undefined }}>
              <label>Parent Category *</label>
              <div
                className="custom-select-trigger"
                onClick={() => setShowParentList(!showParentList)}
              >
                <span>
                  {parentCategories.find(pc => String(pc.id) === parentCategoryId)?.category_name || "Select Parent Category"}
                </span>
                <span>▼</span>
              </div>

              {showParentList && (
                <div className="custom-select-options">
                  <div className="dropdown-search-wrapper">
                    <input
                      type="text"
                      className="dropdown-search-input"
                      placeholder="Search parent..."
                      value={parentSearch}
                      onChange={(e) => setParentSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  <div className="dropdown-items-list">
                    {filteredParentOptions.map(item => (
                      <div
                        key={item.id}
                        className="option-item"
                        onClick={() => {
                          setParentCategoryId(String(item.id));
                          setShowParentList(false);
                          setParentSearch("");
                        }}
                      >
                        {item.category_name}
                      </div>
                    ))}
                    {filteredParentOptions.length === 0 && (
                      <div className="option-item empty">No Data Found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* INFO */}
          <div className="inline-form-field">
            <label>Info</label>
            <textarea
              placeholder="Enter Info..."
              value={info}
              onChange={e => setInfo(e.target.value)}
            />
          </div>

          {/* NOTE */}
          <div className="inline-form-field">
            <label>Note</label>
            <textarea
              placeholder="Enter Note..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {/* SYSTEM NOTE */}
          <div className="inline-form-field">
            <label>System Note</label>
            <textarea
              placeholder="Enter System Note..."
              value={systemNote}
              onChange={e => setSystemNote(e.target.value)}
            />
          </div>

          {/* IMAGE UPLOAD SECTION */}
          <div className="product-image-section">
            <div className="image-status-flex">
              <div className="image-preview-box">
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" />
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => {
                        setImage(null);
                        setFilename(null);
                        setPreview(null);
                        const input = document.getElementById("categoryImage") as HTMLInputElement;
                        if (input) input.value = "";
                      }}
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="empty-placeholder" onClick={() => document.getElementById("categoryImage")?.click()} />
                )}
              </div>

              <div className="image-upload-controls">
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Category Image</label>
                <input
                  type="file"
                  id="categoryImage"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImage(file);
                    setFilename(file ? file.name : null);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    } else {
                      setPreview(null);
                    }
                  }}
                />
                <label htmlFor="categoryImage" className="upload-button-label">
                  <Upload size={18} /> {preview ? "Change Image" : "Upload Image"}
                </label>
                {filename && <span className="filename-display">{filename}</span>}
              </div>

              {/* STATUS */}
              <div className="inline-form-field status-section" style={{ marginLeft: "auto", minWidth: "150px" }}>
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={resetForm}>Reset</button>
          <button type="submit" className="btn primary">
            Save Category
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCategory;
