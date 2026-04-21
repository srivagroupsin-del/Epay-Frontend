export interface MenuTitle {
  id: number;
  menu_title: string;
  status: "active" | "inactive";

}

export interface MenuTitleResponse {
  success: boolean;
  data: MenuTitle[];
}
