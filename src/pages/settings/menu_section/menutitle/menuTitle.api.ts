import { http } from "../../../../base_api/base_api";

/* LIST */
export const getMenuTitles = async () => {
  const res = await http("/menu/titles");
  const list = Array.isArray(res) ? res : (res?.data || []);
  return list.filter((t: any) =>
    t.menu_title &&
    !t.menu_title.toLowerCase().includes("select") &&
    t.menu_title.trim() !== ""
  );
};

/* ADD */
export const addMenuTitle = (title: string) => {
  return http("/menu/titles", {
    method: "POST",
    body: JSON.stringify({ menu_title: title }),
  });
};

/* UPDATE TITLE ONLY */
export const updateMenuTitle = (id: number, title: string) => {
  return http(`/menu/titles/${id}`, {
    method: "PUT",
    body: JSON.stringify({ menu_title: title }),
  });
};

/* UPDATE STATUS ONLY ✅ */
export const updateMenuTitleStatus = (
  id: number,
  status: "active" | "inactive" | "blocked"
) => {
  return http(`/menu/titles/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
};

/* DELETE */
export const deleteMenuTitle = (id: number) => {
  return http(`/menu/titles/${id}`, {
    method: "DELETE",
  });
};
