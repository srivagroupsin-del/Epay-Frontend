import { useEffect, useState } from "react";
import { http } from "../../../base_api/base_api";

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
// import "./sector-title.css";

type SectorGSTRow = {
  id: number;
  sectorTitle: string;
  gstPercent: string;
  hsnCode: string;
};

const SectorGSTConfig = () => {
  /* ======================
     STATES
  ====================== */
  const [data, setData] = useState<SectorGSTRow[]>([]);
  const [loading, setLoading] = useState(true);

  //   const SAVE_API = "https://your-api-url.com/save-sector-gst-config";

  /* ======================
     LOAD DATA
  ====================== */
  useEffect(() => {
    http("/sector-gst-config") // Placeholder endpoint
      .then(result => {
        setData(result.data || result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* ======================
     HANDLERS
  ====================== */
  const handleGSTChange = (id: number, value: string) => {
    setData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, gstPercent: value } : item
      )
    );
  };

  const handleHSNChange = (id: number, value: string) => {
    setData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, hsnCode: value } : item
      )
    );
  };

  /* ======================
     SAVE CONFIG
  ====================== */
  const handleSave = () => {
    const payload = {
      configurations: data
    };

    console.log("Saving GST Configuration:", payload);

    /*
    fetch(SAVE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    */
  };

  return (
    <div className="page-container">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2>Sector Title Menu</h2>
          <p className="subtitle">
            Configure GST percentage and HSN codes for each sector
          </p>
        </div>
      </div>

      {/* CARD */}
      <div className="card">

        {loading ? (
          <div className="loading">Loading sector configuration...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Sector Title</th>
                <th>GST %</th>
                <th>HSN Code</th>
              </tr>
            </thead>

            <tbody>
              {data.map(item => (
                <tr key={item.id}>
                  <td>{item.sectorTitle}</td>

                  <td>
                    <select
                      value={item.gstPercent}
                      onChange={e =>
                        handleGSTChange(item.id, e.target.value)
                      }
                    >
                      <option value="">No Tax Assigned</option>
                      <option value="0%">0%</option>
                      <option value="5%">5%</option>
                      <option value="12%">12%</option>
                      <option value="18%">18%</option>
                      <option value="28%">28%</option>
                    </select>
                  </td>

                  <td>
                    <input
                      placeholder="Enter HSN Code..."
                      value={item.hsnCode}
                      onChange={e =>
                        handleHSNChange(item.id, e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="form-actions" style={{ marginTop: "20px" }}>
          <button style={btnStyle} onClick={handleSave}>
            Save Configuration
          </button>
        </div>

      </div>
    </div>
  );
};

export default SectorGSTConfig;
