import { http } from "../../base_api/base_api";

export type Master = {
    id: number;
    module_type: "category" | "sector" | "subsector" | "brand" | "global";
    module_id: number | null;
    created_at?: string;
};

export const getAllMasters = async (): Promise<Master[]> => {
    const json = await http("/master");
    return Array.isArray(json) ? json : json.data ?? [];
};

export const createMaster = async (data: { module_type: string; module_id: number | null }) => {
    return await http("/master", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const updateMaster = async (id: number, data: { module_type: string; module_id: number | null }) => {
    return await http(`/master/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteMaster = async (id: number) => {
    return await http(`/master/${id}`, {
        method: "DELETE",
    });
};
