import { http } from "../../../base_api/base_api";

export type UnitTypePayload = {
    type: string;
    name: string;
    status: "active" | "inactive";
};

export type UnitType = {
    id: number;
    type: string;
    name: string;
    status: "active" | "inactive";
    created_at: string;
};

export const getUnitTypes = async (): Promise<UnitType[]> => {
    const json = await http("/unit-types");
    return json.data ?? json;
};

export const createUnitType = async (data: UnitTypePayload) => {
    return await http("/unit-types", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const updateUnitType = async (id: number, data: UnitTypePayload) => {
    return await http(`/unit-types/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteUnitType = async (id: number) => {
    return await http(`/unit-types/${id}`, {
        method: "DELETE",
    });
};
