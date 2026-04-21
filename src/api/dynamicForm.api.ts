import { http } from "../base_api/base_api";

/* ================= TYPES ================= */

export type DynamicPage = {
    id: number;
    folder_name: string;
    route_link: string;
    url: string;
    title: string;
    info: string;
    status: "active" | "inactive";
};

export type DynamicField = {
    id: number;
    page_id: number;
    field_label: string;
    field_name: string;
    placeholder: string;
    field_type: string;
    status: "active" | "inactive";
};

/* ================= PAGES API ================= */

export const getDynamicPages = async (): Promise<DynamicPage[]> => {
    const json = await http("/dynamic-pages");
    return Array.isArray(json) ? json : json.data ?? [];
};

export const createDynamicPage = async (data: Omit<DynamicPage, "id">) => {
    return await http("/dynamic-pages", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const updateDynamicPage = async (id: number, data: Partial<DynamicPage>) => {
    return await http(`/dynamic-pages/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteDynamicPage = async (id: number) => {
    return await http(`/dynamic-pages/${id}`, {
        method: "DELETE",
    });
};

/* ================= FIELDS API ================= */

export const getDynamicFields = async (pageId: number): Promise<DynamicField[]> => {
    const json = await http(`/dynamic-fields?page_id=${pageId}`);
    return Array.isArray(json) ? json : json.data ?? [];
};

export const saveDynamicFields = async (pageId: number, fields: Omit<DynamicField, "id" | "page_id">[], tableName?: string) => {
    return await http("/dynamic-fields/bulk", {
        method: "POST",
        body: JSON.stringify({ pageId, fields, tableName }),
    });
};

export const updateDynamicField = async (id: number, data: Partial<DynamicField>) => {
    return await http(`/dynamic-fields/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteDynamicField = async (id: number) => {
    return await http(`/dynamic-fields/${id}`, {
        method: "DELETE",
    });
};
