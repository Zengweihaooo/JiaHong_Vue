import { appEnv } from "@/config/env";
import { request } from "@/services/http";
import {
  generatePatientAutoReply as mockGeneratePatientAutoReply,
  getAppBootstrap as mockGetAppBootstrap,
  getRealtimeSnapshot as mockGetRealtimeSnapshot,
  searchDiagnosisCatalog as mockSearchDiagnosisCatalog,
  searchMedicineCatalog as mockSearchMedicineCatalog,
  updateConsultationStatus as mockUpdateConsultationStatus,
  updateDoctorStatus as mockUpdateDoctorStatus,
  updateServiceAvailability as mockUpdateServiceAvailability
} from "@/infrastructure/api/mockApi";

const mockApi = {
  getAppBootstrap: mockGetAppBootstrap,
  updateDoctorStatus: mockUpdateDoctorStatus,
  updateServiceAvailability: mockUpdateServiceAvailability,
  updateConsultationStatus: mockUpdateConsultationStatus,
  getRealtimeSnapshot: mockGetRealtimeSnapshot,
  generatePatientAutoReply: mockGeneratePatientAutoReply,
  searchDiagnosisCatalog: mockSearchDiagnosisCatalog,
  searchMedicineCatalog: mockSearchMedicineCatalog
};

function normalizeCatalogSearchPayload(payload) {
  if (typeof payload === "string") return { keyword: payload, exclude: [] };
  return {
    keyword: payload?.keyword || "",
    exclude: Array.isArray(payload?.exclude) ? payload.exclude : []
  };
}

const backendApi = {
  getAppBootstrap: () => request({ url: "/doctor/bootstrap", method: "GET" }),
  updateDoctorStatus: (status) => request({ url: "/doctor/status", method: "PUT", data: { status } }),
  updateServiceAvailability: (serviceKey, enabled) =>
    request({ url: `/doctor/services/${serviceKey}`, method: "PUT", data: { enabled } }),
  updateConsultationStatus: (recordId, event, recordPatch) =>
    request({ url: `/consultations/${recordId}/status`, method: "PUT", data: { event, recordPatch } }),
  getRealtimeSnapshot: () => request({ url: "/doctor/realtime", method: "GET" }),
  generatePatientAutoReply: (payload) => request({ url: "/ai/patient-reply", method: "POST", data: payload }),
  searchDiagnosisCatalog: (payload) => {
    const { keyword, exclude } = normalizeCatalogSearchPayload(payload);
    return request({ url: "/catalog/diagnosis", method: "GET", params: { keyword, exclude } });
  },
  searchMedicineCatalog: (payload) => {
    const { keyword, exclude } = normalizeCatalogSearchPayload(payload);
    return request({ url: "/catalog/medicines", method: "GET", params: { keyword, exclude } });
  }
};

export const appService = appEnv.useMock ? mockApi : backendApi;
