import { http } from "../../../base_api/base_api";

/* =========================
   BULK → PRIMARY
   PUT /categories/bulk/make-primary
========================= */
export const bulkToPrimary = async (categoryIds: number[]) => {
  return await http("/categories/bulk/make-primary", {
    method: "PUT",
    body: JSON.stringify({
      category_ids: categoryIds,
    }),
  });
};

/* =========================
   BULK → SECONDARY
   PUT /categories/bulk/make-secondary
========================= */
export const bulkToSecondary = async (
  categoryIds: number[],
  parentCategoryId: number
) => {
  return await http("/categories/bulk/make-secondary", {
    method: "PUT",
    body: JSON.stringify({
      category_ids: categoryIds,
      parent_category_id: parentCategoryId,
    }),
  });
};

/* =========================
   BULK REMAP SECONDARY
   PATCH /categories/bulk/remap-secondary
========================= */
export const bulkRemapSecondary = async (
  categoryIds: number[],
  newParentCategoryId: number
) => {
  return await http("/categories/bulk/remap-secondary", {
    method: "PUT",
    body: JSON.stringify({
      category_ids: categoryIds,
      new_parent_category_id: newParentCategoryId,
    }),
  });
};
