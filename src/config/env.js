export const appEnv = {
  title: import.meta.env.VITE_APP_TITLE || "嘉虹健康医生端",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT || 15000),
  useMock: String(import.meta.env.VITE_USE_MOCK ?? "true") === "true"
};
