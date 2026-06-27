import React, { useEffect, useState } from "react";
import { getMultitabPreview } from "../../api/multitab.api";
import { HelpCircle, Info } from "lucide-react";

// Inline Dynamic Component Renderer
const DynamicComponentRenderer: React.FC<{ fileUrl: string }> = ({ fileUrl }) => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadBabelAndRun = async () => {
      try {
        // Load Babel from local public folder — no CDN dependency
        if (!(window as any).Babel) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "/babel.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load local Babel compiler"));
            document.head.appendChild(script);
          });
        }

        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.statusText}`);
        }
        const rawCode = await response.text();

        // Transpile TSX to JS — use "classic" runtime so JSX compiles to React.createElement
        // (avoids requiring "react/jsx-runtime" which is not in the sandbox)
        const compiled = (window as any).Babel.transform(rawCode, {
          presets: [
            ["env", { modules: "commonjs" }],
            ["react", { runtime: "classic" }],
            "typescript"
          ],
          filename: "dynamic_component.tsx",
        }).code;

        // Execute code and extract component
        const exports: any = {};

        // Build a pre-configured apiFetch helper available to all dynamic modules
        const _getToken = () => localStorage.getItem("token") || "";
        const _apiBase = (() => {
          // Derive from current page origin, fallback to backend port 5000
          const origin = window.location.origin;
          return origin.includes("5173") || origin.includes("3000")
            ? origin.replace(/:\d+$/, ":5000") + "/api"
            : origin + "/api";
        })();
        const apiFetch = async (path: string, options: RequestInit = {}) => {
          const res = await fetch(`${_apiBase}${path}`, {
            ...options,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${_getToken()}`,
              ...((options.headers as Record<string, string>) || {}),
            },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          const json = await res.json();
          return json.data ?? json;
        };

        const requireMap: Record<string, any> = {
          react: {
            ...React,
            default: React,
            useState: React.useState,
            useEffect: React.useEffect,
            useCallback: React.useCallback,
            useMemo: React.useMemo,
            useRef: React.useRef,
            useReducer: React.useReducer,
          },
          // Fallback for automatic JSX runtime (in case a module uses it)
          "react/jsx-runtime": {
            jsx: React.createElement,
            jsxs: React.createElement,
            Fragment: React.Fragment,
          },
          "react/jsx-dev-runtime": {
            jsxDEV: React.createElement,
            Fragment: React.Fragment,
          },
          // Modules can do: const { apiFetch } = require("api");
          api: { apiFetch },
        };

        const customRequire = (name: string) => {
          if (requireMap[name]) return requireMap[name];
          throw new Error(`Module '${name}' is not pre-configured.`);
        };

        const runCode = new Function("exports", "require", "React", compiled);
        runCode(exports, customRequire, React);

        const FoundComponent = exports.default || Object.values(exports)[0];
        if (typeof FoundComponent !== "function") {
          throw new Error("No React component exported.");
        }

        if (active) {
          setComponent(() => FoundComponent);
        }
      } catch (err: any) {
        console.error("Dynamic Component execution error:", err);
        if (active) {
          setError(err.message || "Failed to compile code component.");
        }
      }
    };

    loadBabelAndRun();

    return () => {
      active = false;
    };
  }, [fileUrl]);

  if (error) {
    return (
      <div style={{ padding: "20px", color: "#b91c1c", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "8px" }}>
        <strong>Error Loading Component:</strong> {error}
      </div>
    );
  }

  if (!Component) {
    return <div style={{ padding: "20px", color: "#64748b" }}>Compiling and loading dynamic module...</div>;
  }

  return <Component />;
};

interface MultitabContentLoaderProps {
  menuTitle: string;
  children: React.ReactNode;
}

export const MultitabContentLoader: React.FC<MultitabContentLoaderProps> = ({ menuTitle, children }) => {
  const [menus, setMenus] = useState<any[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [activeTabId, setActiveTabId] = useState<number | null>(null); // null = default list
  const [popupData, setPopupData] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await getMultitabPreview();
        // Match by Menu Title name (ignoring casing and spaces)
        const matched = res.filter((m: any) =>
          m.menu_title_name?.toLowerCase().replace(/\s+/g, "") ===
          menuTitle.toLowerCase().replace(/\s+/g, "")
        );
        setMenus(matched);
        if (matched.length > 0) {
          setActiveMenuId(matched[0].id);
        }
      } catch (error) {
        console.error("Failed to load multitab config on page:", error);
      }
    };
    loadConfig();
  }, [menuTitle]);

  const activeMenu = menus.find(m => m.id === activeMenuId);
  const activeTab = activeMenu?.tabs?.find((t: any) => t.id === activeTabId);

  // If there are no configured tabs for this module, just render the default children
  const hasTabs = menus.some(m => m.tabs && m.tabs.length > 0);
  if (!hasTabs) {
    return <>{children}</>;
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Menu / Module Tabs Header */}
      <div style={{
        display: "flex",
        borderBottom: "2px solid #e2e8f0",
        marginBottom: "30px",
        overflowX: "auto",
        gap: "10px",
        background: "#fff",
        padding: "10px 20px 0 20px",
        borderRadius: "12px 12px 0 0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}>
        {/* Default Tab representing the standard list/page */}
        <button
          onClick={() => setActiveTabId(null)}
          style={{
            padding: "14px 20px",
            border: "none",
            borderBottom: activeTabId === null ? "3px solid #4f46e5" : "3px solid transparent",
            background: "transparent",
            color: activeTabId === null ? "#4f46e5" : "#64748b",
            fontWeight: activeTabId === null ? "700" : "600",
            fontSize: "14px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.2s",
          }}
        >
          Standard List
        </button>

        {/* Dynamic Tab Headings from multitab config */}
        {activeMenu?.tabs?.map((tab: any) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 20px",
                border: "none",
                borderBottom: isActive ? "3px solid #4f46e5" : "3px solid transparent",
                background: "transparent",
                color: isActive ? "#4f46e5" : "#64748b",
                fontWeight: isActive ? "700" : "600",
                fontSize: "14px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {tab.image_url && (
                <img
                  src={tab.image_url}
                  alt=""
                  style={{ width: "16px", height: "16px", borderRadius: "3px", objectFit: "cover" }}
                />
              )}
              <span>{tab.tab_name}</span>
            </button>
          );
        })}
      </div>

      {/* Rendering Content */}
      {activeTabId === null ? (
        children
      ) : (
        activeTab && (
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "40px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
            border: "1px solid #e2e8f0"
          }}>
            {/* Tab Header Detail */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "20px",
              marginBottom: "30px",
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{activeTab.tab_title}</span>
                  {activeTab.description && (
                    <button
                      onClick={() => setPopupData({ title: `${activeTab.tab_name} Description`, content: activeTab.description })}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      <HelpCircle size={18} color="#4f46e5" />
                    </button>
                  )}
                </h3>
              </div>
              {activeTab.image_url && (
                <img
                  src={activeTab.image_url}
                  alt={activeTab.tab_name}
                  style={{ maxHeight: "60px", borderRadius: "8px", objectFit: "contain" }}
                />
              )}
            </div>

            {/* Render Mapped Code Checkbox Components */}
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              {activeTab.checkboxes?.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", border: "2px dashed #e2e8f0", borderRadius: "12px" }}>
                  No checkboxes or component modules mapped to this tab heading.
                </div>
              ) : (
                activeTab.checkboxes?.map((cb: any) => (
                  <div
                    key={cb.id}
                    style={{
                      border: "1px solid #f1f5f9",
                      borderRadius: "12px",
                      padding: "24px",
                      background: "#f8fafc",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
                      <span style={{ fontWeight: "800", fontSize: "16px", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{cb.label}</span>
                        {cb.description && (
                          <button
                            onClick={() => setPopupData({ title: `${cb.label} Description`, content: cb.description })}
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
                          >
                            <Info size={15} color="#4f46e5" />
                          </button>
                        )}
                      </span>
                    </div>

                    {/* Compile & Render Component Files */}
                    {cb.file_urls && cb.file_urls.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {cb.file_urls.map((fileUrl: string, idx: number) => (
                          <div key={idx} style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <DynamicComponentRenderer fileUrl={fileUrl} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: "#94a3b8", fontSize: "13px" }}>No code files associated.</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      )}

      {/* Info Modal */}
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
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
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
                  cursor: "pointer",
                  color: "#64748b",
                  fontWeight: "bold",
                }}
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
