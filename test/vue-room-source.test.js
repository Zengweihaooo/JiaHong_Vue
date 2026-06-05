import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue room view uses shared UI pending workspace when waiting queue exists", async () => {
  const [roomView, legacyStyles, uiComponent, uiExports, store] = await Promise.all([
    readFile(new URL("../src/views/RoomView.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/src/components/RoomPendingWorkspace/RoomPendingWorkspace.vue", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/src/components/index.js", import.meta.url), "utf8"),
    readFile(new URL("../src/stores/app.js", import.meta.url), "utf8")
  ]);

  assert.match(roomView, /RoomPendingWorkspace/);
  assert.match(roomView, /v-else-if="hasWaitingQueue"/);
  assert.match(roomView, /Number\(store\.waitingQueue\?\.total \|\| 0\) > 0/);

  assert.match(uiExports, /RoomPendingWorkspace/);
  assert.match(uiComponent, /room-card--pending-consult/);
  assert.match(uiComponent, /room-pending-chat-skeleton/);
  assert.match(uiComponent, /room-pending-prescription-panel/);
  assert.match(uiComponent, /medicine-table__head/);

  assert.doesNotMatch(legacyStyles, /\.room-card--pending-consult/);
  assert.doesNotMatch(legacyStyles, /\.room-pending-chat-skeleton/);

  assert.match(store, /shouldAutoEnterNextVideo/);
  assert.match(store, /getNextOngoingVideoConsultationRecord\(this\.consultationRecords/);
  assert.match(store, /this\.activeRecordId = nextVideoRecord\.id/);
  assert.match(store, /showToast\("问诊已结束，已自动接入下一位视频问诊"\)/);
});
