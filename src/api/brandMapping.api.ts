import { http } from "../base_api/base_api";

/* =========================
   GET BRAND MAPPING
========================= */
// export const getBrandMapping = async (categoryId: number | string) => {
//     const json = await http(`/category-brand/${categoryId}`);
//     return json.data ?? json; // Expecting array of brand IDs or Brand objects
// };

export const getBrandMapping = async () => {
    const json = await http(`/category-brand/list`);
    return json.data ?? json; // Expecting array of brand IDs or Brand objects
};

/* =========================
   SAVE BRAND MAPPING
========================= */
export const saveBrandMapping = async (payload: {
    primary_category_id: number | string;
    secondary_category_id: number | string | null;
    is_secondary_enabled: boolean;
    brand_ids: (number | string)[];
}) => {
    return await http("/category-brand/save", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};
