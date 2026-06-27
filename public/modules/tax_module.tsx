import React, { useState, useEffect, useMemo } from "react";

// Pre-configured fetch helper is injected into our runtime context
const { apiFetch } = require("api");

// -------------------------------------------------------------
// 🗃️ DETAILED MOCK DATASETS (Fallback when backend is empty)
// -------------------------------------------------------------
const MOCK_SECTOR_TITLES = [
  { id: 1, name: "Agriculture & Allied" },
  { id: 2, name: "Electronics & Tech" },
  { id: 3, name: "Healthcare & Biotech" }
];

const MOCK_SECTORS = [
  { id: 101, sector_title_id: 1, name: "Organic Crop Farming" },
  { id: 102, sector_title_id: 1, name: "Livestock & Dairy" },
  { id: 201, sector_title_id: 2, name: "Consumer Hardware" },
  { id: 202, sector_title_id: 2, name: "Enterprise Networking" },
  { id: 301, sector_title_id: 3, name: "Medical Devices" },
  { id: 302, sector_title_id: 3, name: "Pharmaceuticals" }
];

const MOCK_SUB_SECTORS = [
  { id: 1001, sector_id: 101, name: "Grains & Cereals" },
  { id: 1002, sector_id: 101, name: "Vegetables & Roots" },
  { id: 1003, sector_id: 102, name: "Dairy Products" },
  { id: 2001, sector_id: 201, name: "Smartphones & Tablets" },
  { id: 2002, sector_id: 201, name: "Audio Equipment" },
  { id: 3001, sector_id: 301, name: "Diagnostic Scanners" }
];

const MOCK_CATEGORIES = [
  { id: 10001, sub_sector_id: 1001, category_name: "Premium Durum Wheat", category_type: "primary", parent_category_id: null },
  { id: 10002, sub_sector_id: 1002, category_name: "Fresh Potatoes", category_type: "primary", parent_category_id: null },
  { id: 10003, sub_sector_id: 1003, category_name: "Pasteurized Milk", category_type: "primary", parent_category_id: null },
  { id: 20001, sub_sector_id: 2001, category_name: "Android Mobile Devices", category_type: "primary", parent_category_id: null },
  { id: 20002, sub_sector_id: 2002, category_name: "Wireless Earbuds", category_type: "primary", parent_category_id: null },
  { id: 30001, sub_sector_id: 3001, category_name: "MRI Machines", category_type: "primary", parent_category_id: null },
  // Secondary categories
  { id: 40001, sub_sector_id: 2001, category_name: "OLED Smartphones", category_type: "secondary", parent_category_id: 20001 },
  { id: 40002, sub_sector_id: 2001, category_name: "LCD Smartphones", category_type: "secondary", parent_category_id: 20001 }
];

const MOCK_PRODUCTS = [
  { id: 50001, category_id: 10001, product_name: "Sharbati Durum Wheat 5kg" },
  { id: 50002, category_id: 10002, product_name: "Organic Russet Potatoes 1kg" },
  { id: 50003, category_id: 10003, product_name: "Homogenized Milk Tetrapack 1L" },
  { id: 50004, category_id: 40001, product_name: "Epay Phone X1 Pro Max (OLED)" },
  { id: 50005, category_id: 20002, product_name: "AeroSound Pro TWS Earbuds" },
  { id: 50006, category_id: 30001, product_name: "SuperScan MRI System v3.2" }
];

// Initial dynamic GST/VAT Master Rates
const DEFAULT_TAX_MASTER = [
  { id: 1, tax_name: "GST 18%", tax_type: "GST", percentage: 18 },
  { id: 2, tax_name: "GST 12%", tax_type: "GST", percentage: 12 },
  { id: 3, tax_name: "GST 5%", tax_type: "GST", percentage: 5 },
  { id: 4, tax_name: "VAT 5%", tax_type: "VAT", percentage: 5 },
  { id: 5, tax_name: "VAT 15%", tax_type: "VAT", percentage: 15 }
];

export default function TaxModule(props: {
  menuTitleName?: string;
  selectedSectorTitleId?: string;
  selectedSectorId?: string;
  selectedSubSectorId?: string;
  selectedPrimaryCategoryId?: string;
  selectedSecondaryCategoryId?: string;
  selectedBrandId?: string;
}) {
  const [activeTab, setActiveTab] = useState<"master" | "assign" | "resolve">("master");
  const [assignSubTab, setAssignSubTab] = useState<"sector" | "subsector" | "category" | "product">("sector");

  // -------------------------------------------------------------
  // 💾 STATE MANAGEMENT
  // -------------------------------------------------------------
  const [taxMaster, setTaxMaster] = useState<any[]>(() => {
    const saved = localStorage.getItem("tax_master_list");
    return saved ? JSON.parse(saved) : DEFAULT_TAX_MASTER;
  });

  const [assignments, setAssignments] = useState<any[]>(() => {
    const saved = localStorage.getItem("tax_assignments_list");
    return saved ? JSON.parse(saved) : [];
  });

  // DB entities
  const [sectorTitles, setSectorTitles] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [subSectors, setSubSectors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form selections (Assignments)
  const [selectedSectorTitleId, setSelectedSectorTitleId] = useState("");
  const [selectedSectorId, setSelectedSectorId] = useState("");
  const [selectedSubSectorId, setSelectedSubSectorId] = useState("");
  const [selectedPrimaryCategoryId, setSelectedPrimaryCategoryId] = useState("");
  const [selectedSecondaryCategoryId, setSelectedSecondaryCategoryId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedTaxId, setSelectedTaxId] = useState("");
  const [selectedTaxType, setSelectedTaxType] = useState("");

  // Edit states
  const [editingMasterId, setEditingMasterId] = useState<number | null>(null);
  const [masterType, setMasterType] = useState("GST");
  const [masterPercent, setMasterPercent] = useState("");

  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);

  // Sync with global top filters props
  useEffect(() => {
    if (props.selectedSectorTitleId !== undefined) {
      setSelectedSectorTitleId(props.selectedSectorTitleId || "");
    }
  }, [props.selectedSectorTitleId]);

  useEffect(() => {
    if (props.selectedSectorId !== undefined) {
      setSelectedSectorId(props.selectedSectorId || "");
    }
  }, [props.selectedSectorId]);

  useEffect(() => {
    if (props.selectedSubSectorId !== undefined) {
      setSelectedSubSectorId(props.selectedSubSectorId || "");
    }
  }, [props.selectedSubSectorId]);

  useEffect(() => {
    if (props.selectedPrimaryCategoryId !== undefined) {
      setSelectedPrimaryCategoryId(props.selectedPrimaryCategoryId || "");
    }
  }, [props.selectedPrimaryCategoryId]);

  useEffect(() => {
    if (props.selectedSecondaryCategoryId !== undefined) {
      setSelectedSecondaryCategoryId(props.selectedSecondaryCategoryId || "");
    }
  }, [props.selectedSecondaryCategoryId]);

  useEffect(() => {
    if (props.selectedBrandId !== undefined) {
      setSelectedBrandId(props.selectedBrandId || "");
    }
  }, [props.selectedBrandId]);

  // Set default / pre-selected Sector Title if menuTitleName is provided
  useEffect(() => {
    if (props.menuTitleName && sectorTitles.length > 0) {
      const matched = sectorTitles.find(
        t => t.name.toLowerCase().trim() === props.menuTitleName?.toLowerCase().trim()
      );
      if (matched) {
        setSelectedSectorTitleId(String(matched.id));
      }
    }
  }, [props.menuTitleName, sectorTitles]);


  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // -------------------------------------------------------------
  // 📡 API INTEGRATION & FALLBACKS
  // -------------------------------------------------------------
  useEffect(() => {
    const loadAllEntities = async () => {
      setLoading(true);
      try {
        const [titlesRes, sectorsRes, subSectorsRes, categoriesRes, productsRes, brandsRes] = await Promise.allSettled([
          apiFetch("/sectorTitleRoutes"),
          apiFetch("/sectors"),
          apiFetch("/sub-sectors"),
          apiFetch("/categories"),
          apiFetch("/products?limit=9999"),
          apiFetch("/brands"),
        ]);

        const titlesData = titlesRes.status === "fulfilled" ? (titlesRes.value?.data || titlesRes.value) : [];
        const sectorsData = sectorsRes.status === "fulfilled" ? (sectorsRes.value?.data || sectorsRes.value) : [];
        const subSectorsData = subSectorsRes.status === "fulfilled" ? (subSectorsRes.value?.data || subSectorsRes.value) : [];
        const categoriesData = categoriesRes.status === "fulfilled" ? (categoriesRes.value?.data || categoriesRes.value) : [];
        const productsData = productsRes.status === "fulfilled" ? (productsRes.value?.data || productsRes.value) : [];
        const brandsData = brandsRes.status === "fulfilled" ? (brandsRes.value?.data || brandsRes.value) : [];

        setSectorTitles(titlesData.length ? titlesData.map((t: any) => ({ id: t.id, name: t.name || t.sector_title })) : MOCK_SECTOR_TITLES);
        setSectors(sectorsData.length ? sectorsData.map((s: any) => ({ id: s.id, sector_title_id: s.sector_title_id, name: s.sector_name || s.name })) : MOCK_SECTORS);
        setSubSectors(subSectorsData.length ? subSectorsData.map((ss: any) => ({ id: ss.id, sector_id: ss.sector_id, name: ss.sub_sector_name || ss.name })) : MOCK_SUB_SECTORS);
        setCategories(categoriesData.length ? categoriesData.map((c: any) => ({ id: c.id, sub_sector_id: c.sub_sector_id, category_name: c.category_name, category_type: c.category_type || (c.parent_category_id ? "secondary" : "primary"), parent_category_id: c.parent_category_id || null })) : MOCK_CATEGORIES);
        setProducts(productsData.length ? productsData.map((p: any) => ({
          id: p.id,
          primary_category_id: p.primary_category_ids
            ? Number(String(p.primary_category_ids).split(",")[0])
            : null,
          secondary_category_id: p.secondary_category_ids
            ? Number(String(p.secondary_category_ids).split(",")[0])
            : null,
          category_id: p.secondary_category_ids
            ? Number(String(p.secondary_category_ids).split(",")[0])
            : p.primary_category_ids
            ? Number(String(p.primary_category_ids).split(",")[0])
            : null,
          brand_id: p.brand_ids
            ? Number(String(p.brand_ids).split(",")[0])
            : p.brand_id ? Number(p.brand_id) : null,
          product_name: p.product_name,
        })) : MOCK_PRODUCTS);
        setBrands(brandsData.length ? brandsData.map((b: any) => ({ id: b.id, name: b.brand_name || b.name })) : []);

      } catch (err) {
        console.error("Failed to load active entities from backend, falling back to mock layers:", err);
        setSectorTitles(MOCK_SECTOR_TITLES);
        setSectors(MOCK_SECTORS);
        setSubSectors(MOCK_SUB_SECTORS);
        setCategories(MOCK_CATEGORIES);
        setProducts(MOCK_PRODUCTS);
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllEntities();
  }, []);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("tax_master_list", JSON.stringify(taxMaster));
  }, [taxMaster]);

  useEffect(() => {
    localStorage.setItem("tax_assignments_list", JSON.stringify(assignments));
  }, [assignments]);

  // Reset form selections on tab change
  const handleTabChange = (tab: "master" | "assign" | "resolve") => {
    setActiveTab(tab);
    resetForm();
  };

  const handleSubTabChange = (subtab: "sector" | "subsector" | "category" | "product") => {
    setAssignSubTab(subtab);
    resetForm();
  };

  const resetForm = () => {
    setSelectedSectorTitleId("");
    setSelectedSectorId("");
    setSelectedSubSectorId("");
    setSelectedPrimaryCategoryId("");
    setSelectedSecondaryCategoryId("");
    setSelectedProductId("");
    setSelectedTaxId("");
    setSelectedTaxType("");
    setEditingAssignmentId(null);
  };


  // -------------------------------------------------------------
  // ⚡ DYNAMIC CASCADING SELECTIONS & FILTERING
  // -------------------------------------------------------------
  const activeTaxTypes = useMemo(() => {
    const types = new Set(taxMaster.map(t => t.tax_type));
    // Default system fallbacks if master list is empty
    if (types.size === 0) {
      return ["GST", "VAT", "CESS", "EXCISE"];
    }
    return Array.from(types);
  }, [taxMaster]);

  const sectorsFiltered = useMemo(() => {
    if (!selectedSectorTitleId) return [];
    return sectors.filter(s => String(s.sector_title_id) === String(selectedSectorTitleId));
  }, [selectedSectorTitleId, sectors]);

  const subSectorsFiltered = useMemo(() => {
    if (!selectedSectorId) return [];
    return subSectors.filter(ss => String(ss.sector_id) === String(selectedSectorId));
  }, [selectedSectorId, subSectors]);

  // For Categories block
  const categoriesFilteredBySubsector = useMemo(() => {
    if (!selectedSubSectorId) return [];
    return categories.filter(c => String(c.sub_sector_id) === String(selectedSubSectorId));
  }, [selectedSubSectorId, categories]);

  const primaryCategories = useMemo(() => {
    return categoriesFilteredBySubsector.filter(c => c.category_type === "primary" || !c.parent_category_id);
  }, [categoriesFilteredBySubsector]);

  const secondaryCategories = useMemo(() => {
    if (!selectedPrimaryCategoryId) return [];
    return categoriesFilteredBySubsector.filter(
      c => c.category_type === "secondary" && String(c.parent_category_id) === String(selectedPrimaryCategoryId)
    );
  }, [selectedPrimaryCategoryId, categoriesFilteredBySubsector]);

  // Products filtered under category (either secondary or primary selected)
  const productsFiltered = useMemo(() => {
    if (!selectedPrimaryCategoryId && !selectedSecondaryCategoryId) return [];
    let list = products.filter(p => {
      if (selectedSecondaryCategoryId) {
        return (
          Number(p.secondary_category_id) === Number(selectedSecondaryCategoryId) ||
          Number(p.category_id) === Number(selectedSecondaryCategoryId)
        );
      }
      return (
        Number(p.primary_category_id) === Number(selectedPrimaryCategoryId) ||
        Number(p.category_id) === Number(selectedPrimaryCategoryId)
      );
    });

    if (selectedBrandId) {
      list = list.filter(p => Number(p.brand_id) === Number(selectedBrandId));
    }

    return list;
  }, [selectedPrimaryCategoryId, selectedSecondaryCategoryId, selectedBrandId, products]);


  // Dynamically resolve the active Tax Type based on selection state (to filter options in Category/Product selectors)
  const currentResolvedTaxType = useMemo(() => {
    if (selectedSubSectorId) {
      const ssAssign = assignments.find(a => a.level === "sub_sector" && String(a.entity_id) === String(selectedSubSectorId));
      if (ssAssign && ssAssign.tax_type) return ssAssign.tax_type;
    }
    if (selectedSectorId) {
      const sAssign = assignments.find(a => a.level === "sector" && String(a.entity_id) === String(selectedSectorId));
      if (sAssign && sAssign.tax_type) return sAssign.tax_type;
    }
    return "GST"; // Default fallback type
  }, [selectedSubSectorId, selectedSectorId, assignments]);

  // Filter master rules by this resolved type for micro rate selectors
  const filteredTaxRulesForCascade = useMemo(() => {
    return taxMaster.filter(t => t.tax_type === currentResolvedTaxType);
  }, [taxMaster, currentResolvedTaxType]);

  // -------------------------------------------------------------
  // ⚙️ HIERARCHY CASCADING TAX RESOLVER (CORE ENGINE)
  // -------------------------------------------------------------
  const resolveProductTax = (productId: number) => {
    const productObj = products.find(p => p.id === productId);
    if (!productObj) return { rate: "Exempt", percentage: 0, source: "Default" };

    const categoryObj = categories.find(c => c.id === productObj.category_id);
    if (!categoryObj) return { rate: "Exempt", percentage: 0, source: "Default" };

    const subSectorObj = subSectors.find(ss => ss.id === categoryObj.sub_sector_id);
    const sectorObj = subSectorObj ? sectors.find(s => s.id === subSectorObj.sector_id) : null;

    // 1️⃣ Determine macro-level active Tax Type for this product path
    let resolvedTaxType = "GST";
    let typeSource = "Default Fallback";

    if (subSectorObj) {
      const ssAssign = assignments.find(a => a.level === "sub_sector" && String(a.entity_id) === String(subSectorObj.id));
      if (ssAssign && ssAssign.tax_type) {
        resolvedTaxType = ssAssign.tax_type;
        typeSource = `Sub-sector (${subSectorObj.name})`;
      } else if (sectorObj) {
        const sAssign = assignments.find(a => a.level === "sector" && String(a.entity_id) === String(sectorObj.id));
        if (sAssign && sAssign.tax_type) {
          resolvedTaxType = sAssign.tax_type;
          typeSource = `Sector (${sectorObj.name})`;
        }
      }
    }

    // 2️⃣ Resolve micro-level specific Percentage Rate under resolvedTaxType
    // A. Check Product Override
    const productAssign = assignments.find(a => a.level === "product" && String(a.entity_id) === String(productId));
    if (productAssign) {
      const tax = taxMaster.find(t => t.id === productAssign.tax_id);
      if (tax && tax.tax_type === resolvedTaxType) {
        return {
          rate: tax.tax_name,
          percentage: tax.percentage,
          source: `Product Override [Type: ${resolvedTaxType}]`,
          details: productObj.product_name
        };
      }
    }

    // B. Check Category Assignment
    const categoryAssign = assignments.find(a => a.level === "category" && String(a.entity_id) === String(categoryObj.id));
    if (categoryAssign) {
      const tax = taxMaster.find(t => t.id === categoryAssign.tax_id);
      if (tax && tax.tax_type === resolvedTaxType) {
        return {
          rate: tax.tax_name,
          percentage: tax.percentage,
          source: `Category: ${categoryObj.category_name} [Type: ${resolvedTaxType}]`,
          details: categoryObj.category_name
        };
      }
    }

    // C. Check Parent Category Assignment (if secondary category is unassigned)
    if (categoryObj.parent_category_id) {
      const parentAssign = assignments.find(a => a.level === "category" && String(a.entity_id) === String(categoryObj.parent_category_id));
      if (parentAssign) {
        const tax = taxMaster.find(t => t.id === parentAssign.tax_id);
        const parentCat = categories.find(c => c.id === categoryObj.parent_category_id);
        if (tax && tax.tax_type === resolvedTaxType) {
          return {
            rate: tax.tax_name,
            percentage: tax.percentage,
            source: `Primary Category: ${parentCat?.category_name} [Type: ${resolvedTaxType}]`,
            details: parentCat?.category_name
          };
        }
      }
    }

    // D. Fallback if no specific micro rate is configured: it defaults to Exempt for the determined type
    return {
      rate: `Exempt (${resolvedTaxType})`,
      percentage: 0,
      source: `Tax Type set by ${typeSource}`
    };
  };

  // Resolved list
  const resolvedProductGrid = useMemo(() => {
    return products.map(prod => {
      const cat = categories.find(c => c.id === prod.category_id);
      const sub = cat ? subSectors.find(s => s.id === cat.sub_sector_id) : null;
      const sec = sub ? sectors.find(s => s.id === sub.sector_id) : null;
      const title = sec ? sectorTitles.find(t => t.id === sec.sector_title_id) : null;

      const taxDetails = resolveProductTax(prod.id);

      return {
        ...prod,
        categoryName: cat?.category_name || "—",
        subSectorName: sub?.name || "—",
        sectorName: sec?.name || "—",
        sectorTitleName: title?.name || "—",
        taxRate: taxDetails.rate,
        taxPercent: taxDetails.percentage,
        taxSource: taxDetails.source,
      };
    });
  }, [products, categories, subSectors, sectors, sectorTitles, assignments, taxMaster]);

  const filteredResolvedGrid = useMemo(() => {
    if (!searchQuery.trim()) return resolvedProductGrid;
    const q = searchQuery.toLowerCase();
    return resolvedProductGrid.filter(
      p =>
        p.product_name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.sectorName.toLowerCase().includes(q) ||
        p.taxRate.toLowerCase().includes(q) ||
        p.taxSource.toLowerCase().includes(q)
    );
  }, [resolvedProductGrid, searchQuery]);

  // -------------------------------------------------------------
  // 🛠️ CRUD OPERATIONS — TAX MASTER (AUTO-NAMING RATE CREATOR)
  // -------------------------------------------------------------
  const handleSaveMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPercent) return alert("Please specify the percentage value.");

    const percentage = Number(masterPercent);
    if (isNaN(percentage)) return alert("Percentage value must be a number.");

    // Auto generate the Tax Name based on Type and Percentage
    const tax_name = `${masterType} ${percentage}%`;

    if (editingMasterId !== null) {
      setTaxMaster(prev =>
        prev.map(t =>
          t.id === editingMasterId ? { ...t, tax_name, tax_type: masterType, percentage } : t
        )
      );
      setEditingMasterId(null);
    } else {
      const newTax = {
        id: Date.now(),
        tax_name,
        tax_type: masterType,
        percentage
      };
      setTaxMaster(prev => [...prev, newTax]);
    }

    setMasterPercent("");
  };

  const handleEditMaster = (item: any) => {
    setEditingMasterId(item.id);
    setMasterType(item.tax_type);
    setMasterPercent(String(item.percentage));
  };

  const handleDeleteMaster = (id: number) => {
    if (confirm("Are you sure you want to delete this tax type? Any mappings using it will fall back to Exempt.")) {
      setTaxMaster(prev => prev.filter(t => t.id !== id));
      setAssignments(prev => prev.filter(a => a.tax_id !== id));
    }
  };

  // -------------------------------------------------------------
  // 🔗 MAPPING CRUD OPERATIONS — CASCADING ASSIGNMENTS
  // -------------------------------------------------------------
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();

    const uiTab = assignSubTab; // "sector" | "subsector" | "category" | "product"
    // Storage key — subsector saved as "sub_sector" to match resolver logic
    const storageLevel = uiTab === "subsector" ? "sub_sector" : uiTab;

    let targetEntityId = "";
    let displayName = "";
    let additionalInfo = "";

    if (uiTab === "sector") {
      if (!selectedSectorId) return alert("Please select a Sector.");
      targetEntityId = selectedSectorId;
      displayName = sectors.find(s => String(s.id) === String(selectedSectorId))?.name || "";
      const stName = sectorTitles.find(st => String(st.id) === String(selectedSectorTitleId))?.name || "";
      additionalInfo = `Sector Title: ${stName}`;
    } else if (uiTab === "subsector") {
      if (!selectedSubSectorId) return alert("Please select a Sub-sector.");
      targetEntityId = selectedSubSectorId;
      displayName = subSectors.find(ss => String(ss.id) === String(selectedSubSectorId))?.name || "";
      const sName = sectors.find(s => String(s.id) === String(selectedSectorId))?.name || "";
      additionalInfo = `Sector: ${sName}`;
    } else if (uiTab === "category") {
      const catId = selectedSecondaryCategoryId || selectedPrimaryCategoryId;
      if (!catId) return alert("Please select a Category.");
      targetEntityId = catId;
      const catObj = categories.find(c => String(c.id) === String(catId));
      displayName = catObj?.category_name || "";
      additionalInfo = catObj?.parent_category_id ? "Secondary Category" : "Primary Category";
    } else if (uiTab === "product") {
      if (!selectedProductId) return alert("Please select a Product.");
      targetEntityId = selectedProductId;
      displayName = products.find(p => String(p.id) === String(selectedProductId))?.product_name || "";
      const catName = categories.find(c => String(c.id) === String(selectedPrimaryCategoryId))?.category_name || "";
      additionalInfo = `Category: ${catName}`;
    }

    // Validate selections — macro levels only need a tax type, micro need a specific rate
    const isMacro = uiTab === "sector" || uiTab === "subsector";
    if (isMacro) {
      if (!selectedTaxType) return alert("Please select a Tax Type.");
    } else {
      if (!selectedTaxId) return alert("Please select a Tax Rule Rate.");
    }

    // If editing, update or insert new
    setAssignments(prev => {
      let filtered = prev;
      if (editingAssignmentId !== null) {
        filtered = prev.filter(a => a.id !== editingAssignmentId);
      } else {
        // Prevent duplicate assignments for the same item at the same level
        filtered = prev.filter(
          a => !(a.level === storageLevel && String(a.entity_id) === String(targetEntityId))
        );
      }
      return [
        ...filtered,
        {
          id: editingAssignmentId || Date.now(),
          level: storageLevel,
          entity_id: Number(targetEntityId),
          entity_name: displayName,
          tax_id: isMacro ? null : Number(selectedTaxId),
          tax_type: isMacro ? selectedTaxType : undefined,
          additional_info: additionalInfo,
          // Cascading contexts saved to re-populate selectors when editing
          context: {
            selectedSectorTitleId,
            selectedSectorId,
            selectedSubSectorId,
            selectedPrimaryCategoryId,
            selectedSecondaryCategoryId,
          }
        }
      ];
    });


    resetForm();
    alert("Tax assignment configuration updated and saved.");
  };

  const handleEditAssignment = (assign: any) => {
    setEditingAssignmentId(assign.id);
    const uiLevel = assign.level === "sub_sector" ? "subsector" : assign.level;
    setAssignSubTab(uiLevel);

    // Re-populate cascading context values
    const ctx = assign.context || {};
    setSelectedSectorTitleId(ctx.selectedSectorTitleId || "");
    setSelectedSectorId(ctx.selectedSectorId || "");
    setSelectedSubSectorId(ctx.selectedSubSectorId || "");
    setSelectedPrimaryCategoryId(ctx.selectedPrimaryCategoryId || "");
    setSelectedSecondaryCategoryId(ctx.selectedSecondaryCategoryId || "");
    
    if (assign.level === "sector") {
      setSelectedSectorId(String(assign.entity_id));
      setSelectedTaxType(assign.tax_type || "");
    } else if (assign.level === "sub_sector" || assign.level === "subsector") {
      setSelectedSubSectorId(String(assign.entity_id));
      setSelectedTaxType(assign.tax_type || "");
    } else {
      if (assign.level === "product") {
        setSelectedProductId(String(assign.entity_id));
      }
      setSelectedTaxId(String(assign.tax_id));
    }
  };


  const handleRemoveAssignment = (id: number) => {
    if (confirm("Are you sure you want to delete this assignment mapping?")) {
      setAssignments(prev => prev.filter(a => a.id !== id));
      if (editingAssignmentId === id) resetForm();
    }
  };

  // Level display helper
  const renderLevelName = (level: string) => {
    switch (level) {
      case "sector": return "Sector";
      case "subsector": return "Sub-sector";
      case "category": return "Category";
      case "product": return "Product Override";
      default: return level;
    }
  };

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", color: "#1e293b", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Dynamic Module Header Card */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        borderRadius: "16px",
        padding: "30px",
        color: "#ffffff",
        marginBottom: "30px",
        boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.2)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            🛡️ Dynamic Tax & Privilege Rules
          </h2>
          <p style={{ margin: "5px 0 0 0", color: "#e0e7ff", fontSize: "14px", fontWeight: "500" }}>
            Set, edit, and audit cascading dynamic GST/VAT rules down from Sector Title to single Products.
          </p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.15)", padding: "10px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: "700" }}>
          {loading ? "🔄 Syncing database..." : "⚡ Active Database Linked"}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: "flex",
        background: "#f1f5f9",
        padding: "6px",
        borderRadius: "12px",
        marginBottom: "30px",
        maxWidth: "600px"
      }}>
        <button
          onClick={() => handleTabChange("master")}
          style={{
            flex: 1,
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            background: activeTab === "master" ? "#fff" : "transparent",
            color: activeTab === "master" ? "#4f46e5" : "#64748b",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          1. Tax Master Rules
        </button>
        <button
          onClick={() => handleTabChange("assign")}
          style={{
            flex: 1,
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            background: activeTab === "assign" ? "#fff" : "transparent",
            color: activeTab === "assign" ? "#4f46e5" : "#64748b",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          2. Map & Cascading Assignments
        </button>
        <button
          onClick={() => handleTabChange("resolve")}
          style={{
            flex: 1,
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            background: activeTab === "resolve" ? "#fff" : "transparent",
            color: activeTab === "resolve" ? "#4f46e5" : "#64748b",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          3. Grid Audit & Overrides
        </button>
      </div>

      {/* -------------------------------------------------------------
          TAB 1: TAX MASTER MANAGER (ONLY TYPE & RATE SELECTIONS)
          ------------------------------------------------------------- */}
      {activeTab === "master" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "30px", alignItems: "start" }}>
          {/* Left Form */}
          <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "800", color: "#1e293b" }}>
              {editingMasterId !== null ? "📝 Edit Tax Rate" : "➕ Create Dynamic Tax Rule"}
            </h3>
            <form onSubmit={handleSaveMaster} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>SELECT TAX TYPE</label>
                <select
                  value={masterType}
                  onChange={(e) => setMasterType(e.target.value)}
                  style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
                >
                  <option value="GST">GST (Goods and Services Tax)</option>
                  <option value="VAT">VAT (Value Added Tax)</option>
                  <option value="CESS">CESS</option>
                  <option value="EXCISE">EXCISE Duty</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>ENTER PERCENT VALUE (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 18"
                  value={masterPercent}
                  onChange={(e) => setMasterPercent(e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                  style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: "12px",
                    background: "#4f46e5",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  {editingMasterId !== null ? "Save Update" : "Create Tax Rule"}
                </button>
                {editingMasterId !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMasterId(null);
                      setMasterPercent("");
                    }}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "#e2e8f0",
                      color: "#475569",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Master List */}
          <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "800", color: "#1e293b" }}>
              Active Dynamic Tax Rates
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {taxMaster.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 20px",
                    borderRadius: "10px",
                    border: "1px solid #f1f5f9",
                    background: "#f8fafc"
                  }}
                >
                  <div>
                    <span style={{ fontWeight: "700", color: "#1e293b", marginRight: "10px" }}>{item.tax_name}</span>
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: item.tax_type === "GST" ? "#e0e7ff" : "#fee2e2",
                      color: item.tax_type === "GST" ? "#4f46e5" : "#ef4444",
                      fontSize: "11px",
                      fontWeight: "700"
                    }}>
                      {item.tax_type}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <span style={{ fontWeight: "800", color: "#4f46e5" }}>{item.percentage}%</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleEditMaster(item)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "5px", display: "flex", alignItems: "center" }}
                        title="Edit Rate"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMaster(item.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "5px", display: "flex", alignItems: "center" }}
                        title="Delete Rate"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: CASCADING ASSIGNMENTS
          ------------------------------------------------------------- */}
      {activeTab === "assign" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {/* Sub Navigation for Levels */}
          <div style={{
            display: "flex",
            borderBottom: "2px solid #e2e8f0",
            gap: "20px"
          }}>
            {[
              { key: "sector", label: "Sector Mapping" },
              { key: "subsector", label: "Sub-sector Mapping" },
              { key: "category", label: "Category Mapping" },
              { key: "product", label: "Product Override" }
            ].map((sub) => {
              const isSel = assignSubTab === sub.key;
              return (
                <button
                  key={sub.key}
                  onClick={() => handleSubTabChange(sub.key as any)}
                  style={{
                    padding: "12px 6px",
                    border: "none",
                    borderBottom: isSel ? "3px solid #4f46e5" : "3px solid transparent",
                    background: "transparent",
                    color: isSel ? "#4f46e5" : "#64748b",
                    fontWeight: isSel ? "800" : "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "30px", alignItems: "start" }}>
            {/* Form Column */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "800", color: "#1e293b" }}>
                {editingAssignmentId !== null ? "📝 Edit Mapping Assignment" : `🔗 Configure ${renderLevelName(assignSubTab)}`}
              </h3>

              <form onSubmit={handleCreateAssignment} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                
                {/* Sector Title Selection (Root of cascades) */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>SELECT SECTOR TITLE *</label>
                  <select
                    value={selectedSectorTitleId}
                    onChange={(e) => {
                      setSelectedSectorTitleId(e.target.value);
                      setSelectedSectorId("");
                      setSelectedSubSectorId("");
                      setSelectedPrimaryCategoryId("");
                      setSelectedSecondaryCategoryId("");
                      setSelectedProductId("");
                    }}
                    style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  >
                    <option value="">Select Sector Title</option>
                    {sectorTitles.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>


                {/* Sector Dropdown (For Sector, Subsector, Category, Product) */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: selectedSectorTitleId ? "#64748b" : "#94a3b8", marginBottom: "4px" }}>SELECT SECTOR *</label>
                  <select
                    disabled={!selectedSectorTitleId}
                    value={selectedSectorId}
                    onChange={(e) => {
                      setSelectedSectorId(e.target.value);
                      setSelectedSubSectorId("");
                      setSelectedPrimaryCategoryId("");
                      setSelectedSecondaryCategoryId("");
                      setSelectedProductId("");
                    }}
                    style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  >
                    <option value="">Select Sector</option>
                    {sectorsFiltered.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Sub-sector Dropdown (For Subsector, Category, Product) */}
                {assignSubTab !== "sector" && (
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: selectedSectorId ? "#64748b" : "#94a3b8", marginBottom: "4px" }}>SELECT SUB-SECTOR *</label>
                    <select
                      disabled={!selectedSectorId}
                      value={selectedSubSectorId}
                      onChange={(e) => {
                        setSelectedSubSectorId(e.target.value);
                        setSelectedPrimaryCategoryId("");
                        setSelectedSecondaryCategoryId("");
                        setSelectedProductId("");
                      }}
                      style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                    >
                      <option value="">Select Sub-sector</option>
                      {subSectorsFiltered.map(ss => (
                        <option key={ss.id} value={ss.id}>{ss.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Category Selection Block (For Category, Product) */}
                {assignSubTab !== "sector" && assignSubTab !== "subsector" && (
                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: selectedSubSectorId ? "#64748b" : "#94a3b8", marginBottom: "4px" }}>PRIMARY CATEGORY *</label>
                      <select
                        disabled={!selectedSubSectorId}
                        value={selectedPrimaryCategoryId}
                        onChange={(e) => {
                          setSelectedPrimaryCategoryId(e.target.value);
                          setSelectedSecondaryCategoryId("");
                          setSelectedProductId("");
                        }}
                        style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                      >
                        <option value="">Select Primary Category</option>
                        {primaryCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.category_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: selectedPrimaryCategoryId ? "#64748b" : "#94a3b8", marginBottom: "4px" }}>SECONDARY CATEGORY (UNDER PRIMARY)</label>
                      <select
                        disabled={!selectedPrimaryCategoryId}
                        value={selectedSecondaryCategoryId}
                        onChange={(e) => {
                          setSelectedSecondaryCategoryId(e.target.value);
                          setSelectedProductId("");
                        }}
                        style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                      >
                        <option value="">Select Secondary Category (Optional)</option>
                        {secondaryCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.category_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Brand Dropdown (For Product Override only) */}
                {assignSubTab === "product" && (
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>FILTER BY BRAND (OPTIONAL)</label>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => {
                        setSelectedBrandId(e.target.value);
                        setSelectedProductId("");
                      }}
                      style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                    >
                      <option value="">All Brands</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Product Dropdown (For Product Override only) */}
                {assignSubTab === "product" && (
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: selectedPrimaryCategoryId ? "#64748b" : "#94a3b8", marginBottom: "4px" }}>SELECT PRODUCT *</label>
                    <select
                      disabled={!selectedPrimaryCategoryId}
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                    >
                      <option value="">Select Product</option>
                      {productsFiltered.map(p => (
                        <option key={p.id} value={p.id}>{p.product_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Macro level Tax Type selector VS Micro level Tax Rate selector */}
                {(assignSubTab === "sector" || assignSubTab === "subsector") ? (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>ASSIGN TAX TYPE</label>
                    <select
                      value={selectedTaxType}
                      onChange={(e) => setSelectedTaxType(e.target.value)}
                      style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
                    >
                      <option value="">Select Tax Type</option>
                      {activeTaxTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b" }}>
                        ASSIGN TAX RATE
                      </label>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#4f46e5", background: "#e0e7ff", padding: "2px 8px", borderRadius: "6px" }}>
                        Filtered by Type: {currentResolvedTaxType}
                      </span>
                    </div>
                    <select
                      value={selectedTaxId}
                      onChange={(e) => setSelectedTaxId(e.target.value)}
                      style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
                    >
                      <option value="">Select Tax Rate ({currentResolvedTaxType})</option>
                      {filteredTaxRulesForCascade.map(t => (
                        <option key={t.id} value={t.id}>{t.tax_name} ({t.percentage}%)</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: "12px",
                      background: "#4f46e5",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    {editingAssignmentId !== null ? "Save Changes" : "Create Mapping"}
                  </button>
                  {editingAssignmentId !== null && (
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{
                        flex: 1,
                        padding: "12px",
                        background: "#e2e8f0",
                        color: "#475569",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "700",
                        fontSize: "14px",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Column */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "800", color: "#1e293b" }}>
                Mapped {renderLevelName(assignSubTab)} Settings
              </h3>
              
              {/* ---- SUBSECTOR: Show inherited list from all mapped sectors ---- */}
              {assignSubTab === "subsector" ? (() => {
                // Build the full list: explicit overrides + inherited from parent sectors
                const sectorAssignments = assignments.filter(a => a.level === "sector");
                if (sectorAssignments.length === 0) {
                  return (
                    <div style={{ padding: "40px", textAlign: "center", border: "2px dashed #cbd5e1", borderRadius: "12px", color: "#94a3b8" }}>
                      No sectors mapped yet. Map a sector first — sub-sectors will inherit automatically.
                    </div>
                  );
                }

                const rows: any[] = [];
                sectorAssignments.forEach((sAssign: any) => {
                  const sectorSubs = subSectors.filter(ss => String(ss.sector_id) === String(sAssign.entity_id));
                  const sectorObj = sectors.find(s => String(s.id) === String(sAssign.entity_id));
                  sectorSubs.forEach((ss: any) => {
                    const explicitAssign = assignments.find(a => a.level === "sub_sector" && String(a.entity_id) === String(ss.id));
                    rows.push({
                      id: ss.id,
                      name: ss.name,
                      sectorName: sectorObj?.name || "",
                      sectorTaxType: sAssign.tax_type,
                      explicit: explicitAssign || null,
                    });
                  });
                });

                if (rows.length === 0) {
                  return (
                    <div style={{ padding: "40px", textAlign: "center", border: "2px dashed #cbd5e1", borderRadius: "12px", color: "#94a3b8" }}>
                      No sub-sectors found under mapped sectors.
                    </div>
                  );
                }

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {rows.map((row: any) => {
                      const isOverridden = !!row.explicit;
                      const displayType = isOverridden ? row.explicit.tax_type : row.sectorTaxType;
                      return (
                        <div
                          key={row.id}
                          style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            border: isOverridden ? "1px solid #c7d2fe" : "1px solid #e2e8f0",
                            background: isOverridden ? "#f5f3ff" : "#fafafa",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px"
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", marginBottom: "2px" }}>
                              Sector: {row.sectorName}
                            </div>
                            <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>
                              {row.name}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                            <span style={{
                              padding: "3px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "800",
                              background: isOverridden ? "#e0e7ff" : "#f1f5f9",
                              color: isOverridden ? "#4f46e5" : "#64748b",
                            }}>
                              {isOverridden ? `Override: ${displayType}` : `Inherited: ${displayType}`}
                            </span>
                            {isOverridden ? (
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  onClick={() => handleEditAssignment(row.explicit)}
                                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
                                  title="Edit Override"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button
                                  onClick={() => handleRemoveAssignment(row.explicit.id)}
                                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
                                  title="Remove Override (revert to inherited)"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  // Pre-fill form to override this sub-sector
                                  const parentSector = sectors.find(s => String(s.id) === String(row.id === undefined ? "" : subSectors.find(ss => ss.name === row.name)?.sector_id));
                                  const parentSectorAssign = assignments.find(a => a.level === "sector" && String(a.entity_id) === String(subSectors.find(ss => ss.name === row.name)?.sector_id));
                                  const sectorTitleId = parentSector?.sector_title_id ? String(parentSector.sector_title_id) : "";
                                  setAssignSubTab("subsector");
                                  setSelectedSectorTitleId(sectorTitleId);
                                  setTimeout(() => {
                                    const ss = subSectors.find(s => s.name === row.name);
                                    if (ss) {
                                      setSelectedSectorId(String(ss.sector_id));
                                      setTimeout(() => setSelectedSubSectorId(String(ss.id)), 50);
                                    }
                                  }, 50);
                                  setSelectedTaxType(row.sectorTaxType);
                                }}
                                style={{
                                  padding: "4px 12px",
                                  background: "#f1f5f9",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  color: "#475569",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                Override
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })() : (
                /* ---- ALL OTHER TABS: normal explicit assignment list ---- */
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {assignments.filter(a => a.level === assignSubTab).length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", border: "2px dashed #cbd5e1", borderRadius: "12px", color: "#94a3b8" }}>
                      No mapping assignments defined for this level. Use the selectors form to map.
                    </div>
                  ) : (
                    assignments.filter(a => a.level === assignSubTab).map((assign: any) => {
                      const isMacro = (assign.level === "sector" || assign.level === "sub_sector");
                      const tax = !isMacro ? taxMaster.find((t: any) => t.id === assign.tax_id) : null;
                      return (
                        <div
                          key={assign.id}
                          style={{
                            padding: "14px 18px",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: "800", color: "#4f46e5", textTransform: "uppercase" }}>
                              {assign.additional_info}
                            </div>
                            <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px", marginTop: "3px" }}>
                              {assign.entity_name}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                            <span style={{ fontWeight: "800", color: "#475569" }}>
                              {isMacro ? `Type: ${assign.tax_type}` : (tax ? `${tax.tax_name}` : "Exempt")}
                            </span>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => handleEditAssignment(assign)}
                                style={{ background: "none", border: "none", cursor: "pointer", padding: "5px", display: "flex", alignItems: "center" }}
                                title="Edit Mapping"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              </button>
                              <button
                                onClick={() => handleRemoveAssignment(assign.id)}
                                style={{ background: "none", border: "none", cursor: "pointer", padding: "5px", display: "flex", alignItems: "center" }}
                                title="Remove Mapping"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* -------------------------------------------------------------
          TAB 3: GRID AUDIT & OVERRIDES
          ------------------------------------------------------------- */}
      {activeTab === "resolve" && (
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#1e293b" }}>
              Resolved Products Tax Audit Grid
            </h3>
            {/* Search filter */}
            <input
              type="text"
              placeholder="🔍 Search product name, sector, or tax rule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                minWidth: "280px"
              }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2.5px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", fontWeight: "700", fontSize: "12px", color: "#475569" }}>PRODUCT NAME</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", fontSize: "12px", color: "#475569" }}>SECTOR TITLE</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", fontSize: "12px", color: "#475569" }}>SECTOR</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", fontSize: "12px", color: "#475569" }}>CATEGORY</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", fontSize: "12px", color: "#475569" }}>RESOLVED TAX RATE</th>
                  <th style={{ padding: "12px 16px", fontWeight: "700", fontSize: "12px", color: "#475569" }}>SOURCE OF RESOLUTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredResolvedGrid.map(item => {
                  const isOverride = item.taxSource === "Product Override";
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px", fontWeight: "700", color: "#1e293b" }}>{item.product_name}</td>
                      <td style={{ padding: "16px", color: "#475569", fontSize: "13px" }}>{item.sectorTitleName}</td>
                      <td style={{ padding: "16px", color: "#475569", fontSize: "13px" }}>{item.sectorName}</td>
                      <td style={{ padding: "16px", color: "#475569", fontSize: "13px" }}>{item.categoryName}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          fontWeight: "800",
                          color: item.taxPercent > 0 ? "#4f46e5" : "#94a3b8"
                        }}>
                          {item.taxRate} ({item.taxPercent}%)
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: isOverride ? "#ffe4e6" : (item.taxSource.startsWith("Default") ? "#f1f5f9" : "#e0f2fe"),
                          color: isOverride ? "#ef4444" : (item.taxSource.startsWith("Default") ? "#64748b" : "#0284c7"),
                        }}>
                          {item.taxSource}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
