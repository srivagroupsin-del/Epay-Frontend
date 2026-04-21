import { http } from "../../../base_api/base_api";

export type ColourPayload = {
    name: string;
    status: "active" | "inactive";
};

export type Colour = {
    id: number;
    name: string;
    status: "active" | "inactive";
    created_at: string;
};

export const getColours = async (): Promise<Colour[]> => {
    const json = await http("/colours");
    return json.data ?? json;
};

export const createColour = async (data: ColourPayload) => {
    return await http("/colours", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const updateColour = async (id: number, data: ColourPayload) => {
    return await http(`/colours/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteColour = async (id: number) => {
    return await http(`/colours/${id}`, {
        method: "DELETE",
    });
};
