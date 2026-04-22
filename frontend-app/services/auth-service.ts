import type {
  AccessRequestCreateRequest,
  AccessRequestCreateSuccessResponse,
  ActivateAccountRequest,
  ActivateAccountSuccessResponse,
  ForgotPasswordRequest,
  ForgotPasswordSuccessResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterSuccessResponse,
  ResetPasswordRequest,
  ResetPasswordSuccessResponse,
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

export async function forgotPassword(
  input: ForgotPasswordRequest,
): Promise<ForgotPasswordSuccessResponse> {
  return apiRequest<ForgotPasswordSuccessResponse>("/auth/forgot-password/", {
    method: "POST",
    body: input,
  });
}

export async function resetPassword(
  input: ResetPasswordRequest,
): Promise<ResetPasswordSuccessResponse> {
  return apiRequest<ResetPasswordSuccessResponse>("/auth/reset-password/", {
    method: "POST",
    body: input,
  });
}

export async function createAccessRequest(
  input: AccessRequestCreateRequest,
): Promise<AccessRequestCreateSuccessResponse> {
  return apiRequest<AccessRequestCreateSuccessResponse>("/auth/access-requests/", {
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
