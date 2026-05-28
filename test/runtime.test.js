import test from "node:test";
import assert from "node:assert/strict";

import {
  activeVideoConsultationState,
  activeVideoConsultationStorageKey,
  clearActiveVideoConsultation,
  clearWaitingQueue,
  consultationMachines,
  dismissedBadgeStorageKey,
  dismissedMessageBadges,
  doctorStatusState,
  getMessageBadgeKey,
  initRuntimeState,
  isWaitingQueueManuallyCleared,
  rememberDismissedMessageBadge,
  safeSessionStorage,
  sendConsultationEvent,
  serviceState,
  setActiveVideoConsultation,
  setWaitingQueue,
  subscribeRuntimeState,
  waitingQueueClearedStorageKey,
  waitingQueueState
} from "../src/application/state/runtimeState.js?v=20260528-06";
import {
  clearWaitingQueueState,
  getDoctorStatus,
  getServiceAvailability,
  getServiceAvailabilityEntries,
  getWaitingQueueState,
  setDoctorStatusState,
  setServiceAvailabilityState
} from "../src/application/controllers/runtimeController.js";
import { consultationEvents, consultationStates } from "../src/domain/consultationStateMachine.js";

function clearRuntimeStorage() {
  safeSessionStorage.removeItem(activeVideoConsultationStorageKey);
  safeSessionStorage.removeItem(waitingQueueClearedStorageKey);
  safeSessionStorage.removeItem(dismissedBadgeStorageKey);
  dismissedMessageBadges.clear();
}

test.beforeEach(() => {
  clearRuntimeStorage();
  initRuntimeState();
});

test("initRuntimeState hydrates service flags, doctor status, machines, active video, and waiting queue", () => {
  safeSessionStorage.setItem(activeVideoConsultationStorageKey, "video_stored");

  initRuntimeState({
    services: [
      { key: "text", enabled: true },
      { key: "video", enabled: false }
    ],
    doctor: { status: "online" },
    consultationRecords: [
      { id: "video_stored", type: "video", state: "ongoing", time: "09:00" },
      { id: "video_recent", type: "video", state: "ongoing", time: "10:00" },
      { id: "text_1", type: "text", state: "ongoing", time: "11:00" },
      { id: "ended_1", type: "text", state: "ended", time: "12:00" }
    ]
  });

  assert.deepEqual(serviceState, { text: true, video: false });
  assert.equal(getDoctorStatus(), "online");
  assert.equal(doctorStatusState.status, "online");
  assert.equal(activeVideoConsultationState.recordId, "video_stored");
  assert.equal(safeSessionStorage.getItem(activeVideoConsultationStorageKey), "video_stored");
  assert.equal(Object.keys(consultationMachines).length, 4);
  assert.equal(sendConsultationEvent("text_1", consultationEvents.OPEN_RISK_REVIEW), consultationStates.RISK_REVIEW);
  assert.equal(waitingQueueState.total, 3);
  assert.deepEqual(waitingQueueState.byType, { text: 1, video: 2, consult: 0 });
});

test("initRuntimeState falls back to the most recent ongoing video when stored active video is invalid", () => {
  safeSessionStorage.setItem(activeVideoConsultationStorageKey, "missing");

  initRuntimeState({
    consultationRecords: [
      { id: "video_old", type: "video", state: "ongoing", time: "09:00" },
      { id: "video_recent", type: "video", state: "ongoing", time: "10:00" },
      { id: "video_ended", type: "video", state: "ended", time: "11:00" }
    ]
  });

  assert.equal(activeVideoConsultationState.recordId, "video_recent");
  assert.equal(safeSessionStorage.getItem(activeVideoConsultationStorageKey), "video_recent");
});

test("active video setters persist, clear, and ignore mismatched clear requests", () => {
  setActiveVideoConsultation("video_1", { silent: true });
  assert.equal(activeVideoConsultationState.recordId, "video_1");
  assert.equal(safeSessionStorage.getItem(activeVideoConsultationStorageKey), "video_1");

  clearActiveVideoConsultation("video_2", { silent: true });
  assert.equal(activeVideoConsultationState.recordId, "video_1");

  clearActiveVideoConsultation("video_1", { silent: true });
  assert.equal(activeVideoConsultationState.recordId, "");
  assert.equal(safeSessionStorage.getItem(activeVideoConsultationStorageKey), null);
});

test("waiting queue manual clear suppresses future queue updates until forced or storage is cleared", () => {
  setWaitingQueue({ byType: { text: 2, video: 1, consult: 1 } }, { silent: true });
  assert.deepEqual(waitingQueueState.byType, { text: 2, video: 1, consult: 1 });
  assert.equal(waitingQueueState.total, 4);

  clearWaitingQueue({ silent: true });
  assert.equal(isWaitingQueueManuallyCleared(), true);
  assert.deepEqual(waitingQueueState.byType, { text: 0, video: 0, consult: 0 });

  setWaitingQueue({ total: 9, byType: { text: 3, video: 3, consult: 3 } }, { silent: true });
  assert.equal(waitingQueueState.total, 0);

  safeSessionStorage.removeItem(waitingQueueClearedStorageKey);
  setWaitingQueue({ total: 9, byType: { text: 3, video: 3, consult: 3 } }, { silent: true });
  assert.equal(waitingQueueState.total, 9);
});

test("runtime controller updates local state without API sync when requested", async () => {
  initRuntimeState({
    services: [{ key: "video", enabled: false }],
    doctor: { status: "offline" }
  });

  assert.equal(getServiceAvailability("video"), false);
  assert.deepEqual(getServiceAvailabilityEntries(), [["video", false]]);

  assert.deepEqual(await setServiceAvailabilityState("video", true, { sync: false }), {
    serviceKey: "video",
    enabled: true
  });
  assert.equal(getServiceAvailability("video"), true);

  assert.deepEqual(await setDoctorStatusState("busy", { sync: false }), { status: "busy" });
  assert.equal(getDoctorStatus(), "busy");
  assert.equal(getWaitingQueueState(), waitingQueueState);

  clearWaitingQueueState();
  assert.equal(waitingQueueState.total, 0);
});

test("runtime subscriptions fire on non-silent state changes and stop after unsubscribe", () => {
  let calls = 0;
  const unsubscribe = subscribeRuntimeState(() => {
    calls += 1;
  });

  setActiveVideoConsultation("video_1");
  setWaitingQueue({ total: 1, byType: { text: 1, video: 0, consult: 0 } });
  assert.equal(calls, 2);

  unsubscribe();
  setActiveVideoConsultation("video_2");
  assert.equal(calls, 2);
});

test("dismissed message badge keys are stable and persisted", () => {
  const key = getMessageBadgeKey("r1");

  assert.equal(key, "record:r1");
  rememberDismissedMessageBadge(key);

  assert.equal(dismissedMessageBadges.has(key), true);
  assert.equal(safeSessionStorage.getItem(dismissedBadgeStorageKey), JSON.stringify([key]));
});
