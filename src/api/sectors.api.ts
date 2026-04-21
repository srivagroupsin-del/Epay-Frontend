import { http, getUserId } from "../base_api/base_api";

/* =========================
   TYPES
========================= */
export type Sector = {
  id: number;
  sector_title_id: number | null;
  sector_title: string | null;

  sector_name: string | null; // DB field
  name: string | null;        // alias for UI (optional)

  description: string | null;
  info: string | null;
  note: string | null;
  system_note: string | null;

  image: string | null;
  status: "active" | "inactive";
};

/* =========================
   GET ALL SECTORS
========================= */
export const getSectors = async (): Promise<Sector[]> => {
  const json = await http("/sectors");
  const rows = Array.isArray(json) ? json : json.data ?? [];

  return rows.map((item: any) => ({
    id: item.id,

    // sector title
    sector_title_id: item.sector_title_id ?? null,
    sector_title:
      item.sector_title_name ??
      item.sector_title ??
      null,

    // sector name
    sector_name:
      item.sector_name ??
      item.name ??
      null,

    // optional alias for UI
    name:
      item.sector_name ??
      item.name ??
      null,

    // extra fields (🔥 previously missing)
    description: item.description ?? null,
    info: item.info ?? null,
    note: item.note ?? null,
    system_note: item.system_note ?? null,

    image: item.image ?? null,
    status: item.status,
  }));
};

/* =========================
   GET SECTOR BY ID
========================= */
export const getSectorById = async (id: number | string): Promise<Sector> => {
  const json = await http(`/sectors/${id}`);
  const item = json.data ?? json;

  return {
    id: item.id,
    sector_title_id: item.sector_title_id ?? null,
    sector_title: item.sector_title_name ?? item.sector_title ?? null,
    sector_name: item.sector_name ?? item.name ?? null,
    name: item.sector_name ?? item.name ?? null,
    description: item.description ?? null,
    info: item.info ?? null,
    note: item.note ?? null,
    system_note: item.system_note ?? null,
    image: item.image ?? null,
    status: item.status,
  };
};



/* =========================
   CREATE SECTOR
========================= */
export const createSector = async (data: any) => {
  const formData = new FormData();

  formData.append("user_id", getUserId());
  formData.append("sector_title_id", data.sectorTitleId);
  formData.append("sector_name", data.sectorName);
  formData.append("description", data.description || "");
  formData.append("info", data.info || "");
  formData.append("note", data.note || "");
  formData.append("system_note", data.systemNote || "");
  formData.append("icon_name", data.iconText || "");
  formData.append("link", data.link || "");
  formData.append("status", data.status);

  if (data.image) formData.append("image", data.image);
  if (data.banner) formData.append("banner", data.banner);
  if (data.theme) formData.append("theme", data.theme);
  if (data.iconFile) formData.append("icon_file", data.iconFile);

  return await http("/sectors", {
    method: "POST",
    body: formData,
  });
};

/* =========================
   DELETE SECTOR
========================= */
export const deleteSector = async (id: number) => {
  return await http(`/sectors/${id}`, {
    method: "DELETE",
  });
};
/* UPDATE */
export const updateSector = async (id: number, data: any) => {
  const formData = new FormData();

  formData.append("user_id", getUserId());
  formData.append("sector_title_id", data.sectorTitleId);
  formData.append("sector_name", data.sectorName);
  formData.append("description", data.description || "");
  formData.append("info", data.info || "");
  formData.append("note", data.note || "");
  formData.append("system_note", data.systemNote || "");
  formData.append("status", data.status);

  if (data.image) formData.append("image", data.image);

  return await http(`/sectors/${id}`, {
    method: "PUT",
    body: formData,
  });
};