import { http, getUserId } from "../../../../base_api/base_api";

/* LIST MENUS */
export const getMenus = async () => {
  const json = await http("/multitab/multitab-menu/all");
  return Array.isArray(json) ? json : json.data || json.rows || [];
};

export const getMenuById = (id: number) => {
  return http(`/multitab/multitab-menu/${id}`);
};

/* ADD MENU */
export const addMenu = (data: {
  menu_title_id: number;
  page_title: string;
  status: "active" | "inactive";
}) => {
  const payload = {
    menu_title_id: data.menu_title_id || 1,
    tab_name: data.page_title,
    status: data.status,
    user_id: getUserId()
  };

  return http("/multitab/multitab-menu", {
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
    tab_name: data.page_title,
    status: data.status,
    user_id: getUserId()
  };

  return http(`/multitab/multitab-menu/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

/* DELETE MENU */
export const deleteMenu = (id: number) => {
  return http(`/multitab/multitab-menu/${id}`, {
    method: "DELETE",
  });
};
