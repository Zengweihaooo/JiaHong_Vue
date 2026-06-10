import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildWaitingQueueFromRecords } from "../src/domain/consultationQueue.js";
import {
  getMessageBadgeKey,
  isMessageBadgeDismissed,
  readDismissedMessageBadges,
  rememberDismissedMessageBadge
} from "../src/domain/messageBadges.js";

test("message badge helpers use the shared record badge key", () => {
  assert.equal(getMessageBadgeKey("text_1"), "record:text_1");
});

test("rememberDismissedMessageBadge persists dismissed keys in session storage", () => {
  const storage = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      }
    }
  };

  const badges = rememberDismissedMessageBadge("record:text_1", new Set());
  assert.equal(badges.has("record:text_1"), true);
  assert.equal(isMessageBadgeDismissed("text_1", readDismissedMessageBadges()), true);
  assert.equal(isMessageBadgeDismissed("video_1", readDismissedMessageBadges()), false);

  delete globalThis.window;
});

test("waiting queue totals are derived from ongoing consultation records", () => {
  const queue = buildWaitingQueueFromRecords([
    { id: "text_1", type: "text", state: "ongoing", time: "10:00" },
    { id: "text_2", type: "text", state: "ongoing", time: "09:00" },
    { id: "video_1", type: "video", state: "ongoing", time: "11:00" },
    { id: "consult_1", type: "consult", state: "ongoing", time: "12:00" },
    { id: "consult_2", type: "consult", state: "ongoing", time: "08:00" },
    { id: "ended_1", type: "text", state: "ended", time: "13:00" }
  ]);

  assert.equal(queue.total, 5);
  assert.deepEqual(queue.byType, { text: 2, video: 1, consult: 2 });
});

test("Vue room sidebar and store clear unread badges and sync waiting queue", async () => {
  const [sidebar, store] = await Promise.all([
    readFile(new URL("../src/components/consultation/RoomSidebar.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/stores/app.js", import.meta.url), "utf8")
  ]);

  assert.match(sidebar, /showUnreadBadge\(record\)/);
  assert.match(sidebar, /store\.isMessageBadgeDismissed\(record\.id\)/);
  assert.match(sidebar, /getMessageBadgeKey/);
  assert.match(store, /markConsultationRecordRead/);
  assert.match(store, /syncWaitingQueue\(\)/);
  assert.match(store, /record\.unreadCount = 0/);
  assert.match(store, /rememberDismissedMessageBadge/);
});
