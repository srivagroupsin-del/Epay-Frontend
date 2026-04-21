import { useEffect, useState, useMemo } from "react";
import { Upload, Image as ImageIcon, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./addSector.css";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useBusinessStore } from "../../../store/useBusinessStore";


/* ================= API ================= */
import {
  getSectorTitles,
  type SectorTitle,
} from "../../../api/sectorTitle.api";
import { createSector } from "../../../api/sectors.api";

const AddSector = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();

  /* ================= STATES ================= */
  const [sectorTitles, setSectorTitles] = useState<SectorTitle[]>([]);
  const [showTitleList, setShowTitleList] = useState(false);
  const [titleSearch, setTitleSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sectorTitleId: "",
    sectorName: "",
    description: "",
    info: "",
    note: "",
    systemNote: "",
    iconText: "",
    link: "",
    status: "active",
    image: null as File | null,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  /* ================= FETCH TITLES ================= */
  useEffect(() => {
    const loadTitles = async () => {
      showLoader("Loading form data, please wait...");
      try {
        const titles = await getSectorTitles();
        setSectorTitles(titles);
      } catch (err) {
        console.error("Failed to load sector titles", err);
      } finally {
        hideLoader();
      }
    };
    loadTitles();

    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".inline-form-field")) {
        setShowTitleList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= HANDLERS ================= */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (name: string, file: File | null) => {
    setForm((prev) => ({ ...prev, [name]: file }));
    if (name === "image") {
      if (file) {
        setFilename(file.name);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
        setFilename(null);
      }
    }
  };

  const handleReset = () => {
    setForm({
      sectorTitleId: "",
      sectorName: "",
      description: "",
      info: "",
      note: "",
      systemNote: "",
      iconText: "",
      link: "",
      status: "active",
      image: null,
    });
    setPreview(null);
    setFilename(null);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.sectorTitleId || !form.sectorName) {
      alert("Sector Title and Sector Name are required");
      return;
    }

    try {
      setSaving(true);
      showLoader("Creating sector, please wait...");
      await createSector(form);
      showSuccess("Sector has been saved successfully.", "Saved Successfully!");
      navigate(`/sector?sectorTitleId=${form.sectorTitleId}`);
      handleReset();
    } catch (err: any) {
      alert(err.message || "Failed to create sector");
    } finally {
      setSaving(false);
      hideLoader();
    }
  };

  /* ================= FILTERED TITLES ================= */
  const filteredTitles = useMemo(() => {
    let result = sectorTitles.filter((t) =>
      t.title.toLowerCase().startsWith(titleSearch.toLowerCase())
    );

    // Deduplicate by title
    const unique = new Map();
    for (const item of result) {
      if (!unique.has(item.title.toLowerCase())) {
        unique.set(item.title.toLowerCase(), item);
      }
    }
    result = Array.from(unique.values());

    // Sort Alphabetically
    result.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

    return result;
  }, [sectorTitles, titleSearch]);

  return (
    <div className="page-container">
      <GlobalStoreHeader />

      <form onSubmit={handleSubmit} className="form-card">
        {/* HEADER */}
        <div className="page-header">
          <div>
            <h2>Add Sector</h2>
            <p className="subtitle">Configure and map a new sector item</p>
          </div>
          <a
            href="/sector-titles/add"
            className="btn primary"
            style={{ textDecoration: "none" }}
          >
            View Sector Titles
          </a>
        </div>

        {/* FORM GRID */}
        <div className="form-grid">
          {/* ===== Sector Title Select (Floating) ===== */}
          <div className={`inline-form-field ${showTitleList ? 'active' : ''}`}>
            <label>Sector Title</label>

            <div
              className="custom-select-trigger"
              onClick={() => setShowTitleList((prev) => !prev)}
            >
              <span>
                {sectorTitles.find((t) => String(t.id) === form.sectorTitleId)
                  ?.title || "Select Sector Title"}
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
                  />
                </div>
                <div className="dropdown-items-list">
                  {filteredTitles.map((item) => (
                    <div
                      key={item.id}
                      className="option-item"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          sectorTitleId: String(item.id),
                        }));
                        useBusinessStore.getState().setBusiness(item.title);
                        setShowTitleList(false);
                        setTitleSearch("");
                      }}

                    >
                      {item.title}
                    </div>
                  ))}
                  {filteredTitles.length === 0 && (
                    <div className="option-item empty">No results</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ===== Sector Name (Floating) ===== */}
          <div className="inline-form-field">
            <label>Sector Name</label>
            <input
              name="sectorName"
              placeholder="Enter Sector Name..."
              value={form.sectorName}
              onChange={handleChange}
              required
            />
          </div>

          {/* ===== Link (Floating) ===== */}
          <div className="inline-form-field">
            <label>Link</label>
            <input
              name="link"
              placeholder="Enter Link (https://example.com)..."
              value={form.link}
              onChange={handleChange}
            />
          </div>

          {/* ===== Status (Floating) ===== */}
          <div className="inline-form-field">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* ===== Description (Floating) ===== */}
          <div className="inline-form-field full">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Enter Description..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          {/* ===== Image Section ===== */}
          <div className="image-section">
            <label>Image</label>
            <div className="file-input-wrapper-inline">
              <input
                type="file"
                id="sectorImage"
                hidden
                onChange={(e) =>
                  handleFile("image", e.target.files?.[0] || null)
                }
              />

              <div
                className="image-preview-container-compact"
                style={{ cursor: "pointer" }}
                onClick={() => document.getElementById("sectorImage")?.click()}
                title={preview ? "Change image" : "Upload image"}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" />
                    <div className="edit-overlay">
                      <Edit size={16} />
                      <span>Change</span>
                    </div>
                  </>
                ) : (
                  <div className="empty-placeholder">
                    <ImageIcon size={32} strokeWidth={1.5} />
                  </div>
                )}
              </div>

              <div className="file-upload-section">
                <label htmlFor="sectorImage" className="btn-upload-file">
                  <Upload size={16} /> {preview ? "Change File" : "Choose File"}
                </label>
                {filename && (
                  <span className="filename-display">{filename}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="form-actions">
          <button type="button" className="btn danger" onClick={handleReset}>
            Reset
          </button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSector;
