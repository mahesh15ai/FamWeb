import { apiClient } from "./client";

export async function register({ first_name, last_name, email, phone_number, password, confirm_password }) {
  const { data } = await apiClient.post("/auth/register/", {
    first_name,
    last_name,
    email,
    phone_number,
    password,
    confirm_password,
  });
  return data;
}

export async function login({ email, password }) {
  const { data } = await apiClient.post("/auth/login/", { email, password });
  return data;
}

export async function logout(refreshToken) {
  const { data } = await apiClient.post("/auth/logout/", { refresh: refreshToken });
  return data;
}

export async function getProfile() {
  const { data } = await apiClient.get("/auth/profile/");
  return data;
}

export async function updateProfile(formData) {
  const { data } = await apiClient.patch("/auth/profile/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function changePassword({ old_password, new_password, confirm_password }) {
  const { data } = await apiClient.post("/auth/change-password/", {
    old_password,
    new_password,
    confirm_password,
  });
  return data;
}

export async function forgotPassword(email) {
  const { data } = await apiClient.post("/auth/forgot-password/", { email });
  return data;
}

export async function resetPassword({ email, otp, new_password, confirm_password }) {
  const { data } = await apiClient.post("/auth/reset-password/", {
    email,
    otp,
    new_password,
    confirm_password,
  });
  return data;
}