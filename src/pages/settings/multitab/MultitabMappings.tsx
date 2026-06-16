import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  getMultitabTabs,
  getMultitabCheckboxes,
  getMultitabMappingsByTabId,
  saveMultitabMappings,
} from "../../../api/multitab.api";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";

interface MultitabTab {
  id: number;
  tab_name: string;
  tab_title: string;
}

interface MultitabCheckbox {
  id: number;
  label: string;
  description: string;
}

interface MappingItem {
  checkbox_id: number;
  checkbox_label: string;
  tab_name: string;
  status: string;
}

const MultitabMappings: React.FC = () => {
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();

  const [tabs, setTabs] = useState<MultitabTab[]>([]);
  const [checkboxes, setCheckboxes] = useState<MultitabCheckbox[]>([]);
  const [selectedTabId, setSelectedTabId] = useState<string>("");
  const [selectedCheckboxIds, setSelectedCheckboxIds] = useState<number[]>([]);
  const [currentMappings, setCurrentMappings] = useState<MappingItem[]>([]);

  const loadInitialData = async () => {
    try {
      showLoader("Loading mapping resources...");
      const [tabsRes, checkboxesRes] = await Promise.all([
        getMultitabTabs(),
        getMultitabCheckboxes(),
      ]);
      setTabs(tabsRes.filter((t: any) => t.status === "active"));
      setCheckboxes(checkboxesRes.filter((c: any) => c.status === "active"));
    } catch (error) {
      console.error("Failed to load mapping resources:", error);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch current mappings when Tab changes
  useEffect(() => {
    if (!selectedTabId) {
      setSelectedCheckboxIds([]);
      setCurrentMappings([]);
      return;
    }

    const loadMappings = async () => {
      try {
        showLoader("Loading mapped configurations...");
        const res = await getMultitabMappingsByTabId(Number(selectedTabId));
        const activeMappedIds = res.map((m: any) => m.checkbox_id);
        setSelectedCheckboxIds(activeMappedIds);
        setCurrentMappings(res);
      } catch (error) {
        console.error("Failed to load mappings:", error);
      } finally {
        hideLoader();
      }
    };

    loadMappings();
  }, [selectedTabId]);

  const handleCheckboxToggle = (checkboxId: number) => {
    setSelectedCheckboxIds((prev) => {
      if (prev.includes(checkboxId)) {
        return prev.filter((id) => id !== checkboxId);
      } else {
        return [...prev, checkboxId];
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTabId) {
      alert("Please select a Tab Heading");
      return;
    }

    try {
      showLoader("Saving mapping configuration...");
      await saveMultitabMappings({
        tabId: Number(selectedTabId),
        checkboxIds: selectedCheckboxIds,
      });
      showSuccess("Tab mappings saved successfully.", "Mappings Saved!");

      // Reload mappings
      const res = await getMultitabMappingsByTabId(Number(selectedTabId));
      setCurrentMappings(res);
    } catch (error: any) {
      alert(error.message || "Failed to save mapping");
    } finally {
      hideLoader();
    }
  };

  const floatingLabelStyle: React.CSSProperties = {
    position: "absolute",
    top: "-10px",
    left: "12px",
    background: "#fff",
    padding: "0 6px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#6366f1",
    zIndex: 1,
    letterSpacing: "0.5px",
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
  };

  return (
    <div className="page-container" style={{ padding: "40px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Mapping Form Card */}
        <form onSubmit={handleSave} style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          marginBottom: "40px",
        }}>
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>
              Configure Tab Heading & Checkboxes Mapping
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>

            {/* Step 1: Select Tab */}
            <div style={{ position: "relative" }}>
              <label style={floatingLabelStyle}>SELECT TAB HEADING *</label>
              <select
                name="tab_id"
                value={selectedTabId}
                onChange={(e) => setSelectedTabId(e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                  backgroundSize: "18px",
                }}
              >
                <option value="">Select Tab Heading</option>
                {tabs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tab_name} ({t.tab_title})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Checklist Card */}
            {selectedTabId && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#475569", margin: 0 }}>
                    MAPPED CHECKBOXES (CODE MODULES)
                  </h4>
                  {checkboxes.length > 0 && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedCheckboxIds(checkboxes.map((cb) => cb.id))}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCheckboxIds([])}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: "#fef2f2",
                          color: "#dc2626",
                          border: "1px solid #fecaca",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {checkboxes.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "14px" }}>No active checkboxes configured</p>
                ) : (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                    background: "#f8fafc",
                    padding: "25px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0"
                  }}>
                    {checkboxes.map((cb) => {
                      const isChecked = selectedCheckboxIds.includes(cb.id);
                      return (
                        <div
                          key={cb.id}
                          onClick={() => handleCheckboxToggle(cb.id)}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                            padding: "16px",
                            borderRadius: "10px",
                            background: isChecked ? "#eff6ff" : "#fff",
                            border: isChecked ? "1.5px solid #3b82f6" : "1.5px solid #e2e8f0",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <div style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "4px",
                            border: isChecked ? "none" : "2px solid #cbd5e1",
                            background: isChecked ? "#3b82f6" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: "2px"
                          }}>
                            {isChecked && <Check size={14} color="#fff" />}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "14px", color: isChecked ? "#1d4ed8" : "#334155" }}>
                              {cb.label}
                            </div>
                            {cb.description && (
                              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                {cb.description}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {selectedTabId && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", marginTop: "40px" }}>
              <button
                type="submit"
                style={{
                  background: "#4f46e5",
                  color: "#fff",
                  padding: "14px 40px",
                  borderRadius: "12px",
                  fontWeight: "700",
                  border: "none",
                  fontSize: "15px",
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
                }}
              >
                Save Mapping
              </button>
            </div>
          )}
        </form>

        {/* Current Mappings Display */}
        {selectedTabId && (
          <div style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          }}>
            <div style={{ marginBottom: "25px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>
                Active Mappings Summary
              </h3>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>S.NO</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>TAB NAME</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>CHECKBOX LABEL</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>MAPPING STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMappings.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                        No Checkboxes Mapped
                      </td>
                    </tr>
                  ) : (
                    currentMappings.map((map, index) => (
                      <tr key={map.checkbox_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "16px" }}>{index + 1}</td>
                        <td style={{ padding: "16px", color: "#64748b" }}>{map.tab_name || "—"}</td>
                        <td style={{ padding: "16px", fontWeight: "600", color: "#1e293b" }}>{map.checkbox_label}</td>
                        <td style={{ padding: "16px" }}>
                          <span style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "700",
                            background: "#dcfce7",
                            color: "#166534",
                          }}>
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MultitabMappings;
