import { http, getUserId } from "../../base_api/base_api";

export type Menu = {
    id: number;
    menu_name: string;
    menu_title_id?: number;
    sort_order?: number;
    is_active: number;
    is_enabled: number;
    status: string;
};

const BASE_PATH = "/multitab/category/category-menu";

export const createMenu = async (data: Partial<Menu>) => {
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

export const getMenus = async (): Promise<Menu[]> => {
    const json = await http(BASE_PATH);
    const rows = Array.isArray(json) ? json : json.data || json.rows || [];
    return rows.map((item: any) => ({
        ...item,
        menu_name: item.menu_name || item.name || "",
    }));
};

export const updateMenu = async (id: number, data: Partial<Menu>) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            ...data,
            user_id: getUserId(),
        }),
    });
};

export const deleteMenu = async (id: number) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "DELETE",
    });
};
