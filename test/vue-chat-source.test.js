import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue chat panel uses the latest H5 AI reply header controls", async () => {
  const [chatPanel, uiStyles, legacyStyles] = await Promise.all([
    readFile(new URL("../src/components/consultation/ChatPanel.vue", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8")
  ]);

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

  assert.match(uiStyles, /\.ai-reply\s*\{/);
  assert.match(uiStyles, /\.ai-reply__toggle:focus-visible\s*\{/);
  assert.match(uiStyles, /\.ai-spark\s*\{[\s\S]*?ai-reply-spark-mask\.png/);
  assert.match(uiStyles, /\.jh-chat-input__top \.quick-reply-trigger\s*\{/);
  assert.match(uiStyles, /\.jh-chat-input__actions \.jh-btn--primary\s*\{/);
  assert.match(uiStyles, /\.chat-message-menu\s*\{/);

  assert.doesNotMatch(legacyStyles, /^\.ai-reply\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.ai-reply__toggle:focus-visible\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.jh-chat-input\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.chat-message-menu\s*\{/m);
});

test("Vue chat panel routes H5 consult info through the shared UI card", async () => {
  const [chatPanel, appDialogs, uiStyles, legacyStyles] = await Promise.all([
    readFile(new URL("../src/components/consultation/ChatPanel.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/components/common/AppDialogs.vue", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8")
  ]);

  assert.match(chatPanel, /import \{ ConsultInfoCard, VideoCallWindow \} from "@jiahong\/ui"/);
  assert.match(chatPanel, /<ConsultInfoCard/);
  assert.match(chatPanel, /function getConsultInfoCard/);
  assert.match(chatPanel, /function getFollowUpVoucher/);
  assert.match(chatPanel, /defaultConsultCaseVoices/);
  assert.match(chatPanel, /record\?\.type !== "consult" && !hasConsultInfo && !voucher/);

  assert.doesNotMatch(chatPanel, /<FollowUpVoucher/);

  assert.match(appDialogs, /class="consult-attachment-overlay is-open"/);
  assert.match(appDialogs, /class="consult-attachment-dialog__page consult-attachment-dialog__page--prev"/);
  assert.match(uiStyles, /^\.jh-voucher-voice-overlay\s*\{/m);
  assert.match(uiStyles, /^\.jh-voucher-voice-overlay\.is-open\s*\{/m);
  assert.match(uiStyles, /^\.jh-voucher-voice-dialog\s*\{/m);
  assert.match(uiStyles, /^\.jh-voucher-wave\s*\{/m);
  assert.match(uiStyles, /^\.consult-info-card\s*\{/m);
  assert.match(uiStyles, /^\.consult-info-card__row\s*\{/m);
  assert.match(uiStyles, /^\.consult-info-card__voices,\n\.consult-attachments\s*\{/m);
  assert.match(uiStyles, /^\.consult-info-card \.consult-attachment--unread\s*\{/m);
  assert.match(uiStyles, /^\.followup-voucher-voice\s*\{/m);
  assert.match(uiStyles, /^\.followup-voice-wave__icon\s*\{/m);
  assert.match(uiStyles, /^\.consult-attachment-overlay\s*\{/m);
  assert.match(uiStyles, /^\.consult-attachment-dialog\s*\{/m);
  assert.match(uiStyles, /^\.consult-attachment-dialog__page::before\s*\{/m);
  assert.match(uiStyles, /^\.consult-attachment-dialog__page--next::before\s*\{/m);
  assert.doesNotMatch(legacyStyles, /\.consult-info-card\s*\{/);
  assert.doesNotMatch(legacyStyles, /\.followup-voucher-card\s*\{/);
  assert.doesNotMatch(legacyStyles, /^\.consult-attachment-overlay\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.consult-attachment-dialog\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.consult-attachment-dialog__page::before\s*\{/m);
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
  assert.match(consultInfoCard, /v-if="activeVoice"/);
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
