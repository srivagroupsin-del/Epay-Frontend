import { http } from "../../../base_api/base_api";

export type FieldPayload = {
    name: string;
    status: "active" | "inactive";
};

export type Field = {
    id: number;
    name: string;
    status: "active" | "inactive";
    created_at: string;
};

export const getFields = async (): Promise<Field[]> => {
    const json = await http("/fields");
    return json.data ?? json;
};

export const createField = async (data: FieldPayload) => {
    return await http("/fields", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const updateField = async (id: number, data: FieldPayload) => {
    return await http(`/fields/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteField = async (id: number) => {
    return await http(`/fields/${id}`, {
        method: "DELETE",
    });
};
