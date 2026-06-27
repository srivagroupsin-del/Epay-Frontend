import React, { useEffect, useState, useMemo } from "react";
import { Layers, Eye, HelpCircle, SlidersHorizontal } from "lucide-react";
import { Select } from "antd";
import { getMultitabPreview, getMenuAssociations, saveMenuAssociations } from "../../../api/multitab.api";
import { useLoading } from "../../../context/LoadingContext";
import { getSectorTitles } from "../../../api/sectorTitle.api";
import { getSectors } from "../../../api/sectors.api";
import { getSubSubSectors } from "../../subsector/models/subSectors.api";
import { getCategories } from "../../../api/category.api";
import { getBrands } from "../../../api/brand.api";
import { getProducts } from "../../../api/product.api";
import { http } from "../../../base_api/base_api";

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

// Searchable Checkbox List Component (used for Multitab Menu selections)
const SearchableCheckboxList: React.FC<{
  items: { id: string | number; name: string }[];
  checkedIds: Set<string>;
  onChange: (id: string, checked: boolean) => void;
  placeholder?: string;
}> = ({ items, checkedIds, onChange, placeholder = "Search options..." }) => {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    return items.filter(item => (item.name || "").toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  return (
    <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px", background: "#fff", maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", marginBottom: "4px", outline: "none" }}
      />
      {filtered.length === 0 ? (
        <span style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "10px" }}>No items found</span>
      ) : (
        filtered.map(item => {
          const idStr = String(item.id);
          const isChecked = checkedIds.has(idStr);
          return (
            <label key={idStr} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", color: "#475569", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={e => onChange(idStr, e.target.checked)}
                style={{ width: "15px", height: "15px", accentColor: "#4f46e5", cursor: "pointer" }}
              />
              <span>{item.name}</span>
            </label>
          );
        })
      )}
    </div>
  );
};

// Inline Dynamic Component Renderer
const DynamicComponentRenderer: React.FC<{
  fileUrl: string;
  menuTitleName?: string;
  menuTitleData?: string;
  menuName?: string;
  selectedSectorTitleId?: string;
  selectedSectorId?: string;
  selectedSubSectorId?: string;
  selectedPrimaryCategoryId?: string;
  selectedSecondaryCategoryId?: string;
  selectedBrandId?: string;
  selectedProductId?: string;
}> = ({
  fileUrl,
  menuTitleName,
  menuTitleData,
  menuName,
  selectedSectorTitleId,
  selectedSectorId,
  selectedSubSectorId,
  selectedPrimaryCategoryId,
  selectedSecondaryCategoryId,
  selectedBrandId,
  selectedProductId
}) => {
    const [Component, setComponent] = useState<React.ComponentType<{
      menuTitleName?: string;
      menuTitleData?: string;
      menuName?: string;
      selectedSectorTitleId?: string;
      selectedSectorId?: string;
      selectedSubSectorId?: string;
      selectedPrimaryCategoryId?: string;
      selectedSecondaryCategoryId?: string;
      selectedBrandId?: string;
      selectedProductId?: string;
    }> | null>(null);
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

          // Transpile TSX to JS
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

          // Build a pre-configured apiFetch helper
          const _getToken = () => localStorage.getItem("token") || "";
          const _apiBase = (() => {
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
            "react/jsx-runtime": {
              jsx: React.createElement,
              jsxs: React.createElement,
              Fragment: React.Fragment,
            },
            "react/jsx-dev-runtime": {
              jsxDEV: React.createElement,
              Fragment: React.Fragment,
            },
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

    return (
      <Component
        menuTitleName={menuTitleName}
        menuTitleData={menuTitleData}
        menuName={menuName}
        selectedSectorTitleId={selectedSectorTitleId}
        selectedSectorId={selectedSectorId}
        selectedSubSectorId={selectedSubSectorId}
        selectedPrimaryCategoryId={selectedPrimaryCategoryId}
        selectedSecondaryCategoryId={selectedSecondaryCategoryId}
        selectedBrandId={selectedBrandId}
        selectedProductId={selectedProductId}
      />
    );
  };

const MultitabPreview: React.FC = () => {
  const { showLoader, hideLoader } = useLoading();
  const [data, setData] = useState<MenuItem[]>([]);

  // Selected state for navigation demo (multiple menu IDs!)
  const [activeMenuIds, setActiveMenuIds] = useState<Set<number>>(new Set());
  const [tempActiveMenuIds, setTempActiveMenuIds] = useState<Set<number>>(new Set());
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [popupData, setPopupData] = useState<{ title: string; content: string } | null>(null);

  // Selected checkbox in the active tab (single selection)
  const [activeCheckboxId, setActiveCheckboxId] = useState<number | null>(null);

  // Dropdowns lists state
  const [sectorTitlesList, setSectorTitlesList] = useState<any[]>([]);
  const [sectorsList, setSectorsList] = useState<any[]>([]);
  const [subSectorsList, setSubSectorsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [categoryBrandMappings, setCategoryBrandMappings] = useState<any[]>([]);
  const [productMappings, setProductMappings] = useState<any[]>([]);

  // Upper layer filters for cascading selections
  const [filterSectorTitleId, setFilterSectorTitleId] = useState("");
  const [filterSectorId, setFilterSectorId] = useState("");
  const [filterSubSectorId, setFilterSubSectorId] = useState("");
  const [filterPrimaryCategoryId, setFilterPrimaryCategoryId] = useState("");
  const [filterSecondaryCategoryId, setFilterSecondaryCategoryId] = useState("");
  const [, setFilterBrandId] = useState("");

  // Selected values for top filters (applied on save button click)
  const [menuTitleFilter, setMenuTitleFilter] = useState("Sector Title");
  const [selSectorTitleId, setSelSectorTitleId] = useState("");
  const [selSectorId, setSelSectorId] = useState("");
  const [selSubSectorId, setSelSubSectorId] = useState("");
  const [selPrimaryCategoryId, setSelPrimaryCategoryId] = useState("");
  const [selSecondaryCategoryId, setSelSecondaryCategoryId] = useState("");
  const [selBrandId, setSelBrandId] = useState("");
  const [selProductId, setSelProductId] = useState("");

  const loadData = async () => {
    try {
      showLoader("Assembling preview workspace...");
      const res = await getMultitabPreview();
      setData(res);
    } catch (error) {
      console.error("Failed to load preview data:", error);
    } finally {
      hideLoader();
    }
  };

  const loadFilterData = async () => {
    try {
      const [titlesRes, sectorsRes, subSectorsRes, categoriesRes, brandsRes, productsRes, cbMappingsRes, pMappingsRes] = await Promise.allSettled([
        getSectorTitles(),
        getSectors(),
        getSubSubSectors(),
        getCategories(),
        getBrands(),
        getProducts({ limit: 9999 }),
        http("/category-brand/list"),
        http("/products/mappings")
      ]);

      const titlesData = titlesRes.status === "fulfilled" ? titlesRes.value : [];
      const sectorsData = sectorsRes.status === "fulfilled" ? sectorsRes.value : [];
      const subSectorsData = subSectorsRes.status === "fulfilled" ? subSectorsRes.value : [];
      const categoriesData = categoriesRes.status === "fulfilled" ? categoriesRes.value : [];
      const brandsData = brandsRes.status === "fulfilled" ? brandsRes.value : [];
      
      let productsData = [];
      if (productsRes.status === "fulfilled") {
        const val = productsRes.value;
        productsData = val?.data || val || [];
      }

      const cbMappingsData = (cbMappingsRes.status === "fulfilled" && cbMappingsRes.value?.success) 
        ? (cbMappingsRes.value?.data || []) 
        : [];

      const pMappingsData = (pMappingsRes.status === "fulfilled" && pMappingsRes.value?.success)
        ? (pMappingsRes.value?.data || [])
        : [];

      setSectorTitlesList(titlesData);
      setSectorsList(sectorsData);
      setSubSectorsList(subSectorsData);
      setCategoriesList(categoriesData);
      setBrandsList(brandsData);
      setProductsList(productsData);
      setCategoryBrandMappings(cbMappingsData);
      setProductMappings(pMappingsData);
    } catch (err) {
      console.error("Failed to load filter dropdown entities:", err);
    }
  };

  // Fetch saved associations from db
  const fetchSavedAssociations = async (menuTitle: string, idStr: string, parentIdStr?: string) => {
    if (!menuTitle || !idStr) {
      setTempActiveMenuIds(new Set());
      setActiveMenuIds(new Set());
      return;
    }
    try {
      const associatedId = Number(idStr);
      const parentAssociatedId = parentIdStr ? Number(parentIdStr) : null;
      const savedMenuIds = await getMenuAssociations(menuTitle, associatedId, parentAssociatedId);
      const menuIdsSet = new Set<number>(savedMenuIds.map(Number));
      setTempActiveMenuIds(menuIdsSet);
      setActiveMenuIds(menuIdsSet);
    } catch (err) {
      console.error("Failed to load saved associations:", err);
    }
  };

  useEffect(() => {
    loadData();
    loadFilterData();
  }, []);

  // Filter lists based on selected parent filters
  const filteredSectors = useMemo(() => {
    if (!filterSectorTitleId) return sectorsList;
    return sectorsList.filter(s => String(s.sector_title_id) === String(filterSectorTitleId));
  }, [sectorsList, filterSectorTitleId]);

  const filteredSubSectors = useMemo(() => {
    let list = subSectorsList;
    if (filterSectorId) {
      list = list.filter(ss => String(ss.sector_id) === String(filterSectorId));
    } else if (filterSectorTitleId) {
      const parentSectorIds = sectorsList
        .filter(s => String(s.sector_title_id) === String(filterSectorTitleId))
        .map(s => String(s.id));
      list = list.filter(ss => parentSectorIds.includes(String(ss.sector_id)));
    }
    return list;
  }, [subSectorsList, filterSectorId, filterSectorTitleId, sectorsList]);

  const filteredCategories = useMemo(() => {
    let list = categoriesList;
    if (filterSubSectorId) {
      list = list.filter(c => String(c.sub_sector_id) === String(filterSubSectorId));
    } else if (filterSectorId) {
      list = list.filter(c => String(c.sector_id) === String(filterSectorId));
    } else if (filterSectorTitleId) {
      list = list.filter(c => String(c.sector_title_id) === String(filterSectorTitleId));
    }
    return list;
  }, [categoriesList, filterSubSectorId, filterSectorId, filterSectorTitleId]);

  // Filter brands based on primary/secondary category using mappings tree
  const filteredBrands = useMemo(() => {
    if (!filterPrimaryCategoryId) return brandsList;

    const matchedBrandIds = new Set<number>();
    categoryBrandMappings.forEach(m => {
      const matchPrimary = String(m.primary_id) === String(filterPrimaryCategoryId);
      if (matchPrimary) {
        if (filterSecondaryCategoryId) {
          const matchSecondary = String(m.secondary_id) === String(filterSecondaryCategoryId);
          if (matchSecondary) {
            matchedBrandIds.add(m.brand_id);
          }
        } else {
          matchedBrandIds.add(m.brand_id);
        }
      }
    });

    return brandsList.filter(b => matchedBrandIds.has(b.id));
  }, [brandsList, categoryBrandMappings, filterPrimaryCategoryId, filterSecondaryCategoryId]);

  // Filter products based on selected cascading category filters (from /api/products/mappings)
  const filteredProducts = useMemo(() => {
    if (!filterPrimaryCategoryId && !filterSecondaryCategoryId) return productsList;

    const matchedProductIds = new Set<number>();
    productMappings.forEach(m => {
      // 1. Primary Category Filter
      if (filterPrimaryCategoryId) {
        const matchPrimary = String(m.primary_category_id) === String(filterPrimaryCategoryId);
        if (!matchPrimary) return;
      }

      // 2. Secondary Category Filter
      if (filterSecondaryCategoryId) {
        const matchSecondary = String(m.secondary_category_id) === String(filterSecondaryCategoryId);
        if (!matchSecondary) return;
      }

      matchedProductIds.add(m.product_id);
    });

    return productsList.filter(p => matchedProductIds.has(p.id));
  }, [productsList, productMappings, filterPrimaryCategoryId, filterSecondaryCategoryId]);

  // Whenever the active selection changes, fetch the saved associations from the database!
  useEffect(() => {
    let activeId = "";
    let parentId = "";

    if (menuTitleFilter === "Sector Title") {
      activeId = selSectorTitleId;
    } else if (menuTitleFilter === "Sector") {
      activeId = selSectorId;
    } else if (menuTitleFilter === "Sub Sector") {
      activeId = selSubSectorId;
    } else if (menuTitleFilter === "Category") {
      if (selSecondaryCategoryId) {
        activeId = selSecondaryCategoryId;
        parentId = selPrimaryCategoryId;
      } else {
        activeId = selPrimaryCategoryId;
      }
    } else if (menuTitleFilter === "Brand") {
      activeId = selBrandId;
    } else if (menuTitleFilter === "Product") {
      activeId = selProductId;
    }

    fetchSavedAssociations(menuTitleFilter, activeId, parentId);
  }, [
    menuTitleFilter,
    selSectorTitleId,
    selSectorId,
    selSubSectorId,
    selPrimaryCategoryId,
    selSecondaryCategoryId,
    selBrandId,
    selProductId
  ]);

  const activeMenus = useMemo(() => {
    return data.filter(m => activeMenuIds.has(m.id));
  }, [data, activeMenuIds]);

  const activeTabsList = useMemo(() => {
    const list: TabItem[] = [];
    activeMenus.forEach(menu => {
      menu.tabs.forEach(tab => {
        if (!list.some(t => t.id === tab.id)) {
          list.push(tab);
        }
      });
    });
    return list;
  }, [activeMenus]);

  const activeTab = useMemo(() => {
    return activeTabsList.find(t => t.id === activeTabId) || activeTabsList[0] || null;
  }, [activeTabsList, activeTabId]);

  // When activeTab changes, maintain active checkbox state
  useEffect(() => {
    if (activeTab) {
      if (activeTabId !== activeTab.id) {
        setActiveTabId(activeTab.id);
      }
      if (activeTab.checkboxes.length > 0) {
        const exists = activeTab.checkboxes.some(cb => cb.id === activeCheckboxId);
        if (!exists) {
          setActiveCheckboxId(activeTab.checkboxes[0].id);
        }
      } else {
        setActiveCheckboxId(null);
      }
    } else {
      setActiveTabId(null);
      setActiveCheckboxId(null);
    }
  }, [activeTab, activeCheckboxId, activeTabId]);

  // Compute textual selected menu title data name
  const menuTitleDataName = useMemo(() => {
    if (menuTitleFilter === "Sector Title") {
      return sectorTitlesList.find(t => String(t.id) === String(selSectorTitleId))?.title || "";
    }
    if (menuTitleFilter === "Sector") {
      const s = sectorsList.find(s => String(s.id) === String(selSectorId));
      return s ? (s.sector_name || s.name) : "";
    }
    if (menuTitleFilter === "Sub Sector") {
      const ss = subSectorsList.find(ss => String(ss.id) === String(selSubSectorId));
      return ss ? (ss.sub_sector_name || ss.name) : "";
    }
    if (menuTitleFilter === "Category") {
      const p = categoriesList.find(c => String(c.id) === String(selPrimaryCategoryId))?.category_name || "";
      const s = categoriesList.find(c => String(c.id) === String(selSecondaryCategoryId))?.category_name || "";
      return s ? `${p} → ${s}` : p;
    }
    if (menuTitleFilter === "Brand") {
      return brandsList.find(b => String(b.id) === String(selBrandId))?.brand_name || "";
    }
    if (menuTitleFilter === "Product") {
      return productsList.find(p => String(p.id) === String(selProductId))?.product_name || "";
    }
    return "";
  }, [menuTitleFilter, selSectorTitleId, selSectorId, selSubSectorId, selPrimaryCategoryId, selSecondaryCategoryId, selBrandId, selProductId, sectorTitlesList, sectorsList, subSectorsList, categoriesList, brandsList, productsList]);

  // Combined menu name for injection props
  const menuNameStr = useMemo(() => {
    return activeMenus.map(m => m.menu_name).join(", ");
  }, [activeMenus]);

  return (
    <div className="page-container" style={{ padding: "40px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Title */}
        <div style={{ marginBottom: "25px", display: "flex", alignItems: "center", gap: "12px" }}>
          <Eye size={28} color="#4f46e5" />
          <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
            Interactive Multitab Live Preview
          </h2>
        </div>

        {/* 🔍 GLOBAL FILTERS & TAX AUDIT CONTROLS CARD */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "28px",
          marginBottom: "30px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <SlidersHorizontal size={20} color="#4f46e5" />
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#1e293b" }}>
              Global Filter & Tax Audit Controls
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            {/* Split controls into left/right columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "30px", alignItems: "start" }}>
              
              {/* Left Side: General Menu Setup */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#4f46e5", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Menu Title *</label>
                  <Select
                    id="filter-menu-title"
                    showSearch
                    style={{ width: "100%" }}
                    value={menuTitleFilter}
                    onChange={(value) => {
                      setMenuTitleFilter(value);
                      setSelSectorTitleId("");
                      setSelSectorId("");
                      setSelSubSectorId("");
                      setSelPrimaryCategoryId("");
                      setSelSecondaryCategoryId("");
                      setSelBrandId("");
                      setSelProductId("");
                      // Reset filter states
                      setFilterSectorTitleId("");
                      setFilterSectorId("");
                      setFilterSubSectorId("");
                      setFilterPrimaryCategoryId("");
                      setFilterSecondaryCategoryId("");
                      setFilterBrandId("");
                    }}
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                    options={[
                      { value: "Sector Title", label: "Sector Title" },
                      { value: "Sector", label: "Sector" },
                      { value: "Sub Sector", label: "Sub Sector" },
                      { value: "Category", label: "Category" },
                      { value: "Brand", label: "Brand" },
                      { value: "Product", label: "Product" },
                    ]}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Select Multitab Menu (Select Multiple) *
                  </label>
                  <SearchableCheckboxList
                    items={data.map(m => ({ id: m.id, name: m.menu_name }))}
                    checkedIds={new Set(Array.from(tempActiveMenuIds).map(String))}
                    onChange={(id, checked) => {
                      setTempActiveMenuIds(prev => {
                        const next = new Set(prev);
                        const idNum = Number(id);
                        if (checked) next.add(idNum);
                        else next.delete(idNum);
                        return next;
                      });
                    }}
                    placeholder="Search Multitab Menus..."
                  />
                </div>
              </div>

              {/* Right Side: Cascading Helper Filters & Target Selector */}
              <div style={{
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                <div style={{ borderBottom: "1.5px solid #cbd5e1", paddingBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Cascading Selection Panel
                  </span>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", background: "#fff", padding: "3px 8px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    Target: {menuTitleFilter}
                  </span>
                </div>

                {menuTitleFilter === "Sector Title" && (
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#4f46e5", marginBottom: "6px", textTransform: "uppercase" }}>Select Sector Title *</label>
                    <Select
                      id="filter-sector-title"
                      showSearch
                      style={{ width: "100%" }}
                      placeholder="Select Sector Title"
                      value={selSectorTitleId || undefined}
                      onChange={(value) => setSelSectorTitleId(value)}
                      filterOption={(input, option) =>
                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      options={sectorTitlesList.map(st => {
                        const sectorCount = sectorsList.filter(s => String(s.sector_title_id) === String(st.id)).length;
                        return {
                          value: String(st.id),
                          label: `${st.title} (${sectorCount} sectors)`
                        };
                      })}
                    />
                  </div>
                )}

                {menuTitleFilter === "Sector" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter by Sector Title</label>
                      <Select
                        showSearch
                        placeholder="All Sector Titles"
                        allowClear
                        style={{ width: "100%" }}
                        value={filterSectorTitleId || undefined}
                        onChange={(val) => {
                          setFilterSectorTitleId(val || "");
                          setSelSectorId("");
                        }}
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        options={sectorTitlesList.map(st => {
                          const sectorCount = sectorsList.filter(s => String(s.sector_title_id) === String(st.id)).length;
                          return {
                            value: String(st.id),
                            label: `${st.title} (${sectorCount} sectors)`
                          };
                        })}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#4f46e5", marginBottom: "6px", textTransform: "uppercase" }}>Select Sector *</label>
                      <Select
                        id="filter-sector"
                        showSearch
                        style={{ width: "100%" }}
                        placeholder="Select Sector"
                        value={selSectorId || undefined}
                        onChange={(value) => setSelSectorId(value)}
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        options={filteredSectors.map(s => {
                          const subSectorCount = subSectorsList.filter(ss => String(ss.sector_id) === String(s.id)).length;
                          return {
                            value: String(s.id),
                            label: `${s.sector_name || s.name} (${subSectorCount} sub sectors)`
                          };
                        })}
                      />
                    </div>
                  </div>
                )}

                {menuTitleFilter === "Sub Sector" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter Sector Title</label>
                        <Select
                          showSearch
                          placeholder="All"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterSectorTitleId || undefined}
                          onChange={(val) => {
                            setFilterSectorTitleId(val || "");
                            setFilterSectorId("");
                            setSelSubSectorId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={sectorTitlesList.map(st => {
                            const sectorCount = sectorsList.filter(s => String(s.sector_title_id) === String(st.id)).length;
                            return {
                              value: String(st.id),
                              label: `${st.title} (${sectorCount} sectors)`
                            };
                          })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter Sector</label>
                        <Select
                          showSearch
                          placeholder="All"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterSectorId || undefined}
                          onChange={(val) => {
                            setFilterSectorId(val || "");
                            setSelSubSectorId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={filteredSectors.map(s => {
                            const subSectorCount = subSectorsList.filter(ss => String(ss.sector_id) === String(s.id)).length;
                            return {
                              value: String(s.id),
                              label: `${s.sector_name || s.name} (${subSectorCount} sub sectors)`
                            };
                          })}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#4f46e5", marginBottom: "6px", textTransform: "uppercase" }}>Select Sub Sector *</label>
                      <Select
                        id="filter-sub-sector"
                        showSearch
                        style={{ width: "100%" }}
                        placeholder="Select Sub Sector"
                        value={selSubSectorId || undefined}
                        onChange={(value) => setSelSubSectorId(value)}
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        options={filteredSubSectors.map(ss => {
                          const categoryCount = categoriesList.filter(c => String(c.sub_sector_id) === String(ss.id) && c.category_type === "primary").length;
                          return {
                            value: String(ss.id),
                            label: `${ss.sub_sector_name || ss.name} (${categoryCount} primary categories)`
                          };
                        })}
                      />
                    </div>
                  </div>
                )}

                {menuTitleFilter === "Category" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "9px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter Title</label>
                        <Select
                          showSearch
                          placeholder="All"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterSectorTitleId || undefined}
                          onChange={(val) => {
                            setFilterSectorTitleId(val || "");
                            setFilterSectorId("");
                            setFilterSubSectorId("");
                            setSelPrimaryCategoryId("");
                            setSelSecondaryCategoryId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={sectorTitlesList.map(st => {
                            const sectorCount = sectorsList.filter(s => String(s.sector_title_id) === String(st.id)).length;
                            return {
                              value: String(st.id),
                              label: `${st.title} (${sectorCount} sectors)`
                            };
                          })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "9px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter Sector</label>
                        <Select
                          showSearch
                          placeholder="All"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterSectorId || undefined}
                          onChange={(val) => {
                            setFilterSectorId(val || "");
                            setFilterSubSectorId("");
                            setSelPrimaryCategoryId("");
                            setSelSecondaryCategoryId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={filteredSectors.map(s => {
                            const subSectorCount = subSectorsList.filter(ss => String(ss.sector_id) === String(s.id)).length;
                            return {
                              value: String(s.id),
                              label: `${s.sector_name || s.name} (${subSectorCount} sub sectors)`
                            };
                          })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "9px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter Sub</label>
                        <Select
                          showSearch
                          placeholder="All"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterSubSectorId || undefined}
                          onChange={(val) => {
                            setFilterSubSectorId(val || "");
                            setSelPrimaryCategoryId("");
                            setSelSecondaryCategoryId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={filteredSubSectors.map(ss => {
                            const categoryCount = categoriesList.filter(c => String(c.sub_sector_id) === String(ss.id) && c.category_type === "primary").length;
                            return {
                              value: String(ss.id),
                              label: `${ss.sub_sector_name || ss.name} (${categoryCount} primary categories)`
                            };
                          })}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#4f46e5", marginBottom: "6px", textTransform: "uppercase" }}>Select Primary Category *</label>
                        <Select
                          id="filter-category-primary"
                          showSearch
                          style={{ width: "100%" }}
                          placeholder="Primary Category"
                          value={selPrimaryCategoryId || undefined}
                          onChange={(value) => {
                            setSelPrimaryCategoryId(value);
                            setSelSecondaryCategoryId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={filteredCategories.filter(c => c.category_type === "primary" || !c.parent_category_id).map(c => {
                            const secondaryCount = categoriesList.filter(sub => sub.category_type === "secondary" && String(sub.parent_category_id) === String(c.id)).length;
                            return {
                              value: String(c.id),
                              label: `${c.category_name} (${secondaryCount} secondary)`
                            };
                          })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: selPrimaryCategoryId ? "#64748b" : "#cbd5e1", marginBottom: "6px", textTransform: "uppercase" }}>Secondary Category</label>
                        <Select
                          id="filter-category-secondary"
                          showSearch
                          disabled={!selPrimaryCategoryId}
                          style={{ width: "100%" }}
                          placeholder="Secondary Category"
                          value={selSecondaryCategoryId || undefined}
                          onChange={(value) => setSelSecondaryCategoryId(value || "")}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={filteredCategories.filter(c => c.category_type === "secondary" && String(c.parent_category_id) === String(selPrimaryCategoryId)).map(c => ({
                            value: String(c.id),
                            label: c.category_name
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {menuTitleFilter === "Brand" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "9px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter Title</label>
                        <Select
                          showSearch
                          placeholder="All"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterSectorTitleId || undefined}
                          onChange={(val) => {
                            setFilterSectorTitleId(val || "");
                            setFilterSectorId("");
                            setFilterSubSectorId("");
                            setFilterPrimaryCategoryId("");
                            setFilterSecondaryCategoryId("");
                            setSelBrandId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={sectorTitlesList.map(st => {
                            const sectorCount = sectorsList.filter(s => String(s.sector_title_id) === String(st.id)).length;
                            return {
                              value: String(st.id),
                              label: `${st.title} (${sectorCount} sectors)`
                            };
                          })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "9px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter Sector</label>
                        <Select
                          showSearch
                          placeholder="All"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterSectorId || undefined}
                          onChange={(val) => {
                            setFilterSectorId(val || "");
                            setFilterSubSectorId("");
                            setFilterPrimaryCategoryId("");
                            setFilterSecondaryCategoryId("");
                            setSelBrandId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={filteredSectors.map(s => {
                            const subSectorCount = subSectorsList.filter(ss => String(ss.sector_id) === String(s.id)).length;
                            return {
                              value: String(s.id),
                              label: `${s.sector_name || s.name} (${subSectorCount} sub sectors)`
                            };
                          })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "9px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter Sub</label>
                        <Select
                          showSearch
                          placeholder="All"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterSubSectorId || undefined}
                          onChange={(val) => {
                            setFilterSubSectorId(val || "");
                            setFilterPrimaryCategoryId("");
                            setFilterSecondaryCategoryId("");
                            setSelBrandId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={filteredSubSectors.map(ss => {
                            const categoryCount = categoriesList.filter(c => String(c.sub_sector_id) === String(ss.id) && c.category_type === "primary").length;
                            return {
                              value: String(ss.id),
                              label: `${ss.sub_sector_name || ss.name} (${categoryCount} primary categories)`
                            };
                          })}
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter Category (Primary)</label>
                        <Select
                          showSearch
                          placeholder="Primary Category"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterPrimaryCategoryId || undefined}
                          onChange={(val) => {
                            setFilterPrimaryCategoryId(val || "");
                            setFilterSecondaryCategoryId("");
                            setSelBrandId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={filteredCategories.filter(c => c.category_type === "primary" || !c.parent_category_id).map(c => {
                            const secondaryCount = categoriesList.filter(sub => sub.category_type === "secondary" && String(sub.parent_category_id) === String(c.id)).length;
                            return {
                              value: String(c.id),
                              label: `${c.category_name} (${secondaryCount} secondary)`
                            };
                          })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: filterPrimaryCategoryId ? "#64748b" : "#cbd5e1", marginBottom: "6px", textTransform: "uppercase" }}>Filter Category (Secondary)</label>
                        <Select
                          showSearch
                          disabled={!filterPrimaryCategoryId}
                          placeholder="Secondary Category"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterSecondaryCategoryId || undefined}
                          onChange={(val) => {
                            setFilterSecondaryCategoryId(val || "");
                            setSelBrandId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={filteredCategories.filter(c => c.category_type === "secondary" && String(c.parent_category_id) === String(filterPrimaryCategoryId)).map(c => {
                            const mappedBrandsCount = categoryBrandMappings.filter(m => String(m.secondary_id) === String(c.id)).length;
                            return {
                              value: String(c.id),
                              label: `${c.category_name} (${mappedBrandsCount} brands)`
                            };
                          })}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#4f46e5", marginBottom: "6px", textTransform: "uppercase" }}>Select Brand *</label>
                      <Select
                        id="filter-brand"
                        showSearch
                        style={{ width: "100%" }}
                        placeholder="Select Brand"
                        value={selBrandId || undefined}
                        onChange={(value) => setSelBrandId(value)}
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        options={filteredBrands.map(b => {
                          const productCount = productMappings.filter(m => {
                            if (String(m.brand_id) !== String(b.id)) return false;
                            if (filterPrimaryCategoryId && String(m.primary_category_id) !== String(filterPrimaryCategoryId)) return false;
                            if (filterSecondaryCategoryId && String(m.secondary_category_id) !== String(filterSecondaryCategoryId)) return false;
                            return true;
                          }).length;
                          return {
                            value: String(b.id),
                            label: `${b.brand_name} (${productCount} products)`
                          };
                        })}
                      />
                    </div>
                  </div>
                )}

                {menuTitleFilter === "Product" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "9px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter Title</label>
                        <Select
                          showSearch
                          placeholder="All"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterSectorTitleId || undefined}
                          onChange={(val) => {
                            setFilterSectorTitleId(val || "");
                            setFilterSectorId("");
                            setFilterSubSectorId("");
                            setFilterPrimaryCategoryId("");
                            setFilterSecondaryCategoryId("");
                            setSelProductId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={sectorTitlesList.map(st => {
                            const sectorCount = sectorsList.filter(s => String(s.sector_title_id) === String(st.id)).length;
                            return {
                              value: String(st.id),
                              label: `${st.title} (${sectorCount} sectors)`
                            };
                          })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "9px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter Sector</label>
                        <Select
                          showSearch
                          placeholder="All"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterSectorId || undefined}
                          onChange={(val) => {
                            setFilterSectorId(val || "");
                            setFilterSubSectorId("");
                            setFilterPrimaryCategoryId("");
                            setFilterSecondaryCategoryId("");
                            setSelProductId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={filteredSectors.map(s => {
                            const subSectorCount = subSectorsList.filter(ss => String(ss.sector_id) === String(s.id)).length;
                            return {
                              value: String(s.id),
                              label: `${s.sector_name || s.name} (${subSectorCount} sub sectors)`
                            };
                          })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "9px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter Sub</label>
                        <Select
                          showSearch
                          placeholder="All"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterSubSectorId || undefined}
                          onChange={(val) => {
                            setFilterSubSectorId(val || "");
                            setFilterPrimaryCategoryId("");
                            setFilterSecondaryCategoryId("");
                            setSelProductId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={filteredSubSectors.map(ss => {
                            const categoryCount = categoriesList.filter(c => String(c.sub_sector_id) === String(ss.id) && c.category_type === "primary").length;
                            return {
                              value: String(ss.id),
                              label: `${ss.sub_sector_name || ss.name} (${categoryCount} primary categories)`
                            };
                          })}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Filter Category (Primary)</label>
                        <Select
                          showSearch
                          placeholder="Primary Category"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterPrimaryCategoryId || undefined}
                          onChange={(val) => {
                            setFilterPrimaryCategoryId(val || "");
                            setFilterSecondaryCategoryId("");
                            setSelProductId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={filteredCategories.filter(c => c.category_type === "primary" || !c.parent_category_id).map(c => {
                            const secondaryCount = categoriesList.filter(sub => sub.category_type === "secondary" && String(sub.parent_category_id) === String(c.id)).length;
                            return {
                              value: String(c.id),
                              label: `${c.category_name} (${secondaryCount} secondary)`
                            };
                          })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: filterPrimaryCategoryId ? "#64748b" : "#cbd5e1", marginBottom: "6px", textTransform: "uppercase" }}>Filter Category (Secondary)</label>
                        <Select
                          showSearch
                          disabled={!filterPrimaryCategoryId}
                          placeholder="Secondary Category"
                          allowClear
                          style={{ width: "100%" }}
                          value={filterSecondaryCategoryId || undefined}
                          onChange={(val) => {
                            setFilterSecondaryCategoryId(val || "");
                            setSelProductId("");
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={filteredCategories.filter(c => c.category_type === "secondary" && String(c.parent_category_id) === String(filterPrimaryCategoryId)).map(c => {
                            const mappedBrandsCount = categoryBrandMappings.filter(m => String(m.secondary_id) === String(c.id)).length;
                            return {
                              value: String(c.id),
                              label: `${c.category_name} (${mappedBrandsCount} brands)`
                            };
                          })}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#4f46e5", marginBottom: "6px", textTransform: "uppercase" }}>Select Product *</label>
                      <Select
                        id="filter-product"
                        showSearch
                        style={{ width: "100%" }}
                        placeholder="Select Product"
                        value={selProductId || undefined}
                        onChange={(value) => setSelProductId(value)}
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        options={filteredProducts.map(p => ({
                          value: String(p.id),
                          label: p.product_name
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Save/Apply Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #e2e8f0", paddingTop: "15px" }}>
              <button
                type="button"
                onClick={async () => {
                  let activeId = "";
                  let parentId = "";

                  if (menuTitleFilter === "Sector Title") {
                    activeId = selSectorTitleId;
                  } else if (menuTitleFilter === "Sector") {
                    activeId = selSectorId;
                  } else if (menuTitleFilter === "Sub Sector") {
                    activeId = selSubSectorId;
                  } else if (menuTitleFilter === "Category") {
                    if (selSecondaryCategoryId) {
                      activeId = selSecondaryCategoryId;
                      parentId = selPrimaryCategoryId;
                    } else {
                      activeId = selPrimaryCategoryId;
                    }
                  } else if (menuTitleFilter === "Brand") {
                    activeId = selBrandId;
                  } else if (menuTitleFilter === "Product") {
                    activeId = selProductId;
                  }

                  if (!activeId) {
                    alert("Please select Menu Title Data first.");
                    return;
                  }

                  try {
                    showLoader("Saving menu associations...");
                    const menuIds = Array.from(tempActiveMenuIds);
                    await saveMenuAssociations({
                      menuTitle: menuTitleFilter,
                      associatedId: Number(activeId),
                      parentAssociatedId: parentId ? Number(parentId) : null,
                      menuIds
                    });

                    // Update live preview state
                    setActiveMenuIds(new Set(tempActiveMenuIds));
                    alert("Mappings saved successfully and applied to preview canvas!");
                  } catch (err: any) {
                    alert("Failed to save menu associations: " + err.message);
                  } finally {
                    hideLoader();
                  }
                }}
                style={{
                  padding: "12px 32px",
                  background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                SAVE
              </button>
            </div>
          </div>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>

            {/* Bottom Panel: Interactive Tabs and Component Fields */}
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
              border: "1px solid #e2e8f0"
            }}>

              {/* Header: Tab items */}
              {activeTabsList.length > 0 ? (
                <div style={{
                  display: "flex",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  padding: "0 24px",
                  overflowX: "auto",
                }}>
                  {activeTabsList.map((tab) => {
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
                  No tabs configured for selected menu(s).
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                      {/* Checkbox Checklist Selectors */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <label style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>
                          Select checklist item to preview
                        </label>
                        {activeTab.checkboxes.map((cb) => {
                          const isSelected = cb.id === activeCheckboxId;
                          return (
                            <div
                              key={cb.id}
                              onClick={() => setActiveCheckboxId(isSelected ? null : cb.id)}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "12px",
                                padding: "16px",
                                borderRadius: "10px",
                                border: isSelected ? "2px solid #4f46e5" : "1.5px solid #e2e8f0",
                                background: isSelected ? "#f8fafc" : "#fff",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setActiveCheckboxId(isSelected ? null : cb.id);
                                }}
                                style={{ marginTop: "4px", width: "16px", height: "16px", cursor: "pointer", accentColor: "#4f46e5" }}
                              />
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <span style={{ fontWeight: "700", fontSize: "14px", color: isSelected ? "#4f46e5" : "#1e293b" }}>
                                  {cb.label}
                                </span>
                                {cb.description && (
                                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                                    {cb.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Render Active Checkbox Component Content */}
                      {(() => {
                        const selectedCb = activeTab.checkboxes.find(cb => cb.id === activeCheckboxId);
                        if (!selectedCb) return null;

                        return (
                          <div style={{ marginTop: "15px" }}>
                            {selectedCb.file_urls && selectedCb.file_urls.length > 0 ? (
                              selectedCb.file_urls.map((fileUrl: string, idx: number) => (
                                <div key={idx} style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                                  <DynamicComponentRenderer
                                    fileUrl={fileUrl}
                                    menuTitleName={menuTitleFilter}
                                    menuTitleData={menuTitleDataName}
                                    menuName={menuNameStr}
                                    selectedSectorTitleId={selSectorTitleId}
                                    selectedSectorId={selSectorId}
                                    selectedSubSectorId={selSubSectorId}
                                    selectedPrimaryCategoryId={selPrimaryCategoryId}
                                    selectedSecondaryCategoryId={selSecondaryCategoryId}
                                    selectedBrandId={selBrandId}
                                    selectedProductId={selProductId}
                                  />
                                </div>
                              ))
                            ) : (
                              <div
                                style={{
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "12px",
                                  padding: "24px",
                                  background: "#fff",
                                  color: "#64748b",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px"
                                }}
                              >
                                <span style={{ fontWeight: "800", fontSize: "15px" }}>{selectedCb.label}</span>
                                <span style={{ color: "#94a3b8", fontSize: "13px" }}>(No code module uploaded)</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
