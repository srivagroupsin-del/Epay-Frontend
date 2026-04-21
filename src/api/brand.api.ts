import { http, getUserId } from "../base_api/base_api";

/* =========================
   TYPES
========================= */
export type Brand = {
    id: number;
    brand_name: string;
    description?: string;
    info?: string;
    note?: string;
    system_note?: string;
    icon_text?: string;
    link?: string;
    status: "active" | "inactive";
    image?: string | null;
    banner?: string | null;
    theme?: string | null;
    icon_file?: string | null;
};

/* =========================
   GET ALL BRANDS
========================= */
export const getBrands = async (): Promise<Brand[]> => {
    const json = await http("/brands");
    return json.data ?? json;
};

/* =========================
   GET BRAND BY ID
========================= */
export const getBrandById = async (id: number | string) => {
    const json = await http(`/brands/${id}`);
    return json.data ?? json;
};

/* =========================
   CREATE BRAND
========================= */
export const createBrand = async (data: any) => {
    const formData = new FormData();

    formData.append("user_id", getUserId());
    formData.append("brand_name", data.brandName);
    formData.append("description", data.description || "");
    formData.append("info", data.info || "");
    formData.append("note", data.note || "");
    formData.append("system_note", data.systemNote || "");
    formData.append("icon_text", data.iconText || "");
    formData.append("link", data.link || "");
    formData.append("status", data.status);

    if (data.image) formData.append("image", data.image);
    if (data.banner) formData.append("banner", data.banner);
    if (data.theme) formData.append("theme", data.theme);
    if (data.iconFile) formData.append("icon_file", data.iconFile);

    return await http("/brands", {
        method: "POST",
        body: formData,
    });
};

/* =========================
   UPDATE BRAND
========================= */
export const updateBrand = async (id: number | string, data: any) => {
    const formData = new FormData();

    formData.append("user_id", getUserId());
    formData.append("brand_name", data.brandName);
    formData.append("description", data.description || "");
    formData.append("info", data.info || "");
    formData.append("note", data.note || "");
    formData.append("system_note", data.systemNote || "");
    formData.append("icon_text", data.iconText || "");
    formData.append("link", data.link || "");
    formData.append("status", data.status);

    if (data.image) formData.append("image", data.image);
    if (data.banner) formData.append("banner", data.banner);
    if (data.theme) formData.append("theme", data.theme);
    if (data.iconFile) formData.append("icon_file", data.iconFile);

    return await http(`/brands/${id}`, {
        method: "PUT",
        body: formData,
    });
};

/* =========================
   DELETE BRAND
========================= */
export const deleteBrand = async (id: number | string) => {
    return await http(`/brands/${id}`, {
        method: "DELETE",
    });
};
/* =========================
   GET BRANDS BY CATEGORY
========================= */
export const getBrandsByCategory = async (
    primaryCategoryId: number | string,
    secondaryCategoryId?: number | string
): Promise<Brand[]> => {
    const params = new URLSearchParams();
    params.append("primary_category_id", String(primaryCategoryId));
    if (secondaryCategoryId) {
        params.append("secondary_category_id", String(secondaryCategoryId));
    }

    const json = await http(`/brands?${params.toString()}`);
    return json.data ?? json;
};
