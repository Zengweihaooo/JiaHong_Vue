import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue chat panel uses the latest H5 AI reply header controls", async () => {
  const chatPanel = await readFile(new URL("../src/components/consultation/ChatPanel.vue", import.meta.url), "utf8");

  assert.match(chatPanel, /class="ai-reply__title ai-reply__toggle"/);
  assert.match(chatPanel, /展开智能推荐回复/);
  assert.match(chatPanel, /智能推荐回复已展开/);
  assert.match(chatPanel, /class="ai-reply__actions"/);
  assert.match(chatPanel, /class="ai-reply__close"/);
  assert.match(chatPanel, /@click="collapseAiReply"/);
  assert.match(chatPanel, /class="jh-btn jh-btn--sm jh-btn--outline-primary quick-reply-trigger"/);
  assert.match(chatPanel, /@click="openQuickReplyDialog"/);

  assert.doesNotMatch(chatPanel, /ai-reply__hint/);
  assert.doesNotMatch(chatPanel, /@dblclick="toggleAiReply"/);
  assert.doesNotMatch(chatPanel, /quickReplyClickTimer|function toggleAiReply/);
});
