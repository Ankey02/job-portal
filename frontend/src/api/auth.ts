import type { Role, TokenResponse, User } from "../types";
import { api } from "./client";

export interface RegisterInput {
  email: string;
  full_name: string;
  password: string;
  role: Role;
}

export const registerUser = (data: RegisterInput) =>
  api<TokenResponse>("/auth/register", { method: "POST", json: data });

// The backend login uses the OAuth2 form format: the email goes in "username"
export const loginUser = (email: string, password: string) =>
  api<TokenResponse>("/auth/login", { method: "POST", form: { username: email, password } });

export const fetchMe = () => api<User>("/auth/me");
