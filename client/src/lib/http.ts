import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:4000/api";

export const api = axios.create({
  baseURL,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("ataraxia_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
