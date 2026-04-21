import { http } from "../base_api/base_api";

export type BusinessCategoryGroupMapping = {
    id: number;
    business_id: number;
    category_group_id: number;
    category_group_name?: string;
    is_active: number; // 1 = active, 0 = inactive
    created_at?: string;
    updated_at?: string;
};

/**
 * Assign multiple category groups to a business.
 * POST /api/businessCategoryGroup
 * Body: { "business_id": 1, "category_group_ids": [1, 2, 3] }
 */
export const assignGroupsToBusiness = async (payload: {
    business_id: number;
    category_group_ids: number[];
}) => {
    return await http("/businessCategoryGroup", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/**
 * List all active category groups assigned to a business.
 * GET /api/businessCategoryGroup?business_id=1
 */
export const getGroupsByBusiness = async (
    businessId: number
): Promise<BusinessCategoryGroupMapping[]> => {
    const json = await http(`/businessCategoryGroup?business_id=${businessId}`);

    if (Array.isArray(json)) return json;

    if (json.data) {
        if (Array.isArray(json.data)) return json.data;
        if (json.data.data && Array.isArray(json.data.data)) return json.data.data;
        if (json.data.mappings && Array.isArray(json.data.mappings)) return json.data.mappings;
        if (json.data.category_groups && Array.isArray(json.data.category_groups)) return json.data.category_groups;
    }


    if (json.mappings && Array.isArray(json.mappings)) return json.mappings;

    return [];
};



/**
 * List all business category group mappings.
 * GET /api/businessCategoryGroup
 */
export const getAllBusinessCategoryGroupMappings = async (): Promise<BusinessCategoryGroupMapping[]> => {
    const json = await http("/businessCategoryGroup");

    if (Array.isArray(json)) return json;
    if (json.data && Array.isArray(json.data)) return json.data;

    return [];
};


/**
 * Soft delete a group assignment from a business (sets is_active = 0).
 * DELETE /api/businessCategoryGroup/:id
 */
export const deleteBusinessCategoryGroupMapping = async (id: number) => {
    return await http(`/businessCategoryGroup/${id}`, {
        method: "DELETE",
    });
};
