import { http } from "../base_api/base_api";

/* ================= TYPE ================= */
export type SectorTitle = {
  id: number;
  name: string;
  image?: string;
  status: "active" | "inactive";
};

/* ================= GET ALL SECTOR TITLES ================= */
export const getSectorTitles = async (): Promise<SectorTitle[]> => {
  const res = await http("/sectorTitleRoutes");
  return res.data;
};

/* ================= GET SINGLE SECTOR TITLE ================= */
export const getSectorTitleById = async (
  id: number
): Promise<SectorTitle> => {
  const res = await http(`/sectorTitleRoutes/${id}`);
  return res.data;
};

/* ================= CREATE SECTOR TITLE ================= */
export const createSectorTitle = async (data: FormData) => {
  return http("/sectorTitleRoutes", {
    method: "POST",
    body: data,
  });
};

/* ================= UPDATE SECTOR TITLE ================= */
export const updateSectorTitle = async (
  id: number,
  data: FormData
) => {
  return http(`/sectorTitleRoutes/${id}`, {
    method: "PUT",
    body: data,
  });
};

/* ================= DELETE SECTOR TITLE ================= */
export const deleteSectorTitle = async (id: number) => {
  return http(`/sectorTitleRoutes/${id}`, {
    method: "DELETE",
  });
};
