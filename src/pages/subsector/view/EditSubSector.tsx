import { useEffect, useState, useRef, useMemo } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import { Upload, X, ChevronDown } from "lucide-react";
import "../../product/addproduct/AddProduct.css";
import "./addSubSector.css"; // Reuse styles from add page
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";

import { updateSubSubSector, getSubSubSectorById } from "../models/subSectors.api";
import { getSectorTitles } from "../../../api/sectorTitle.api";
import { getSectors } from "../../../api/sectors.api";

/* ======================
   TYPES
====================== */
type SectorTitle = {
  id: number;
  title: string;
};

type Sector = {
  id: number;
  sector_title_id: number;
  sector_name: string;
};

const EditSubSector = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") || "1";
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();

  const [row, setRow] = useState<any>(location.state || null);
  const [saving, setSaving] = useState(false);

  // Lists for dropdowns
  const [sectorTitles, setSectorTitles] = useState<SectorTitle[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [filteredSectors, setFilteredSectors] = useState<Sector[]>([]);

  // Dropdown UI states
  const [showSectorTitleList, setShowSectorTitleList] = useState(false);
  const [showSectorList, setShowSectorList] = useState(false);
  const [titleSearch, setTitleSearch] = useState("");
  const [sectorSearch, setSectorSearch] = useState("");

  const sectorTitleRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    sector_title_id: "",
    sector_id: "",
    sub_sector_name: "",
    description: "",
    info: "",
    note: "",
    system_note: "",
    status: "active",
    image: null as File | null,
    link: "",
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  /* ======================
     LOAD INITIAL DATA
  ====================== */
  useEffect(() => {
    const loadDropdownData = async () => {
      showLoader("Loading edit form data...");
      try {
        const [titlesData, sectorsData] = await Promise.all([
          getSectorTitles(),
          getSectors(),
        ]);
        setSectorTitles(titlesData.map((t: any) => ({ id: t.id, title: t.title ?? t.name })));
        setSectors(sectorsData.map((s: any) => ({
          id: s.id,
          sector_title_id: s.sector_title_id,
          sector_name: s.sector_name ?? s.name,
        })));
      } catch (err) {
        console.error("Failed to load dropdown data", err);
      } finally {
        hideLoader();
      }
    };
    loadDropdownData();

    // Click outside to close dropdowns
    const handleClickOutside = (event: MouseEvent) => {
      if (sectorTitleRef.current && !sectorTitleRef.current.contains(event.target as Node)) {
        setShowSectorTitleList(false);
        setTitleSearch("");
      }
      if (sectorRef.current && !sectorRef.current.contains(event.target as Node)) {
        setShowSectorList(false);
        setSectorSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ======================
     FETCH RECORD IF MISSING
  ====================== */
  useEffect(() => {
    const loadRecord = async () => {
      if (!row && id) {
        showLoader("Loading subsector data...");
        try {
          const data = await getSubSubSectorById(id);
          setRow(data);
        } catch (err) {
          console.error("Failed to load subsector", err);
          alert("Could not load subsector data");
          navigate(`/subsector?page=${page}`);
        } finally {
          hideLoader();
        }
      }
    };
    loadRecord();
  }, [id, row, navigate, page]);

  /* ======================
     PREFILL FORM
  ====================== */
  useEffect(() => {
    if (!row || sectors.length === 0) return;

    let derivedTitleId = String(row.sector_title_id ?? "");

    // If title ID is missing, try to find it via sector_id mapping
    if (!derivedTitleId && row.sector_id) {
      const parentSector = sectors.find(s => String(s.id) === String(row.sector_id));
      if (parentSector) {
        derivedTitleId = String(parentSector.sector_title_id);
      }
    }

    setForm({
      sector_title_id: derivedTitleId,
      sector_id: String(row.sector_id ?? ""),
      sub_sector_name: row.sub_sector_name ?? "",
      description: row.description ?? "",
      info: row.info ?? "",
      note: row.note ?? "",
      system_note: row.system_note ?? "",
      status: row.status ?? "active",
      image: null,
      link: row.link ?? "",
    });

    if (row.image) {
      setPreview(`${IMAGE_BASE_URL}/${row.image}`);
    }
  }, [row, sectors]);

  /* ======================
     CASCADE FILTERING
  ====================== */
  useEffect(() => {
    if (!form.sector_title_id) {
      setFilteredSectors([]);
      return;
    }
    setFilteredSectors(
      sectors.filter(s => String(s.sector_title_id) === form.sector_title_id)
    );
  }, [form.sector_title_id, sectors]);

  /* ======================
     HANDLERS
  ====================== */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFile = (file: File | null) => {
    setForm(prev => ({ ...prev, image: file }));
    setFilename(file ? file.name : null);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(row?.image ? `${IMAGE_BASE_URL}/${row.image}` : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      showLoader("Updating subsector...");
      await updateSubSubSector(Number(id), form as any);
      showSuccess("Subsector has been updated.", "Successfully Updated!");
      navigate(`/subsector?page=${page}`);
    } catch (err: any) {
      alert(err.message || "Update failed");
    } finally {
      setSaving(false);
      hideLoader();
    }
  };

  /* ======================
     MEMOIZED LISTS (A-Z)
  ====================== */
  const filteredTitles = useMemo(() => {
    return sectorTitles
      .filter(t => t.title.toLowerCase().startsWith(titleSearch.toLowerCase()))
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
  }, [sectorTitles, titleSearch]);

  const filteredSectorDropdown = useMemo(() => {
    return filteredSectors
      .filter(s => s.sector_name.toLowerCase().startsWith(sectorSearch.toLowerCase()))
      .sort((a, b) => a.sector_name.localeCompare(b.sector_name, undefined, { sensitivity: 'base' }));
  }, [filteredSectors, sectorSearch]);

  return (
    <div className="page-container">
      <form className="form-card" onSubmit={handleSubmit}>
        {/* HEADER */}
        <div className="form-header">
          <h2>Edit SubSector</h2>
          <p className="subtitle">Update subsector details</p>
        </div>

        {/* GRID */}
        <div className="form-grid">

          {/* SECTOR TITLE DROPDOWN */}
          <div className={`inline-form-field ${showSectorTitleList ? 'active' : ''}`} ref={sectorTitleRef}>
            <label>Sector Title *</label>
            <div
              className="custom-select-trigger"
              onClick={() => setShowSectorTitleList(prev => !prev)}
            >
              <span>
                {sectorTitles.find(t => String(t.id) === form.sector_title_id)?.title || "Select Sector Title"}
              </span>
              <ChevronDown size={14} />
            </div>

            {showSectorTitleList && (
              <div className="custom-select-options">
                <div className="dropdown-search-wrapper">
                  <input
                    className="dropdown-search-input"
                    placeholder="SEARCH TITLE..."
                    value={titleSearch}
                    onChange={(e) => setTitleSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="dropdown-items-list">
                  {filteredTitles.map(item => (
                    <div
                      key={item.id}
                      className="option-item"
                      onClick={() => {
                        setForm(prev => ({ ...prev, sector_title_id: String(item.id), sector_id: "" }));
                        setShowSectorTitleList(false);
                        setTitleSearch("");
                      }}
                    >
                      {item.title}
                    </div>
                  ))}
                  {filteredTitles.length === 0 && <div className="option-item empty">No Data Found</div>}
                </div>
              </div>
            )}
          </div>

          {/* SECTOR DROPDOWN */}
          <div className={`inline-form-field ${showSectorList ? 'active' : ''}`} ref={sectorRef}>
            <label>Sector *</label>
            <div
              className="custom-select-trigger"
              onClick={() => { if (form.sector_title_id) setShowSectorList(prev => !prev); }}
              style={{ opacity: !form.sector_title_id ? 0.6 : 1, cursor: !form.sector_title_id ? 'not-allowed' : 'pointer' }}
            >
              <span>
                {sectors.find(s => String(s.id) === form.sector_id)?.sector_name || "Select Sector"}
              </span>
              <ChevronDown size={14} />
            </div>

            {showSectorList && (
              <div className="custom-select-options">
                <div className="dropdown-search-wrapper">
                  <input
                    className="dropdown-search-input"
                    placeholder="SEARCH SECTOR..."
                    value={sectorSearch}
                    onChange={(e) => setSectorSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="dropdown-items-list">
                  {filteredSectorDropdown.map(item => (
                    <div
                      key={item.id}
                      className="option-item"
                      onClick={() => {
                        setForm(prev => ({ ...prev, sector_id: String(item.id) }));
                        setShowSectorList(false);
                        setSectorSearch("");
                      }}
                    >
                      {item.sector_name}
                    </div>
                  ))}
                  {filteredSectorDropdown.length === 0 && <div className="option-item empty">No Data Found</div>}
                </div>
              </div>
            )}
          </div>

          <div className="inline-form-field">
            <label>SubSector Name *</label>
            <input
              name="sub_sector_name"
              placeholder="Enter SubSector Name..."
              value={form.sub_sector_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="inline-form-field">
            <label>Link</label>
            <input
              name="link"
              placeholder="Enter Link (https://example.com)..."
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
              name="system_note"
              placeholder="Enter System Note..."
              value={form.system_note}
              onChange={handleChange}
            />
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
                      onClick={() => handleFile(null)}
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="empty-placeholder" onClick={() => document.getElementById("subSectorImageEdit")?.click()} />
                )}
              </div>

              <div className="image-upload-controls">
                <label style={{ fontSize: '14px', fontWeight: '600' }}>SubSector Image</label>
                <input
                  type="file"
                  id="subSectorImageEdit"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="subSectorImageEdit" className="upload-button-label">
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
            onClick={() => navigate(`/subsector?page=${page}`)}
          >
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Updating..." : "Update SubSector"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSubSector;
