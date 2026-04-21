import { http, getUserId } from "../../base_api/base_api";

/* =============================================================================
   TYPES
============================================================================= */

export type Menu = {
    id: number;
    menu_name: string;
    menu_title_id?: number;
    sort_order?: number;
    is_active: number;
    is_enabled: number;
    status: "active" | "inactive";
};

/* =============================================================================
   MENU APIs (Sector Title Multitab)
============================================================================= */

// Base path for Sector Title Multitab Menus
const BASE_PATH = "/multitab/sector_title/sector-title-menu";

/**
 * CREATE MENU
 */
export const createMenu = async (data: Partial<Menu>) => {
    return await http(BASE_PATH, {
        method: "POST",
        body: JSON.stringify({
            menu_name: data.menu_name,
            sort_order: data.sort_order ?? 1,
            // status: data.status ?? "active", // Doc says status is mainly for update, but let's include if needed
            is_active: data.is_active ?? 1,
            // is_enabled: data.is_enabled ?? 1,
            user_id: getUserId(),
        }),
    });
};

/**
 * GET ALL MENUS
 */
export const getMenus = async (): Promise<Menu[]> => {
    const json = await http(`${BASE_PATH}/all`);

    const rows = Array.isArray(json)
        ? json
        : json.data || json.rows || [];

    return rows.map((item: any) => ({
        id: item.id,
        menu_name: item.menu_name || item.name || "",
        menu_title_id: item.menu_title_id,
        sort_order: item.sort_order,
        is_active: item.is_active ?? 1,
        is_enabled: item.is_enabled ?? 1,
        status: item.status ?? (item.is_active === 1 ? "active" : "inactive"),
    }));
};

/**
 * GET MENUS BY MASTER ID
 */
export const getMenusByMaster = async (masterId: number): Promise<Menu[]> => {
    const json = await http(`${BASE_PATH}/master/${masterId}`);

    const rows = Array.isArray(json)
        ? json
        : json.data || json.rows || [];

    return rows.map((item: any) => ({
        id: item.id,
        menu_name: item.menu_name || item.name || "",
        menu_title_id: item.menu_title_id,
        sort_order: item.sort_order,
        is_active: item.is_active ?? 1,
        is_enabled: item.is_enabled ?? 1,
        status: item.status ?? (item.is_active === 1 ? "active" : "inactive"),
    }));
};

/**
 * UPDATE MENU (STATUS / ACTIVE / ENABLED)
 */
export const updateMenu = async (
    id: number,
    data: Partial<Menu>
) => {
    return await http(
        `${BASE_PATH}/${id}`,
        {
            method: "PUT",
            body: JSON.stringify({
                status: data.status ?? "active",
                // is_active: data.is_active,
                // is_enabled: data.is_enabled,
                sort_order: data.sort_order,
                user_id: getUserId(),
            }),
        }
    );
};

/**
 * DELETE MENU
 */
export const deleteMenu = async (id: number) => {
    return await http(
        `${BASE_PATH}/${id}`,
        {
            method: "DELETE",
        }
    );
};
