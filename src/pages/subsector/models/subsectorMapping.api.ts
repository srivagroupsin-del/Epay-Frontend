import { http } from "../../../base_api/base_api";

/* =========================
   SUBSECTOR → SECTOR MAPPING
========================= */
export const saveSubSectorMapping = async (
  sector_id: number,
  sub_sector_ids: number[]
) => {
  return await http("/sub-sectors/map-to-sector", {
    method: "PUT",
    body: JSON.stringify({
      sector_id,
      sub_sector_ids,
    }),
  });
};
