import { http } from "../../base_api/base_api";

export type Mapping = {
    id: number;
    tabheading_id: number;
    checkbox_ids: number[] | string;
    is_default: 0 | 1;
    status?: "active" | "inactive";
};

const BASE_URL = "/multitab/sub-sector/sub-sector-mapping";

export const getMappings = async (): Promise<any[]> => {
    const res = await http(`${BASE_URL}/all`);
    return res?.data ?? (res || []);
};

export const getMappingByHeading = async (headingId: number): Promise<Mapping[]> => {
    const res = await http(`${BASE_URL}/${headingId}`);
    return res?.data ?? [];
};

export const createMapping = async (data: any) => {
    // Remove user_id, sector_id, subsector_id and menu_id as requested
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
    const { ...cleanData } = data;
    return await http(`${BASE_URL}/${id}`, {
        method: "PUT",
        body: JSON.stringify(cleanData),
    });
};
