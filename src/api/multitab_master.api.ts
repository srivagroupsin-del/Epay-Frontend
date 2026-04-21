import { http, getUserId } from "../base_api/base_api";

// --- TYPES ---
export type MultitabMenu = {
    id: number;
    menu_title_id?: number;
    menu_name: string;
    status?: number; // 0 or 1
};

export type TabHeading = {
    id: number;
    multitab_menu_id: number;
    heading_name: string;
    title: string;
    description: string;
    image?: string;
    status?: number | string;
};

export type CheckboxMaster = {
    id: number;
    label: string;
    value: string;
    image?: string;
    status?: number;
};

export type MultitabMapping = {
    id: number;
    tab_heading_id: number;
    checkbox_id: number;
    is_default: number; // 0 or 1
};

/* =============================================================================
   SECTOR TITLE MULTITAB APIs
============================================================================= */

// --- 1. MENU TAB ---
const MENU_BASE = "/multitab/sector_title/sector-title-menu";

export const createMenuTab = (data: {
    menu_title_id?: number;
    menu_name: string;
    status?: number;
}) => {
    return http(MENU_BASE, {
        method: "POST",
        body: JSON.stringify({
            menu_title_id: data.menu_title_id, // Note: Doc says menu_title_id not in Create Input? Keep if needed or aligns with DB
            menu_name: data.menu_name,
            status: data.status,
            user_id: getUserId()
        }),
    });
};

export const getMenuTabs = async () => {
    // Doc: /sector-title-menu/all
    const json = await http(`${MENU_BASE}/all`);
    return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const getTabsByMenuTitle = (menuTitleId: number) => {
    // This is likely fetching a specific menu by ID or by parent ID?
    // Assuming this fetches a single menu by ID based on usage patterns, or filtered list?
    // Doc says: Get Menu By ID: /sector-title-menu/:id
    return http(`${MENU_BASE}/${menuTitleId}`);
};

export const updateMenuTab = (id: number, data: {
    menu_name: string;
    status?: number;
}) => {
    return http(`${MENU_BASE}/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            menu_name: data.menu_name,
            status: data.status,
            user_id: getUserId()
        }),
    });
};

export const deleteMenuTab = (id: number) => {
    return http(`${MENU_BASE}/${id}`, {
        method: "DELETE",
    });
};

// --- 2. TAB HEADING ---
const HEADING_BASE = "/multitab/sector_title/sector-title-heading";

export const createTabHeading = (data: FormData) => {
    data.append("user_id", getUserId());
    return http(HEADING_BASE, {
        method: "POST",
        body: data,
    });
};

export const getHeadingsByTab = async (multitabMenuId: number) => {
    // Doc: /sector-title-heading/tab/:id
    const json = await http(`${HEADING_BASE}/tab/${multitabMenuId}`);
    return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const getAllTabHeadings = async () => {
    // Doc: /sector-title-heading/all
    const json = await http(`${HEADING_BASE}/all`);
    return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const updateTabHeading = (id: number, data: FormData) => {
    data.append("user_id", getUserId());
    return http(`${HEADING_BASE}/${id}`, {
        method: "PUT",
        body: data,
    });
};

export const deleteTabHeading = (id: number) => {
    return http(`${HEADING_BASE}/${id}`, {
        method: "DELETE",
    });
};


// --- 3. CHECKBOX MASTER ---
const CHECKBOX_BASE = "/multitab/sector_title/sector-title-checkbox";

export const createCheckboxMaster = (data: { label: string; value: string; image?: string; status?: number }) => {
    return http(CHECKBOX_BASE, {
        method: "POST",
        body: JSON.stringify({
            ...data,
            user_id: getUserId()
        }),
    });
};

export const getCheckboxes = async () => {
    // Doc: /sector-title-checkbox/all
    const json = await http(`${CHECKBOX_BASE}/all`);
    return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const getCheckboxesByMenuTitle = (_menuTitleId: number) => {
    // This naming is ambiguous. Assuming it's fetching checkboxes for a context? 
    // Or just all checkboxes if filtering not supported by backend yet.
    // Sticking to /all for now or specific endpoint if known.
    // Doc doesn't have "By Menu Title". Returning /all safe default or filtered.
    // NOTE: _menuTitleId is intentionally unused until backend supports filtering.
    return http(`${CHECKBOX_BASE}/all`);
};

export const updateCheckboxMaster = (id: number, data: any) => {
    return http(`${CHECKBOX_BASE}/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            ...data,
            user_id: getUserId()
        }),
    });
};

export const deleteCheckboxMaster = (id: number) => {
    return http(`${CHECKBOX_BASE}/${id}`, {
        method: "DELETE",
    });
};


// --- 4. MAPPING ---
const MAPPING_BASE = "/multitab/sector_title/sector-title-mapping";

export const mapCheckboxToHeading = (data: { tab_heading_id: number; checkbox_id: number; is_default: number }) => {
    // Remove user_id, sector_id and menu_id if they exist in data (for safety)
    const { user_id, sector_id, menu_id, ...cleanData } = data as any;
    return http(`${MAPPING_BASE}/heading`, {
        method: "POST",
        body: JSON.stringify(cleanData),
    });
};

export const getMappingByHeading = async (headingId: number) => {
    // Doc: /sector-title-mapping/heading/:id
    const json = await http(`${MAPPING_BASE}/heading/${headingId}`);
    return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const deleteMapping = (id: number) => {
    return http(`${MAPPING_BASE}/${id}`, {
        method: "DELETE",
    });
};
export const getMappings = async (headingId?: number) => {
    if (headingId) {
        return getMappingByHeading(headingId);
    }
    const json = await http(`${MAPPING_BASE}/all`);
    return json?.data ?? (json || []);
};
