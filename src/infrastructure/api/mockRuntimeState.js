import { getSessionStorage } from "../browser/runtimeEnvironment.js";

const runtimeStorageKey = "jh.mockRuntimeState";
const runtimeSchemaVersion = 7;
const runtimeStorage = getSessionStorage();

export function readRuntimeState() {
  try {
    const state = JSON.parse(runtimeStorage.getItem(runtimeStorageKey) || "{}");
    if (state.schemaVersion !== runtimeSchemaVersion) return {};
    return state;
  } catch {
    return {};
  }
}

export function writeRuntimeState(patch) {
  const nextState = { ...readRuntimeState(), schemaVersion: runtimeSchemaVersion, ...patch };
  runtimeStorage.setItem(runtimeStorageKey, JSON.stringify(nextState));
  return nextState;
}

export function getRuntimeConsultations() {
  const runtimeState = readRuntimeState();
  return {
    records: runtimeState.consultationRecords || [],
    chats: runtimeState.ongoingChats || {}
  };
}

function insertAtRandomPosition(record, records) {
  const nextRecords = [...records];
  const index = Math.floor(Math.random() * (nextRecords.length + 1));
  nextRecords.splice(index, 0, record);
  return nextRecords;
}

export function writeRuntimeConsultation(record, chat, { maxRuntimeConsultations, baseWaitingQueue }) {
  const runtimeState = readRuntimeState();
  const records = runtimeState.consultationRecords || [];
  const chats = runtimeState.ongoingChats || {};
  if (records.some((item) => item.id === record.id)) {
    return { records, chats };
  }
  const nextRecords = insertAtRandomPosition(record, records).slice(
    0,
    maxRuntimeConsultations - baseWaitingQueue.total
  );
  const keptIds = new Set(nextRecords.map((item) => item.id));
  const nextChats = { ...chats, [record.id]: chat };
  Object.keys(nextChats).forEach((chatId) => {
    if (!keptIds.has(chatId)) delete nextChats[chatId];
  });
  writeRuntimeState({
    consultationRecords: nextRecords,
    ongoingChats: nextChats
  });
  return { records: nextRecords, chats: nextChats };
}

export function writeRuntimeChat(recordId, chat) {
  const runtimeState = readRuntimeState();
  writeRuntimeState({
    ongoingChats: {
      ...(runtimeState.ongoingChats || {}),
      [recordId]: chat
    }
  });
}
