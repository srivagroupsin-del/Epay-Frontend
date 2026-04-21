export interface UserDetails {
  role: string;
  phone: string;
}

export interface AddJson {
  createdBy: string;
  source: string;
}

export interface User {
  id: number;
  sector_title_code: string;
  name: string;
  email: string;
  details: UserDetails;
  add_json: AddJson;
  is_active: boolean;
  is_enabled: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse {
  success: boolean;
  data: User[];
}