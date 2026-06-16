import { http } from "../../../../base_api/base_api";

/* LIST MENUS */
export const getMenus = async () => {
  const json = await http("/menu/fields");
  return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const getMenuById = async (id: number) => {
  const list = await getMenus();
  const found = list.find((m: any) => m.id === id);
  return { data: found || null };
};

/* ADD MENU */
export const addMenu = (data: {
  menu_title_id: number;
  page_title: string;
  status: "active" | "inactive";
}) => {
  const payload = {
    menu_title_id: data.menu_title_id || 1,
    page_title: data.page_title,
    status: data.status,
    itab: null,
    icon_name: null,
    link: ""
  };

  return http("/menu/fields", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/* UPDATE MENU */
export const updateMenu = (id: number, data: {
  menu_title_id: number;
  page_title: string;
  status: "active" | "inactive";
}) => {
  const payload = {
    menu_title_id: data.menu_title_id || 1,
    page_title: data.page_title,
    status: data.status,
    itab: null,
    icon_name: null,
    link: ""
  };

  return http(`/menu/fields/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

/* DELETE MENU */
export const deleteMenu = (id: number) => {
  return http(`/menu/fields/${id}`, {
    method: "DELETE",
  });
};
