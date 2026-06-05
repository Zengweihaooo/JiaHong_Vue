import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue room sidebar keeps latest H5 runtime data attributes", async () => {
  const sidebar = await readFile(new URL("../src/components/consultation/RoomSidebar.vue", import.meta.url), "utf8");
  const store = await readFile(new URL("../src/stores/app.js", import.meta.url), "utf8");

  assert.match(sidebar, /data-waiting-total/);
  assert.match(sidebar, /data-filter-state="ongoing"/);
  assert.match(sidebar, /data-filter-state="ended"/);
  assert.match(sidebar, /data-filter-type="all"/);
  assert.match(sidebar, /:data-record-id="record\.id"/);
  assert.match(sidebar, /:data-target-view="record\.targetView \|\| ''"/);
  assert.match(sidebar, /:data-record-state="record\.state"/);
  assert.match(sidebar, /:data-badge-key="messageBadgeKey\(record\)"/);
  assert.match(sidebar, /:data-video-locked="isVideoLocked\(record\) \? 'true' : undefined"/);
  assert.match(sidebar, /当前视频问诊未结束，暂不可进入新的视频问诊/);
  assert.match(sidebar, /"is-current-video": isCurrentVideo\(record\)/);
  assert.match(sidebar, /function messageBadgeKey/);
  assert.match(store, /collapseVideoQueue: true/);
});
