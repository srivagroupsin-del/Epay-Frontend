import { useState } from "react";
import { Upload, X } from "lucide-react";
import { createSectorTitle } from "../../../api/sectorTitle.api";
import "../../product/addproduct/AddProduct.css";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";

type SectorTitleForm = {
  // ... existing types

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

const AddSectorTitle = () => {
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();
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

  const [previews, setPreviews] = useState({
    image: null as string | null,
  });

  const [filename, setFilename] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFile = (name: keyof SectorTitleForm, file: File | null) => {
    setForm(prev => ({ ...prev, [name]: file }));
    if (file) {
      setFilename(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setPreviews(prev => ({ ...prev, [name]: reader.result as string }));
      reader.readAsDataURL(file);
    } else {
      setFilename(null);
      setPreviews(prev => ({ ...prev, [name]: null }));
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Sector Title is required");
      return;
    }

    try {
      setSaving(true);
      showLoader("Creating sector title, please wait...");

      const response = await createSectorTitle(form);

      console.log("SUCCESS:", response);

      showSuccess("Sector title has been saved successfully.", "Saved Successfully!");

      // RESET AFTER SUCCESS
      setForm({
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
      setPreviews({
        image: null,
      });
      setFilename(null);

    } catch (error: any) {
      console.error("SAVE ERROR:", error);
      alert(error.message || "Failed to save sector title ❌");
    } finally {
      setSaving(false);
      hideLoader();
    }
  };


  return (
    <div className="page-container">
      <form className="form-card" onSubmit={handleSubmit}>

        {/* HEADER */}
        <div className="form-header">
          <h2>Add Sector Title</h2>
          <p className="subtitle">
            Create and configure a new sector title
          </p>
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
                {previews.image ? (
                  <>
                    <img src={previews.image} alt="Preview" />
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => {
                        setPreviews((prev) => ({ ...prev, image: null }));
                        setForm((prev) => ({ ...prev, image: null }));
                        setFilename(null);
                        const fileInput = document.getElementById("sectorTitleImage") as HTMLInputElement;
                        if (fileInput) fileInput.value = "";
                      }}
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="empty-placeholder" onClick={() => document.getElementById("sectorTitleImage")?.click()} />
                )}
              </div>

              <div className="image-upload-controls">
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Sector Title Image</label>
                <input
                  type="file"
                  id="sectorTitleImage"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleFile("image", e.target.files?.[0] || null)}
                />
                <label htmlFor="sectorTitleImage" className="upload-button-label">
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

        {/* ACTIONS */}
        <div className="form-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setForm({
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
              setPreviews({
                image: null,
              });
              setFilename(null);
            }}
          >
            Reset
          </button>

          <button
            type="submit"
            className="btn primary"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddSectorTitle;
