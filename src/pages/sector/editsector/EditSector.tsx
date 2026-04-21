import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams, useParams } from "react-router-dom";
import axios from "axios";
import { IMAGE_BASE_URL, BASE_URL } from "../../../base_api/api_list";
import { Upload, Image as ImageIcon, Edit } from "lucide-react";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";

import { getSectorTitles, type SectorTitle } from "../../../api/sectorTitle.api";
import { updateSector } from "../../../api/sectors.api";
import "../addsector/addSector.css";

const EditSector = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") || "1";

  const { id } = useParams();
  const [sector, setSector] = useState<any>(location.state || null);

  const [sectorTitles, setSectorTitles] = useState<SectorTitle[]>([]);
  const [showTitleList, setShowTitleList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    sectorTitleId: "",
    sectorName: "",
    description: "",
    info: "",
    note: "",
    systemNote: "",
    link: "",
    status: "active",
    image: null as File | null,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);


  useEffect(() => {
    const loadTitles = async () => {
      try {
        const titles = await getSectorTitles();
        setSectorTitles(titles);
      } catch (err) {
        console.error("Failed to load sector titles", err);
      }
    };
    loadTitles();
  }, []);

  useEffect(() => {
    const loadSector = async () => {
      if (id) {
        setLoading(true);
        showLoader("Loading sector data...");
        try {
          const token = localStorage.getItem("token");
          const headers = {
            Authorization: token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : ""
          };

          // Requirement 7: axios.get(`/api/sectors/${id}`)
          // We use BASE_URL which includes the domain and /api/
          const apiUrl = `${BASE_URL.replace(/\/$/, "")}/sectors/${id}`;

          try {
            const response = await axios.get(apiUrl, { headers });
            const data = response.data.data || response.data;
            setSector(data);
            setError(null);
          } catch (directErr: any) {
            console.warn("Direct fetch by ID failed, trying fallback to list...", directErr);

            // Fallback: Fetch all sectors and find the one with matching ID
            // This is confirmed to work in other modules like Categories
            const listUrl = `${BASE_URL.replace(/\/$/, "")}/sectors`;
            const listResponse = await axios.get(listUrl, { headers });
            const allSectors = listResponse.data.data || listResponse.data || [];

            const matchedSector = allSectors.find((s: any) => String(s.id) === String(id));
            if (matchedSector) {
              setSector(matchedSector);
              setForm({
                sectorTitleId: String(matchedSector.sector_title_id ?? ""),
                sectorName: matchedSector.sector_name ?? matchedSector.name ?? "",
                description: matchedSector.description ?? "",
                info: matchedSector.info ?? "",
                note: matchedSector.note ?? "",
                systemNote: matchedSector.system_note ?? "",
                link: matchedSector.link ?? "",
                status: matchedSector.status ?? "active",
                image: null,
              });
              if (matchedSector.image) {
                setPreview(`${IMAGE_BASE_URL}/${matchedSector.image}`);
                setFilename(matchedSector.image);
              }
              setError(null);
            } else {
              throw new Error("Sector not found in list");
            }
          }
        } catch (err: any) {
          console.error("Failed to load sector", err);
          setError("Could not load sector data. Please check the API.");
        } finally {
          setLoading(false);
          hideLoader();
        }
      }
    };
    loadSector();
  }, [id]);

  useEffect(() => {
    if (!sector) return;

    setForm({
      sectorTitleId: String(sector.sector_title_id ?? ""),
      sectorName: sector.sector_name ?? sector.name ?? "",
      description: sector.description ?? "",
      info: sector.info ?? "",
      note: sector.note ?? "",
      systemNote: sector.system_note ?? "",
      link: sector.link ?? "",
      status: sector.status ?? "active",
      image: null,
    });

    if (sector.image) {
      setPreview(`${IMAGE_BASE_URL}/${sector.image}`);
      setFilename(sector.image);
    }
  }, [sector]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFile = (name: string, file: File | null) => {
    setForm(prev => ({ ...prev, [name]: file }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sectorTitleId || !form.sectorName) {
      alert("Sector Title and Sector Name are required");
      return;
    }

    try {
      setSaving(true);
      showLoader("Updating sector...");
      await updateSector(sector.id, form);
      showSuccess("Sector has been updated.", "Successfully Updated!");
      navigate(`/sector?page=${page}`);
    } catch (err: any) {
      alert(err.message || "Update failed ❌");
    } finally {
      setSaving(false);
      hideLoader();
    }
  };

  if (loading) return null;

  if (error) return (
    <div className="page-container">
      <div className="form-card" style={{ textAlign: "center", padding: "50px" }}>
        <h3 style={{ color: "red" }}>{error}</h3>
        <button className="btn primary" onClick={() => navigate(`/sector?page=${page}`)}>
          Back to List
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <form onSubmit={handleSubmit} className="form-card">
        {/* HEADER */}
        <div className="page-header">
          <div>
            <h2>Edit Sector</h2>
            <p className="subtitle">Update existing sector configuration</p>
          </div>
          <button
            type="button"
            className="btn ghost"
            onClick={() => navigate(`/sector?page=${page}`)}
          >
            Back to List
          </button>
        </div>

        {/* FORM GRID */}
        <div className="form-grid">
          {/* ===== Sector Title Select (Floating) ===== */}
          <div className={`inline-form-field ${showTitleList ? 'active' : ''}`}>
            <label>Sector Title</label>
            <div
              className="custom-select-trigger"
              onClick={() => setShowTitleList(prev => !prev)}
            >
              <span>
                {sectorTitles.find(t => String(t.id) === form.sectorTitleId)
                  ?.title || "Select Sector Title"}
              </span>
              <span>▼</span>
            </div>

            {showTitleList && (
              <div className="custom-select-options">
                {sectorTitles.map(item => (
                  <div
                    key={item.id}
                    className="option-item"
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        sectorTitleId: String(item.id),
                      }));
                      setShowTitleList(false);
                    }}
                  >
                    {item.title}
                  </div>
                ))}
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
                onChange={e => handleFile("image", e.target.files?.[0] || null)}
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
                {filename && <span className="filename-display">{filename}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="form-actions">
          <button type="button" className="btn danger" onClick={() => navigate(`/sector?page=${page}`)}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSector;
