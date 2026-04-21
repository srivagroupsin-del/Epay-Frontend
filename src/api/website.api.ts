import { http } from "../base_api/base_api";

export type Website = {
    id: number;
    website_name: string;
    url: string;
    description: string;
    status: "active" | "inactive";
    created_at?: string;
    updated_at?: string;
};

export const getWebsites = async (): Promise<Website[]> => {
    const json = await http("/websites");
    return Array.isArray(json) ? json : json.data ?? [];
};

export const createWebsite = async (data: Omit<Website, "id">) => {
    return await http("/websites", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const updateWebsite = async (id: number, data: Partial<Website>) => {
    return await http(`/websites/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteWebsite = async (id: number) => {
    return await http(`/websites/${id}`, {
        method: "DELETE",
    });
};
