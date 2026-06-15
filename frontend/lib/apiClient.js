import axios from "axios";
import { supabase } from "./supabaseClient";
import { getFriendlyError } from "./errorMessages";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000",
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    error.userMessage = getFriendlyError(error);
    return Promise.reject(error);
  }
);

export default api;
