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
    heading_name: string;
    master_name?: string; // Compatibility
    title: string;
    description: string;
    image: string;
    sort_order?: number;
    is_active: number;
    is_enabled: number;
    status: string;
    menu_id?: number; // Compatibility
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
    tab_heading_id: number;
    tabheading_id?: number; // Compatibility
    checkbox_id: number;
    checkbox_ids?: any; // Compatibility
    menu_id?: number; // Compatibility
    is_default: number;
    is_active: number;
    status: string;
};

/* ==================================================================================
   CATEGORY MULTITAB API
   Endpoints: /multitab/category/...
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
    return await http("/multitab/category/category-menu", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getMenus = async (): Promise<MultitabMenu[]> => {
    const json = await http("/multitab/category/category-menu");
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
    return await http(`/multitab/category/category-menu/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const deleteMenu = async (id: number) => {
    return await http(`/multitab/category/category-menu/${id}`, {
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
    return await http("/multitab/category/category-heading", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getTabHeadings = async (menuId?: number): Promise<TabHeading[]> => {
    const url = menuId
        ? `/multitab/category/category-heading/tab/${menuId}`
        : "/multitab/category/category-heading";
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
    return await http(`/multitab/category/category-heading/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const deleteTabHeading = async (id: number) => {
    return await http(`/multitab/category/category-heading/${id}`, {
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
    return await http("/multitab/category/category-checkbox", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getCheckboxes = async (): Promise<CheckboxMaster[]> => {
    const json = await http("/multitab/category/category-checkbox");
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
    return await http(`/multitab/category/category-checkbox/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const deleteCheckbox = async (id: number) => {
    return await http(`/multitab/category/category-checkbox/${id}`, {
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
    return await http("/multitab/category/category-mapping", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getMappings = async (headingId?: number) => {
    const url = headingId
        ? `/multitab/category/category-mapping/heading/${headingId}`
        : "/multitab/category/category-mapping";
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
    return await http(`/multitab/category/category-mapping/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            ...data,
            user_id: getUserId()
        }),
    });
};

export const deleteMapping = async (id: number) => {
    return await http(`/multitab/category/category-mapping/${id}`, {
        method: "DELETE",
    });
};

// Compatibility exports
export type CategoryMultitabMenu = MultitabMenu;
export type CategoryTabHeading = TabHeading;
export type CategoryCheckboxMaster = CheckboxMaster;
export type CategoryMultitabMapping = MultitabMapping;

export const getCategoryMenus = getMenus;
export const createCategoryMenu = createMenu;
export const updateCategoryMenu = updateMenu;
export const deleteCategoryMenu = deleteMenu;
export const getCategoryTabHeadings = getTabHeadings;
export const createCategoryTabHeading = createTabHeading;
export const updateCategoryTabHeading = updateTabHeading;
export const deleteCategoryTabHeading = deleteTabHeading;
export const getCategoryCheckboxes = getCheckboxes;
export const createCategoryCheckbox = createCheckbox;
export const updateCategoryCheckbox = updateCheckbox;
export const deleteCategoryCheckbox = deleteCheckbox;
export const getCategoryMappings = getMappings;
export const saveCategoryMapping = saveMapping;
export const updateCategoryMapping = updateMapping;
export const deleteCategoryMapping = deleteMapping;
