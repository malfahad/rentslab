/** User shape returned by `GET /auth/me/` and embedded in login response. */
export type UserDto = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: boolean;
  email_verified_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  user: UserDto;
};

export type RegisterRequest = {
  email: string;
  password: string;
  org_name?: string;
};

export type RegisterSuccessResponse = {
  detail: string;
  user_id?: number;
};

export type ActivateAccountRequest = {
  uid: string;
  token: string;
};

export type ActivateAccountSuccessResponse = {
  detail: string;
};

/** Minimal user fields stored client-side after login. */
export type SessionUser = {
  id: number;
  email: string;
  username: string;
};
