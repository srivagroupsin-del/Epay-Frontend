import { http, getUserId } from "../../base_api/base_api";

export type MultitabMenu = {
    id: number;
    menu_title_id?: number;
    menu_name: string;
    status?: number; // 0 or 1
};

/**
 * CREATE Multi Tab Menu
 */
export const createMultiTabMenu = (data: {
    menu_title_id?: number;
    menu_name: string;
    status?: number;
}) => {
    return http("/multitab/menu", {
        method: "POST",
        body: JSON.stringify({
            ...data,
            user_id: getUserId(),
            status: data.status ?? 1
        }),
    });
};

/**
 * GET ALL Multi Tab Menus
 */
export const getMultiTabMenus = async () => {
    const json = await http("/multitab/menu");
    let rows: any[] = [];
    if (Array.isArray(json)) {
        rows = json;
    } else if (json && typeof json === 'object') {
        rows = json.data || json.rows || json.results || json.items || [];
    }

    return rows.filter((m: any) =>
        m.menu_name &&
        !m.menu_name.toLowerCase().includes("select") &&
        m.menu_name.trim() !== ""
    );
};

/**
 * UPDATE Multi Tab Menu
 */
export const updateMultiTabMenu = (id: number, data: {
    menu_name: string;
    status?: number;
}) => {
    return http(`/multitab/menu/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            ...data,
            user_id: getUserId(),
            status: data.status ?? 1
        }),
    });
};

/**
 * DELETE Multi Tab Menu
 */
export const deleteMultiTabMenu = (id: number) => {
    return http(`/multitab/menu/${id}`, {
        method: "DELETE",
    });
};

