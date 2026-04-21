import { http, getUserId } from "../../base_api/base_api";

export type Menu = {
    id: number;
    menu_name: string;
    menu_title_id?: number;
    sort_order?: number;
    is_active: number;
    is_enabled: number;
    status: "active" | "inactive";
};

const BASE_PATH = "/multitab/sector_title/sector-title-menu";

export const createMenu = async (data: Partial<Menu>) => {
    return await http(BASE_PATH, {
        method: "POST",
        body: JSON.stringify({
            menu_name: data.menu_name,
            sort_order: data.sort_order ?? 1,
            is_active: data.is_active ?? 1,
            user_id: getUserId(),
        }),
    });
};

export const getMenus = async (): Promise<Menu[]> => {
    const json = await http(`${BASE_PATH}/all`);
    const rows = Array.isArray(json) ? json : json.data || json.rows || [];

    return rows.map((item: any) => ({
        id: item.id,
        menu_name: item.menu_name || item.name || "",
        menu_title_id: item.menu_title_id || item.sector_title_id || item.sector_id,
        sort_order: item.sort_order,
        is_active: item.is_active ?? 1,
        is_enabled: item.is_enabled ?? 1,
        status: item.status ?? (item.is_active === 1 ? "active" : "inactive"),
    }));
};

export const updateMenu = async (id: number, data: Partial<Menu>) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            menu_name: data.menu_name,
            status: data.status ?? "active",
            sort_order: data.sort_order,
            user_id: getUserId(),
        }),
    });
};

export const deleteMenu = async (id: number) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "DELETE",
    });
};
