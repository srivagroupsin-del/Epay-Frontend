import { http } from "../../../base_api/base_api";

export type WebsitePayload = {
    sector_id: number | "";
    title: string;
    name: string;
    url: string;
    categories: string[];
    status: "active" | "inactive";
    image?: File | null;
};

export type Website = {
    id: number;
    sector_id: number;
    sector_name?: string | null;
    title: string;
    name: string;
    url: string;
    image: string | null;
    status: "active" | "inactive";
    created_at: string;
};

export const getWebsites = async (): Promise<Website[]> => {
    const json = await http("/websites");
    return json.data ?? json;
};

export const createWebsite = async (data: WebsitePayload) => {
    const formData = new FormData();
    formData.append("sector_id", String(data.sector_id));
    formData.append("title", data.title);
    formData.append("name", data.name);
    formData.append("url", data.url);
    formData.append("categories", JSON.stringify(data.categories));
    formData.append("status", data.status);
    if (data.image) formData.append("image", data.image);

    return await http("/websites", {
        method: "POST",
        body: formData,
    });
};

export const updateWebsite = async (id: number, data: WebsitePayload) => {
    const formData = new FormData();
    formData.append("sector_id", String(data.sector_id));
    formData.append("title", data.title);
    formData.append("name", data.name);
    formData.append("url", data.url);
    formData.append("categories", JSON.stringify(data.categories));
    formData.append("status", data.status);
    if (data.image) formData.append("image", data.image);

    return await http(`/websites/${id}`, {
        method: "PUT",
        body: formData,
    });
};

export const deleteWebsite = async (id: number) => {
    return await http(`/websites/${id}`, {
        method: "DELETE",
    });
};
