import axios from "axios";
import { ElMessage } from "element-plus";
import { appEnv } from "@/config/env";

export const http = axios.create({
  baseURL: appEnv.apiBaseUrl,
  timeout: appEnv.apiTimeout
});

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error?.response?.data?.message || error?.message || "接口请求失败";
    ElMessage.error(message);
    return Promise.reject(error);
  }
);

export function request(config) {
  return http.request(config);
}
