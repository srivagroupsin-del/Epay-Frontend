import { http, getUserId } from "../../../../base_api/base_api";
import { IMAGE_BASE_URL } from "../../../../base_api/api_list";

// --- TYPES ---
export type MultitabMenu = {
    id: number;
    menu_name: string;
    name: string; // Required for UI
    tab_name?: string; // New field
    menu_title_id?: number; // New field
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
    master_name: string; // Required for UI
    title: string;
    description: string;
    image: any; // Changed to any to support File | string | null
    sort_order?: number;
    is_active: number;
    is_enabled: number;
    status: string;
};

export type CheckboxMaster = {
    id: number;
    label: string;
    checkbox_name: string; // Required for UI
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
    sector_id?: number | null; // Compatibility
    subsector_id?: number | null; // Compatibility
};

/* ==================================================================================
   SECTOR MULTITAB API
   Endpoints: /multitab/sector/...
================================================================================= */

// --- 1. MENU TAB ---

export const createMenu = async (data: any) => {
    const payload = {
        menu_title_id: Number(data.menu_title_id) || 1,
        tab_name: data.tab_name || data.name || data.menu_name,
        status: data.status || "active",
        user_id: getUserId()
    };
    return await http("/multitab/multitab-menu", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getMenus = async (): Promise<MultitabMenu[]> => {
    // Populate using GET as requested (removing /all which was 404ing)
    const json = await http("/multitab/multitab-menu/all");
    const rows = Array.isArray(json) ? json : json.data || json.rows || [];
    return rows.map((item: any) => ({
        ...item,
        menu_name: item.menu_name || item.tab_name || item.name || "",
        name: item.name || item.tab_name || item.menu_name || ""
    }));
};

export const updateMenu = async (id: number, data: any) => {
    const payload = {
        menu_title_id: Number(data.menu_title_id) || 1,
        tab_name: data.tab_name || data.name || data.menu_name,
        status: data.status || "active",
        user_id: getUserId()
    };
    return await http(`/multitab/multitab-menu/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const deleteMenu = async (id: number) => {
    return await http(`/multitab/multitab-menu/${id}`, {
        method: "DELETE",
    });
};

// --- 2. TAB HEADING ---

export const createTabHeading = async (data: any) => {
    // If data is FormData, we need to append user_id if it's not there
    let body = data;
    if (data instanceof FormData) {
        if (!data.has("user_id")) {
            data.append("user_id", getUserId());
        }
        body = data;
    } else {
        body = JSON.stringify({ ...data, user_id: getUserId() });
    }

    return await http("/multitab/multitab-heading", {
        method: "POST",
        body: body,
    });
};

export const getTabHeadings = async (menuId?: number): Promise<TabHeading[]> => {
    const url = menuId
        ? `/multitab/multitab-heading/tab/${menuId}`
        : "/multitab/multitab-heading/all";
    const json = await http(url);
    const rows = Array.isArray(json) ? json : json.data || json.rows || [];
    return rows.map((item: any) => {
        const imagePath = item.image || item.heading_image;
        return {
            ...item,
            title: item.title || item.heading_name || item.tab_heading_master || item.master_name || "",
            heading_name: item.heading_name || item.tab_heading_master || item.master_name || item.title || "",
            master_name: item.master_name || item.heading_name || item.tab_heading_master || item.title || "",
            image: imagePath ? (imagePath.startsWith('http') ? imagePath : `${IMAGE_BASE_URL}/${imagePath}`) : "",
            menu_id: item.multitab_menu_id || item.menu_id
        };
    });
};

export const updateTabHeading = async (id: number, data: any) => {
    let body = data;
    if (data instanceof FormData) {
        if (!data.has("user_id")) {
            data.append("user_id", getUserId());
        }
        body = data;
    } else {
        body = JSON.stringify({ ...data, user_id: getUserId() });
    }

    return await http(`/multitab/multitab-heading/${id}`, {
        method: "PUT",
        body: body,
    });
};

export const deleteTabHeading = async (id: number) => {
    return await http(`/multitab/multitab-heading/${id}`, {
        method: "DELETE",
    });
};

// --- 3. CHECKBOX MASTER ---

export const createCheckbox = async (data: any) => {
    const payload = {
        label: data.label || data.checkbox_name || data.name || "",
        label_name: data.label || data.checkbox_name || data.name || "",
        value: data.value || data.checkbox_name || data.name || data.label || "",
        checkbox_name: data.checkbox_name || data.label || data.name || data.checkbox_title || "",
        status: data.status || "active",
        user_id: getUserId()
    };
    return await http("/multitab/multitab-checkbox", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getCheckboxes = async (): Promise<CheckboxMaster[]> => {
    const json = await http("/multitab/multitab-checkbox/all");
    const rows = Array.isArray(json) ? json : json.data || json.rows || [];
    return rows.map((item: any) => ({
        ...item,
        label: item.label || item.label_name || item.checkbox_name || item.name || "",
        checkbox_name: item.checkbox_name || item.label_name || item.label || item.name || ""
    }));
};

export const updateCheckbox = async (id: number, data: any) => {
    const payload = {
        label: data.label || data.checkbox_name || data.name || "",
        label_name: data.label || data.checkbox_name || data.name || "",
        value: data.value || data.checkbox_name || data.name || data.label || "",
        checkbox_name: data.checkbox_name || data.label || data.name || data.checkbox_title || "",
        status: data.status || "active",
        user_id: getUserId()
    };
    return await http(`/multitab/multitab-checkbox/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const deleteCheckbox = async (id: number) => {
    return await http(`/multitab/multitab-checkbox/${id}`, {
        method: "DELETE",
    });
};

// --- 4. MAPPING ---

export const saveMapping = async (data: any) => {
    const payload = {
        ...data,
        heading_id: data.heading_id || data.tabheading_id || data.headingId,
        user_id: getUserId()
    };
    return await http("/multitab/multitab-mapping", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getMappings = async (headingId?: number): Promise<MultitabMapping[]> => {
    // If headingId is provided, get for that heading, otherwise get all
    const url = headingId
        ? `/multitab/multitab-mapping?heading_id=${headingId}`
        : "/multitab/multitab-mapping";
    
    const json = await http(url);
    const rows = Array.isArray(json) ? json : json.data || json.rows || [];
    return rows.map((item: any) => ({
        ...item,
        sector_id: item.sector_id || item.sector_title_id || item.id_sector || item.sectorId,
        menu_id: item.menu_id || item.multitab_menu_id || item.menu_title_id || item.menuId,
        tabheading_id: item.tabheading_id || item.tab_heading_id || item.tab_heading_master_id || item.headingId || item.heading_id,
        // Convert single checkbox_id to array if needed
        checkbox_ids: item.checkbox_ids || (item.checkbox_id ? [item.checkbox_id] : []),
        status: item.status || (Number(item.is_active) === 1 ? "active" : "inactive")
    }));
};

export const updateMapping = async (id: number, data: any) => {
    const payload = {
        ...data,
        heading_id: data.heading_id || data.tabheading_id || data.headingId,
        user_id: getUserId()
    };
    return await http(`/multitab/multitab-mapping/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const deleteMapping = async (id: number) => {
    return await http(`/multitab/multitab-mapping/${id}`, {
        method: "DELETE",
    });
};

// Compatibility exports
export type SectorMultitabMenu = MultitabMenu;
export type SectorTabHeading = TabHeading;
export type SectorCheckboxMaster = CheckboxMaster;
export type SectorMultitabMapping = MultitabMapping;

export const getSectorMenus = getMenus;
export const createSectorMenu = createMenu;
export const updateSectorMenu = updateMenu;
export const deleteSectorMenu = deleteMenu;
export const getSectorTabHeadings = getTabHeadings;
export const createSectorTabHeading = createTabHeading;
export const updateSectorTabHeading = updateTabHeading;
export const deleteSectorTabHeading = deleteTabHeading;
export const getSectorCheckboxes = getCheckboxes;
export const createSectorCheckbox = createCheckbox;
export const updateSectorCheckbox = updateCheckbox;
export const deleteSectorCheckbox = deleteCheckbox;
export const getSectorMappings = getMappings;
export const saveSectorMapping = saveMapping;
export const updateSectorMapping = updateMapping;
export const deleteSectorMapping = deleteMapping;

export const getSectorTitles = async () => {
    const json = await http("/sectorTitleRoutes");
    const rows = Array.isArray(json) ? json : json.data || json.rows || [];
    return rows.map((item: any, index: number) => ({
        id: item.id ?? item.sector_title_id ?? item.id_sector_title ?? index,
        title: item.title ?? item.name ?? item.sector_title_name ?? item.sector_title ?? item.sectorTitle ?? item.name_sectorTitle ?? "—",
    }));
};
