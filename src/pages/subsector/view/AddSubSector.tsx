import { useEffect, useState, useRef, useMemo } from "react";
import { Upload, X, ChevronDown } from "lucide-react";
import { getSectorTitles } from "../../../api/sectorTitle.api";
import { getSectors } from "../../../api/sectors.api";
import { createSubSubSector } from "../models/subSectors.api";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useBusinessStore } from "../../../store/useBusinessStore";
import "../../product/addproduct/AddProduct.css";
import "./addSubSector.css";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";

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

const AddSubSector = () => {
  /* ======================
     STATES
====================== */
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();
  const [sectorTitles, setSectorTitles] = useState<SectorTitle[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [filteredSectors, setFilteredSectors] = useState<Sector[]>([]);
  const [saving, setSaving] = useState(false);

  // Dropdown states
  const [showSectorTitleList, setShowSectorTitleList] = useState(false);
  const [showSectorList, setShowSectorList] = useState(false);
  const [titleSearch, setTitleSearch] = useState("");
  const [sectorSearch, setSectorSearch] = useState("");

  const sectorTitleRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    sectorTitleId: "",
    sectorId: "",
    subSectorName: "",
    description: "",
    info: "",
    note: "",
    systemNote: "",
    iconText: "",
    link: "",
    status: "active",
    image: null as File | null,
    banner: null as File | null,
    theme: null as File | null,
    iconFile: null as File | null,
  });

  const [previews, setPreviews] = useState({
    image: null as string | null,
    banner: null as string | null,
    theme: null as string | null,
    iconFile: null as string | null,
  });

  const [filename, setFilename] = useState<string | null>(null);

  /* ======================
     LOAD SECTOR TITLES
====================== */
  useEffect(() => {
    const loadFormData = async () => {
      showLoader("Loading form data, please wait...");
      try {
        const [titles, sectorsData] = await Promise.all([
          getSectorTitles(),
          getSectors(),
        ]);
        setSectorTitles(titles.map((t: any) => ({ id: t.id, title: t.title ?? t.name })));
        setSectors(sectorsData.map((s: any) => ({
          id: s.id,
          sector_title_id: s.sector_title_id,
          sector_name: s.sector_name ?? s.name,
        })));
      } catch (err) {
        console.error("Failed to load form data", err);
      } finally {
        hideLoader();
      }
    };
    loadFormData();
  }, []);

  /* ======================
     FILTER SECTORS
====================== */
  useEffect(() => {
    if (!form.sectorTitleId) {
      setFilteredSectors([]);
      return;
    }

    setFilteredSectors(
      sectors.filter(
        s => String(s.sector_title_id) === form.sectorTitleId
      )
    );
  }, [form.sectorTitleId, sectors]);

  /* ======================
     CLICK OUTSIDE HANDLER
====================== */
  useEffect(() => {
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
     HANDLERS
====================== */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFile = (name: string, file: File | null) => {
    setForm(prev => ({ ...prev, [name]: file }));
    if (name === "image") setFilename(file ? file.name : null);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews(prev => ({ ...prev, [name]: reader.result as string }));
      reader.readAsDataURL(file);
    } else {
      setPreviews(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleReset = () => {
    setForm({
      sectorTitleId: "",
      sectorId: "",
      subSectorName: "",
      description: "",
      info: "",
      note: "",
      systemNote: "",
      iconText: "",
      link: "",
      status: "active",
      image: null,
      banner: null,
      theme: null,
      iconFile: null,
    });
    setPreviews({
      image: null,
      banner: null,
      theme: null,
      iconFile: null,
    });
    setFilename(null);
    setFilteredSectors([]);
    setShowSectorTitleList(false);
    setShowSectorList(false);
    setTitleSearch("");
    setSectorSearch("");
  };

  /* ======================
     SUBMIT
====================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      showLoader("Creating subsector, please wait...");

      await createSubSubSector({
        sector_title_id: form.sectorTitleId,
        sector_id: form.sectorId,
        sub_sector_name: form.subSectorName,
        description: form.description,
        info: form.info,
        note: form.note,
        system_note: form.systemNote,
        icon_text: form.iconText,
        link: form.link,
        status: form.status,
        image: form.image,
        banner: form.banner,
        theme: form.theme,
        icon_file: form.iconFile,
      });

      showSuccess("Subsector has been created successfully.", "Saved Successfully!");
      handleReset();
    } catch (err: any) {
      alert(err.message || "Create failed");
    } finally {
      setSaving(false);
      hideLoader();
    }
  };

  /* ======================
     FILTERED DROPDOWN LISTS (A-Z)
====================== */
  const useMemoFilteredTitles = useMemo(() => {
    const unique = new Map<string, SectorTitle>();
    for (const t of sectorTitles) {
      if (t.title.toLowerCase().startsWith(titleSearch.toLowerCase()) && !unique.has(t.title.toLowerCase())) {
        unique.set(t.title.toLowerCase(), t);
      }
    }
    return Array.from(unique.values()).sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
  }, [sectorTitles, titleSearch]);

  const useMemoFilteredSectors = useMemo(() => {
    const unique = new Map<string, Sector>();
    for (const s of filteredSectors) {
      if (s.sector_name.toLowerCase().startsWith(sectorSearch.toLowerCase()) && !unique.has(s.sector_name.toLowerCase())) {
        unique.set(s.sector_name.toLowerCase(), s);
      }
    }
    return Array.from(unique.values()).sort((a, b) => a.sector_name.localeCompare(b.sector_name, undefined, { sensitivity: 'base' }));
  }, [filteredSectors, sectorSearch]);

  return (
    <div className="page-container">
      <GlobalStoreHeader />

      <form onSubmit={handleSubmit} className="form-card">

        {/* HEADER */}
        <div className="form-header">
          <h2>Add SubSector</h2>
          <p className="subtitle">Create and manage subsectors</p>
        </div>

        {/* GRID */}
        <div className="form-grid">

          <div className={`inline-form-field ${showSectorTitleList ? 'active' : ''}`} ref={sectorTitleRef}>
            <label>Sector Title *</label>
            <div
              className="custom-select-trigger"
              onClick={() => setShowSectorTitleList(prev => !prev)}
            >
              <span>
                {sectorTitles.find(t => String(t.id) === form.sectorTitleId)?.title || "Select Sector Title"}
              </span>
              <ChevronDown size={14} />
            </div>

            {showSectorTitleList && (
              <div className="custom-select-options">
                <div className="dropdown-search-wrapper">
                  <input
                    type="text"
                    className="dropdown-search-input"
                    placeholder="Search title..."
                    value={titleSearch}
                    onChange={(e) => setTitleSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="dropdown-items-list">
                  {useMemoFilteredTitles.map(item => (
                    <div
                      key={item.id}
                      className="option-item"
                      onClick={() => {
                        setForm(prev => ({ ...prev, sectorTitleId: String(item.id), sectorId: "" }));
                        useBusinessStore.getState().setBusiness(item.title);
                        setShowSectorTitleList(false);
                        setTitleSearch("");
                      }}
                    >
                      {item.title}
                    </div>
                  ))}
                  {useMemoFilteredTitles.length === 0 && (
                    <div className="option-item empty">No Data Found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={`inline-form-field ${showSectorList ? 'active' : ''}`} ref={sectorRef}>
            <label>Sector *</label>
            <div
              className={`custom-select-trigger ${!form.sectorTitleId ? 'disabled' : ''}`}
              onClick={() => {
                if (form.sectorTitleId) setShowSectorList(prev => !prev);
              }}
              style={{ opacity: !form.sectorTitleId ? 0.6 : 1, cursor: !form.sectorTitleId ? 'not-allowed' : 'pointer' }}
            >
              <span>
                {filteredSectors.find(s => String(s.id) === form.sectorId)?.sector_name || "Select Sector"}
              </span>
              <ChevronDown size={14} />
            </div>

            {showSectorList && (
              <div className="custom-select-options">
                <div className="dropdown-search-wrapper">
                  <input
                    type="text"
                    className="dropdown-search-input"
                    placeholder="Search SubSector..."
                    value={sectorSearch}
                    onChange={(e) => setSectorSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="dropdown-items-list">
                  {useMemoFilteredSectors.map(item => (
                    <div
                      key={item.id}
                      className="option-item"
                      onClick={() => {
                        setForm(prev => ({ ...prev, sectorId: String(item.id) }));
                        useBusinessStore.getState().setBusiness(item.sector_name);
                        setShowSectorList(false);
                        setSectorSearch("");
                      }}
                    >
                      {item.sector_name}
                    </div>
                  ))}
                  {useMemoFilteredSectors.length === 0 && (
                    <div className="option-item empty">No Data Found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="inline-form-field">
            <label>SubSector Name *</label>
            <input
              name="subSectorName"
              placeholder="Enter SubSector Name..."
              value={form.subSectorName}
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
              name="systemNote"
              placeholder="Enter System Note..."
              value={form.systemNote}
              onChange={handleChange}
            />
          </div>

          <div className="product-image-section">
            <div className="image-status-flex">
              <div className="image-preview-box">
                {previews.image ? (
                  <>
                    <img src={previews.image} alt="Preview" />
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleFile("image", null)}
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="empty-placeholder" onClick={() => document.getElementById("subSectorImage")?.click()} />
                )}
              </div>

              <div className="image-upload-controls">
                <label style={{ fontSize: '14px', fontWeight: '600' }}>SubSector Image</label>
                <input
                  type="file"
                  id="subSectorImage"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleFile("image", e.target.files?.[0] || null)}
                />
                <label htmlFor="subSectorImage" className="upload-button-label">
                  <Upload size={18} /> {previews.image ? "Change Image" : "Upload Image"}
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

        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={handleReset}>Reset</button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddSubSector;
