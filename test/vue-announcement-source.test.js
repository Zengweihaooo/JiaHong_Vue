import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue announcement components use unread dots and mark details as read", async () => {
  const [noticeCard, dialogs, store] = await Promise.all([
    readFile(new URL("../src/components/home/NoticeCard.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/components/common/AppDialogs.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/stores/app.js", import.meta.url), "utf8")
  ]);

  assert.match(noticeCard, /announcement__unread-dot/);
  assert.match(noticeCard, /查看历史公告/);
  assert.match(noticeCard, /store\.markAnnouncementRead\(id\)/);
  assert.doesNotMatch(noticeCard, /announcement-tag|ReadTag/);

  assert.match(dialogs, /announcement-list-item__unread-dot/);
  assert.match(dialogs, /历史公告/);
  assert.match(dialogs, /store\.markAnnouncementRead\(id\)/);
  assert.doesNotMatch(dialogs, /announcement-list-item__tag/);

  assert.match(store, /markAnnouncementRead\(announcementId = ""\)/);
});
