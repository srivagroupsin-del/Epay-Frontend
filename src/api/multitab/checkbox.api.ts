import { http, getUserId } from "../../base_api/base_api";

const BASE_PATH = "/multitab/sector_title/sector-title-checkbox";

export type Checkbox = {
  id: number;
  label: string;
  value: string;
  status?: number;
  is_active?: number;
  created_at?: string;
};

export const getCheckboxes = async (): Promise<Checkbox[]> => {
  const json = await http(`${BASE_PATH}/all`);
  return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const getCheckboxesByMenuTitle = async (
  _menuTitleId: number
): Promise<Checkbox[]> => {
  // Assuming the backend has a way to filter, but if not, fallback to all or specific endpoint if known.
  // The master api used /all as a placeholder or specific filter if supported.
  const json = await http(`${BASE_PATH}/all`);
  return Array.isArray(json) ? json : (json as any).data ?? [];
};

export const createCheckbox = async (data: {
  label: string;
  value: string;
  status?: number;
}) => {
  return await http(BASE_PATH, {
    method: "POST",
    body: JSON.stringify({
      ...data,
      user_id: getUserId()
    }),
  });
};

export const updateCheckbox = async (
  id: number,
  data: any
) => {
  return await http(`${BASE_PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...data,
      user_id: getUserId()
    }),
  });
};

export const deleteCheckbox = async (id: number) => {
  return await http(`${BASE_PATH}/${id}`, {
    method: "DELETE",
  });
};
