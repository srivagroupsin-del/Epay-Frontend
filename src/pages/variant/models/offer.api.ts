import { http } from "../../../base_api/base_api";

export type Offer = {
    id: number;
    name: string;
    description: string;
    status: "active" | "inactive" | number;
};

export type OfferPayload = {
    name: string;
    description: string;
    status: "active" | "inactive";
};

export type CategoryOffer = {
    id: number;
    category_id: number;
    offer_id: number;
    status: "active" | "inactive" | number;
    category_name?: string;
    offer_name?: string;
    offer_description?: string;
};

export type CategoryOfferPayload = {
    category_id: number;
    offer_id: number;
    status: "active" | "inactive";
};

export type ProductOffer = {
    id: number;
    product_id: number;
    offer_id: number;
    status: "active" | "inactive" | number;
    product_name?: string;
    category_name?: string;
    offer_name?: string;
    offer_description?: string;
};

export type ProductOfferPayload = {
    product_id: number;
    offer_id: number;
    status: "active" | "inactive";
};

/* ============================================================================
   OFFER CRUD
============================================================================ */

export const getOffers = async (): Promise<Offer[]> => {
    const json = await http("/offers");
    return json.data ?? json;
};

export const createOffer = async (data: OfferPayload) => {
    const json = await http("/offers", {
        method: "POST",
        body: JSON.stringify(data),
    });
    return json.data ?? json;
};

export const deleteOffer = async (id: number) => {
    return await http(`/offers/${id}`, { method: "DELETE" });
};

/* ============================================================================
   CATEGORY OFFER CRUD
============================================================================ */

export const getCategoryOffers = async (): Promise<CategoryOffer[]> => {
    const json = await http("/category-offers");
    return json.data ?? json;
};

export const createCategoryOffer = async (data: CategoryOfferPayload) => {
    const json = await http("/category-offers", {
        method: "POST",
        body: JSON.stringify(data),
    });
    return json.data ?? json;
};

export const deleteCategoryOffer = async (id: number) => {
    return await http(`/category-offers/${id}`, { method: "DELETE" });
};

/* ============================================================================
   PRODUCT OFFER CRUD
============================================================================ */

export const getProductOffers = async (): Promise<ProductOffer[]> => {
    const json = await http("/product-offers");
    return json.data ?? json;
};

export const createProductOffer = async (data: ProductOfferPayload) => {
    const json = await http("/product-offers", {
        method: "POST",
        body: JSON.stringify(data),
    });
    return json.data ?? json;
};

export const deleteProductOffer = async (id: number) => {
    return await http(`/product-offers/${id}`, { method: "DELETE" });
};
