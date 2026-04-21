import { http, getUserId } from "../../base_api/base_api";

export type Checkbox = {
    id: number;
    label: string;
    value: string;
    is_active: number;
    is_enabled: number;
    status: string;
};

const BASE_PATH = "/multitab/category/category-checkbox";

export const createCheckbox = async (data: Partial<Checkbox>) => {
    return await http(BASE_PATH, {
        method: "POST",
        body: JSON.stringify({
            ...data,
            is_active: data.is_active ?? 1,
            user_id: getUserId(),
        }),
    });
};

export const getCheckboxes = async (): Promise<Checkbox[]> => {
    const json = await http(BASE_PATH);
    const rows = Array.isArray(json) ? json : json.data || json.rows || [];
    return rows.map((item: any) => ({
        ...item,
        label: item.label || item.checkbox_name || "",
    }));
};

export const updateCheckbox = async (id: number, data: Partial<Checkbox>) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            ...data,
            user_id: getUserId(),
        }),
    });
};

export const deleteCheckbox = async (id: number) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "DELETE",
    });
};
