import React, { useState, useEffect } from "react";
import { Pencil, Trash2, ChevronsLeft, ChevronsRight } from "lucide-react";
import { getMenuTitles } from "../menutitle/menuTitle.api";
import { getMenus } from "../menu/menu.api";
import type { MenuTitle } from "../menutitle/menuTitle.types";
import "../menu/view-menu-list.css";

interface MappingItem {
  id: number;
  title: string;
  menu: string;
  link: string;
  status: "active" | "inactive";
}

interface MenuField {
  id: number;
  tab_name?: string;
  page_title?: string;
  link?: string;
}

const MenuMappingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [titles, setTitles] = useState<MenuTitle[]>([]);
  const [menus, setMenus] = useState<MenuField[]>([]);

  const [form, setForm] = useState({
    menu_title_id: "",
    menu_id: "",
    status: true,
  });

  // Load List Data & Dropdowns
  const fetchData = async () => {
    try {
      setListLoading(true);
      const [titleRes, menuRes] = await Promise.all([
        getMenuTitles(),
        getMenus()
      ]);
      
      const titleList = Array.isArray(titleRes) ? titleRes : (titleRes.data || []);
      const menuList = Array.isArray(menuRes) ? menuRes : (menuRes.data || []);

      setTitles(titleList);
      setMenus(menuList);

      const storedData = localStorage.getItem("menu_mappings_data");
      if (storedData) {
        setMappings(JSON.parse(storedData));
      } else {
        const defaultMappings: MappingItem[] = [
          { id: 1, title: "Category", menu: "Home", link: "/home", status: "active" },
          { id: 2, title: "Brand", menu: "Shop", link: "/shop", status: "active" },
        ];
        localStorage.setItem("menu_mappings_data", JSON.stringify(defaultMappings));
        setMappings(defaultMappings);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.menu_title_id || !form.menu_id) {
        alert("Please select both Menu Title and Menu");
        return;
    }
    
    setLoading(true);
    try {
      const storedMappings = localStorage.getItem("menu_mappings_data");
      const currentMappings = storedMappings ? JSON.parse(storedMappings) : [];

      const selectedTitle = titles.find(t => String(t.id) === String(form.menu_title_id));
      const selectedMenu = menus.find(m => String(m.id) === String(form.menu_id));

      const newMapping: MappingItem = {
        id: Date.now(),
        title: selectedTitle ? selectedTitle.menu_title : "Unknown",
        menu: selectedMenu ? (selectedMenu.tab_name || selectedMenu.page_title || "Unknown") : "Unknown",
        link: selectedMenu ? selectedMenu.link || "/" : "/",
        status: form.status ? "active" : "inactive"
      };

      const updated = [...currentMappings, newMapping];
      localStorage.setItem("menu_mappings_data", JSON.stringify(updated));
      setMappings(updated);
      resetForm();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      menu_title_id: "",
      menu_id: "",
      status: true,
    });
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this mapping?")) return;
    const updatedMappings = mappings.filter(m => m.id !== id);
    setMappings(updatedMappings);
    localStorage.setItem("menu_mappings_data", JSON.stringify(updatedMappings));
  };

  const filtered = mappings.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.menu.toLowerCase().includes(search.toLowerCase())
  );

  const totalPagesCount = Math.ceil(filtered.length / limit);
  const startIndex = (currentPage - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  // Floating Label Styles
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
    letterSpacing: "0.5px",
    textTransform: "uppercase"
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#475569",
    outline: "none",
    background: "#fff",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
    backgroundSize: "18px"
  };

  return (
    <div className="view-menu-list-container" style={{ padding: "40px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* ADD SECTION */}
      <form 
        className="form-card" 
        onSubmit={handleSave} 
        style={{ 
          maxWidth: "1200px", 
          margin: "0 auto 40px auto", 
          background: "#fff", 
          padding: "40px", 
          borderRadius: "16px", 
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" 
        }}
      >
        <div className="form-header" style={{ marginBottom: "35px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b" }}>Add Mapping</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "35px 50px" }}>
          <div style={{ position: "relative" }}>
            <label style={floatingLabelStyle}>MENU TITLE</label>
            <select
              name="menu_title_id"
              value={form.menu_title_id}
              onChange={handleChange}
              style={selectStyle}
            >
              <option value="">select</option>
              {titles.map((t) => (
                <option key={t.id} value={t.id}>{t.menu_title}</option>
              ))}
            </select>
          </div>

          <div style={{ position: "relative" }}>
            <label style={floatingLabelStyle}>MENU</label>
            <select
              name="menu_id"
              value={form.menu_id}
              onChange={handleChange}
              style={selectStyle}
            >
              <option value="">select</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>{m.tab_name || m.page_title}</option>
              ))}
            </select>
          </div>

          <div style={{ position: "relative" }}>
            <label style={floatingLabelStyle}>STATUS</label>
            <div style={{ display: "flex", alignItems: "center", height: "48px" }}>
                <div
                    onClick={() => setForm({ ...form, status: !form.status })}
                    style={{
                        width: "28px",
                        height: "28px",
                        backgroundColor: form.status ? "#007bff" : "#fff",
                        border: "2px solid #007bff",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    {form.status && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    )}
                </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginTop: "40px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{ 
              background: "#22c55e", 
              color: "#fff", 
              padding: "12px 40px", 
              borderRadius: "10px", 
              fontWeight: "700", 
              border: "none",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            {loading ? "Saving..." : "Save Mapping"}
          </button>
          
          <button
            type="button"
            onClick={resetForm}
            style={{ 
              background: "#e2e8f0", 
              color: "#475569", 
              padding: "12px 40px", 
              borderRadius: "10px", 
              fontWeight: "700", 
              border: "none",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            Reset
          </button>

          <button
            type="button"
            style={{ 
              background: "#5bc0de", 
              color: "#fff", 
              padding: "12px 40px", 
              borderRadius: "10px", 
              fontWeight: "700", 
              border: "none",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* VIEW SECTION */}
      <div 
        className="list-card" 
        style={{ 
          maxWidth: "1200px", 
          margin: "0 auto", 
          background: "#fff", 
          borderRadius: "16px", 
          boxShadow: "0 4px 15px -3px rgba(0, 0, 0, 0.05)" 
        }}
      >
        <div className="list-header-top" style={{ padding: "30px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>View Mapping List</h2>
          {/* <button className="btn-add-new" style={{ padding: "10px 24px" }}>
            Add New Mapping
          </button> */}
        </div>

        <div className="list-title-sub" style={{ padding: "0 30px 15px 30px", fontSize: "14px", color: "#64748b" }}>Mapping - Master</div>

        <div className="list-controls" style={{ padding: "0 30px 20px 30px", justifyContent: "space-between" }}>
          <div className="show-entries">
            Show
            <select
              className="entries-select"
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            entries
          </div>

          <div className="search-wrapper" style={{ margin: 0 }}>
            Search:
            <input
              type="text"
              className="search-input"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ width: "250px" }}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="menu-list-table">
            <thead>
              <tr style={{ borderTop: "1px solid #f1f5f9" }}>
                <th style={{ color: "#000", fontWeight: "700", padding: "20px 30px" }}>S.NO</th>
                <th style={{ color: "#000", fontWeight: "700", padding: "20px 30px" }}>MENU TITLE</th>
                <th style={{ color: "#000", fontWeight: "700", padding: "20px 30px" }}>SUB TITLE</th>
                <th style={{ color: "#000", fontWeight: "700", padding: "20px 30px" }}>STATUS</th>
                <th style={{ color: "#000", fontWeight: "700", padding: "20px 30px", textAlign: "center" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px" }}>Loading mappings...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px" }}>No Data Found</td></tr>
              ) : (
                paginated.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ padding: "15px 30px" }}>{startIndex + index + 1}</td>
                    <td style={{ padding: "15px 30px", color: "#64748b" }}>{item.title}</td>
                    <td style={{ padding: "15px 30px", color: "#64748b" }}>{item.menu}</td>
                    <td style={{ padding: "15px 30px" }}>
                      <span style={{ fontWeight: "600", color: item.status === "active" ? "#475569" : "#ef4444" }}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: "15px 30px" }}>
                      <div className="action-buttons" style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                        <button
                          className="action-btn edit"
                          style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "#eff6ff",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s"
                          }}
                          title="Edit"
                        >
                          <Pencil size={15} color="#3b82f6" />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(item.id)}
                          style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "#fef2f2",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s"
                          }}
                          title="Delete"
                        >
                          <Trash2 size={15} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPagesCount > 0 && (
          <div className="pagination-container" style={{ padding: "20px 30px", justifyContent: "space-between", display: "flex", alignItems: "center" }}>
            <div className="pagination-info" style={{ fontSize: "14px", color: "#64748b" }}>
              Showing {startIndex + 1} to {Math.min(startIndex + limit, filtered.length)} of {filtered.length} entries
            </div>
            <div className="pagination-premium">
              <button
                className="pagination-btn nav-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronsLeft size={18} />
              </button>
              {[...Array(totalPagesCount)].map((_, i) => (
                <button
                  key={i}
                  className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="pagination-btn nav-btn"
                disabled={currentPage === totalPagesCount}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuMappingPage;
