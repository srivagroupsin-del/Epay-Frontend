import { http, getUserId } from "../../../../base_api/base_api";

// --- TYPES ---
export type MultitabMenu = {
    id: number;
    menu_name: string;
    name?: string; // Compatibility
    sort_order?: number;
    is_active: number;
    is_enabled: number;
    status: string;
};

export type TabHeading = {
    id: number;
    multitab_menu_id: number;
    menu_id?: number; // Compatibility
    heading_name: string;
    master_name?: string; // Compatibility
    title: string;
    description: string;
    image: string;
    sort_order?: number;
    is_active: number;
    is_enabled: number;
    status: string;
};

export type CheckboxMaster = {
    id: number;
    label: string;
    checkbox_name?: string; // Compatibility
    value: string;
    is_active: number;
    is_enabled: number;
    status: string;
};

export type MultitabMapping = {
    id: number;
    tabheading_id?: number; // Compatibility
    tab_heading_id: number;
    checkbox_id: number;
    checkbox_ids?: any; // Compatibility
    menu_id?: number; // Compatibility
    is_default: number;
    is_active: number;
    status: string;
};

/* ==================================================================================
   BRAND MULTITAB API
   Endpoints: /multitab/brand/...
================================================================================== */

// --- 1. MENU TAB ---

export const createMenu = async (data: Partial<MultitabMenu>) => {
    const payload = {
        ...data,
        sort_order: data.sort_order ?? 1,
        is_active: data.is_active ?? 1,
        is_enabled: data.is_enabled ?? 1,
        status: data.status ?? "active",
        user_id: getUserId()
    };
    return await http("/multitab/brand/brand-menu", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getMenus = async (): Promise<MultitabMenu[]> => {
    const json = await http("/multitab/brand/brand-menu");
    const rows = Array.isArray(json) ? json : json.data || json.rows || [];
    return rows.map((item: any) => ({
        ...item,
        menu_name: item.menu_name || item.name || "",
        name: item.name || item.menu_name || ""
    }));
};

export const updateMenu = async (id: number, data: Partial<MultitabMenu>) => {
    const payload = {
        ...data,
        user_id: getUserId()
    };
    return await http(`/multitab/brand/brand-menu/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const deleteMenu = async (id: number) => {
    return await http(`/multitab/brand/brand-menu/${id}`, {
        method: "DELETE",
    });
};

// --- 2. TAB HEADING ---

export const createTabHeading = async (data: Partial<TabHeading>) => {
    const payload = {
        ...data,
        sort_order: data.sort_order ?? 1,
        is_active: data.is_active ?? 1,
        is_enabled: data.is_enabled ?? 1,
        status: data.status ?? "active",
        user_id: getUserId()
    };
    return await http("/multitab/brand/brand-heading", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getTabHeadings = async (menuId?: number): Promise<TabHeading[]> => {
    const url = menuId
        ? `/multitab/brand/brand-heading/tab/${menuId}`
        : "/multitab/brand/brand-heading";
    const json = await http(url);
    const rows = Array.isArray(json) ? json : json.data || json.rows || [];
    return rows.map((item: any) => ({
        ...item,
        heading_name: item.heading_name || item.master_name || item.title || "",
        master_name: item.master_name || item.heading_name || item.title || "",
        menu_id: item.multitab_menu_id || item.menu_id
    }));
};

export const updateTabHeading = async (id: number, data: Partial<TabHeading>) => {
    const payload = {
        ...data,
        user_id: getUserId()
    };
    return await http(`/multitab/brand/brand-heading/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const deleteTabHeading = async (id: number) => {
    return await http(`/multitab/brand/brand-heading/${id}`, {
        method: "DELETE",
    });
};

// --- 3. CHECKBOX MASTER ---

export const createCheckbox = async (data: Partial<CheckboxMaster>) => {
    const payload = {
        ...data,
        is_active: data.is_active ?? 1,
        is_enabled: data.is_enabled ?? 1,
        status: data.status ?? "active",
        user_id: getUserId()
    };
    return await http("/multitab/brand/brand-checkbox", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getCheckboxes = async (): Promise<CheckboxMaster[]> => {
    const json = await http("/multitab/brand/brand-checkbox");
    const rows = Array.isArray(json) ? json : json.data || json.rows || [];
    return rows.map((item: any) => ({
        ...item,
        label: item.label || item.checkbox_name || "",
        checkbox_name: item.checkbox_name || item.label || ""
    }));
};

export const updateCheckbox = async (id: number, data: Partial<CheckboxMaster>) => {
    const payload = {
        ...data,
        user_id: getUserId()
    };
    return await http(`/multitab/brand/brand-checkbox/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const deleteCheckbox = async (id: number) => {
    return await http(`/multitab/brand/brand-checkbox/${id}`, {
        method: "DELETE",
    });
};

// --- 4. MAPPING ---

export const saveMapping = async (data: Partial<MultitabMapping>) => {
    const payload = {
        ...data,
        is_default: data.is_default ?? 0,
        is_active: data.is_active ?? 1,
        status: data.status ?? "active",
        user_id: getUserId()
    };
    return await http("/multitab/brand/brand-mapping", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getMappings = async (headingId?: number): Promise<MultitabMapping[]> => {
    const url = headingId
        ? `/multitab/brand/brand-mapping/heading/${headingId}`
        : "/multitab/brand/brand-mapping";
    const json = await http(url);
    const rows = Array.isArray(json) ? json : json.data || json.rows || [];
    return rows.map((item: any) => ({
        ...item,
        menu_id: item.menu_id || item.multitab_menu_id,
        tabheading_id: item.tabheading_id || item.tab_heading_id,
        checkbox_ids: item.checkbox_ids || item.checkbox_id
    }));
};

export const updateMapping = async (id: number, data: any) => {
    return await http(`/multitab/brand/brand-mapping/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            ...data,
            user_id: getUserId()
        }),
    });
};

export const deleteMapping = async (id: number) => {
    return await http(`/multitab/brand/brand-mapping/${id}`, {
        method: "DELETE",
    });
};

// Compatibility exports
export const getBrandMenus = getMenus;
export const createBrandMenu = createMenu;
export const updateBrandMenu = updateMenu;
export const deleteBrandMenu = deleteMenu;
export const getBrandTabHeadings = getTabHeadings;
export const createBrandTabHeading = createTabHeading;
export const updateBrandTabHeading = updateTabHeading;
export const deleteBrandTabHeading = deleteTabHeading;
export const getBrandCheckboxes = getCheckboxes;
export const createBrandCheckbox = createCheckbox;
export const updateBrandCheckbox = updateCheckbox;
export const deleteBrandCheckbox = deleteCheckbox;
export const getBrandMappings = getMappings;
export const saveBrandMapping = saveMapping;
export const updateBrandMapping = updateMapping;
export const deleteBrandMapping = deleteMapping;

export type BrandMultitabMenu = MultitabMenu;
export type BrandTabHeading = TabHeading;
export type BrandCheckboxMaster = CheckboxMaster;
export type BrandMultitabMapping = MultitabMapping;
