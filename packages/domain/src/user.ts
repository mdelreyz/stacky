export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  timezone: string;
   location_name: string | null;
   latitude: number | null;
   longitude: number | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
