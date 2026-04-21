import { http } from "../base_api/base_api";

export const MultitabConfigApi = {
  // 🟢 1. MULTITAB (Menu, Heading, Checkbox)
  // Base: /api/multitab

  // MENU
  getAllMenus: async () => {
    const json = await http("/multitab/multitab-menu/all");
    return json.data ?? json;
  },
  getConfigById: async (id: number | string) => {
    const json = await http(`/multitab-config/${id}`);
    return json.data ?? json;
  },
  createMenu: (data: any) => http("/multitab/multitab-menu", { method: "POST", body: JSON.stringify(data) }),
  updateMenu: (id: number | string, data: any) => http(`/multitab/multitab-menu/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMenu: (id: number | string) => http(`/multitab/multitab-menu/${id}`, { method: "DELETE" }),

  // HEADING
  getAllHeadings: async () => {
    const json = await http("/multitab/multitab-heading/all");
    return json.data ?? json;
  },
  getHeadingsByTab: async (tabId: number | string) => {
    const json = await http(`/multitab/multitab-heading/tab/${tabId}`);
    return json.data ?? json;
  },
  createHeading: (data: any) => http("/multitab/multitab-heading", { method: "POST", body: JSON.stringify(data) }),
  updateHeading: (id: number | string, data: any) => http(`/multitab/multitab-heading/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // CHECKBOX
  getAllCheckboxes: async () => {
    const json = await http("/multitab/multitab-checkbox/all");
    return json.data ?? json;
  },
  createCheckbox: (data: any) => http("/multitab/multitab-checkbox", { method: "POST", body: JSON.stringify(data) }),
  updateCheckbox: (id: number | string, data: any) => http(`/multitab/multitab-checkbox/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // 🟢 2. FIELDS MODULE
  // Base: /api/multitab-fields
  getAllFields: async () => {
    const json = await http("/multitab-fields");
    return json.data ?? json;
  },
  getFieldById: async (id: number | string) => {
    const json = await http(`/multitab-fields/${id}`);
    return json.data ?? json;
  },
  createField: (data: any) => http("/multitab-fields", { method: "POST", body: JSON.stringify(data) }),
  updateField: (id: number | string, data: any) => http(`/multitab-fields/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteField: (id: number | string) => http(`/multitab-fields/${id}`, { method: "DELETE" }),

  // Filtered fields (checkbox-based UI)
  getUIFields: async (checkboxIds: string) => {
    const json = await http(`/multitab-fields/ui?checkbox_ids=${checkboxIds}`);
    return json.data ?? json;
  },

  // 🟢 3. CONFIG MODULE
  // Base: /api/multitab-config
  getAllConfigs: async () => {
    const json = await http("/multitab-config");
    return json.data ?? json;
  },
  createConfig: (data: any) => http("/multitab-config", { method: "POST", body: JSON.stringify(data) }),
  updateConfig: (id: number | string, data: any) => http(`/multitab-config/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteConfig: (id: number | string) => http(`/multitab-config/${id}`, { method: "DELETE" }),

  /**
   * 🔥 MAIN RUNTIME API (USE THIS IN PRODUCT PAGE)
   * GET /api/multitab-config/fields
   */
  getDynamicFields: async (categoryIds: (number | string)[]) => {
    const query = categoryIds.map(id => `category_id=${id}`).join('&');
    const json = await http(`/multitab-config/fields?${query}`);
    return json.data ?? json;
  },
};
