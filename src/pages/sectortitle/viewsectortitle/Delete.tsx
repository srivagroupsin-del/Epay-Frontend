import { http } from "../../../base_api/base_api";


export const deleteItem = async (id: number) => {
  return http(`/sectorTitleRoutes/${id}`, {
    method: "DELETE",
  });
};

// const handleDelete = async (id: number) => {
//   if (!window.confirm("Are you sure you want to delete?")) return;

//   try {
//     await deleteItem(id);

//     alert("Deleted successfully");

//     setItems((prev) => prev.filter((item) => item.id !== id));
//   } catch (error: any) {
//     alert(error.message || "Delete failed");
//   }
// };
