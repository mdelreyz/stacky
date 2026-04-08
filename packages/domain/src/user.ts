export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  timezone: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
