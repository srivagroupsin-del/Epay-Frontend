import { http } from "../base_api/base_api";
import { BASE_URL } from "../base_api/api_list";

/* ============================================================================
   TYPES
============================================================================ */

export type Product = {
    id: number;
    product_name: string;
    description: string;
    info: string;
    model?: string;
    series?: string;
    alternative_names?: string[];
    mrp?: number;
    option_set?: number;
    note?: string;
    system_note?: string;
    image?: string;
    base_image?: string;
    status: string;

    // Stored category & brand fields (ID + Name)
    primaryId?: number;
    primaryName?: string;
    secondaryId?: number;
    secondaryName?: string;
    brandId?: number;
    brandName?: string;

    // Legacy fields for backward compatibility
    brand_id?: number | string;
    brand_name?: string;
    brands?: string;
    mappings?: any;
    primary_category_id?: number | string;
    secondary_category_id?: number | string;
    primary_category_name?: string;
    primary_category?: string;
    secondary_category?: string;
    categories?: string;
};

// Type for the object returned by GET /products/:id/mappings
export type ProductMappingResponse = {
    id: number;
    category_id: number;
    brand_id: number;
    secondary_category_id?: number;
};

// Type for the object returned by GET /products/mappings (Joined Table)
export interface ProductMappingRecord {
    product_id: number;
    product_name: string;

    primary_category_id: number | null;
    primary_category_name: string | null;

    secondary_category_id: number | null;
    secondary_category_name: string | null;

    brand_id: number | null;
    brand_name: string | null;

    product_mapping_id: number | null;
    category_brand_mapping_id: number | null;
}

/**
 * Payload for creating a product via POST /api/products.
 * Follows the naming convention from the API guide.
 */
export type ProductCreatePayload = {
    product_name: string;
    description: string;
    info: string;
    status: string;
    mappings: {
        primary_id: number;
        secondary_id: number;
        brand_id: number;
    }[];
    model?: string;
    series?: string;
    alternative_names?: string[];
    option_set?: number;
    mrp?: number | string;
    note?: string;
    system_note?: string;
    image?: File | null;
};

/**
 * Legacy ProductForm type (kept for backward compatibility with existing pages).
 */
export type ProductForm = {
    product_name: string;
    model?: string;
    series?: string;
    alternative_name?: string;
    alternative_names?: string[];
    description: string;
    info: string;
    note?: string;
    option_set?: number;
    mrp?: number | string;
    status: string;
    image?: File | null;
    system_note?: string;
    mappings?: {
        primary_id: number;
        secondary_id: number;
        brand_id: number;
    }[];
    primary_category?: string | number;
    secondary_category?: string | number;
    brand?: string | number;
    mapping_id?: string | number;
};

/* ============================================================================
   CREATE PRODUCT (POST /api/products)
   Follows Guide: productName -> product_name, etc.
============================================================================ */

export const createProduct = async (data: ProductCreatePayload) => {
    const formData = new FormData();

    formData.append("product_name", data.product_name);
    formData.append("description", data.description);
    formData.append("info", data.info);
    formData.append("status", data.status);

    // Guide: mappings must be a non-empty array stringified in FormData
    formData.append("mappings", JSON.stringify(data.mappings));

    if (data.model) formData.append("model", data.model);
    if (data.series) formData.append("series", data.series);
    if (data.alternative_names && data.alternative_names.length > 0) {
        formData.append("alternative_names", JSON.stringify(data.alternative_names));
    }
    if (data.option_set !== undefined) formData.append("option_set", String(data.option_set));
    if (data.mrp) formData.append("mrp", String(data.mrp));
    if (data.note) formData.append("note", data.note);
    if (data.system_note) formData.append("system_note", data.system_note);
    if (data.image) formData.append("image", data.image);
    console.log("Mappings before submit:", data.mappings);
    const json = await http("/products", {
        method: "POST",
        body: formData,
    });
    return json.data ?? json;
};

/* ============================================================================
   UPDATE PRODUCT INFO
   PUT /products/:id
============================================================================ */

export const updateProduct = async (
    id: number | string,
    data: Partial<ProductForm>
) => {
    const formData = new FormData();

    if (data.product_name) formData.append("product_name", data.product_name);
    if (data.description !== undefined) formData.append("description", data.description);
    if (data.info !== undefined) formData.append("info", data.info);
    if (data.status) formData.append("status", data.status);
    if (data.model !== undefined) formData.append("model", data.model || "");
    if (data.series !== undefined) formData.append("series", data.series || "");
    if (data.alternative_name !== undefined) formData.append("alternative_name", data.alternative_name || "");
    if (data.alternative_names !== undefined) {
        formData.append("alternative_names", JSON.stringify(data.alternative_names || []));
    }
    if (data.option_set !== undefined) formData.append("option_set", String(data.option_set));
    if (data.mrp) formData.append("mrp", String(data.mrp));
    if (data.note !== undefined) formData.append("note", data.note || "");
    if (data.system_note !== undefined) formData.append("system_note", data.system_note || "");

    // Individual IDs for backward compatibility/backend verification
    if (data.primary_category) formData.append("category_id", String(data.primary_category));
    if (data.secondary_category) formData.append("secondary_category_id", String(data.secondary_category));
    if (data.brand) formData.append("brand_id", String(data.brand));

    // Support both single mapping_id and multiple mappings array
    if (data.mappings && Array.isArray(data.mappings)) {
        formData.append("mappings", JSON.stringify(data.mappings));
    } else if (data.mapping_id) {
        formData.append("mappings", JSON.stringify([Number(data.mapping_id)]));
    }

    if (data.image instanceof File) {
        formData.append("image", data.image);
    } else if (data.image === null) {
        formData.append("remove_image", "1");
        formData.append("image", "");
    }

    const json = await http(`/products/${id}`, {
        method: "PUT",
        body: formData,
    });
    return json.data ?? json;
};

/* ============================================================================
   UPDATE PRODUCT MAPPINGS
   PUT /products/:id/mappings
============================================================================ */

export const updateProductMappings = async (
    id: number | string,
    mappings: number[]
) => {
    const json = await http(`/products/${id}/mappings`, {
        method: "PUT",
        body: JSON.stringify({ mappings }),
    });
    return json.data ?? json;
};

/* ============================================================================
   GET PRODUCT LIST
   GET /products
============================================================================ */

export const getProducts = async (filters?: {
    primary_id?: string | number;
    secondary_id?: string | number;
    brand_id?: string | number;
    brand?: string;
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    let url = "/products";

    if (filters) {
        const params = new URLSearchParams();

        // Maps to the parent_category_id logic in your SQL
        if (filters.primary_id) params.append("primary_id", String(filters.primary_id));

        // Maps to the category_id logic where a parent exists
        if (filters.secondary_id) params.append("secondary_id", String(filters.secondary_id));

        // Maps to the brand_id in category_brand_mapping
        if (filters.brand_id) params.append("brand_id", String(filters.brand_id));

        // Added search parameter for the "Type product name or model..." input
        if (filters.search) params.append("search", filters.search);

        if (filters.brand) params.append("brand", filters.brand);
        if (filters.category) params.append("category", filters.category);
        if (filters.status) params.append("status", filters.status);

        if (filters.page) params.append("page", String(filters.page));
        if (filters.limit) params.append("limit", String(filters.limit));

        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
    }

    const json = await http(url);
    return json;
};
/* ============================================================================
   GET PRODUCT BY ID
   GET /products/:id
============================================================================ */

export const getProductById = async (id: number | string) => {
    const json = await http(`/products/${id}`);
    return json.data ?? json;
};

/* ============================================================================
   GET PRODUCT MAPPINGS
   GET /products/:id/mappings
============================================================================ */

export const getProductMappings = async (id: number | string) => {
    const json = await http(`/products/${id}/mappings`);
    return json.data ?? json;
};

/* ============================================================================
   DELETE PRODUCT (SOFT DELETE)
   DELETE /products/:id
============================================================================ */

export const deleteProduct = async (id: number | string) => {
    const json = await http(`/products/${id}`, {
        method: "DELETE",
    });
    return json.data ?? json;
};

/* ============================================================================
   UPDATE MRP ONLY
   PUT /products/:id/mrp
============================================================================ */

export const updateProductMRP = async (id: number | string, mrp: number) => {
    const json = await http(`/products/${id}/mrp`, {
        method: "PUT",
        body: JSON.stringify({ mrp }),
    });
    return json.data ?? json;
};

/* ============================================================================
   BULK MAPPING UPDATE
   PUT /products/bulk/mappings
============================================================================ */

export const bulkUpdateMappings = async (
    product_ids: (number | string)[],
    mappings: number[]
) => {
    const json = await http("/products/bulk/mappings", {
        method: "PUT",
        body: JSON.stringify({ product_ids, mappings }),
    });
    return json.data ?? json;
};

/* ============================================================================
   GET MAPPED PRODUCT IDS
   GET /product-mapping/list
============================================================================ */

export const getMappedProductIds = async (filters: {
    primary_id: string | number;
    secondary_id?: string | number;
    brand_id?: string | number;
}) => {
    const params = new URLSearchParams();
    params.append("primary_id", String(filters.primary_id));
    if (filters.secondary_id) params.append("secondary_id", String(filters.secondary_id));
    if (filters.brand_id) params.append("brand_id", String(filters.brand_id));

    const json = await http(`/product-mapping/list?${params.toString()}`);
    return json.data ?? json;
};

/* ============================================================================
   GENERATE QR PDF
   GET /products/:id/qr-pdf
============================================================================ */

export const downloadProductQrPdf = async (id: number | string) => {
    const token = localStorage.getItem("token");
    const headers = new Headers();
    if (token) headers.set("Authorization", token.startsWith("Bearer ") ? token : `Bearer ${token}`);

    const normalizedBase = BASE_URL.replace(/\/+$/, "");
    const finalUrl = `${normalizedBase}/products/${id}/qr-pdf`;

    const response = await fetch(finalUrl, { headers });

    if (!response.ok) throw new Error("Failed to download PDF");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `product_${id}_qr.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

/* ============================================================================
   GET ALL PRODUCTS MAPPINGS (JOINED)
   GET /products/mappings
============================================================================ */

export const getProductsMappings = async () => {
    const json = await http("/products/mappings");
    return json.data ?? json;
};
