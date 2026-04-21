import { useEffect, useState, useMemo } from "react";
import { saveSectorMapping } from "../../../api/sectorMapping.api";
import { getSectorTitles, type SectorTitle } from "../../../api/sectorTitle.api";
import { getSectors } from "../../../api/sectors.api";
import "./addSectorMapping.css";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useBusinessStore } from "../../../store/useBusinessStore";


const BLUE = "#323da7";
const btnStyle: React.CSSProperties = {
  background: BLUE,
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
};

/* ======================
   TYPES
====================== */
type SectorRow = {
  id: number;
  sector_name: string;
  mapped_menu: string | null;
  sector_title_id: number | null;
};

const AddSectorMapping = () => {
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();
  const [sectorTitles, setSectorTitles] = useState<SectorTitle[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<number | null>(null);
  const [showTitleList, setShowTitleList] = useState(false);

  const [rows, setRows] = useState<SectorRow[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [titleSearch, setTitleSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ======================
     LOAD DATA
  ====================== */
  useEffect(() => {
    // 1. Load Titles
    getSectorTitles()
      .then(setSectorTitles)
      .catch(err => console.error("Failed to load sector titles", err));

    // 2. Load Sectors (Always load by default)
    loadSectors();

    // 3. Click outside handler (Using 'click' is safer for sync with trigger)
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".custom-dropdown")) {
        setShowTitleList(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  /* ======================
     LOAD SECTORS HELPER
  ====================== */
  const loadSectors = async () => {
    showLoader("Loading sectors, please wait...");
    try {
      setLoading(true);
      const data = await getSectors();

      setRows(
        data.map((r: any) => ({
          id: r.id,
          sector_name: r.sector_name ?? r.name,
          mapped_menu: r.sector_title ?? null,
          sector_title_id: r.sector_title_id ?? null,
        }))
      );
      setSelected([]);
    } catch (err) {
      console.error("Failed to load sectors", err);
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  /* ======================
     FILTER
  ====================== */
  const filtered = rows.filter(r => {
    return r.sector_name.toLowerCase().includes(search.toLowerCase());
  });

  /* ======================
     CHECKBOX HANDLERS
  ====================== */
  const toggle = (id: number) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (filtered.length === 0) return;

    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map(r => r.id));
    }
  };

  /* ======================
     SAVE
  ====================== */
  const handleSave = async () => {
    if (!selectedTitle) {
      alert("Please select Sector Title");
      return;
    }

    if (selected.length === 0) {
      alert("Please select at least one sector");
      return;
    }

    try {
      setSaving(true);
      showLoader("Saving sector mapping...");

      await saveSectorMapping(
        selectedTitle,
        selected
      );
      showSuccess("Sector mapping has been saved successfully.", "Saved Successfully!");

      // 🔄 RELOAD DATA REFRESH
      await loadSectors();
    } catch (err: any) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
      hideLoader();
    }
  };
  /* ======================
     FILTERED TITLES (A-Z)
  ====================== */
  const filteredSectorTitles = useMemo(() => {
    let result = sectorTitles.filter(t => {
      const title = t.title || "";
      return title.toLowerCase().includes(titleSearch.toLowerCase());
    });

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


      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2>Add Sector Mapping</h2>
          <p className="subtitle">
            Select a sector title and map multiple sectors
          </p>
        </div>
      </div>

      <div className="mapping-card">

        {/* TOP CONTROLS */}
        <div className="mapping-controls">

          {/* Custom Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#4b5563' }}>SECTOR TITLE</label>
            <div className="custom-dropdown" style={{ position: "relative", zIndex: showTitleList ? 10000 : 50 }}>
              <div
                className="dropdown-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTitleList(prev => !prev);
                }}
                style={{
                  borderColor: showTitleList ? "#323da7" : "#d1d5db",
                  boxShadow: showTitleList ? "0 0 0 3px rgba(50, 61, 167, 0.1)" : "none",
                  backgroundColor: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  minHeight: "38px"
                }}
              >
                <span style={{ color: selectedTitle ? "#1f2937" : "#6b7280", fontSize: "14px" }}>
                  {sectorTitles.find(t => String(t.id) === String(selectedTitle))?.title || "Select Sector Title"}
                </span>
                <span className="dropdown-arrow" style={{ transform: showTitleList ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", fontSize: "10px", color: "#6b7280" }}>▼</span>
              </div>

              {showTitleList && (
                <div 
                  className="sector-unique-menu-container" 
                  style={{ 
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    marginTop: '4px',
                    backgroundColor: '#ffffff', 
                    border: '1px solid #323da7', 
                    borderRadius: '8px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                    minHeight: '100px',
                    zIndex: 10001
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ position: 'sticky', top: 0, backgroundColor: '#ffffff', padding: '10px', borderBottom: '1px solid #eee', zIndex: 10 }}>
                    <input
                      type="text"
                      placeholder="Search title..."
                      value={titleSearch}
                      onChange={(e) => setTitleSearch(e.target.value)}
                      autoFocus
                      style={{ 
                        width: '100%', 
                        padding: '10px', 
                        border: '1px solid #323da7', 
                        borderRadius: '4px',
                        outline: 'none',
                        fontSize: '14px',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
                    {sectorTitles.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', backgroundColor: '#ffffff' }}>
                        Loading titles...
                      </div>
                    ) : filteredSectorTitles.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', backgroundColor: '#ffffff' }}>
                        No results for "{titleSearch}"
                      </div>
                    ) : (
                      filteredSectorTitles.map(item => (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTitle(item.id);
                            if (item.title) {
                              useBusinessStore.getState().setBusiness(item.title);
                            }
                            setShowTitleList(false);
                            setTitleSearch("");
                          }}
                          style={{
                            padding: "12px 14px",
                            cursor: "pointer",
                            borderBottom: "1px solid #f3f4f6",
                            fontSize: "14px",
                            color: "#374151",
                            backgroundColor: String(item.id) === String(selectedTitle) ? "#323da710" : "#ffffff"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = String(item.id) === String(selectedTitle) ? "#323da710" : "#ffffff"}
                        >
                          {item.title}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: 'auto' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#4b5563' }}>SEARCH</label>
            <div className="search-wrapper" style={{ margin: 0 }}>
              <input
                className="search-input"
                placeholder="Search sectors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* TABLE (Always Visible) */}
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '5%', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={
                    filtered.length > 0 &&
                    selected.length === filtered.length
                  }
                  onChange={toggleAll}
                />
              </th>
              <th style={{ width: '45%', textAlign: 'left' }}>SECTOR NAME</th>
              <th style={{ width: '50%', textAlign: 'left' }}>MAPPED MENU</th>
            </tr>
          </thead>

          <tbody>
            {loading ? null : filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty">
                  No sectors found
                </td>
              </tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={() => toggle(r.id)}
                    />
                  </td>
                  <td>{r.sector_name}</td>
                  <td>{r.mapped_menu ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="table-footer">
          <span>
            Selected {selected.length} sector(s)
          </span>
        </div>

        <div className="form-actions center" style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
          <button
            style={{ ...btnStyle, background: "#6c757d" }}
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
          <button
            style={btnStyle}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Sector Mapping"}
          </button>
        </div>

      </div>
    </div >
  );
};

export default AddSectorMapping;
