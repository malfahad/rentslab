import type {
  ActivateAccountRequest,
  ActivateAccountSuccessResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterSuccessResponse,
  SessionUser,
  UserDto,
} from "@/types/auth";
import { apiRequest } from "@/lib/api/client";

export async function loginUser(
  input: LoginRequest,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login/", {
    method: "POST",
    body: input,
  });
}

export async function registerUser(
  input: RegisterRequest,
): Promise<RegisterSuccessResponse> {
  return apiRequest<RegisterSuccessResponse>("/auth/register/", {
    method: "POST",
    body: input,
  });
}

export async function activateAccount(
  input: ActivateAccountRequest,
): Promise<ActivateAccountSuccessResponse> {
  return apiRequest<ActivateAccountSuccessResponse>("/auth/activate-account/", {
    method: "POST",
    body: input,
  });
}

export function userDtoToSessionUser(user: UserDto): SessionUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
  };
}
