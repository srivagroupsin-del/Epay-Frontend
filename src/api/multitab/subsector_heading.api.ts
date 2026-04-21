import { http, getUserId } from "../../base_api/base_api";

export type Heading = {
    id: number;
    multitab_menu_id: number;
    heading_name: string;
    title: string;
    description: string;
    image?: string;
    status?: number | string;
};

const BASE_PATH = "/multitab/sub-sector/sub-sector-heading";

export const getAllTabHeadings = async () => {
    const json = await http(`${BASE_PATH}/all`);
    return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const getHeadingsByTab = async (menuId: number): Promise<Heading[]> => {
    const json = await http(`${BASE_PATH}/tab/${menuId}`);
    return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const createHeading = async (data: any) => {
    // If it's FormData, it should be handled by the caller, but here we assume JSON or object
    // Wait, the original master API used FormData for headings (images).
    // Let's support both or check the caller. 
    // AddTabheadingMaster.tsx sends plain object in handleSubmit.
    return await http(BASE_PATH, {
        method: "POST",
        body: JSON.stringify({
            ...data,
            user_id: getUserId()
        }),
    });
};

export const createHeadingFormData = async (data: FormData) => {
    data.append("user_id", getUserId());
    return await http(BASE_PATH, {
        method: "POST",
        body: data,
    });
};

export const updateHeading = async (id: number, data: any) => {
    return await http(`${BASE_PATH}/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            ...data,
            user_id: getUserId()
        }),
    });
};

export const updateHeadingFormData = async (id: number, data: FormData) => {
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
