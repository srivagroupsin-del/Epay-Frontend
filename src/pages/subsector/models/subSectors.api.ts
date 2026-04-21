import { http } from "../../../base_api/base_api";

/* =========================
   TYPES
========================= */
export type SubSubSectorPayload = {
  sector_title_id: string;
  sector_id: string;
  sub_sector_name: string;
  description?: string;
  info?: string;
  note?: string;
  system_note?: string;
  icon_text?: string;
  link?: string;
  status: string;
  image?: File | null;
  banner?: File | null;
  theme?: File | null;
  icon_file?: File | null;
};

export type SubSectorRow = {
  id: number;
  sector_id: number;
  sector_title_name: string | null;
  sector_name: string | null;
  sub_sector_name: string | null;
  description?: string | null;
  info?: string | null;
  note?: string | null;
  system_note?: string | null;
  image: string | null;
  status: string;
};

/* =========================
   GET ALL SUBSECTORS
========================= */
export const getSubSubSectors = async (): Promise<SubSectorRow[]> => {
  const json = await http("/sub-sectors");
  return json.data ?? json;
};

/* =========================
   GET SUB SECTOR BY ID
========================= */
export const getSubSubSectorById = async (id: number | string): Promise<SubSectorRow> => {
  try {
    const json = await http(`/sub-sectors/${id}`);
    return json.data ?? json;
  } catch (err: any) {
    // Fallback if single record endpoint is missing or returns 404
    if (err.message?.includes("404")) {
      console.warn("Single subsector endpoint failed, falling back to filtration...");
      const all = await getSubSubSectors();
      const found = all.find(r => String(r.id) === String(id));
      if (found) return found;
    }
    throw err;
  }
};

/* =========================
   CREATE SUB SECTOR
========================= */
export const createSubSubSector = async (data: SubSubSectorPayload) => {
  const formData = new FormData();

  formData.append("sector_title_id", data.sector_title_id);
  formData.append("sector_id", data.sector_id);
  formData.append("sub_sector_name", data.sub_sector_name);
  formData.append("description", data.description || "");
  formData.append("info", data.info || "");
  formData.append("note", data.note || "");
  formData.append("system_note", data.system_note || "");
  formData.append("status", data.status);

  if (data.image) formData.append("image", data.image);
  if (data.banner) formData.append("banner", data.banner);
  if (data.theme) formData.append("theme", data.theme);
  if (data.icon_file) formData.append("icon_file", data.icon_file);

  return await http("/sub-sectors", {
    method: "POST",
    body: formData,
  });
};

/* =========================
   UPDATE SUB SECTOR
========================= */
export const updateSubSubSector = async (
  id: number,
  data: SubSubSectorPayload
) => {
  const formData = new FormData();

  formData.append("sector_title_id", data.sector_title_id);
  formData.append("sector_id", data.sector_id);
  formData.append("sub_sector_name", data.sub_sector_name);
  formData.append("description", data.description || "");
  formData.append("info", data.info || "");
  formData.append("note", data.note || "");
  formData.append("system_note", data.system_note || "");
  formData.append("status", data.status);

  if (data.image) formData.append("image", data.image);
  if (data.banner) formData.append("banner", data.banner);
  if (data.theme) formData.append("theme", data.theme);
  if (data.icon_file) formData.append("icon_file", data.icon_file);

  return await http(`/sub-sectors/${id}`, {
    method: "PUT",
    body: formData,
  });
};

/* =========================
   DELETE SUB SECTOR
========================= */
export const deleteSubSubSector = async (id: number) => {
  return await http(`/sub-sectors/${id}`, {
    method: "DELETE",
  });
};
