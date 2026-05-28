import {
  createStateMachine,
  mapRecordStateToMachineState
} from "../../domain/consultationStateMachine.js";
import { buildWaitingQueueFromRecords } from "../../domain/consultationQueue.js";
import { getNextOngoingVideoConsultationRecord } from "../../domain/consultationQueue.js";
import { getNavigationEntry, getSessionStorage } from "../../infrastructure/browser/runtimeEnvironment.js";

export const serviceState = {};
export const consultationMachines = {};
export const doctorStatusState = {
  status: "offline"
};
export const activeVideoConsultationState = {
  recordId: ""
};
export const waitingQueueState = {
  total: 0,
  byType: {
    text: 0,
    video: 0,
    consult: 0
  },
  updatedAt: null
};

const runtimeStateListeners = new Set();
export const activeVideoConsultationStorageKey = "jh.activeVideoConsultationId.v1";
export const dismissedBadgeStorageKey = "jh.dismissedMessageBadges.v2";
export const waitingQueueClearedStorageKey = "jh.waitingQueueCleared.v1";
export const waitingQueueClearCooldownMs = 30_000;
export const safeSessionStorage = getSessionStorage();
const emptyWaitingQueue = {
  total: 0,
  byType: {
    text: 0,
    video: 0,
    consult: 0
  }
};

export function subscribeRuntimeState(listener) {
  runtimeStateListeners.add(listener);
  return () => runtimeStateListeners.delete(listener);
}

function emitRuntimeStateChange() {
  runtimeStateListeners.forEach((listener) => listener());
}

export function isWaitingQueueManuallyCleared() {
  const rawClearedUntil = safeSessionStorage.getItem(waitingQueueClearedStorageKey);
  const clearedUntil = Number(rawClearedUntil || 0);
  if (!rawClearedUntil) return false;
  if (!Number.isFinite(clearedUntil) || clearedUntil <= 0) {
    safeSessionStorage.removeItem(waitingQueueClearedStorageKey);
    return false;
  }
  if (Date.now() < clearedUntil) return true;
  safeSessionStorage.removeItem(waitingQueueClearedStorageKey);
  return false;
}

export function initRuntimeState({ services = [], consultationRecords = [], doctor = null } = {}) {
  Object.keys(serviceState).forEach((key) => {
    delete serviceState[key];
  });
  services.forEach((service) => {
    serviceState[service.key] = service.enabled;
  });

  Object.keys(consultationMachines).forEach((key) => {
    delete consultationMachines[key];
  });
  consultationRecords.forEach((record) => {
    consultationMachines[record.id] = createStateMachine(mapRecordStateToMachineState(record.state));
  });

  const storedActiveVideoId = safeSessionStorage.getItem(activeVideoConsultationStorageKey);
  const storedActiveVideo = consultationRecords.find(
    (record) => record.id === storedActiveVideoId && record.type === "video" && record.state === "ongoing"
  );
  const defaultActiveVideo = getNextOngoingVideoConsultationRecord(consultationRecords);
  activeVideoConsultationState.recordId = storedActiveVideo?.id || defaultActiveVideo?.id || "";
  if (activeVideoConsultationState.recordId) {
    safeSessionStorage.setItem(activeVideoConsultationStorageKey, activeVideoConsultationState.recordId);
  } else {
    safeSessionStorage.removeItem(activeVideoConsultationStorageKey);
  }

  doctorStatusState.status = doctor?.status || "offline";
  setWaitingQueue(buildWaitingQueueFromRecords(consultationRecords), { silent: true });
  emitRuntimeStateChange();
}

export function sendConsultationEvent(recordId, event) {
  return consultationMachines[recordId]?.send(event);
}

export function registerConsultationMachine(record) {
  if (!record?.id || consultationMachines[record.id]) return;
  consultationMachines[record.id] = createStateMachine(mapRecordStateToMachineState(record.state));
}

export function setActiveVideoConsultation(recordId, { silent = false } = {}) {
  activeVideoConsultationState.recordId = recordId || "";
  if (activeVideoConsultationState.recordId) {
    safeSessionStorage.setItem(activeVideoConsultationStorageKey, activeVideoConsultationState.recordId);
  } else {
    safeSessionStorage.removeItem(activeVideoConsultationStorageKey);
  }
  if (!silent) emitRuntimeStateChange();
}

export function clearActiveVideoConsultation(recordId, { silent = false } = {}) {
  if (recordId && activeVideoConsultationState.recordId !== recordId) return;
  setActiveVideoConsultation("", { silent });
}

export function setDoctorStatus(status, { silent = false } = {}) {
  doctorStatusState.status = status;
  if (!silent) emitRuntimeStateChange();
}

export function setWaitingQueue(queue, { silent = false, force = false } = {}) {
  const nextQueue = isWaitingQueueManuallyCleared() && !force ? emptyWaitingQueue : queue;
  waitingQueueState.byType = {
    text: Number(nextQueue?.byType?.text) || 0,
    video: Number(nextQueue?.byType?.video) || 0,
    consult: Number(nextQueue?.byType?.consult) || 0
  };
  waitingQueueState.total =
    typeof nextQueue?.total === "number"
      ? nextQueue.total
      : waitingQueueState.byType.text + waitingQueueState.byType.video + waitingQueueState.byType.consult;
  waitingQueueState.updatedAt = nextQueue?.updatedAt || new Date().toISOString();
  if (!silent) emitRuntimeStateChange();
}

export function clearWaitingQueue({ silent = false } = {}) {
  safeSessionStorage.setItem(waitingQueueClearedStorageKey, String(Date.now() + waitingQueueClearCooldownMs));
  setWaitingQueue(emptyWaitingQueue, { silent, force: true });
}

export const currentNavigation = getNavigationEntry();
export const dismissedMessageBadges = new Set(
  JSON.parse(safeSessionStorage.getItem(dismissedBadgeStorageKey) || "[]")
);

export function rememberDismissedMessageBadge(badgeKey) {
  if (!badgeKey) return;
  dismissedMessageBadges.add(badgeKey);
  safeSessionStorage.setItem(
    dismissedBadgeStorageKey,
    JSON.stringify(Array.from(dismissedMessageBadges))
  );
}

export function getMessageBadgeKey(recordId) {
  return `record:${recordId}`;
}
