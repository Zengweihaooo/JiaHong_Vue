import test from "node:test";
import assert from "node:assert/strict";

import {
  getConsultationRecordById,
  hydrateAppData
} from "../src/application/state/dataStore.js";
import {
  activeVideoConsultationState,
  activeVideoConsultationStorageKey,
  dismissedBadgeStorageKey,
  initRuntimeState,
  safeSessionStorage,
  waitingQueueClearedStorageKey,
  waitingQueueState
} from "../src/application/state/runtimeState.js?v=20260528-06";
import {
  activePrescriptionHasWarnings,
  activateVideoConsultation,
  getActiveConsultationRecord,
  openRiskReviewForActiveConsultation,
  resolveActiveConsultation,
  showPrescriptionWarningsForActiveConsultation,
  submitPrescriptionForActiveConsultation,
  syncActiveElapsedSeconds,
  syncWaitingQueueToMessages
} from "../src/application/controllers/consultationController.js";

const mockRuntimeStorageKey = "jh.mockRuntimeState";

function resetConsultationFlow(records = [], ongoingChats = {}) {
  safeSessionStorage.removeItem(mockRuntimeStorageKey);
  safeSessionStorage.removeItem(activeVideoConsultationStorageKey);
  safeSessionStorage.removeItem(waitingQueueClearedStorageKey);
  safeSessionStorage.removeItem(dismissedBadgeStorageKey);
  hydrateAppData({
    schemaVersion: 1,
    doctor: { id: "doctor_1", status: "offline" },
    waitingQueue: null,
    navigation: { menuGroups: [] },
    home: { quickActions: [], quickEntryOptions: [], announcements: [] },
    services: [],
    consultations: {
      records,
      ongoingChats
    },
    quickReplies: { categories: [], messages: [] }
  });
  initRuntimeState({ consultationRecords: records, doctor: { status: "offline" } });
}

test.beforeEach(() => {
  resetConsultationFlow();
});

test("risk review and prescription submission update the active consultation record", async () => {
  resetConsultationFlow([
    {
      id: "text_1",
      type: "text",
      targetView: "text",
      state: "ongoing",
      time: "10:00",
      inlineRiskWarningVisible: false,
      prescriptionSubmitted: false,
      prescriptionMedicines: [
        {
          index: 1,
          name: "阿莫西林胶囊",
          warningFields: ["dose"]
        }
      ]
    }
  ]);

  assert.equal(getActiveConsultationRecord({ sessionId: "text_1" }).id, "text_1");
  assert.equal(activePrescriptionHasWarnings({ sessionId: "text_1" }), true);

  const riskResponse = await openRiskReviewForActiveConsultation({ sessionId: "text_1" });
  assert.equal(riskResponse.recordId, "text_1");
  assert.equal(riskResponse.event, "OPEN_RISK_REVIEW");
  assert.equal(typeof riskResponse.updatedAt, "string");
  assert.equal((await showPrescriptionWarningsForActiveConsultation({ sessionId: "text_1" })).event, "OPEN_RISK_REVIEW");
  assert.equal(getConsultationRecordById("text_1").inlineRiskWarningVisible, true);

  const submitResponse = await submitPrescriptionForActiveConsultation({ sessionId: "text_1" });

  assert.equal(submitResponse.recordId, "text_1");
  assert.equal(submitResponse.event, "SUBMIT_PRESCRIPTION");
  assert.equal(getConsultationRecordById("text_1").prescriptionSubmitted, true);
  assert.equal(getConsultationRecordById("text_1").inlineRiskWarningVisible, false);
});

test("syncActiveElapsedSeconds and activateVideoConsultation mutate runtime-facing state", () => {
  resetConsultationFlow([
    { id: "video_1", type: "video", targetView: "video", state: "ongoing", time: "10:00" }
  ]);

  syncActiveElapsedSeconds(128, { sessionId: "video_1" });
  activateVideoConsultation("video_1");

  assert.equal(getConsultationRecordById("video_1").elapsedSeconds, 128);
  assert.equal(activeVideoConsultationState.recordId, "video_1");
  assert.equal(safeSessionStorage.getItem(activeVideoConsultationStorageKey), "video_1");
});

test("syncWaitingQueueToMessages derives queue totals from current consultation records", () => {
  resetConsultationFlow([
    { id: "video_1", type: "video", targetView: "video", state: "ongoing", time: "10:00" },
    { id: "text_1", type: "text", targetView: "text", state: "ongoing", time: "10:01" },
    { id: "ended_1", type: "text", targetView: "text", state: "ended", time: "11:00" }
  ]);

  syncWaitingQueueToMessages({ silent: true });

  assert.equal(waitingQueueState.total, 2);
  assert.deepEqual(waitingQueueState.byType, { text: 1, video: 1, consult: 0 });
});

test("ending an active video consultation archives it and activates the next ongoing video", async () => {
  resetConsultationFlow(
    [
      {
        id: "video_1",
        type: "video",
        targetView: "video",
        state: "ongoing",
        time: "09:00",
        diagnosis: "急性咽炎",
        prescriptionMedicines: [{ name: "阿莫西林胶囊" }],
        badge: 2,
        unreadCount: 1
      },
      { id: "video_2", type: "video", targetView: "video", state: "ongoing", time: "10:00" },
      { id: "text_1", type: "text", targetView: "text", state: "ongoing", time: "11:00" }
    ],
    {
      video_1: {
        sessionDate: "2026-05-28",
        messages: [{ from: "patient", text: "咽痛" }]
      }
    }
  );
  activateVideoConsultation("video_1");

  const result = await resolveActiveConsultation("end", { sessionId: "video_1" });

  assert.equal(result.recordId, "video_1");
  assert.equal(result.message, "问诊已结束，已自动接入下一位视频问诊");
  assert.equal(result.nextVideoRecord.id, "video_2");
  assert.equal(activeVideoConsultationState.recordId, "video_2");
  assert.equal(getConsultationRecordById("video_1").state, "ended");
  assert.equal(getConsultationRecordById("video_1").badge, 0);
  assert.equal(getConsultationRecordById("video_1").transcript[0].text, "咽痛");
  assert.equal(waitingQueueState.total, 2);
});

test("cancelling a video consultation clears active video and unread markers", async () => {
  resetConsultationFlow([
    {
      id: "video_1",
      type: "video",
      targetView: "video",
      state: "ongoing",
      time: "09:00",
      badge: 2,
      unreadCount: 1
    }
  ]);
  activateVideoConsultation("video_1");

  const result = await resolveActiveConsultation("cancel", { sessionId: "video_1" });

  assert.equal(result.recordId, "video_1");
  assert.equal(result.message, "已取消问诊");
  assert.equal(result.nextVideoRecord, null);
  assert.equal(activeVideoConsultationState.recordId, "");
  assert.equal(getConsultationRecordById("video_1").state, "cancelled");
  assert.equal(getConsultationRecordById("video_1").badge, 0);
  assert.equal(getConsultationRecordById("video_1").unreadCount, 0);
  assert.equal(waitingQueueState.total, 0);
});

test("resolveActiveConsultation handles missing active record and unknown actions", async () => {
  resetConsultationFlow([]);

  assert.equal(await resolveActiveConsultation("unknown", { sessionId: "missing" }), null);
  assert.deepEqual(await resolveActiveConsultation("end"), {
    message: "问诊已结束"
  });
  assert.deepEqual(await resolveActiveConsultation("end", { sessionId: "missing" }), {
    recordId: "missing",
    record: null,
    nextVideoRecord: null,
    message: "问诊已结束"
  });
});
