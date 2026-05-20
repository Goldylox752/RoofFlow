import { api } from "./client";

export const authAPI = {
  getMe: () => api.get("/auth/me"),

  login: (data) => api.post("/auth/login", data),

  signup: (data) => api.post("/auth/signup", data),

  logout: () => api.post("/auth/logout"),
};