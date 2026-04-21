import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import { Upload, X, ArrowLeft } from "lucide-react";
import "../../product/addproduct/AddProduct.css";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";

import {
  getSectorTitleById,
  // ...
  updateSectorTitle,
} from "../../../api/sectorTitle.api";


type SectorTitleForm = {
  name: string;
  description: string;
  info: string;
  note: string;
  systemNote: string;
  iconText: string;
  link: string;
  status: "active" | "inactive";
  image: File | null;
};

const EditSectorTitle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") || "1";

  const [form, setForm] = useState<SectorTitleForm>({
    name: "",
    description: "",
    info: "",
    note: "",
    systemNote: "",
    iconText: "",
    link: "",
    status: "active",
    image: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);


  useEffect(() => {
    if (!id) {
      navigate(`/sector-titles?page=${page}`);
      return;
    }

    const loadData = async () => {
      showLoader("Loading sector title data...");
      try {
        const data = await getSectorTitleById(id);

        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          info: data.info ?? "",
          note: data.note ?? "",
          systemNote: data.system_note ?? "",
          iconText: data.icon_name ?? "",
          link: data.link ?? "",
          status: data.status === "active" ? "active" : "inactive",
          image: null,
        });

        if (data.image) {
          setPreview(`${IMAGE_BASE_URL}/${data.image}`);
          setFilename(data.image);
        }
      } catch (err) {
        alert("Failed to load sector title");
        navigate(`/sector-titles?page=${page}`);
      } finally {
        setLoading(false);
        hideLoader();
      }
    };

    loadData();
  }, [id, navigate]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFile = (file: File | null) => {
    setForm(prev => ({ ...prev, image: file }));
    if (file) {
      setFilename(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      setFilename(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      showLoader("Updating sector title...");
      await updateSectorTitle(id!, form);
      showSuccess("Sector title has been updated.", "Successfully Updated!");
      navigate(`/sector-titles?page=${page}`);
    } catch (err: any) {
      alert(err.message || "Update failed");
    } finally {
      setSaving(false);
      hideLoader();
    }
  };

  if (loading) return null;

  return (
    <div className="page-container">
      <form onSubmit={handleSubmit} className="form-card">

        {/* HEADER */}
        <div className="form-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn-back"
              onClick={() => navigate(`/sector-titles?page=${page}`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <ArrowLeft size={20} />
            </button>
            <h2>Edit Sector Title</h2>
          </div>
          <p className="subtitle">Update existing sector title configurations</p>
        </div>

        {/* GRID */}
        <div className="form-grid">

          <div className="inline-form-field">
            <label>Sector Title</label>
            <input
              name="name"
              placeholder="Enter Sector Title..."
              value={form.name}
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
              placeholder="Enter description..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="inline-form-field">
            <label>Info</label>
            <textarea
              name="info"
              placeholder="Enter info..."
              value={form.info}
              onChange={handleChange}
            />
          </div>

          <div className="inline-form-field">
            <label>Note</label>
            <textarea
              name="note"
              placeholder="Enter note..."
              value={form.note}
              onChange={handleChange}
            />
          </div>

          <div className="inline-form-field">
            <label>System Note</label>
            <textarea
              name="systemNote"
              placeholder="Enter system note..."
              value={form.systemNote}
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
                  <div className="empty-placeholder" onClick={() => document.getElementById("sectorTitleImageEdit")?.click()} />
                )}
              </div>

              <div className="image-upload-controls">
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Sector Title Image</label>
                <input
                  type="file"
                  id="sectorTitleImageEdit"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="sectorTitleImageEdit" className="upload-button-label">
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
            className="btn cancel"
            onClick={() => navigate(`/sector-titles?page=${page}`)}
          >
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Updating..." : "Update Sector Title"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSectorTitle;
