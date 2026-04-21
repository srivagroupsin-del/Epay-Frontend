import { http } from "../../../base_api/base_api";

export type TaxPayload = {
    menu_id?: number | string;
    name: string;
    value: string;
    status: "active" | "inactive";
};

export type CategoryTaxPayload = {
    category_id: number;
    gst_variant_id: number;
    hsn_code: string;
    status: "active" | "inactive";
};

export type Tax = {
    id: number;
    menu_id?: number;
    menu_name?: string;
    name: string;
    value: string;
    status: "active" | "inactive" | number | string;
    created_at: string;
};

export const getTaxes = async (): Promise<Tax[]> => {
    const json = await http("/variant", {
        method: "GET",
    });
    console.log(json);
    return json.data ?? json;
};

export const createTax = async (data: TaxPayload) => {
    return await http("/variant/create", {
        method: "POST",
        body: JSON.stringify({
            menu_id: data.menu_id ? Number(data.menu_id) : undefined,
            name: data.name,
            value: data.value,
            status: data.status,
        }),
    });
};

export const updateTax = async (id: number, data: TaxPayload) => {
    return await http(`/variant/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            menu_id: data.menu_id ? Number(data.menu_id) : undefined,
            name: data.name,
            value: data.value,
            status: data.status,
        }),
    });
};

export const deleteTax = async (id: number) => {
    return await http(`/variant/${id}`, {
        method: "DELETE",
    });
};

export const createCategoryTax = async (data: CategoryTaxPayload) => {
    return await http("/categories/tax/create", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export type CategoryTax = {
    id: number;
    category_id: number;
    gst_variant_id: number;
    hsn_code: string;
    status: "active" | "inactive" | number;
    category_name?: string;
    gst_value?: string; // Possible alias
    variant_name?: string; // Possible alias
    value?: string; // Joined field
    name?: string; // Joined field
    percentage?: string; // Possible alias
    gst?: string; // Possible alias
    tax?: string; // Possible alias
    gst_percent?: string; // Possible alias
    tax_percent?: string; // Possible alias
};

export const getCategoryTaxes = async (): Promise<CategoryTax[]> => {
    const json = await http("/categories/tax", {
        method: "GET",
    });
    return json.data ?? json;
};

export const updateCategoryTax = async (id: number, data: CategoryTaxPayload) => {
    return await http(`/categories/tax/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteCategoryTax = async (id: number) => {
    return await http(`/categories/tax/${id}`, {
        method: "DELETE",
    });
};

export type ProductTaxPayload = {
    product_id: number;
    gst_variant_id: number;
    hsn_code: string;
    status: "active" | "inactive";
};

export const createProductTax = async (data: ProductTaxPayload) => {
    return await http("/products/tax/create", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export type ProductTax = {
    id: number;
    product_id: number;
    gst_variant_id: number;
    hsn_code: string;
    status: "active" | "inactive" | number;
    product_name?: string;
    category_name?: string;
    gst_value?: string;
    variant_name?: string;
    value?: string;
    name?: string;
    percentage?: string;
    gst?: string;
    tax?: string;
    gst_percent?: string;
    tax_percent?: string;
};

export const getProductTaxes = async (): Promise<ProductTax[]> => {
    const json = await http("/products/tax", {
        method: "GET",
    });
    return json.data ?? json;
};

export const updateProductTax = async (id: number, data: ProductTaxPayload) => {
    return await http(`/products/tax/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteProductTax = async (id: number) => {
    return await http(`/products/tax/${id}`, {
        method: "DELETE",
    });
};
