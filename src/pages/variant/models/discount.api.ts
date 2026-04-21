import { http } from "../../../base_api/base_api";

export type Discount = {
    id: number;
    name: string;
    value: string;
    type: "percentage" | "flat";
    status: "active" | "inactive" | number;
};

export type DiscountPayload = {
    name: string;
    value: string;
    type: "percentage" | "flat";
    status: "active" | "inactive";
};

export type CategoryDiscount = {
    id: number;
    category_id: number;
    discount_id: number;
    status: "active" | "inactive" | number;
    category_name?: string;
    discount_name?: string;
    discount_value?: string;
    discount_type?: string;
};

export type CategoryDiscountPayload = {
    category_id: number;
    discount_id: number;
    status: "active" | "inactive";
};

export type ProductDiscount = {
    id: number;
    product_id: number;
    discount_id: number;
    status: "active" | "inactive" | number;
    product_name?: string;
    category_name?: string;
    discount_name?: string;
    discount_value?: string;
    discount_type?: string;
};

export type ProductDiscountPayload = {
    product_id: number;
    discount_id: number;
    status: "active" | "inactive";
};

/* ============================================================================
   DISCOUNT CRUD
============================================================================ */

export const getDiscounts = async (): Promise<Discount[]> => {
    const json = await http("/discounts");
    return json.data ?? json;
};

export const createDiscount = async (data: DiscountPayload) => {
    const json = await http("/discounts", {
        method: "POST",
        body: JSON.stringify(data),
    });
    return json.data ?? json;
};

export const deleteDiscount = async (id: number) => {
    return await http(`/discounts/${id}`, { method: "DELETE" });
};

/* ============================================================================
   CATEGORY DISCOUNT CRUD
============================================================================ */

export const getCategoryDiscounts = async (): Promise<CategoryDiscount[]> => {
    const json = await http("/category-discounts");
    return json.data ?? json;
};

export const createCategoryDiscount = async (data: CategoryDiscountPayload) => {
    const json = await http("/category-discounts", {
        method: "POST",
        body: JSON.stringify(data),
    });
    return json.data ?? json;
};

export const deleteCategoryDiscount = async (id: number) => {
    return await http(`/category-discounts/${id}`, { method: "DELETE" });
};

/* ============================================================================
   PRODUCT DISCOUNT CRUD
============================================================================ */

export const getProductDiscounts = async (): Promise<ProductDiscount[]> => {
    const json = await http("/product-discounts");
    return json.data ?? json;
};

export const createProductDiscount = async (data: ProductDiscountPayload) => {
    const json = await http("/product-discounts", {
        method: "POST",
        body: JSON.stringify(data),
    });
    return json.data ?? json;
};

export const deleteProductDiscount = async (id: number) => {
    return await http(`/product-discounts/${id}`, { method: "DELETE" });
};
