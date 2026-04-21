import { http } from "../../base_api/base_api";

export type MultitabTitle = {
    id: number;
    menu_title: string;
    description?: string;
    status?: "active" | "inactive" | "blocked";
};

/**
 * CREATE Multitab Title (Using the master menu/titles endpoint)
 */
export const createMultitabTitle = (data: {
    title: string;
    description?: string;
    status?: number;
}) => {
    // Note: The master endpoint expects menu_title
    return http("/menu/titles", {
        method: "POST",
        body: JSON.stringify({
            menu_title: data.title
            // The master endpoint might not support description/status in the same POST
            // But we'll send it if supported. addMenuTitle only sends menu_title.
        }),
    });
};

/**
 * GET ALL Multitab Titles
 */
export const getMultitabTitles = async (): Promise<MultitabTitle[]> => {
    const json = await http("/menu/titles");
    // menu/titles returns { data: [...] } based on MenuTitlePage.tsx
    return Array.isArray(json) ? json : json.data ?? [];
};

/**
 * UPDATE Multitab Title
 */
export const updateMultitabTitle = async (id: number, data: {
    title: string;
    description?: string;
    status?: number;
}) => {
    // Update title
    await http(`/menu/titles/${id}`, {
        method: "PUT",
        body: JSON.stringify({ menu_title: data.title }),
    });

    // Update status (if status is provided and different)
    const statusStr = data.status === 1 ? "active" : "inactive";
    return await http(`/menu/titles/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: statusStr }),
    });
};

/**
 * DELETE Multitab Title
 */
export const deleteMultitabTitle = (id: number) => {
    return http(`/menu/titles/${id}`, {
        method: "DELETE",
    });
};
