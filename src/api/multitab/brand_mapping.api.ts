import { http, getUserId } from "../../base_api/base_api";

export type Mapping = {
    id: number;
    tab_heading_id: number;
    checkbox_id: number;
    is_default: number;
    is_active: number;
    status: string;
};

const BASE_PATH = "/multitab/brand/brand-mapping";

export const saveMapping = async (data: Partial<Mapping>) => {
    return await http(BASE_PATH, {
        method: "POST",
        body: JSON.stringify({
            ...data,
            is_default: data.is_default ?? 0,
            is_active: data.is_active ?? 1,
            user_id: getUserId(),
        }),
    });
};

export const getMappings = async (headingId?: number): Promise<Mapping[]> => {
    const url = headingId ? `${BASE_PATH}/${headingId}` : BASE_PATH;
    const json = await http(url);
    return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const updateMapping = async (id: number, data: Partial<Mapping>) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            ...data,
            user_id: getUserId(),
        }),
    });
};

export const deleteMapping = async (id: number) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "DELETE",
    });
};
