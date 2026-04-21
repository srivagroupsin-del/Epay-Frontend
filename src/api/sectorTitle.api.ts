import { http, getUserId } from "../base_api/base_api";

/* =========================
   TYPES
========================= */
export type SectorTitle = {
  id: number;
  title: string;
};

/* =========================
   GET ALL (FOR DROPDOWN)
========================= */
export const getSectorTitles = async (): Promise<SectorTitle[]> => {
  const json = await http("/sectorTitleRoutes");

  // Extremely robust extraction for any structure
  let rows: any[] = [];
  if (Array.isArray(json)) {
    rows = json;
  } else if (json && typeof json === 'object') {
    // Check various nesting patterns
    if (Array.isArray(json.data)) rows = json.data;
    else if (json.data && Array.isArray(json.data.rows)) rows = json.data.rows;
    else if (Array.isArray(json.rows)) rows = json.rows;
    else if (Array.isArray(json.results)) rows = json.results;
    else rows = [];
  }

  return rows.map((item: any, index: number) => ({
    id: item.id ?? item.sector_title_id ?? item.id_sector_title ?? index,
    title:
      item.title ??
      item.name ??
      item.sector_title_name ??
      item.sector_title ??
      item.sectorTitle ??
      item.name_sectorTitle ??
      "—",
  }));
};

/* =========================
   CREATE
========================= */
export const createSectorTitle = async (data: any) => {
  const formData = new FormData();

  formData.append("user_id", getUserId());
  formData.append("name", data.name);
  formData.append("description", data.description || "");
  formData.append("info", data.info || "");
  formData.append("note", data.note || "");
  formData.append("system_note", data.systemNote || "");
  formData.append("icon_name", data.iconText || "");
  formData.append("link", data.link || "");
  formData.append("status", data.status);

  if (data.image) formData.append("image", data.image);

  return await http("/sectorTitleRoutes", {
    method: "POST",
    body: formData,
  });
};
  
/* =========================
   GET BY ID
========================= */
export const getSectorTitleById = async (id: string) => {
  const json = await http(`/sectorTitleRoutes/${id}`);
  return json.data ?? json;
};

/* =========================
   UPDATE
========================= */
export const updateSectorTitle = async (id: string, data: any) => {
  const formData = new FormData();

  formData.append("user_id", getUserId());
  formData.append("name", data.name);
  formData.append("description", data.description || "");
  formData.append("info", data.info || "");
  formData.append("note", data.note || "");
  formData.append("system_note", data.systemNote || "");
  formData.append("icon_name", data.iconText || "");
  formData.append("link", data.link || "");
  formData.append("status", data.status);

  if (data.image) formData.append("image", data.image);

  return await http(`/sectorTitleRoutes/${id}`, {
    method: "PUT",
    body: formData,
  });
};
