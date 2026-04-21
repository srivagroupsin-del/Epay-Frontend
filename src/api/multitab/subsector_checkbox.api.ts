import { http, getUserId } from "../../base_api/base_api";

export type Checkbox = {
    id: number;
    label: string;
    value: string;
    status?: string;
    is_active?: number;
};

const BASE_PATH = "/multitab/sub-sector/sub-sector-checkbox";

export const getCheckboxes = async (): Promise<Checkbox[]> => {
    const json = await http(`${BASE_PATH}/all`);
    return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const createCheckbox = async (data: {
    label: string;
    value: string;
    status?: string;
}) => {
    return await http(BASE_PATH, {
        method: "POST",
        body: JSON.stringify({
            ...data,
            user_id: getUserId()
        }),
    });
};

export const updateCheckbox = async (
    id: number,
    data: any
) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            ...data,
            user_id: getUserId()
        }),
    });
};

export const deleteCheckbox = async (id: number) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "DELETE",
    });
};
