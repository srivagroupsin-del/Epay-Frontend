export interface SectorTitle {
  id: number;
  sector_title_code: string;
  name: string;
  status: "active" | "inactive";
  image: string | null;
}

export interface ApiResponse {
  success: boolean;
  data: SectorTitle[];
}
