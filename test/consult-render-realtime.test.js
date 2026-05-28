import test from "node:test";
import assert from "node:assert/strict";

import { hydrateAppData, getConsultationRecordById, ongoingChatState } from "../src/application/state/dataStore.js";
import {
  activeVideoConsultationState,
  activeVideoConsultationStorageKey,
  clearWaitingQueue,
  consultationMachines,
  doctorStatusState,
  safeSessionStorage,
  waitingQueueClearedStorageKey,
  waitingQueueState
} from "../src/application/state/runtimeState.js?v=20260528-06";
import { readRuntimeState, writeRuntimeState } from "../src/infrastructure/api/mockRuntimeState.js";

function setupBrowserGlobals(pathname = "/text/", search = "") {
  globalThis.window = {
    JH_APP_VIEW: "",
    matchMedia() {
      return { matches: false };
    }
  };
  globalThis.location = {
    pathname: `/Users/zengweihao/Desktop/Repos/JiaHong${pathname}`,
    search
  };
}

function resetState({ records = [], chats = {}, services = [], doctor = { status: "online" } } = {}) {
  safeSessionStorage.removeItem("jh.mockRuntimeState");
  safeSessionStorage.removeItem(activeVideoConsultationStorageKey);
  safeSessionStorage.removeItem(waitingQueueClearedStorageKey);
  hydrateAppData({
    schemaVersion: 1,
    doctor,
    waitingQueue: null,
    navigation: { menuGroups: [] },
    home: { quickActions: [], quickEntryOptions: [], announcements: [] },
    services,
    consultations: {
      records,
      ongoingChats: chats
    },
    quickReplies: {
      categories: ["问候"],
      messages: ["您好，请补充症状"]
    }
  });
}

test.beforeEach(() => {
  setupBrowserGlobals();
  resetState();
});

test("consult room view renders text, consult, and video main shells with the expected panels", async () => {
  setupBrowserGlobals("/text/", "?sessionId=text_1");
  const records = [
    {
      id: "text_1",
      type: "text",
      targetView: "text",
      state: "ongoing",
      time: "10:00",
      title: "图文问诊标题",
      patient: "王女士",
      age: "35岁",
      elapsedSeconds: 179,
      diagnosisTags: ["急性咽炎"],
      prescriptionSubmitted: true,
      prescriptionMedicines: []
    },
    {
      id: "consult_1",
      type: "consult",
      targetView: "text",
      state: "ongoing",
      time: "10:01",
      title: "图文咨询",
      patient: "李先生",
      age: "41岁",
      consultationAttribute: "with-medicine",
      diagnosisTags: ["颈肩筋膜炎"],
      treatmentAdvice: "减少久坐"
    },
    {
      id: "video_1",
      type: "video",
      targetView: "video",
      state: "ongoing",
      time: "10:02",
      title: "视频问诊标题",
      patient: "赵先生",
      age: "48岁",
      elapsedSeconds: 600,
      diagnosisTags: ["急性支气管炎"],
      prescriptionMedicines: []
    }
  ];
  resetState({
    records,
    chats: {
      text_1: { sessionDate: "2026-05-28", messages: [{ id: "m1", from: "patient", text: "咽痛" }] },
      consult_1: { sessionDate: "2026-05-28", messages: [] },
      video_1: { sessionDate: "2026-05-28", messages: [{ id: "m2", from: "patient", text: "咳嗽" }] }
    }
  });
  const runtime = await import("../src/application/state/runtimeState.js?v=20260528-06");
  runtime.initRuntimeState({ consultationRecords: records, doctor: { status: "online" } });
  activeVideoConsultationState.recordId = "video_1";

  const { renderTextMain, renderTextPage, renderVideoChatPanel, renderVideoMain, renderVideoPage } = await import(
    "../src/presentation/views/consultRoomView.js?consult-render"
  );
  const { videoMediaState } = await import("../src/presentation/views/videoMedia.js");

  const textMain = renderTextMain();
  assert.match(textMain, /图文问诊标题/);
  assert.match(textMain, /jh-duration-chip--warning/);
  assert.match(textMain, /cancel-consult-trigger" type="button" disabled/);
  assert.match(textMain, /处方信息/);

  setupBrowserGlobals("/text/", "?sessionId=consult_1");
  const consultMain = renderTextMain();
  assert.match(consultMain, /武汉市好药师大药房/);
  assert.match(consultMain, /带药/);
  assert.match(consultMain, /咨询处理信息/);
  assert.match(consultMain, /减少久坐/);

  videoMediaState.cameraOn = false;
  videoMediaState.micOn = false;
  const videoChat = renderVideoChatPanel();
  assert.match(videoChat, /video-window__pip--local is-camera-off/);
  assert.match(videoChat, /摄像头已关闭/);
  assert.match(videoChat, /video-chat-thread/);
  assert.match(videoChat, /aria-label="开启麦克风"/);

  setupBrowserGlobals("/video/", "?sessionId=video_1");
  const videoMain = renderVideoMain();
  assert.match(videoMain, /视频问诊标题/);
  assert.match(videoMain, /jh-duration-chip--danger/);
  assert.match(videoMain, /video-submit-countdown/);

  assert.match(renderTextPage({ overlays: "<div>overlay</div>" }), /text-shell/);
  assert.match(renderTextPage({ overlays: "<div>overlay</div>" }), /<div>overlay<\/div>/);
  assert.match(renderVideoPage({ overlays: "<div>video-overlay</div>" }), /video-shell/);
  assert.match(renderVideoPage({ overlays: "<div>video-overlay</div>" }), /<div>video-overlay<\/div>/);
});

test("presentation render composes quick reply, risk warning, room shell, and app markup for the active view", async () => {
  setupBrowserGlobals("/room/");
  const records = [
    {
      id: "text_1",
      type: "text",
      targetView: "text",
      state: "ongoing",
      time: "10:00",
      title: "图文问诊",
      patient: "王女士",
      age: "35岁",
      diagnosisTags: ["急性咽炎"],
      prescriptionMedicines: [
        {
          index: 1,
          name: "阿莫西林胶囊",
          type: "处方药",
          spec: "0.25g*24粒",
          usage: "口服",
          frequency: "3次/日",
          dose: "",
          quantity: "1",
          unit: "盒",
          risk: "中",
          warningFields: ["dose"],
          warningColumns: { 3: "severe" },
          warningMessage: "[警示信息]剂量缺失"
        }
      ]
    }
  ];
  resetState({
    records,
    chats: { text_1: { sessionDate: "2026-05-28", messages: [] } },
    services: [{ key: "text", label: "图文问诊", enabled: true }],
    doctor: { status: "online" }
  });
  const runtime = await import("../src/application/state/runtimeState.js?v=20260528-06");
  runtime.initRuntimeState({
    services: [{ key: "text", enabled: true }],
    consultationRecords: records,
    doctor: { status: "online" }
  });

  const { renderAppMarkup, renderQuickReplyDialog, renderRiskWarningDialog, renderRoom } = await import(
    "../src/presentation/render.js?render-room"
  );

  assert.match(renderQuickReplyDialog(), /快捷用语/);
  assert.match(renderQuickReplyDialog(), /您好，请补充症状/);
  assert.match(renderRiskWarningDialog(), /风险检测提醒/);
  assert.match(renderRiskWarningDialog(), /剂量缺失/);
  assert.match(renderRoom(), /room-shell app-shell--responsive/);
  assert.match(renderRoom(), /候诊室/);
  assert.match(renderRoom(), /consult-confirm-overlay/);
  assert.match(renderAppMarkup(), /app-shell/);
  assert.match(renderAppMarkup(), /toast/);
});

test("refreshRealtimeState returns cleared queue without fetching when queue is manually cleared", async () => {
  setupBrowserGlobals("/room/");
  resetState({
    records: [{ id: "text_1", type: "text", targetView: "text", state: "ongoing", time: "10:00" }]
  });
  const runtime = await import("../src/application/state/runtimeState.js?v=20260528-06");
  runtime.initRuntimeState({
    consultationRecords: [{ id: "text_1", type: "text", targetView: "text", state: "ongoing", time: "10:00" }]
  });
  clearWaitingQueue({ silent: true });

  const { refreshRealtimeState } = await import("../src/application/controllers/realtimeController.js?realtime-cleared");
  const result = await refreshRealtimeState();

  assert.equal(result.newConsultation, null);
  assert.equal(result.addedConsultation, null);
  assert.equal(result.waitingQueue.total, 0);
});

test("refreshRealtimeState adds realtime consultations, registers machines, activates video, and updates doctor status", async (t) => {
  setupBrowserGlobals("/room/");
  t.mock.method(Math, "random", () => 0);
  const baseRecord = { id: "text_1", type: "text", targetView: "text", state: "ongoing", time: "10:00" };
  resetState({
    records: [baseRecord],
    chats: { text_1: { sessionDate: "2026-05-28", messages: [] } },
    doctor: { status: "online" }
  });
  const runtime = await import("../src/application/state/runtimeState.js?v=20260528-06");
  runtime.initRuntimeState({ consultationRecords: [baseRecord], doctor: { status: "online" } });
  runtime.setActiveVideoConsultation("", { silent: true });
  safeSessionStorage.removeItem(waitingQueueClearedStorageKey);

  writeRuntimeState({
    doctorStatus: "online",
    dispatchEnabledAt: new Date(Date.now() - 1000).toISOString(),
    consultationRecords: []
  });

  const { refreshRealtimeState } = await import("../src/application/controllers/realtimeController.js?realtime-add");
  const result = await refreshRealtimeState();

  assert.equal(result.doctorStatus, "online");
  assert.equal(Boolean(result.addedConsultation), true);
  assert.equal(getConsultationRecordById(result.addedConsultation.record.id)?.id, result.addedConsultation.record.id);
  assert.equal(Boolean(ongoingChatState[result.addedConsultation.record.id]), true);
  assert.equal(Boolean(consultationMachines[result.addedConsultation.record.id]), true);
  assert.equal(waitingQueueState.total >= 1, true);
  assert.equal(doctorStatusState.status, "online");
  if (result.addedConsultation.record.type === "video") {
    assert.equal(activeVideoConsultationState.recordId, result.addedConsultation.record.id);
  }
  assert.equal(Boolean(readRuntimeState().waitingQueue), true);
});
