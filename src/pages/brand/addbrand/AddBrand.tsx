import { useState } from "react";
import { Upload, ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createBrand } from "../../../api/brand.api";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useBrandStore } from "../../../store/useBrandStore";

import "../../product/addproduct/AddProduct.css";

type BrandForm = {
  brandName: string;
  description: string;
  info: string;
  note: string;
  systemNote: string;
  iconText: string;
  link: string;
  status: "active" | "inactive";
  image?: File | null;
};

const AddBrand = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();

  const [form, setForm] = useState<BrandForm>({
    brandName: "",
    description: "",
    info: "",
    note: "",
    systemNote: "",
    iconText: "",
    link: "",
    status: "active",
    image: null,
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  /* ======================
     INPUT HANDLERS
  ====================== */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (file: File | null) => {
    setForm((prev) => ({ ...prev, image: file }));

    if (file) {
      setFilename(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilename(null);
      setPreview(null);
    }
  };

  const handleDeleteImage = () => {
    setPreview(null);
    setFilename(null);
    setForm(prev => ({ ...prev, image: null }));
    const fileInput = document.getElementById("brandImage") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  /* ======================
     ACTIONS
  ====================== */
  const handleReset = () => {
    setForm({
      brandName: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brandName) {
      alert("Brand Name is required");
      return;
    }

    try {
      setSaving(true);
      showLoader("Creating brand, please wait...");
      await createBrand(form);
      showSuccess("Brand has been created successfully.", "Successfully Saved!");
      navigate("/brands");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to create brand");
    } finally {
      setSaving(false);
      hideLoader();
    }
  };

  return (
    <div className="page-container">
      <GlobalStoreHeader />

      <form className="form-card" onSubmit={handleSubmit}>

        {/* HEADER */}
        <div className="form-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" className="btn-back" onClick={() => navigate("/brands")} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <ArrowLeft size={20} color="#111" />
            </button>
            <h2>Add Brand</h2>
          </div>
          <p className="subtitle">Create and configure a new brand</p>
        </div>

        {/* GRID */}
        <div className="form-grid">

          <div className="inline-form-field">
            <label>Brand Name</label>
            <input
              name="brandName"
              placeholder="Enter Brand Name..."
              value={form.brandName}
              onChange={(e) => {
                handleChange(e);
                useBrandStore.getState().setBrand(e.target.value);
              }}

            />
          </div>

          <div className="inline-form-field">
            <label>Link</label>
            <input
              name="link"
              placeholder="Enter Link..."
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

          <div className="inline-form-field">
            <label>Icon Text</label>
            <input
              name="iconText"
              placeholder="Enter Icon Text..."
              value={form.iconText}
              onChange={handleChange}
            />
          </div>

          {/* Main Image + Status Row */}
          {/* Main Image + Status Row */}
          <div className="product-image-section">
            <div className="image-status-flex">
              <div className="image-preview-box">
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" />
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={handleDeleteImage}
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="empty-placeholder" onClick={() => document.getElementById("brandImage")?.click()} />
                )}
              </div>

              <div className="image-upload-controls">
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Brand Image</label>
                <input
                  type="file"
                  id="brandImage"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
                <label htmlFor="brandImage" className="upload-button-label">
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
            onClick={handleReset}
          >
            Reset
          </button>

          <button
            type="button"
            className="btn ghost" // Using ghost style for Cancel to match consistent secondary button style
            style={{ border: 'none', background: '#ccc', color: '#333' }}
            onClick={() => navigate("/brands")}
          >
            Cancel
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

export default AddBrand;
