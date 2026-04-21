import { http, getUserId } from "../../base_api/base_api";

const BASE_PATH = "/multitab/sector_title/sector-title-heading";

export type Heading = {
    id: number;
    multitab_menu_id: number;
    heading_name: string;
    title: string;
    description: string;
    image?: string;
    status?: number | string;
};

export const getAllTabHeadings = async () => {
    const json = await http(`${BASE_PATH}/all`);
    return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const getHeadingsByMenu = async (menuId: number): Promise<Heading[]> => {
    const json = await http(`${BASE_PATH}/tab/${menuId}`);
    return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const createHeading = async (data: FormData) => {
    data.append("user_id", getUserId());
    return await http(BASE_PATH, {
        method: "POST",
        body: data,
    });
};

export const updateHeading = async (id: number, data: FormData) => {
    data.append("user_id", getUserId());
    return await http(`${BASE_PATH}/${id}`, {
        method: "PUT",
        body: data,
    });
};

export const deleteHeading = async (id: number) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "DELETE",
    });
};
