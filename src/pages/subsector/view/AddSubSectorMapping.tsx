import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../../../base_api/base_api";
import { saveSubSectorMapping } from "../models/subsectorMapping.api";
import "./addSubSectorMapping.css";
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
type Sector = {
  id: number;
  name: string;
};

type SubSectorRow = {
  id: number;
  sub_sector_name: string;
  sector_name: string | null;
};

const AddSubSectorMapping = () => {
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [subsectors, setSubsectors] = useState<SubSectorRow[]>([]);
  const [selectedSector, setSelectedSector] = useState<number | "">("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  /* LOAD BOTH IN PARALLEL */
  const loadInitialData = async () => {
    showLoader("Loading subsector mapping data...");
    try {
      setLoading(true);
      const [sectorsJson, subsectorsJson] = await Promise.all([
        http("/sectors"),
        http("/sub-sectors"),
      ]);
      const sectorRows = sectorsJson.data ?? sectorsJson;
      setSectors(sectorRows.map((s: any) => ({ id: s.id, name: s.sector_name ?? s.name })));
      setSubsectors(subsectorsJson.data ?? subsectorsJson);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  /* FILTER TABLE ROWS */
  const filtered = useMemo(() => {
    return subsectors
      .filter(s => s.sub_sector_name.toLowerCase().startsWith(search.toLowerCase()))
      .sort((a, b) => a.sub_sector_name.localeCompare(b.sub_sector_name, undefined, { sensitivity: 'base' }));
  }, [subsectors, search]);

  /* SECTOR DROPDOWN OPTIONS */
  const sectorOptions = useMemo(() => {
    const unique = new Map<number, Sector>();
    for (const s of sectors) {
      if (!unique.has(s.id)) {
        unique.set(s.id, s);
      }
    }
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [sectors]);

  /* CHECKBOX */
  const toggle = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds(
      selectedIds.length === filtered.length
        ? []
        : filtered.map(r => r.id)
    );
  };

  /* SAVE */
  const handleSave = async () => {
    if (!selectedSector) {
      alert("Please select Sector");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Select at least one Subsector");
      return;
    }

    try {
      setSaving(true);
      showLoader("Saving subsector mapping...");
      await saveSubSectorMapping(
        selectedSector,
        selectedIds
      );
      showSuccess("Subsector mapping has been saved successfully.", "Saved Successfully!");
      
      // Clear selection
      setSelectedIds([]);
      
      // Re-fetch data to reflect changes immediately
      await loadInitialData();
      
      // Redirect to view page
      setTimeout(() => navigate("/subsector/view"), 1500);
      
    } catch (err: any) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
      hideLoader();
    }
  };

  return (
    <div className="page-container">
      <GlobalStoreHeader />

      <div className="mapping-container">
        <div className="page-header" style={{ marginBottom: '20px' }}>
          <h2>Add Subsector Mapping</h2>
        </div>

        <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '900px', margin: '0 auto' }}>
          <div className="table-controls">
            {/* SEARCHABLE SECTOR DROPDOWN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '250px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#4b5563' }}>SECTOR</label>
              <select
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  outline: "none",
                  fontSize: "14px",
                  backgroundColor: "#fff",
                  color: "#1f2937",
                  height: "42px",
                  cursor: "pointer"
                }}
                value={selectedSector}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : "";
                  setSelectedSector(val);
                  if (val !== "") {
                    const sec = sectorOptions.find(s => s.id === val);
                    if (sec) useBusinessStore.getState().setBusiness(sec.name);
                  }
                }}
              >
                <option value="">-- Select Sector --</option>
                {sectorOptions.length > 0 && sectorOptions.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: 'auto' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#4b5563' }}>SEARCH</label>
              <input
                placeholder="Search Subsector Name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading data...</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          filtered.length > 0 &&
                          selectedIds.length === filtered.length
                        }
                        onChange={toggleAll}
                      />
                    </th>
                    <th>Subsector Name</th>
                    <th>Mapped Sector</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                        No subsectors found
                      </td>
                    </tr>
                  ) : (
                    filtered.map(row => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.id)}
                            onChange={() => toggle(row.id)}
                          />
                        </td>
                        <td>{row.sub_sector_name}</td>
                        <td>{row.sector_name ?? "Not Mapped"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-actions" style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "30px", borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
            <button style={{ ...btnStyle, background: "#6c757d" }} onClick={() => window.history.back()}>
              Cancel
            </button>
            <button style={btnStyle} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Mapping"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSubSectorMapping;
