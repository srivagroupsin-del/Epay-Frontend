import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Settings,
  Menu as MenuIcon,
  MoreVertical,
  LayoutDashboard,
  Database,
  // Shield,
  // Globe,
  Box,
  Layers,
  Tag,
  Grid,
  Package
} from "lucide-react";
import "./sidebar.css";

import SidebarSection from "./SidebarSection";
import SidebarItem from "./SidebarItem";
import SidebarLink from "./SidebarLink";

import { getMenuTitles } from "../../pages/settings/menu_section/menutitle/menuTitle.api";
import { getMenus } from "../../pages/settings/menu_section/menu/menu.api";
import type { MenuTitle } from "../../pages/settings/menu_section/menutitle/menuTitle.types";
import type { MenuItem } from "../../pages/settings/menu_section/menu/menu.types";
import { useRefresh } from "../refreshcontext/RefreshContext";

type SidebarProps = {
  open: boolean;
  onToggle: () => void;
};

type SidebarMode = "menu" | "settings";

const settingsRoutes = [
  "/settings", "/website", "/variant", "/multitab", "/sub-multitab",
  "/sector-multitab", "/category-multitab", "/brand-multitab", "/create-tab-multitab"
];

const Sidebar = ({ open, onToggle }: SidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Mode management (Menu mode vs Settings mode)
  const [mode, setMode] = useState<SidebarMode>(() => {
    const stored = localStorage.getItem("sidebar_mode") as SidebarMode | null;
    return stored || "menu";
  });

  // SINGLE STATE VARIABLE: Exactly one menu expanded at a time
  const [activeMenu, setActiveMenu] = useState<string | null>(() => {
    return localStorage.getItem("sidebar_active_menu");
  });

  const [menuTitles, setMenuTitles] = useState<MenuTitle[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { refreshKey } = useRefresh();

  // Fetch sidebar data (dynamic modules)
  useEffect(() => {
    if (mode === "settings") return; // Skip fetching in settings mode
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const [titleRes, menuRes] = await Promise.all([
          getMenuTitles(),
          getMenus()
        ]);

        const titles = Array.isArray(titleRes) ? titleRes : (titleRes?.data || []);
        const items = Array.isArray(menuRes) ? menuRes : (menuRes?.data || []);

        const priorityOrder = [
          "Sector Title", "Sector", "SubSector", "Category",
          "Category Group", "Brand", "Category Brand Mapping", "Products"
        ];

        const activeTitles = titles.filter((t: MenuTitle) => t.status === "active");
        activeTitles.sort((a: MenuTitle, b: MenuTitle) => {
          const indexA = priorityOrder.indexOf(a.menu_title);
          const indexB = priorityOrder.indexOf(b.menu_title);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          return a.menu_title.localeCompare(b.menu_title);
        });

        setMenuTitles(activeTitles);
        setMenuItems(items.filter((m: MenuItem) => m.status === "active"));
      } catch (error) {
        console.error("Sidebar data fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mode, refreshKey]);

  // TOGGLE LOGIC: Toggle clicked item, close others
  const handleToggleMenu = (menuId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent propagation that might cause multiple triggers

    setActiveMenu((prev) => {
      const next = prev === menuId ? null : menuId;
      if (next) {
        localStorage.setItem("sidebar_active_menu", next);
      } else {
        localStorage.removeItem("sidebar_active_menu");
      }
      return next;
    });
  };

  // AUTO-EXPAND Logic: Open the correct menu based on URL
  useEffect(() => {
    // 1. Check Settings
    const isSettings = settingsRoutes.some(route => currentPath.startsWith(route));
    if (isSettings) {
      if (currentPath.includes("/settings/menu")) setActiveMenu("Menu Section");
      else if (currentPath.includes("/settings/roles") || currentPath.includes("/settings/permissions")) setActiveMenu("Security");
      else if (currentPath.includes("/settings/page-creation") || currentPath.includes("/settings/dynamic-form-creator")) setActiveMenu("Dynamic Section");
      else if (currentPath.includes("/website")) setActiveMenu("Website");
      else if (currentPath.includes("/variant")) setActiveMenu("Variant Field");
      else if (currentPath.includes("/multitab")) setActiveMenu("Sector Title Multitab");
      else if (currentPath.includes("/sub-multitab")) setActiveMenu("SubSector Multi Tab");
      else if (currentPath.includes("/sector-multitab")) setActiveMenu("Sector Multi Tab");
      else if (currentPath.includes("/category-multitab")) setActiveMenu("Category Multitab");
      else if (currentPath.includes("/brand-multitab")) setActiveMenu("Brand Multitab");
      else if (currentPath.includes("/create-tab-multitab")) setActiveMenu("Create Tab");
      return;
    }

    // 2. Check Dynamic Modules (Inventory)
    for (const title of menuTitles) {
      // Find the links by checking keys case-insensitively
      const menuKey = Object.keys(defaultModuleLinks).find(
        key => key.toLowerCase() === title.menu_title.toLowerCase()
      );

      const links = menuKey ? defaultModuleLinks[menuKey] : [];
      const hasMatch = links.some(l => currentPath === l.to || currentPath.startsWith(l.to + "/"));

      if (hasMatch) {
        setActiveMenu(`title-${title.id}`);
        return;
      }
    }
  }, [currentPath, menuTitles]);

  // Sync mode with current URL
  useEffect(() => {
    const isSettings = settingsRoutes.some(route => currentPath.startsWith(route));
    const newMode = isSettings ? "settings" : "menu";
    setMode(newMode);
    localStorage.setItem("sidebar_mode", newMode);
  }, [currentPath]);

  const defaultModuleLinks: Record<string, { to: string; label: string }[]> = {
    "Sector Title": [
      { to: "/sector-titles/add", label: "Add Sector Title" },
      { to: "/sector-titles", label: "View Sector Titles" },
    ],
    "Sector": [
      { to: "/sector/add", label: "Add Sector" },
      { to: "/sector", label: "View Sector" },
      { to: "/sector-mapping", label: "Mapping Sector" },
    ],
    "SubSector": [
      { to: "/subsector/add", label: "Add SubSector" },
      { to: "/subsector", label: "View SubSector" },
      { to: "/subsector-mapping", label: "Mapping SubSector" }
    ],
    "Category": [
      { to: "/category/add", label: "Add Category" },
      { to: "/categories", label: "View Category" },
      { to: "/manage-category", label: "Manage Category" },
      { to: "/unselect-categories", label: "Secondary Manage" },
      { to: "/primary-secondary-category-mapping", label: "Primary -> Secondary Mapping" },
      // { to: "/category/tax", label: "Tax" },
    ],
    "Brand": [
      { to: "/brands/add", label: "Add Brand" },
      { to: "/brands", label: "View Brand" }
    ],
    "Category Group": [
      { to: "/category-groups/create-title", label: "Create Category Title" },
      { to: "/category-groups/add", label: "Add Category Group" },
      { to: "/category-groups/mapping", label: "Mapping Category Group" },
      { to: "/category-groups", label: "View Category Group" }
    ],

    "Category Brand Mapping": [
      { to: "/add-category-brand", label: "Add Category Brand" },
      { to: "/manage-category-brand", label: "Manage Category Brand" }
    ],
    "Products": [
      { to: "/product/add", label: "Add Product" },
      { to: "/products", label: "View Product" },
      { to: "/product/update-mrp", label: "Update MRP" },
      { to: "/product-mapping", label: "Product Mapping" },
      // { to: "/product/tax", label: "Tax" }
    ]
  };

  const getModuleIcon = (title: string) => {
    switch (title) {
      case "Sector Title": return LayoutDashboard;
      case "Sector": return Database;
      case "SubSector": return Layers;
      case "Category": return Grid;
      case "Category Group": return Box;
      case "Brand": return Tag;
      case "Category Brand Mapping": return Package;
      case "Products": return Package;
      default: return Database;
    }
  };

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      {/* HEADER */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-initials" style={{
            width: "32px", height: "32px", background: "rgba(255,255,255,0.15)",
            borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "bold", color: "white", fontSize: "14px"
          }}>EP</div>
          <span className="sidebar-logo-text">ePay</span>
        </div>
        <button className="sidebar-toggle-btn" onClick={onToggle}>
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="sidebar-scroll">
        {mode === "settings" ? (
          <SidebarSection title="Settings">
            <SidebarItem label="Menu Section" icon={LayoutDashboard} open={activeMenu === "Menu Section"} onToggle={(e) => handleToggleMenu("Menu Section", e)}>
              <SidebarLink to="/settings/menu-title" label="Menu Title" />
              <SidebarLink to="/settings/menu/add" label="Add Menu" />
              <SidebarLink to="/settings/menu" label="View Menu" />
              <SidebarLink to="/settings/menu-mapping" label="Mapping" />
              {/* <SidebarLink to="/settings/menu-pages" label="Menu Page" /> */}
            </SidebarItem>

            {/* <SidebarItem label="Security" icon={Shield} open={activeMenu === "Security"} onToggle={(e) => handleToggleMenu("Security", e)}>
              <SidebarLink to="/settings/roles" label="User Roles" />
              <SidebarLink to="/settings/permissions" label="Permissions" />
            </SidebarItem> */}

            {/* <SidebarItem label="Dynamic Section" icon={Grid} open={activeMenu === "Dynamic Section"} onToggle={(e) => handleToggleMenu("Dynamic Section", e)}>
              <SidebarLink to="/settings/page-creation" label="Page Creation" />
              <SidebarLink to="/settings/dynamic-form-creator" label="Form Creator" />
            </SidebarItem> */}

            {/* <SidebarItem label="Website" icon={Globe} open={activeMenu === "Website"} onToggle={(e) => handleToggleMenu("Website", e)}>
              <SidebarLink to="/website/add" label="Register Website" />
              <SidebarLink to="/websites" label="Global List" />
            </SidebarItem> */}

            <SidebarItem label="Variant Field" icon={Box} open={activeMenu === "Variant Field"} onToggle={(e) => handleToggleMenu("Variant Field", e)}>
              {/* <SidebarLink to="/variant/add-colour" label="Colours" />
              <SidebarLink to="/variant/add-variant" label="Attributes" />
              <SidebarLink to="/variant/add-unit-type" label="Units" /> */}
              <SidebarLink to="/variant/add-tax" label="Tax Management" />
              <SidebarLink to="/variant/discount-management" label="Discount Management" />
              <SidebarLink to="/variant/offer-management" label="Offer Management" />
            </SidebarItem>

            {/* <SidebarItem label="Sector Title Multitab" icon={Layers} open={activeMenu === "Sector Title Multitab"} onToggle={(e) => handleToggleMenu("Sector Title Multitab", e)}>
              <SidebarLink to="/multitab/add-menu" label="Add Menu" />
              <SidebarLink to="/multitab/add-tabheading" label="Tabheading" />
              <SidebarLink to="/multitab/add-checkbox" label="Checkbox" />
              <SidebarLink to="/multitab/add-mapping" label="Mapping" />
              <SidebarLink to="/multitab/add-preview" label="Preview" />
            </SidebarItem>

            <SidebarItem label="SubSector Multi Tab" icon={Layers} open={activeMenu === "SubSector Multi Tab"} onToggle={(e) => handleToggleMenu("SubSector Multi Tab", e)}>
              <SidebarLink to="/sub-multitab/add-menu" label="Add Menu" />
              <SidebarLink to="/sub-multitab/add-tabheading" label="Tabheading" />
              <SidebarLink to="/sub-multitab/add-checkbox" label="Checkbox" />
              <SidebarLink to="/sub-multitab/add-mapping" label="Mapping" />
              <SidebarLink to="/sub-multitab/add-preview" label="Preview" />
            </SidebarItem>

            <SidebarItem label="Sector Multi Tab" icon={Layers} open={activeMenu === "Sector Multi Tab"} onToggle={(e) => handleToggleMenu("Sector Multi Tab", e)}>
              <SidebarLink to="/sector-multitab/add-menu" label="Add Menu" />
              <SidebarLink to="/sector-multitab/add-tabheading" label="Tabheading" />
              <SidebarLink to="/sector-multitab/add-checkbox" label="Checkbox" />
              <SidebarLink to="/sector-multitab/add-mapping" label="Mapping" />
              <SidebarLink to="/sector-multitab/add-preview" label="Preview" />
            </SidebarItem>

            <SidebarItem label="Category Multitab" icon={Grid} open={activeMenu === "Category Multitab"} onToggle={(e) => handleToggleMenu("Category Multitab", e)}>
              <SidebarLink to="/category-multitab/add-menu" label="Add Menu" />
              <SidebarLink to="/category-multitab/add-tabheading" label="Tabheading" />
              <SidebarLink to="/category-multitab/add-checkbox" label="Checkbox" />
              <SidebarLink to="/category-multitab/add-mapping" label="Mapping" />
              <SidebarLink to="/category-multitab/add-preview" label="Preview" />
            </SidebarItem>

            <SidebarItem label="Brand Multitab" icon={Tag} open={activeMenu === "Brand Multitab"} onToggle={(e) => handleToggleMenu("Brand Multitab", e)}>
              <SidebarLink to="/brand-multitab/add-menu" label="Add Menu" />
              <SidebarLink to="/brand-multitab/add-tabheading" label="Tabheading" />
              <SidebarLink to="/brand-multitab/add-checkbox" label="Checkbox" />
              <SidebarLink to="/brand-multitab/add-mapping" label="Mapping" />
              <SidebarLink to="/brand-multitab/add-preview" label="Preview" />
            </SidebarItem> */}

            <SidebarItem label="Create Tab" icon={Layers} open={activeMenu === "Create Tab"} onToggle={(e) => handleToggleMenu("Create Tab", e)}>
              {/* <SidebarLink to="/create-tab-multitab/add-menu" label="Add Menu" /> */}
              <SidebarLink to="/create-tab-multitab/add-tabheading" label="Tabheading" />
              <SidebarLink to="/create-tab-multitab/add-checkbox" label="Checkbox" />
              <SidebarLink to="/create-tab-multitab/add-mapping" label="Mapping" />
              <SidebarLink to="/create-tab-multitab/add-preview" label="Preview" />
            </SidebarItem>
          </SidebarSection>
        ) : (
          <SidebarSection title="Menu">
            {loading ? (
              <div className="sidebar-loading">Loading Modules...</div>
            ) : (
              menuTitles.map((title) => (
                <SidebarItem
                  key={title.id}
                  label={title.menu_title}
                  icon={getModuleIcon(title.menu_title)}
                  open={activeMenu === `title-${title.id}`}
                  onToggle={(e) => handleToggleMenu(`title-${title.id}`, e)}
                >
                  {(defaultModuleLinks[title.menu_title] || []).map((link, idx) => (
                    <SidebarLink key={idx} to={link.to} label={link.label} />
                  ))}
                  {menuItems.filter(item => item.menu_title_id === title.id).map(item => (
                    <SidebarLink key={item.id} to={item.link || "#"} label={item.page_title} />
                  ))}
                </SidebarItem>
              ))
            )}
          </SidebarSection>
        )}
      </div>

      {/* FOOTER */}
      <div className="sidebar-footer">
        <Link to="#" className="sidebar-footer-btn footer-btn-setting" onClick={(e) => {
          e.preventDefault(); setMode("settings"); setActiveMenu(null);
        }}>
          <Settings size={18} /> Settings
        </Link>
        <Link to="#" className="sidebar-footer-btn footer-btn-menu" onClick={(e) => {
          e.preventDefault(); setMode("menu"); setActiveMenu(null);
        }}>
          <MenuIcon size={18} /> Menu
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
