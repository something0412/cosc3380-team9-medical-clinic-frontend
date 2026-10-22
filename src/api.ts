import axios, { isAxiosError } from "axios";

// backend URL
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// shared axios instance
export const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

// error message from a failed request
export function apiErrorMessage(err: unknown) {
  if (isAxiosError(err)) {
    if (!err.response) return "Can't reach the server. Is the backend running?";
    return err.response.data?.error ?? "Something went wrong";
  }
  return "Something went wrong";
}
