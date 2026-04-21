import { http } from "../../../base_api/base_api";

// --- Types ---

export type MultitabMenu = {
    id: number;
    name: string;
    status: "active" | "inactive";
    created_at: string;
};

export type TabHeading = {
    id: number;
    menu_id: number;
    master_name: string;
    image: string;
    title: string;
    description: string;
    status: "active" | "inactive";
    created_at: string;
};

export type CheckboxMaster = {
    id: number;
    checkbox_name: string;
    status: "active" | "inactive";
    created_at: string;
};

// --- API Functions ---

// Menu
export const getMenus = async (): Promise<MultitabMenu[]> => {
    const json = await http("/multitab/menus/");
    return json.data ?? json;
};

export const createMenu = async (data: { name: string; status: string }) => {
    return await http("/multitab/menus/", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const updateMenu = async (id: number, data: { name: string; status: string }) => {
    return await http(`/multitab/menus/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteMenu = async (id: number) => {
    return await http(`/multitab/menus/${id}/`, {
        method: "DELETE",
    });
};

// Tab Heading
export const getTabHeadings = async (): Promise<TabHeading[]> => {
    const json = await http("/multitab/tab-headings/");
    return json.data ?? json;
};

export const createTabHeading = async (data: {
    menu_id: number;
    master_name: string;
    title: string;
    description: string;
    status: string;
    image?: any;
}) => {
    return await http("/multitab/tab-headings/", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const updateTabHeading = async (id: number, data: {
    menu_id: number;
    master_name: string;
    title: string;
    description: string;
    status: string;
    image?: any;
}) => {
    return await http(`/multitab/tab-headings/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteTabHeading = async (id: number) => {
    return await http(`/multitab/tab-headings/${id}/`, {
        method: "DELETE",
    });
};

// Checkbox Master
export const getCheckboxes = async (): Promise<CheckboxMaster[]> => {
    const json = await http("/multitab/checkboxes/");
    return json.data ?? json;
};

export const createCheckbox = async (data: { checkbox_name: string; status: string }) => {
    return await http("/multitab/checkboxes/", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const updateCheckbox = async (id: number, data: { checkbox_name: string; status: string }) => {
    return await http(`/multitab/checkboxes/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteCheckbox = async (id: number) => {
    return await http(`/multitab/checkboxes/${id}/`, {
        method: "DELETE",
    });
};

// Mapping & Preview placeholders
export const getMappings = async () => {
    const json = await http("/multitab/mappings/");
    return json.data ?? json;
};

export const saveMapping = async (data: any) => {
    return await http("/multitab/mappings", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const deleteMapping = async (id: number) => {
    return await http(`/multitab/mappings/${id}/`, {
        method: "DELETE",
    });
};
