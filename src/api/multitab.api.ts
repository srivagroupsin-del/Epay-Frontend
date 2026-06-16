import { http } from "../base_api/base_api";

/* ================= MENUS ================= */
export const getMultitabMenus = async () => {
  const json = await http("/multitab/menus");
  return Array.isArray(json) ? json : json.data || [];
};

export const getMultitabMenuById = async (id: number) => {
  const json = await http(`/multitab/menus/${id}`);
  return json.data || null;
};

export const addMultitabMenu = (data: {
  menu_title_id: number;
  menu_name: string;
  description?: string;
  status: "active" | "inactive";
}) => {
  return http("/multitab/menus", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateMultitabMenu = (id: number, data: {
  menu_title_id?: number;
  menu_name?: string;
  description?: string;
  status?: "active" | "inactive";
}) => {
  return http(`/multitab/menus/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteMultitabMenu = (id: number) => {
  return http(`/multitab/menus/${id}`, {
    method: "DELETE",
  });
};


/* ================= TABS ================= */
export const getMultitabTabs = async () => {
  const json = await http("/multitab/tabs");
  return Array.isArray(json) ? json : json.data || [];
};

export const getMultitabTabById = async (id: number) => {
  const json = await http(`/multitab/tabs/${id}`);
  return json.data || null;
};

export const addMultitabTab = (formData: FormData) => {
  return http("/multitab/tabs", {
    method: "POST",
    body: formData,
  });
};

export const updateMultitabTab = (id: number, formData: FormData) => {
  return http(`/multitab/tabs/${id}`, {
    method: "PUT",
    body: formData,
  });
};

export const deleteMultitabTab = (id: number) => {
  return http(`/multitab/tabs/${id}`, {
    method: "DELETE",
  });
};


/* ================= CHECKBOXES ================= */
export const getMultitabCheckboxes = async () => {
  const json = await http("/multitab/checkboxes");
  return Array.isArray(json) ? json : json.data || [];
};

export const getMultitabCheckboxById = async (id: number) => {
  const json = await http(`/multitab/checkboxes/${id}`);
  return json.data || null;
};

export const addMultitabCheckbox = (formData: FormData) => {
  return http("/multitab/checkboxes", {
    method: "POST",
    body: formData,
  });
};

export const updateMultitabCheckbox = (id: number, formData: FormData) => {
  return http(`/multitab/checkboxes/${id}`, {
    method: "PUT",
    body: formData,
  });
};

export const deleteMultitabCheckbox = (id: number) => {
  return http(`/multitab/checkboxes/${id}`, {
    method: "DELETE",
  });
};


/* ================= MAPPINGS ================= */
export const getMultitabMappings = async () => {
  const json = await http("/multitab/mappings");
  return Array.isArray(json) ? json : json.data || [];
};

export const getMultitabMappingsByTabId = async (tabId: number) => {
  const json = await http(`/multitab/mappings/tab/${tabId}`);
  return Array.isArray(json) ? json : json.data || [];
};

export const saveMultitabMappings = (data: { tabId: number; checkboxIds: number[] }) => {
  return http("/multitab/mappings", {
    method: "POST",
    body: JSON.stringify(data),
  });
};


/* ================= PREVIEW ================= */
export const getMultitabPreview = async () => {
  const json = await http("/multitab/preview");
  return Array.isArray(json) ? json : json.data || [];
};
