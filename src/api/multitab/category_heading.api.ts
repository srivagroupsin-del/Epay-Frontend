import { http, getUserId } from "../../base_api/base_api";

export type Heading = {
    id: number;
    multitab_menu_id: number;
    heading_name: string;
    title: string;
    description: string;
    image: string;
    sort_order?: number;
    is_active: number;
    is_enabled: number;
    status: string;
};

const BASE_PATH = "/multitab/category/category-heading";

export const createTabHeading = async (data: Partial<Heading>) => {
    return await http(BASE_PATH, {
        method: "POST",
        body: JSON.stringify({
            ...data,
            sort_order: data.sort_order ?? 1,
            is_active: data.is_active ?? 1,
            user_id: getUserId(),
        }),
    });
};

export const getTabHeadings = async (menuId?: number): Promise<Heading[]> => {
    const url = menuId ? `${BASE_PATH}/tab/${menuId}` : BASE_PATH;
    const json = await http(url);
    const rows = Array.isArray(json) ? json : json.data || json.rows || [];
    return rows.map((item: any) => ({
        ...item,
        heading_name: item.heading_name || item.master_name || item.title || "",
    }));
};

export const updateTabHeading = async (id: number, data: Partial<Heading>) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            ...data,
            user_id: getUserId(),
        }),
    });
};

export const deleteTabHeading = async (id: number) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "DELETE",
    });
};
