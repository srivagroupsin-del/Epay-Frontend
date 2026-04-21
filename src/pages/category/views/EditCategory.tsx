import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import { Upload, ArrowLeft, X } from "lucide-react";
import "../../product/addproduct/AddProduct.css";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useBusinessStore } from "../../../store/useBusinessStore";
import { useCategoryStore } from "../../../store/useCategoryStore";


import { type CategoryRow, getCategoryById } from "../models/category.api";

import { http } from "../../../base_api/base_api";
import {
  getSubSubSectors,
  type SubSectorRow,
} from "../../subsector/models/subSectors.api";
import { getSectorTitles, type SectorTitle } from "../../../api/sectorTitle.api";
import "./addCategory.css";

/* =========================
   TYPES
========================= */
type Sector = {
  id: number;
  sector_name: string;
  sector_title_id?: number | string;
};

const EditCategory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") || "1";

  const { id } = useParams();
  const [category, setCategory] = useState<CategoryRow | null>(location.state as CategoryRow || null);


  /* =========================
     STATE
  ========================= */
  const [sectorstitle, setSectorstitle] = useState<SectorTitle[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [subSectors, setSubSectors] = useState<SubSectorRow[]>([]);

  const [sectorTitleId, setSectorTitleId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [subSectorId, setSubSectorId] = useState("");
  const [categoryType, setCategoryType] = useState<"Primary" | "Secondary">("Primary");
  const [parentCategoryId, setParentCategoryId] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [info, setInfo] = useState("");
  const [note, setNote] = useState("");
  const [systemNote, setSystemNote] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [parentCategories, setParentCategories] = useState<CategoryRow[]>([]);




  const formRef = useRef<HTMLFormElement>(null);

  /* =========================
     GUARD
  ========================= */
  useEffect(() => {
    const loadCategory = async () => {
      if (!category && id) {
        showLoader("Loading category data...");
        try {
          const data = await getCategoryById(id);
          setCategory(data);
        } catch (err) {
          console.error("Failed to load category", err);
          alert("Could not load category data");
          navigate(`/categories?page=${page}`);
        } finally {
          hideLoader();
        }
      }
    };
    loadCategory();
  }, [id, category, navigate, page]);

  useEffect(() => {
    if (!category && !id) {
      alert("No category data found");
      navigate(`/categories?page=${page}`);
    }
  }, [category, id, navigate, page]);



  /* =========================
     PREFILL OLD DATA
  ========================= */
  useEffect(() => {
    if (!category) return;

    setSectorTitleId(String(category.sector_title_id));
    setSectorId(String(category.sector_id));
    setSubSectorId(category.sub_sector_id ? String(category.sub_sector_id) : "");
    setCategoryType(category.category_type === "primary" ? "Primary" : "Secondary");
    setParentCategoryId(category.parent_category_id ? String(category.parent_category_id) : "");
    setCategoryName(category.category_name);
    setDescription(category.description ?? "");
    setInfo(category.info ?? "");
    setNote(category.note ?? "");
    setSystemNote(category.system_note ?? "");
    setStatus(category.status === "active" ? "Active" : "Inactive");
    setPreview(category.image ? `${IMAGE_BASE_URL}/${category.image}` : null);
  }, [category]);

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    const loadFormData = async () => {
      showLoader("Loading form data...");
      try {
        const [titlesData, sectorsJson] = await Promise.all([
          getSectorTitles(),
          http("/sectors"),
        ]);
        setSectorstitle(titlesData);
        setSectors(sectorsJson.data ?? sectorsJson);
      } catch (e) {
        console.error("Failed to load form data", e);
      } finally {
        hideLoader();
      }
    };
    loadFormData();
  }, []);

  useEffect(() => {
    const loadSubSectors = async () => {
      if (!sectorId) {
        setSubSectors([]);
        return;
      }
      try {
        const all = await getSubSubSectors();
        setSubSectors(all.filter(ss => String(ss.sector_id) === String(sectorId)));
      } catch (e) {
        console.error(e);
      }
    };
    loadSubSectors();
  }, [sectorId]);

  useEffect(() => {
    const loadParentCategories = async () => {
      if (categoryType !== "Secondary" || !subSectorId) {
        setParentCategories([]);
        return;
      }
      try {
        const json = await http("/categories");
        const data = json.data ?? json;
        const primaryOnly = data.filter(
          (c: CategoryRow) =>
            c.category_type?.toLowerCase() === "primary" && String(c.sub_sector_id) === String(subSectorId)
        );
        setParentCategories(primaryOnly);
      } catch (err) {
        console.error("Failed to load parent categories", err);
      }
    };
    loadParentCategories();
  }, [categoryType, subSectorId]);

  /* =========================
     UPDATE
  ========================= */
  const handleUpdate = async () => {
    if (!sectorTitleId || !sectorId || !categoryName) {
      alert("Required fields missing");
      return;
    }

    if (categoryType === "Secondary" && !parentCategoryId) {
      alert("Parent Category required");
      return;
    }

    const formData = new FormData();
    formData.append("sector_title_id", sectorTitleId);
    formData.append("sector_id", sectorId);
    formData.append("category_type", categoryType.toLowerCase());
    formData.append("category_name", categoryName);
    formData.append("status", status.toLowerCase());
    formData.append("description", description || "");
    formData.append("info", info || "");
    formData.append("note", note || "");
    formData.append("system_note", systemNote || "");
    formData.append("is_enabled", status.toLowerCase() === "active" ? "1" : "0");
    formData.append("is_active", status.toLowerCase() === "active" ? "1" : "0");

    if (subSectorId) {
      formData.append("sub_sector_id", subSectorId);
    }
    if (categoryType === "Secondary") {
      formData.append("parent_category_id", parentCategoryId);
    }
    if (image) {
      formData.append("image", image);
    }

    try {
      showLoader("Updating category...");
      await http(`/categories/${category?.id}`, {
        method: "PUT",
        body: formData,
      });
      showSuccess("Category has been updated.", "Successfully Updated!");
      navigate(`/categories?page=${page}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Update failed");
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="page-container">
      <GlobalStoreHeader />

      <form className="form-card" ref={formRef} onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
        <div className="form-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" className="btn-back" onClick={() => navigate(`/categories?page=${page}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <ArrowLeft size={20} />
            </button>
            <h2>Edit Category</h2>
          </div>

          <p className="subtitle">Update existing category configurations</p>
        </div>

        <div className="form-grid">
          {/* SECTOR TITLE */}
          <div className="inline-form-field">
            <label>Sector Title *</label>
            <select
              value={sectorTitleId}
              onChange={(e) => {
                const val = e.target.value;
                setSectorTitleId(val);
                const label = sectorstitle.find(st => String(st.id) === val)?.title;
                if (label) useBusinessStore.getState().setBusiness(label);
                setSectorId(""); // Reset children
                setSubSectorId("");
              }}
              required
            >
              <option value="">Select Sector Title</option>
              {sectorstitle?.length > 0 && sectorstitle.map((st) => (
                <option key={st.id} value={st.id}>{st.title}</option>
              ))}
            </select>
          </div>

          {/* SECTOR - Cascading */}
          <div className="inline-form-field">
            <label>Sector *</label>
            <select
              value={sectorId}
              onChange={(e) => {
                const val = e.target.value;
                setSectorId(val);
                const label = sectors.find(s => String(s.id) === val)?.sector_name;
                if (label) useBusinessStore.getState().setBusiness(label);
                setSubSectorId(""); // Reset child
              }}
              required
              disabled={!sectorTitleId}
            >
              <option value="">Select Sector</option>
              {sectors
                .filter(s => !sectorTitleId || String(s.sector_title_id) === sectorTitleId)
                .map(s => (
                <option key={s.id} value={s.id}>{s.sector_name}</option>
              ))}
            </select>
          </div>

          {/* SUB SECTOR - Cascading */}
          <div className="inline-form-field">
            <label>Sub Sector</label>
            <select
              value={subSectorId}
              onChange={(e) => {
                const val = e.target.value;
                setSubSectorId(val);
                const label = subSectors.find(ss => String(ss.id) === val)?.sub_sector_name;
                if (label) useBusinessStore.getState().setBusiness(label);
              }}
              disabled={!sectorId}
            >
              <option value="">Select Sub Sector</option>
              {subSectors
                .filter(ss => !sectorId || String(ss.sector_id) === sectorId)
                .map(ss => (
                <option key={ss.id} value={ss.id}>{ss.sub_sector_name || "N/A"}</option>
              ))}
            </select>
          </div>

          <div className="inline-form-field">
            <label>Category Type</label>
            <select value={categoryType} onChange={e => {
              const value = e.target.value as "Primary" | "Secondary";
              setCategoryType(value);
              if (value === "Primary") setParentCategoryId("");
            }}>
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>

          {categoryType === "Secondary" && (
            <div className="inline-form-field">
              <label>Parent Category *</label>
              <select
                value={parentCategoryId}
                onChange={(e) => {
                  const val = e.target.value;
                  setParentCategoryId(val);
                  const label = parentCategories.find(pc => String(pc.id) === val)?.category_name;
                  if (label) useCategoryStore.getState().setCategory(label);
                }}
                required
              >
                <option value="">Select Parent Category</option>
                {parentCategories?.length > 0 && parentCategories.map(pc => (
                  <option key={pc.id} value={pc.id}>{pc.category_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="inline-form-field">
            <label>Category Name *</label>
            <input value={categoryName} onChange={e => {
              setCategoryName(e.target.value);
              useCategoryStore.getState().setCategory(e.target.value);
            }} />

          </div>

          <div className="inline-form-field">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="inline-form-field">
            <label>Info</label>
            <textarea value={info} onChange={e => setInfo(e.target.value)} />
          </div>
          <div className="inline-form-field">
            <label>Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="inline-form-field">
            <label>System Note</label>
            <textarea value={systemNote} onChange={e => setSystemNote(e.target.value)} />
          </div>

          {/* Image Upload Section */}
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
                {image && <span className="filename-display">{image.name}</span>}
              </div>

              <div className="inline-form-field status-section" style={{ marginLeft: "auto", minWidth: "150px" }}>
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn cancel" onClick={() => navigate(`/categories?page=${page}`)}>Cancel</button>
          <button type="submit" className="btn primary">Update</button>
        </div>

      </form>
    </div>
  );
};

export default EditCategory;
