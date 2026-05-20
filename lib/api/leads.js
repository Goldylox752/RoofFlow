import { api } from "./client";

export const leadsAPI = {
  getLeads: () => api.get("/leads"),

  getLead: (id) => api.get(`/leads/${id}`),

  createLead: (data) => api.post("/leads", data),

  updateLead: (id, data) => api.put(`/leads/${id}`, data),

  deleteLead: (id) => api.delete(`/leads/${id}`),
};