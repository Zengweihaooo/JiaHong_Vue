import { assetUrl } from "../../shared/core.js";
import { renderData } from "../../application/viewModels/renderViewModel.js";
import { renderButton } from "../components/primitives.js";
import { escapeHtml } from "../ui/html.js";
import { getActiveChatKey } from "./renderRecordSelectors.js";

export function renderChatInput({ className = "" } = {}) {
  return `
    <div class="jh-chat-input${className ? ` ${className}` : ""}">
      <div class="jh-chat-input__top">
        ${renderButton({ text: "快捷回复", tone: "outline-primary", className: "quick-reply-trigger" })}
        <textarea aria-label="回复内容" placeholder="输入回复内容，或点击上方AI推荐快速填充..."></textarea>
      </div>
      <div class="jh-chat-input__actions">
        ${renderButton({ text: "发送", tone: "primary", size: "md" })}
      </div>
    </div>`;
}

export function renderAiReplyOptions(options = []) {
  const layoutTextThreshold = "这是一串智能回复的文字内容，并且这是一行的最长字符数".length;
  const maxTextLength = Math.max(0, ...options.map((option) => option.length));
  const layoutClass = maxTextLength >= layoutTextThreshold ? " ai-reply__options--long" : "";
  return `
    <div class="ai-reply__options${layoutClass}" data-layout-threshold="${layoutTextThreshold}">
      ${options
        .map((option) =>
          renderButton({ text: option, tone: "outline-primary", size: "md", className: "jh-btn--ai-pill" })
        )
        .join("")}
    </div>`;
}

export function findOngoingChatMessage(chatKey, messageId) {
  return renderData.ongoingChatState[chatKey]?.messages.find((message) => message.id === messageId);
}

export function renderChatBubble(message) {
  if (message.from === "doctor" && message.recalled) {
    return `
      <div class="chat-bubble chat-bubble--doctor chat-bubble--recalled" data-message-id="${message.id}">
        <p class="chat-bubble__recalled">您撤回了一条消息</p>
      </div>`;
  }

  const isDoctor = message.from === "doctor";
  return `
    <div
      class="chat-bubble chat-bubble--${message.from}${isDoctor ? " chat-bubble--actionable" : ""}"
      data-message-id="${message.id}"
      ${isDoctor ? 'data-chat-context="doctor"' : ""}
    >
      <p>${escapeHtml(message.text)}</p>
    </div>`;
}

export function renderChatThread(chatKey = getActiveChatKey(), { threadClass = "chat-thread" } = {}) {
  const chat = renderData.ongoingChatState[chatKey];
  if (!chat) return "";

  return `
    <div class="${threadClass}" data-chat-key="${chatKey}">
      <p class="chat-date">${chat.sessionDate}</p>
      ${chat.messages.map((message) => renderChatBubble(message)).join("")}
    </div>`;
}

function getConsultInfo(record = {}) {
  const attachments = record.consultInfo?.attachments?.length
    ? record.consultInfo.attachments
    : [
        { title: "附件1", image: "assets/consult-materials/allergic-rhinitis.png" },
        { title: "附件2", image: "assets/consult-materials/pediatric-fever.png" },
        { title: "附件3", image: "assets/consult-materials/sore-throat.png" },
        { title: "附件4", image: "assets/consult-materials/skin-rash.png" }
      ];
  return {
    description: record.consultInfo?.description || "颈部酸痛僵硬，转头活动受限，久坐后痛感加重",
    attachments: attachments.map((attachment, index) =>
      typeof attachment === "string"
        ? {
            title: attachment,
            image: "assets/figma-consult/attachment-preview.png"
          }
        : {
            title: attachment.title || `附件${index + 1}`,
            image: attachment.image || "assets/figma-consult/attachment-preview.png"
          }
    )
  };
}

export function renderConsultInfoCard(record) {
  if (record?.type !== "consult") return "";
  const consultInfo = getConsultInfo(record);
  return `
    <section class="consult-info-card" aria-label="咨询信息">
      <h3>咨询信息</h3>
      <div class="consult-info-card__row">
        <span class="consult-info-card__label">病情描述：</span>
        <p>${escapeHtml(consultInfo.description)}</p>
      </div>
      <div class="consult-info-card__row">
        <span class="consult-info-card__label">病例信息：</span>
        <div class="consult-attachments">
          ${consultInfo.attachments
            .map(
              (attachment, index) => `
                <button class="consult-attachment" type="button" aria-label="预览${escapeHtml(attachment.title)}" data-consult-attachment-index="${index + 1}" data-consult-attachment-total="${consultInfo.attachments.length}" data-consult-attachment-title="${escapeHtml(attachment.title)}" data-consult-attachment-image="${assetUrl(attachment.image)}">
                  <span class="consult-attachment__thumb">
                    <img src="${assetUrl(attachment.image)}" alt="${escapeHtml(attachment.title)}" loading="lazy" />
                  </span>
                </button>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

export function renderConsultAttachmentDialog() {
  return `
    <div class="consult-attachment-overlay" role="dialog" aria-modal="true" aria-hidden="true">
      <div class="consult-attachment-dialog">
        <div class="consult-attachment-dialog__header">
          <h2>
            <span class="consult-attachment-dialog__icon" aria-hidden="true"></span>
            <span data-consult-attachment-dialog-title>附件1</span>
          </h2>
          <button class="consult-attachment-dialog__close" type="button" aria-label="关闭附件预览"></button>
        </div>
        <div class="consult-attachment-dialog__body">
          <img class="consult-attachment-dialog__image" src="${assetUrl("assets/figma-consult/attachment-preview.png")}" alt="附件预览" />
          <span class="consult-attachment-dialog__scrub consult-attachment-dialog__scrub--prev" aria-hidden="true"></span>
          <span class="consult-attachment-dialog__scrub consult-attachment-dialog__scrub--next" aria-hidden="true"></span>
          <span class="consult-attachment-dialog__scrub consult-attachment-dialog__scrub--pager" aria-hidden="true"></span>
          <span class="consult-attachment-dialog__pager" data-consult-attachment-dialog-pager>1/4</span>
          <button class="consult-attachment-dialog__page consult-attachment-dialog__page--prev" type="button" aria-label="上一页"></button>
          <button class="consult-attachment-dialog__page consult-attachment-dialog__page--next" type="button" aria-label="下一页"></button>
        </div>
      </div>
    </div>`;
}

export function renderChatMessageMenu() {
  return `
    <div class="chat-message-menu" role="menu" aria-hidden="true" hidden>
      <button type="button" class="chat-message-menu__item" role="menuitem" data-action="recall">撤回</button>
      <button type="button" class="chat-message-menu__item" role="menuitem" data-action="copy">复制</button>
      <button type="button" class="chat-message-menu__item" role="menuitem" data-action="quote">引用</button>
    </div>`;
}

export function renderChatPanel(chatKey = getActiveChatKey(), { record = null } = {}) {
  const aiReplies =
    record?.type === "consult"
      ? [
          "考虑颈部肌肉劳损，多休息少低头",
          "颈椎姿势不良引发不适，局部热敷缓解",
          "颈肩筋膜炎，避免久坐适当活动颈部"
        ]
      : [
          "头痛发烧多久啦？体温多少度？",
          "持续几天了？头痛具体位置在哪，程度如何？",
          "这是一串智能回复的文字内容，并且这是一行的最长字符数"
        ];
  return `
    <section class="chat-panel" aria-label="聊天区域">
      ${renderConsultInfoCard(record)}
      ${renderChatThread(chatKey)}
      <div class="ai-reply">
        <div class="ai-reply__head">
          <span class="ai-spark" aria-hidden="true"></span>
          <h3>智能推荐回复</h3>
        </div>
        ${renderAiReplyOptions(aiReplies)}
        ${renderChatInput()}
      </div>
    </section>`;
}
