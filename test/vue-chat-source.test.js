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
  assert.match(chatPanel, /ai-reply__options--long/);
  assert.match(chatPanel, /data-layout-threshold/);
  assert.match(chatPanel, /jh-btn--ai-pill__keyword/);
  assert.match(chatPanel, /function aiReplyTextSegments/);

  assert.doesNotMatch(chatPanel, /ai-reply__hint/);
  assert.doesNotMatch(chatPanel, /@dblclick="toggleAiReply"/);
  assert.doesNotMatch(chatPanel, /quickReplyClickTimer|function toggleAiReply/);
});

test("Vue chat panel routes H5 consult info through the shared UI card", async () => {
  const chatPanel = await readFile(new URL("../src/components/consultation/ChatPanel.vue", import.meta.url), "utf8");
  const legacyStyles = await readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8");

  assert.match(chatPanel, /import \{ ConsultInfoCard, VideoCallWindow \} from "@jiahong\/ui"/);
  assert.match(chatPanel, /<ConsultInfoCard/);
  assert.match(chatPanel, /function getConsultInfoCard/);
  assert.match(chatPanel, /function getFollowUpVoucher/);
  assert.match(chatPanel, /defaultConsultCaseVoices/);
  assert.match(chatPanel, /record\?\.type !== "consult" && !hasConsultInfo && !voucher/);

  assert.doesNotMatch(chatPanel, /<FollowUpVoucher/);
  assert.doesNotMatch(legacyStyles, /\.consult-info-card\s*\{/);
  assert.doesNotMatch(legacyStyles, /\.followup-voucher-card\s*\{/);
});

test("shared consult info card keeps H5 attachment viewed states", async () => {
  const consultInfoCard = await readFile(
    new URL("../../JiaHong_UI/src/components/ConsultInfoCard/ConsultInfoCard.vue", import.meta.url),
    "utf8"
  );

  assert.match(consultInfoCard, /viewedImageKeys/);
  assert.match(consultInfoCard, /function previewImage/);
  assert.match(consultInfoCard, /consult-attachment--read/);
  assert.match(consultInfoCard, /data-consult-attachment-status/);

  assert.match(consultInfoCard, /viewedVoiceKeys/);
  assert.match(consultInfoCard, /activeVoiceKey/);
  assert.match(consultInfoCard, /activeVoiceRemaining/);
  assert.match(consultInfoCard, /activeVoiceWaveStep/);
  assert.match(consultInfoCard, /function isVoiceActive/);
  assert.match(consultInfoCard, /function getVoiceCurrentDuration/);
  assert.match(consultInfoCard, /function stopFollowUpVoicePlayback/);
  assert.match(consultInfoCard, /function openVoice/);
  assert.match(consultInfoCard, /followup-voucher-item--viewed/);
  assert.match(consultInfoCard, /data-followup-voucher-status/);
  assert.match(consultInfoCard, /data-followup-voice-current/);
  assert.match(consultInfoCard, /data-followup-voice-step/);
  assert.match(consultInfoCard, /is-playing/);
});
