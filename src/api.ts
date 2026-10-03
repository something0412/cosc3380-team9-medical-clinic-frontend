import axios from "axios";

// Base URL of the backend API, read from an environment variable instead
// of hardcoded, so the frontend can point at a different backend (e.g.
// once deployed) without a code change — just set VITE_API_URL. Vite only
// exposes env vars prefixed with VITE_ to browser code, and this default
// matches the backend's own default PORT (see config/env.ts).
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// A shared axios instance instead of calling axios.get(...) directly in
// every component. The base URL lives here once, and this is the one
// place to add things later (auth headers, request logging, etc.) that
// should apply to every call.
export const api = axios.create({ baseURL: BASE_URL });
