import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { addMenu, getMenuById, updateMenu } from "./menu.api";
import { useLoading } from "../../../../context/LoadingContext";
import { useSuccessPopup } from "../../../../context/SuccessPopupContext";

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") || "1";
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    menu_title_id: "",
    page_title: "",
    // itab: "",
    // link: "",
    description: "",
    status: true,
    image: null as File | null
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (id) {
          showLoader("Loading menu data...");
          const menuData = await getMenuById(Number(id));
          const menu = menuData.data || menuData;
          setForm({
            menu_title_id: (menu.menu_title_id || 1).toString(),
            page_title: menu.tab_name || menu.page_title || "",
            description: menu.description || "",
            status: menu.status === "active",
            image: null
          });
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        if (id) hideLoader();
      }
    };
    loadInitialData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        menu_title_id: Number(form.menu_title_id) || 1,
        page_title: form.page_title,
        status: form.status ? "active" : "inactive" as const,
      };

      if (id) {
        await updateMenu(Number(id), payload as any);
        showSuccess("Menu updated successfully.", "Successfully Updated!");
      } else {
        await addMenu(payload as any);
        showSuccess("Menu added successfully.", "Successfully Saved!");
      }
      navigate(`/settings/menu?page=${page}`);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const resetForm = () => {
    setForm({
      menu_title_id: "",
      page_title: "",
      description: "",
      status: true,
      image: null
    });
  };

  // Label style for the floating effect
  const floatingLabelStyle: React.CSSProperties = {
    position: "absolute",
    top: "-10px",
    left: "12px",
    background: "#fff",
    padding: "0 6px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#6366f1", // Indigo
    zIndex: 1,
    letterSpacing: "0.5px"
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#334155",
    outline: "none",
    background: "#fff",
    transition: "border-color 0.2s"
  };

  return (
    <div className="page-container" style={{ padding: "40px", background: "#f8fafc", minHeight: "100vh" }}>
      <form className="form-card" onSubmit={handleSave} style={{ 
          maxWidth: "1000px", 
          margin: "0 auto", 
          background: "#fff", 
          padding: "40px", 
          borderRadius: "16px", 
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" 
        }}>
        <div className="form-header" style={{ marginBottom: "35px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>{id ? "Edit Menu" : "Add Menu"}</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
          {/* Row 1: Sub Menu Title & Status */}
          <div style={{ position: "relative" }}>
            <label style={floatingLabelStyle}>SUB MENU TITLE</label>
            <input
              name="page_title"
              placeholder="Enter Sub Menu Title"
              value={form.page_title}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div style={{ position: "relative" }}>
            <label style={floatingLabelStyle}>STATUS</label>
            <select
              name="status"
              value={form.status ? "active" : "inactive"}
              onChange={(e) => setForm({ ...form, status: e.target.value === "active" })}
              style={{
                ...inputStyle,
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 16px center",
                backgroundSize: "18px"
              }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "50px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{ 
              background: "#4f46e5", 
              color: "#fff", 
              padding: "14px 60px", 
              borderRadius: "12px", 
              fontWeight: "700", 
              border: "none",
              fontSize: "15px",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)"
            }}
          >
            {loading ? "Saving..." : "Save"}
          </button>
          
          <button
            type="button"
            onClick={resetForm}
            style={{ 
              background: "#fff", 
              color: "#ef4444", 
              padding: "14px 60px", 
              borderRadius: "12px", 
              fontWeight: "700", 
              border: "2px solid #fee2e2",
              fontSize: "15px",
              cursor: "pointer"
            }}
          >
            Reset
          </button>

          <button
            type="button"
            onClick={() => navigate(`/settings/menu?page=${page}`)}
            style={{ 
              background: "#fff", 
              color: "#64748b", 
              padding: "14px 60px", 
              borderRadius: "12px", 
              fontWeight: "700", 
              border: "2px solid #f1f5f9",
              fontSize: "15px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default Menu;
