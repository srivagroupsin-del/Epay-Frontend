import React, { useEffect, useState } from "react";
import { Layers, CheckSquare, Eye, ListFilter, Info, HelpCircle } from "lucide-react";
import { getMultitabPreview } from "../../../api/multitab.api";
import { useLoading } from "../../../context/LoadingContext";

interface CheckboxItem {
  id: number;
  label: string;
  description: string;
  files: string[];
  file_urls: string[];
  status: string;
}

interface TabItem {
  id: number;
  tab_name: string;
  tab_title: string;
  description: string;
  image: string;
  image_url: string;
  status: string;
  checkboxes: CheckboxItem[];
}

interface MenuItem {
  id: number;
  menu_name: string;
  menu_title_name: string;
  tabs: TabItem[];
}

const MultitabPreview: React.FC = () => {
  const { showLoader, hideLoader } = useLoading();
  const [data, setData] = useState<MenuItem[]>([]);
  
  // Selected state for navigation demo
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [popupData, setPopupData] = useState<{ title: string; content: string } | null>(null);

  const loadData = async () => {
    try {
      showLoader("Assembling preview workspace...");
      const res = await getMultitabPreview();
      setData(res);
      
      // Auto-select first active menu and tab
      if (res.length > 0) {
        setActiveMenuId(res[0].id);
        if (res[0].tabs.length > 0) {
          setActiveTabId(res[0].tabs[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load preview data:", error);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeMenu = data.find(m => m.id === activeMenuId);
  const activeTab = activeMenu?.tabs.find(t => t.id === activeTabId);


  return (
    <div className="page-container" style={{ padding: "40px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Title */}
        <div style={{ marginBottom: "35px", display: "flex", alignItems: "center", gap: "12px" }}>
          <Eye size={28} color="#4f46e5" />
          <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
            Interactive Multitab Live Preview
          </h2>
        </div>

        {data.length === 0 ? (
          <div style={{
            background: "#fff",
            padding: "80px 40px",
            borderRadius: "16px",
            textAlign: "center",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
            color: "#64748b",
          }}>
            <Layers size={48} color="#cbd5e1" style={{ marginBottom: "20px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#334155" }}>No Mapped Data Found</h3>
            <p style={{ fontSize: "14px", marginTop: "8px" }}>
              Configure menus, tab headings, checkboxes, and mappings to view the live preview canvas.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "30px" }}>
            
            {/* Sidebar Left: Menus List */}
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
              border: "1px solid #e2e8f0",
              height: "fit-content",
            }}>
              <h4 style={{
                fontSize: "12px",
                fontWeight: "800",
                color: "#94a3b8",
                letterSpacing: "1px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <ListFilter size={14} /> SELECT SYSTEM MENU
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.map((menu) => {
                  const isActive = menu.id === activeMenuId;
                  return (
                    <button
                      key={menu.id}
                      onClick={() => {
                        setActiveMenuId(menu.id);
                        if (menu.tabs.length > 0) {
                          setActiveTabId(menu.tabs[0].id);
                        } else {
                          setActiveTabId(null);
                        }
                      }}
                      style={{
                        textAlign: "left",
                        padding: "14px 18px",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: "700",
                        border: "none",
                        background: isActive ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "#f8fafc",
                        color: isActive ? "#fff" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{menu.menu_name}</span>
                      <span style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "6px",
                        background: isActive ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                        color: isActive ? "#fff" : "#64748b",
                      }}>
                        {menu.tabs.length} Tabs
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Interactive Tabs and Component Fields */}
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}>
              
              {/* Header: Tab items */}
              {activeMenu && activeMenu.tabs.length > 0 ? (
                <div style={{
                  display: "flex",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  padding: "0 24px",
                  overflowX: "auto",
                }}>
                  {activeMenu.tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "18px 24px",
                          border: "none",
                          borderBottom: isActive ? "3px solid #4f46e5" : "3px solid transparent",
                          background: "transparent",
                          color: isActive ? "#4f46e5" : "#64748b",
                          fontWeight: isActive ? "800" : "600",
                          fontSize: "14px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tab.image_url && (
                          <img
                            src={tab.image_url}
                            alt=""
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "4px",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <span>{tab.tab_name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                  No tabs configured for this menu.
                </div>
              )}

              {/* Tab Content Display */}
              {activeTab && (
                <div style={{ padding: "40px" }}>
                  <div style={{ marginBottom: "30px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{activeTab.tab_title}</span>
                      {activeTab.description && (
                        <button
                          type="button"
                          onClick={() => setPopupData({ title: `${activeTab.tab_name} Description`, content: activeTab.description })}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer"
                          }}
                          title="Show Description"
                        >
                          <HelpCircle size={18} color="#4f46e5" />
                        </button>
                      )}
                    </h3>
                  </div>

                  {/* Components Display */}
                  <h4 style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "#94a3b8",
                    letterSpacing: "1px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <CheckSquare size={14} /> ACTIVE MODULE COMPONENTS
                  </h4>

                  {activeTab.checkboxes.length === 0 ? (
                    <div style={{
                      padding: "40px",
                      border: "2px dashed #cbd5e1",
                      borderRadius: "12px",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}>
                      No checklist checkboxes mapped to this tab heading.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {activeTab.checkboxes.map((cb) => (
                        <div
                          key={cb.id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            padding: "24px",
                            background: "#fff",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input
                              type="checkbox"
                              checked={true}
                              readOnly
                              style={{
                                width: "18px",
                                height: "18px",
                                cursor: "pointer",
                                accentColor: "#4f46e5",
                              }}
                            />
                            <span style={{ fontWeight: "800", fontSize: "15px", color: "#1e293b", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                              <span>{cb.label}</span>
                              {cb.description && (
                                <button
                                  type="button"
                                  onClick={() => setPopupData({ title: `${cb.label} Description`, content: cb.description })}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer"
                                  }}
                                  title="Show Description"
                                >
                                  <Info size={15} color="#4f46e5" />
                                </button>
                              )}
                            </span>
                          </div>

                          <div style={{ paddingLeft: "28px" }}>

                            {/* Files */}
                            {/* <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                              {cb.files && cb.files.length > 0 ? (
                                cb.files.map((file, idx) => (
                                  <a
                                    key={idx}
                                    href={cb.file_urls[idx]}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      background: "#f1f5f9",
                                      color: "#475569",
                                      textDecoration: "none",
                                      border: "1px solid #e2e8f0",
                                    }}
                                  >
                                    <FileCode size={13} color="#4f46e5" />
                                    <span>{getFileName(file)}</span>
                                  </a>
                                ))
                              ) : (
                                <span style={{ color: "#94a3b8", fontSize: "12px" }}>No code files loaded.</span>
                              )}
                            </div> */}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Description Popup Modal */}
      {popupData && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }} 
          onClick={() => setPopupData(null)}
        >
          <div 
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "30px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e2e8f0",
              position: "relative",
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                {popupData.title}
              </h3>
              <button 
                onClick={() => setPopupData(null)} 
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                  fontWeight: "bold",
                  fontSize: "14px",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" }}>
              {popupData.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultitabPreview;
