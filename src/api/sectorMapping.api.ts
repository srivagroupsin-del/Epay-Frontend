import { http } from "../base_api/base_api";

export type Menu = {
  id: number;
  name: string;
};

/* =========================
   GET MENUS
========================= */
export const getMenus = async (): Promise<Menu[]> => {
  const json = await http("/menus");
  return json.data ?? json;
};

/* =========================
   SAVE SECTOR MAPPING
   (MATCHES BACKEND)
========================= */
export const saveSectorMapping = async (
  sectorTitleId: number,
  sectorIds: number[]
) => {
  return await http("/sector-mapping", {
    method: "POST",
    body: JSON.stringify({
      sector_title_id: sectorTitleId,
      sector_ids: sectorIds,
    }),
  });
};
