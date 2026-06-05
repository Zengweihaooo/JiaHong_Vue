import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue announcement components use unread dots and mark details as read", async () => {
  const [noticeCard, dialogs, store, uiStyles, legacyStyles] = await Promise.all([
    readFile(new URL("../src/components/home/NoticeCard.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/components/common/AppDialogs.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/stores/app.js", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8")
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

  assert.match(uiStyles, /\.notice-card\s*\{/);
  assert.match(uiStyles, /\.notice-card__title-row \.card__title\s*\{[^}]*display:\s*inline-flex/s);
  assert.match(uiStyles, /\.announcement__unread-dot,\s*\.announcement-list-item__unread-dot\s*\{/);
  assert.match(uiStyles, /\.announcement-list-dialog__body\s*\{/);
  assert.match(uiStyles, /\.announcement-list-item__title-text\s*\{[^}]*flex:\s*0 1 auto/s);
  assert.match(uiStyles, /\.announcement__detail-trigger:focus-visible,\s*\.announcement-list-item:focus-visible\s*\{/);

  assert.doesNotMatch(legacyStyles, /notice-card__/);
  assert.doesNotMatch(legacyStyles, /\.announcement(?:__|-list-item|__unread-dot)/);
  assert.doesNotMatch(legacyStyles, /\.divider\s*\{/);
});
