import { fetchJson } from "./httpClient.js";
import { createPatientAutoReplyMessage, formatMessageTime } from "./mockPatientReply.js";
import {
  getRuntimeConsultations,
  readRuntimeState,
  writeRuntimeChat,
  writeRuntimeConsultation,
  writeRuntimeState
} from "./mockRuntimeState.js";
export { searchDiagnosisCatalog, searchMedicineCatalog } from "./mockCatalogSearch.js";

const mockLatencyMs = 80;
let realtimeTick = 0;
const maxRuntimeConsultations = 6;
const dispatchDelayAfterOnlineMs = 20_000;
const baseWaitingQueue = {
  total: 4,
  byType: { text: 1, video: 1, consult: 2 }
};
const bootstrapUrl = new URL("../mocks/app-bootstrap.json?v=20260527-36", import.meta.url);

function delay(ms = mockLatencyMs) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function formatRuntimeEndedAt(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function findConsultationRecord(recordId, payload, runtimeRecords) {
  return (
    runtimeRecords.find((record) => record.id === recordId) ||
    payload.consultations?.records?.find((record) => record.id === recordId) ||
    payload.consultations?.realtimePool?.records?.find((record) => record.id === recordId) ||
    null
  );
}

function pickRandomAvailableConsultation(poolRecords, runtimeRecords) {
  const usedIds = new Set(runtimeRecords.map((record) => record.id));
  const availableRecords = poolRecords.filter((record) => !usedIds.has(record.id));
  if (!availableRecords.length) return null;
  const videoRecords = availableRecords.filter((record) => record.type === "video");
  const prioritizedRecords = videoRecords.length ? videoRecords : availableRecords;
  const index = Math.floor(Math.random() * prioritizedRecords.length);
  return prioritizedRecords[index];
}

function buildWaitingQueue(runtimeRecords) {
  const ongoingRuntimeRecords = runtimeRecords.filter((record) => record.state === "ongoing");
  const addedText = ongoingRuntimeRecords.filter((record) => record.type === "text").length;
  const addedVideo = ongoingRuntimeRecords.filter((record) => record.type === "video").length;
  const addedConsult = ongoingRuntimeRecords.filter((record) => record.type === "consult").length;
  const text = Math.min(baseWaitingQueue.byType.text + addedText, 3);
  const video = Math.min(baseWaitingQueue.byType.video + addedVideo, 3);
  const consult = Math.min(baseWaitingQueue.byType.consult + addedConsult, 3);
  return {
    total: Math.min(text + video + consult, maxRuntimeConsultations),
    byType: { text, video, consult },
    updatedAt: new Date().toISOString()
  };
}

function getDispatchGate(runtimeState, fallbackStatus = "offline", date = new Date()) {
  const doctorStatus = runtimeState.doctorStatus || fallbackStatus;
  if (doctorStatus !== "online") {
    return {
      doctorStatus,
      canDispatch: false,
      dispatchEnabledAt: null
    };
  }

  const existingEnabledAt = Date.parse(runtimeState.dispatchEnabledAt || "");
  const dispatchEnabledAt = Number.isNaN(existingEnabledAt)
    ? date.getTime() + dispatchDelayAfterOnlineMs
    : existingEnabledAt;

  if (Number.isNaN(existingEnabledAt)) {
    writeRuntimeState({
      doctorStatus,
      doctorOnlineAt: date.toISOString(),
      dispatchEnabledAt: new Date(dispatchEnabledAt).toISOString()
    });
  }

  return {
    doctorStatus,
    canDispatch: date.getTime() >= dispatchEnabledAt,
    dispatchEnabledAt: new Date(dispatchEnabledAt).toISOString()
  };
}

export async function getAppBootstrap() {
  await delay();
  const payload = await fetchJson(bootstrapUrl);
  const runtimeState = readRuntimeState();
  if (runtimeState.doctorStatus && payload.doctor) {
    payload.doctor = { ...payload.doctor, status: runtimeState.doctorStatus };
  }
  if (runtimeState.waitingQueue) {
    payload.waitingQueue = runtimeState.waitingQueue;
  }
  if (runtimeState.services) {
    payload.services = payload.services.map((service) => ({
      ...service,
      enabled:
        typeof runtimeState.services[service.key] === "boolean"
          ? runtimeState.services[service.key]
          : service.enabled
    }));
  }
  if (runtimeState.consultationRecords?.length) {
    const baseRecordsById = new Map(payload.consultations.records.map((record) => [record.id, record]));
    const runtimeRecords = runtimeState.consultationRecords.slice(0, maxRuntimeConsultations).map((record) => {
      const baseRecord = baseRecordsById.get(record.id);
      if (!baseRecord) return record;
      return {
        ...baseRecord,
        ...record,
        prescriptionMedicines: record.prescriptionMedicines?.length
          ? record.prescriptionMedicines
          : baseRecord.prescriptionMedicines || record.prescriptionMedicines
      };
    });
    payload.consultations.records = [
      ...runtimeRecords,
      ...payload.consultations.records.filter(
        (record) => !runtimeRecords.some((item) => item.id === record.id)
      )
    ];
  }
  if (runtimeState.ongoingChats) {
    payload.consultations.ongoingChats = {
      ...payload.consultations.ongoingChats,
      ...runtimeState.ongoingChats
    };
  }
  return payload;
}

export async function updateServiceAvailability(serviceKey, enabled) {
  await delay(40);
  const runtimeState = readRuntimeState();
  writeRuntimeState({
    services: {
      ...(runtimeState.services || {}),
      [serviceKey]: enabled
    }
  });
  return { serviceKey, enabled, updatedAt: new Date().toISOString() };
}

export async function updateDoctorStatus(status) {
  await delay(40);
  const runtimeState = readRuntimeState();
  const patch = { doctorStatus: status };
  if (status === "online") {
    const alreadyOnline = runtimeState.doctorStatus === "online";
    patch.doctorOnlineAt = alreadyOnline && runtimeState.doctorOnlineAt
      ? runtimeState.doctorOnlineAt
      : new Date().toISOString();
    patch.dispatchEnabledAt = alreadyOnline && runtimeState.dispatchEnabledAt
      ? runtimeState.dispatchEnabledAt
      : new Date(Date.now() + dispatchDelayAfterOnlineMs).toISOString();
  } else {
    patch.doctorOnlineAt = null;
    patch.dispatchEnabledAt = null;
  }
  writeRuntimeState(patch);
  return { status, updatedAt: new Date().toISOString() };
}

export async function getRealtimeSnapshot() {
  await delay(40);
  realtimeTick += 1;

  const payload = await fetchJson(bootstrapUrl);
  const runtimeState = readRuntimeState();
  const dispatchGate = getDispatchGate(runtimeState, payload.doctor?.status);
  const poolRecords = payload.consultations?.realtimePool?.records || [];
  const poolChats = payload.consultations?.realtimePool?.chats || {};
  let currentConsultations = getRuntimeConsultations();
  let newConsultation = null;

  const currentTotal =
    baseWaitingQueue.total +
    currentConsultations.records.filter((record) => record.state === "ongoing").length;
  if (dispatchGate.canDispatch && currentTotal < maxRuntimeConsultations) {
    const record = pickRandomAvailableConsultation(poolRecords, currentConsultations.records);
    if (record) {
      newConsultation = {
        record,
        chat: poolChats[record.id]
      };
      currentConsultations = writeRuntimeConsultation(record, poolChats[record.id], {
        maxRuntimeConsultations,
        baseWaitingQueue
      });
    }
  }

  const waitingQueue = buildWaitingQueue(currentConsultations.records);
  writeRuntimeState({ waitingQueue });

  return {
    waitingQueue,
    newConsultation,
    doctorStatus: dispatchGate.doctorStatus,
    dispatchEnabledAt: dispatchGate.dispatchEnabledAt,
    tick: realtimeTick
  };
}

export async function generatePatientAutoReply({ recordId, doctorMessage, record = null, chat = null } = {}) {
  await delay(500 + Math.floor(Math.random() * 900));
  if (!recordId || !doctorMessage?.text) {
    return { recordId, message: null };
  }

  const payload = await fetchJson(bootstrapUrl);
  const runtimeState = readRuntimeState();
  const runtimeRecords = runtimeState.consultationRecords || [];
  const sourceRecord = record || findConsultationRecord(recordId, payload, runtimeRecords) || {};
  const sourceChat = chat || runtimeState.ongoingChats?.[recordId] || payload.consultations?.ongoingChats?.[recordId] || {};
  const date = new Date();
  const message = createPatientAutoReplyMessage({
    recordId,
    doctorMessage: doctorMessage.text,
    record: sourceRecord,
    chat: sourceChat,
    date
  });

  writeRuntimeChat(recordId, {
    ...sourceChat,
    sessionDate: sourceChat.sessionDate || formatMessageTime(date),
    messages: [...(sourceChat.messages || []), message]
  });

  return {
    recordId,
    message,
    updatedAt: date.toISOString()
  };
}

export async function updateConsultationStatus(recordId, event, recordPatch = null) {
  await delay(40);
  if (event === "END" || event === "CANCEL") {
    const payload = await fetchJson(bootstrapUrl);
    const runtimeState = readRuntimeState();
    const runtimeRecords = runtimeState.consultationRecords || [];
    const sourceRecord = recordPatch || findConsultationRecord(recordId, payload, runtimeRecords);
    if (sourceRecord) {
      const nextState = event === "END" ? "ended" : "cancelled";
      const nextRecord = {
        ...sourceRecord,
        state: nextState,
        badge: 0,
        unreadCount: 0
      };
      if (nextState === "ended" && !nextRecord.endedAt) {
        nextRecord.endedAt = formatRuntimeEndedAt();
      }
      const nextRecords = runtimeRecords.some((record) => record.id === recordId)
        ? runtimeRecords.map((record) => (record.id === recordId ? nextRecord : record))
        : [nextRecord, ...runtimeRecords];
      writeRuntimeState({ consultationRecords: nextRecords });
    }
  }
  return { recordId, event, updatedAt: new Date().toISOString() };
}
