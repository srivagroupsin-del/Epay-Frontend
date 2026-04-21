import { http } from "../../base_api/base_api";

const BASE_URL = "/multitab/sector_title/sector-title-mapping";

export type Mapping = {
    id: number;
    tab_heading_id: number;
    checkbox_id: number;
    is_default: 0 | 1;
    status?: "active" | "inactive";
};

export const getMappings = async (): Promise<any[]> => {
    const res = await http(`${BASE_URL}/heading`);
    return res?.data ?? (res || []);
};

export const getMappingByHeading = async (headingId: number): Promise<Mapping[]> => {
    const res = await http(`${BASE_URL}/${headingId}`);
    return res?.data ?? [];
};

export const createMapping = async (data: any) => {
    // Remove user_id, sector_id and menu_id if they exist in data
    const { ...cleanData } = data;
    return await http(`${BASE_URL}`, {
        method: "POST",
        body: JSON.stringify(cleanData),
    });
};

export const deleteMapping = async (id: number) => {
    return await http(`${BASE_URL}/${id}`, {
        method: "DELETE",
    });
};

export const updateMapping = async (id: number, data: any) => {
    const { user_id, sector_id, menu_id, ...cleanData } = data;
    return await http(`${BASE_URL}/${id}`, {
        method: "PUT",
        body: JSON.stringify(cleanData),
    });
};
