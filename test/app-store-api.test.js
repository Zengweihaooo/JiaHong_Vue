import test from "node:test";
import assert from "node:assert/strict";

import { appStore, initAppStore } from "../src/application/store/appStore.js";
import {
  consultationRecords,
  doctor,
  services
} from "../src/application/state/dataStore.js";
import {
  doctorStatusState,
  safeSessionStorage,
  serviceState,
  waitingQueueState
} from "../src/application/state/runtimeState.js?v=20260528-06";
import {
  generatePatientAutoReply,
  getAppBootstrap,
  getRealtimeSnapshot,
  updateConsultationStatus,
  updateDoctorStatus,
  updateServiceAvailability
} from "../src/infrastructure/api/appApi.js";
import { readRuntimeState, writeRuntimeState } from "../src/infrastructure/api/mockRuntimeState.js";

const mockRuntimeStorageKey = "jh.mockRuntimeState";

test.beforeEach(() => {
  safeSessionStorage.removeItem(mockRuntimeStorageKey);
});

test("initAppStore hydrates bootstrap data and initializes runtime state", async () => {
  appStore.ready = false;
  appStore.error = null;

  await initAppStore();

  assert.equal(appStore.ready, true);
  assert.equal(appStore.error, null);
  assert.equal(Boolean(doctor?.id), true);
  assert.equal(services.length > 0, true);
  assert.equal(consultationRecords.length > 0, true);
  assert.deepEqual(Object.keys(serviceState).sort(), services.map((service) => service.key).sort());
  assert.equal(doctorStatusState.status, doctor.status || "offline");
  assert.equal(typeof waitingQueueState.total, "number");
});

test("mock bootstrap applies persisted doctor, service, waiting queue, consultation, and chat overrides", async () => {
  writeRuntimeState({
    doctorStatus: "busy",
    services: {
      text: false
    },
    waitingQueue: {
      total: 7,
      byType: { text: 2, video: 3, consult: 2 },
      updatedAt: "2026-05-28T00:00:00.000Z"
    },
    consultationRecords: [
      {
        id: "runtime_1",
        type: "text",
        targetView: "text",
        state: "ongoing",
        time: "12:00",
        title: "运行态会话"
      }
    ],
    ongoingChats: {
      runtime_1: {
        sessionDate: "2026-05-28",
        messages: [{ id: "runtime_msg", from: "patient", text: "运行态消息" }]
      }
    }
  });

  const bootstrap = await getAppBootstrap();

  assert.equal(bootstrap.doctor.status, "busy");
  assert.equal(bootstrap.waitingQueue.total, 7);
  assert.equal(bootstrap.services.find((service) => service.key === "text").enabled, false);
  assert.equal(bootstrap.consultations.records[0].id, "runtime_1");
  assert.equal(bootstrap.consultations.ongoingChats.runtime_1.messages[0].text, "运行态消息");
});

test("mock API persists service availability and doctor dispatch timestamps", async () => {
  const serviceResponse = await updateServiceAvailability("video", false);
  assert.equal(serviceResponse.serviceKey, "video");
  assert.equal(serviceResponse.enabled, false);
  assert.equal(readRuntimeState().services.video, false);

  const onlineResponse = await updateDoctorStatus("online");
  const onlineState = readRuntimeState();
  assert.equal(onlineResponse.status, "online");
  assert.equal(onlineState.doctorStatus, "online");
  assert.equal(typeof onlineState.doctorOnlineAt, "string");
  assert.equal(typeof onlineState.dispatchEnabledAt, "string");

  await updateDoctorStatus("offline");
  const offlineState = readRuntimeState();
  assert.equal(offlineState.doctorStatus, "offline");
  assert.equal(offlineState.doctorOnlineAt, null);
  assert.equal(offlineState.dispatchEnabledAt, null);
});

test("mock API updates terminal consultation status and handles missing auto reply inputs", async () => {
  const patchedRecord = {
    id: "terminal_1",
    type: "text",
    targetView: "text",
    state: "ongoing",
    time: "10:00",
    title: "终止会话"
  };

  const response = await updateConsultationStatus("terminal_1", "END", patchedRecord);
  const runtimeRecord = readRuntimeState().consultationRecords.find((record) => record.id === "terminal_1");

  assert.equal(response.recordId, "terminal_1");
  assert.equal(response.event, "END");
  assert.equal(runtimeRecord.state, "ended");
  assert.equal(runtimeRecord.badge, 0);
  assert.equal(runtimeRecord.unreadCount, 0);
  assert.equal(typeof runtimeRecord.endedAt, "string");

  assert.deepEqual(await generatePatientAutoReply({ recordId: "terminal_1", doctorMessage: null }), {
    recordId: "terminal_1",
    message: null
  });
});

test("mock API writes cancelled terminal consultation records", async () => {
  const patchedRecord = {
    id: "cancel_1",
    type: "video",
    targetView: "video",
    state: "ongoing",
    time: "11:00",
    title: "取消会话",
    badge: 4,
    unreadCount: 3
  };

  const response = await updateConsultationStatus("cancel_1", "CANCEL", patchedRecord);
  const runtimeRecord = readRuntimeState().consultationRecords.find((record) => record.id === "cancel_1");

  assert.equal(response.recordId, "cancel_1");
  assert.equal(response.event, "CANCEL");
  assert.equal(runtimeRecord.state, "cancelled");
  assert.equal(runtimeRecord.badge, 0);
  assert.equal(runtimeRecord.unreadCount, 0);
  assert.equal(runtimeRecord.endedAt, undefined);
});

test("mock API generates patient replies from runtime state and persists them", async (t) => {
  t.mock.method(Math, "random", () => 0);
  writeRuntimeState({
    consultationRecords: [
      {
        id: "reply_1",
        type: "text",
        state: "ongoing",
        diagnosis: "急性咽炎",
        preview: "咽痛",
        patientDetail: { allergies: "无" }
      }
    ],
    ongoingChats: {
      reply_1: {
        sessionDate: "2026-05-28",
        messages: []
      }
    }
  });

  const response = await generatePatientAutoReply({
    recordId: "reply_1",
    doctorMessage: { id: "d1", text: "请问有发热吗？" }
  });
  const storedChat = readRuntimeState().ongoingChats.reply_1;

  assert.equal(response.recordId, "reply_1");
  assert.equal(response.message.from, "patient");
  assert.equal(response.message.mock, true);
  assert.equal(storedChat.messages.at(-1).id, response.message.id);
});

test("realtime snapshot respects offline dispatch gate and persists waiting queue", async () => {
  writeRuntimeState({
    doctorStatus: "offline",
    consultationRecords: []
  });

  const snapshot = await getRealtimeSnapshot();
  const runtimeState = readRuntimeState();

  assert.equal(snapshot.doctorStatus, "offline");
  assert.equal(snapshot.newConsultation, null);
  assert.equal(snapshot.waitingQueue.total, runtimeState.waitingQueue.total);
  assert.equal(typeof snapshot.tick, "number");
});

test("realtime snapshot dispatches when doctor is online and dispatch gate is open", async (t) => {
  t.mock.method(Math, "random", () => 0);
  writeRuntimeState({
    doctorStatus: "online",
    dispatchEnabledAt: new Date(Date.now() - 1000).toISOString(),
    consultationRecords: [],
    ongoingChats: {}
  });

  const snapshot = await getRealtimeSnapshot();
  const runtimeState = readRuntimeState();

  assert.equal(snapshot.doctorStatus, "online");
  assert.equal(Boolean(snapshot.newConsultation), true);
  assert.equal(snapshot.newConsultation.record.type, "video");
  assert.equal(runtimeState.consultationRecords.some((record) => record.id === snapshot.newConsultation.record.id), true);
  assert.equal(Boolean(runtimeState.ongoingChats[snapshot.newConsultation.record.id]), true);
  assert.equal(runtimeState.waitingQueue.total, snapshot.waitingQueue.total);
});
