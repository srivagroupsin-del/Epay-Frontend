import { http } from "../base_api/base_api";

/* =========================
   BACKEND ROW TYPE (EXACT)
========================= */
export type CategoryRow = {
    id: number;

    sector_title_id: number;
    sector_id: number;
    sub_sector_id: number;

    category_type: "primary" | "secondary";
    parent_category_id: number | null;

    category_name: string;

    description: string | null;
    info: string | null;
    note: string | null;
    system_note: string | null;

    image: string | null;

    is_active: number;
    is_enabled: number;

    status: "active" | "inactive";

    created_at: string;
    updated_at: string;

    /* JOINED NAMES */
    sector_title_name: string | null;
    sector_name: string | null;
    sub_sector_name: string | null;
    parent_category_name: string | null;
};

/* =========================
   GET ALL CATEGORIES
========================= */
export const getCategories = async (): Promise<CategoryRow[]> => {
    const json = await http("/categories");
    return json.data ?? json;
};

/* =========================
   UPDATE CATEGORY (PUT)
========================= */
export const updateCategory = async (id: number, formData: FormData) => {
    return await http(`/categories/${id}`, {
        method: "PUT",
        body: formData,
    });
};

/* =========================
   PROMOTE TO PRIMARY HELPER
========================= */
export const promoteToPrimary = async (category: CategoryRow) => {
    const formData = new FormData();

    formData.append("sector_title_id", String(category.sector_title_id));
    formData.append("sector_id", String(category.sector_id));
    formData.append("category_name", category.category_name);
    formData.append("status", category.status || "active");
    formData.append("category_type", "Primary"); // Transition to Primary

    // Clear parent association
    formData.append("parent_category_id", "");

    if (category.sub_sector_id) {
        formData.append("sub_sector_id", String(category.sub_sector_id));
    }

    // Description, Note, etc.
    formData.append("description", category.description || "");
    formData.append("note", category.note || "");
    formData.append("info", category.info || "");
    formData.append("system_note", category.system_note || "");

    return await updateCategory(category.id, formData);
};
