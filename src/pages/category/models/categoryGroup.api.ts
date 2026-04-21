import { http } from "../../../base_api/base_api";

export type CategoryGroupRow = {
    id: number;
    name: string;
    image: string | null;
    status: "active" | "inactive";
    description: string | null;
    info: string | null;
    created_at?: string;
    updated_at?: string;
};

export type CategoryGroupMapping = {
    id: number;
    category_group_id: number;
    category_id: number;
    category_name?: string;
    category_level?: string;
    is_active: number; // 1 = active, 0 = soft-deleted
};

/* ============================================================================
   CATEGORY GROUP API
   ============================================================================ */

/** 4️⃣ Get All Category Groups */
export const getCategoryGroups = async (): Promise<CategoryGroupRow[]> => {
    const json = await http("/categoryGroup");
    return json.data ?? json;
};

/** 5️⃣ Get Category Group By ID */
export const getCategoryGroupById = async (id: number): Promise<CategoryGroupRow> => {
    const json = await http(`/categoryGroup/${id}`);
    return json.data ?? json;
};

/** 3️⃣ Create Category Group (multipart/form-data) */
export const createCategoryGroup = async (formData: FormData) => {
    return await http("/categoryGroup", {
        method: "POST",
        body: formData,
    });
};

/** 6️⃣ Update Category Group (multipart/form-data) */
export const updateCategoryGroup = async (id: number, formData: FormData) => {
    return await http(`/categoryGroup/${id}`, {
        method: "PUT",
        body: formData,
    });
};

/** 7️⃣ Delete Category Group */
export const deleteCategoryGroup = async (id: number) => {
    return await http(`/categoryGroup/${id}`, {
        method: "DELETE",
    });
};

/* ============================================================================
   CATEGORY GROUP MAPPING API
   ============================================================================ */

/**
 * GET mappings for a specific category group.
 * Endpoint: GET /api/categoryGroupMapping?category_group_id=<id>
 */
export const getCategoryGroupMappingsByGroup = async (
    category_group_id: number
): Promise<CategoryGroupMapping[]> => {
    const json = await http(`/categoryGroupMapping?category_group_id=${category_group_id}`);
    return json.data ?? json;
};

/** 8️⃣ Get All Category Group Mappings */
export const getAllCategoryGroupMappings = async (): Promise<CategoryGroupMapping[]> => {
    const json = await http("/categoryGroupMapping");
    return json.data ?? json;
};

/**
 * POST /api/categoryGroupMapping
 * REPLACE MODE: deactivates existing, then inserts the new list.
 * Body: { category_group_id: number, category_ids: number[] }
 */
export const assignCategoriesToGroup = async (payload: {
    category_group_id: number;
    category_ids: number[];
}) => {
    return await http("/categoryGroupMapping", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/**
 * DELETE /api/categoryGroupMapping/:id
 * Soft delete — sets is_active = 0 on the server side.
 */
export const deleteCategoryGroupMapping = async (id: number) => {
    return await http(`/categoryGroupMapping/${id}`, {
        method: "DELETE",
    });
};
