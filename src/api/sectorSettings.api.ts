import { http } from "../base_api/base_api";

export type SectorItemConfig = {
    id: number;
    category_type: "Primary" | "Secondary";
    sector_id: number;
    item_name: string;
    tax_type: string;
    tax_percent: number;
    amount: number;
    total_value: number;
    status: "active" | "inactive";

    /* Joined field */
    sector_name?: string;
};

/* =========================
   GET ALL SECTOR SETTINGS
========================= */
export const getSectorSettings = async (): Promise<SectorItemConfig[]> => {
    const json = await http("/sector-settings");
    return json.data ?? json;
};

/* =========================
   CREATE SECTOR SETTING
========================= */
export const createSectorSetting = async (data: Omit<SectorItemConfig, "id">) => {
    return await http("/sector-settings", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

/* =========================
   UPDATE SECTOR SETTING
========================= */
export const updateSectorSetting = async (id: number, data: Partial<SectorItemConfig>) => {
    return await http(`/sector-settings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

/* =========================
   DELETE SECTOR SETTING
========================= */
export const deleteSectorSetting = async (id: number) => {
    return await http(`/sector-settings/${id}`, {
        method: "DELETE",
    });
};
