import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  getDoctorReadState,
  markDoctorMessagesReadWhenPatientReplies,
  syncDoctorMessageReadState
} from "../src/domain/chatReadState.js";

test("doctor read state infers read when a later patient message exists", () => {
  const messages = [
    { id: "d1", from: "doctor", text: "你好" },
    { id: "p1", from: "patient", text: "医生好" },
    { id: "d2", from: "doctor", text: "请问哪里不舒服", readStatus: "unread" }
  ];

  assert.equal(getDoctorReadState(messages[0], messages, 0), "read");
  assert.equal(getDoctorReadState(messages[2], messages, 2), "unread");
});

test("syncDoctorMessageReadState persists inferred read markers", () => {
  const messages = [
    { id: "d1", from: "doctor", text: "你好" },
    { id: "p1", from: "patient", text: "医生好" }
  ];

  syncDoctorMessageReadState(messages);

  assert.equal(messages[0].readStatus, "read");
  assert.equal(messages[0].read, true);
});

test("markDoctorMessagesReadWhenPatientReplies marks doctor messages as read", () => {
  const messages = [
    { id: "d1", from: "doctor", text: "你好", readStatus: "unread" },
    { id: "p1", from: "patient", text: "医生好" }
  ];

  markDoctorMessagesReadWhenPatientReplies(messages);

  assert.equal(messages[0].readStatus, "read");
});

test("Vue chat panel scrolls to bottom when opening or switching conversations", async () => {
  const [chatPanel, store] = await Promise.all([
    readFile(new URL("../src/components/consultation/ChatPanel.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/stores/app.js", import.meta.url), "utf8")
  ]);

  assert.match(chatPanel, /:key="record\?\.id"/);
  assert.match(chatPanel, /store\.chatScrollNonce/);
  assert.match(chatPanel, /scrollChatThreadToBottom\(\)/);
  assert.match(chatPanel, /getDoctorReadState/);
  assert.match(store, /markConsultationChatRead/);
  assert.match(store, /requestChatScrollToBottom/);
  assert.match(store, /markDoctorMessagesReadWhenPatientReplies/);
});
