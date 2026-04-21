import { http } from "../../../base_api/base_api";

export type VariantPayload = {
    name: string;
    status: "active" | "inactive";
};

export type Variant = {
    id: number;
    name: string;
    status: "active" | "inactive";
    created_at: string;
};

export const getVariants = async (): Promise<Variant[]> => {
    const json = await http("/variants");
    return json.data ?? json;
};

export const createVariant = async (data: VariantPayload) => {
    return await http("/variants", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const updateVariant = async (id: number, data: VariantPayload) => {
    return await http(`/variants/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteVariant = async (id: number) => {
    return await http(`/variants/${id}`, {
        method: "DELETE",
    });
};
