import { appView, assetUrl, getHistoryHref, getRoomHref, getSessionIdParam, getTextHref, getVideoHref } from "../shared/core.js";
import {
  getActiveConsultationRecord,
  activateVideoConsultation,
  getConsultationRecordById,
  getFirstEndedConsultationRecord,
  openRiskReviewForActiveConsultation,
  resolveActiveConsultation,
  submitPrescriptionForActiveConsultation,
  syncActiveElapsedSeconds,
  syncWaitingQueueToMessages
} from "../application/controllers/consultationController.js";
import {
  appendDoctorChatMessage,
  generatePatientReplyForChat,
  getOngoingChatMessage,
  rememberMessageBadgeDismissed,
  recallOngoingChatMessage
} from "../application/controllers/chatController.js";
import { getAnnouncementById, getQuickEntryOption } from "../application/controllers/contentController.js";
import { refreshRealtimeState } from "../application/controllers/realtimeController.js";
import {
  getDoctorStatus,
  getServiceAvailability,
  getServiceAvailabilityEntries,
  getWaitingQueueState,
  setDoctorStatusState,
  setServiceAvailabilityState,
  subscribeToRuntimeState
} from "../application/controllers/runtimeController.js";
import {
  addDiagnosisToActiveRecord,
  addMedicineToActiveRecord,
  getDiagnosisOptions,
  getMedicineOptions,
  removeDiagnosisFromActiveRecord,
  removeMedicineFromActiveRecord,
  updateMedicineFieldInActiveRecord
} from "../application/controllers/prescriptionController.js";
import { getConsultMainElement, isConsultReadonlyView, refreshChatThread, setConsultShellReadonly } from "./ui/dom.js";
import { renderQuickEntryIcon } from "./ui/icons.js";
import {
  bindOverlayDismiss,
  closeOverlay,
  closePopupMenus,
  openOverlay,
  setOverlayOpen,
  showToast,
  stopEvent,
  togglePopupMenu
} from "./ui/interactionPrimitives.js";
import { attachLocalCamera, getLocalMediaStatus, setLocalCameraEnabled, setLocalMicrophoneEnabled } from "./ui/localMedia.js";
import { formatDuration, getActiveChatKey, getDoctorStatusLabel, renderChatThread, renderConsultationPanel, renderMessageList, renderPrescriptionPanel, renderPrescriptionTraceMain, renderRoomMain, renderTextMain, renderVideoMain, renderVideoMediaIcon, videoMediaState } from "./render.js";

const videoConsultationLockedMessage = "请先结束当前视频问诊，再进入新的视频问诊";

function getRouteConsultationContext() {
  return {
    sessionId: getSessionIdParam(),
    view: appView
  };
}

function setServiceTileState(tile, enabled, { sync = true } = {}) {
  const serviceKey = tile.dataset.serviceKey;
  if (serviceKey) {
    setServiceAvailabilityState(serviceKey, enabled, { sync }).catch(() => {
      showToast("服务状态同步失败");
    });
  }
  tile.setAttribute("aria-checked", String(enabled));
  tile.classList.toggle("is-selected", enabled);
  if (serviceKey) applyServiceStateToDom(serviceKey, enabled);
}

function applyServiceStateToDom(serviceKey, enabled) {
  document.querySelectorAll(`[data-service-key="${serviceKey}"]`).forEach((node) => {
    node.setAttribute("aria-checked", String(enabled));
    node.classList.toggle("is-selected", enabled);
  });
}

function applyRuntimeStateToDom() {
  const status = getDoctorStatus();
  const statusLabel = getDoctorStatusLabel(status);

  document.querySelectorAll("[data-status-text]").forEach((node) => {
    node.textContent = statusLabel;
    node.classList.remove("jh-status-badge--online", "jh-status-badge--busy", "jh-status-badge--offline");
    node.classList.add(`jh-status-badge--${status}`);
  });

  document.querySelectorAll(".room-status").forEach((button) => {
    button.setAttribute("aria-label", `出诊状态：${statusLabel}，展开状态菜单`);
  });

  document.querySelectorAll(".doctor-status-trigger").forEach((button) => {
    button.setAttribute("aria-label", `出诊状态：${statusLabel}，展开状态菜单`);
  });

  document.querySelectorAll(".doctor-status-menu__item").forEach((item) => {
    const active = item.dataset.doctorStatus === status;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-checked", String(active));
  });

  document.querySelectorAll(".jh-switch").forEach((button) => {
    const enabled = status !== "offline";
    button.classList.toggle("is-on", enabled);
    button.setAttribute("aria-pressed", String(enabled));
  });

  const waitingQueue = getWaitingQueueState();
  document.querySelectorAll("[data-waiting-total]").forEach((node) => {
    node.textContent = String(waitingQueue.total);
  });
  document.querySelectorAll("[data-waiting-type]").forEach((node) => {
    node.textContent = String(waitingQueue.byType[node.dataset.waitingType] ?? 0);
  });

  getServiceAvailabilityEntries().forEach(([serviceKey, enabled]) => {
    applyServiceStateToDom(serviceKey, enabled);
  });
}

function changeDoctorStatus(nextStatus, { sync = true } = {}) {
  setDoctorStatusState(nextStatus, { sync }).catch(() => {
    showToast("出诊状态同步失败");
  });
}

function setSidebarCollapsed(collapsed) {
  const shell = document.querySelector(".app-shell");
  shell?.classList.toggle("is-sidebar-collapsed", collapsed);
  shell?.classList.toggle("is-sidebar-expanded", !collapsed);
  document.querySelector(".sidebar-toggle")?.setAttribute("aria-expanded", String(!collapsed));
  document.querySelector(".sidebar-toggle")?.setAttribute("aria-label", collapsed ? "展开主菜单" : "收起主菜单");
}

function bindSidebarToggle() {
  document.querySelectorAll(".sidebar-toggle").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const shell = button.closest(".app-shell");
      const sidebarWidth = document.querySelector(".sidebar")?.getBoundingClientRect().width || 0;
      const isCollapsed = shell?.classList.contains("is-sidebar-collapsed") || sidebarWidth <= 80;
      setSidebarCollapsed(!isCollapsed);
    });
  });
}

function bindSidebarScrollIsolation() {
  document.querySelectorAll(".sidebar").forEach((sidebar) => {
    if (sidebar.dataset.scrollBound === "true") return;
    sidebar.dataset.scrollBound = "true";
    sidebar.addEventListener(
      "wheel",
      (event) => {
        const content = sidebar.querySelector(".sidebar__content");
        if (!content) return;
        if (content.scrollHeight > content.clientHeight) {
          content.scrollTop += event.deltaY;
        }
        event.preventDefault();
        event.stopPropagation();
      },
      { passive: false }
    );
  });
}

function openQuickReplyDialog() {
  openOverlay(".quick-reply-overlay", ".quick-reply-dialog__close");
}

function closeQuickReplyDialog() {
  closeOverlay(".quick-reply-overlay");
}

function enableEndConsultButton() {
  document.querySelectorAll(".end-consult-trigger").forEach((button) => {
    button.disabled = false;
    button.classList.remove("jh-btn--soft-danger");
    button.classList.add("jh-btn--danger");
  });
}

function openRiskWarningDialog() {
  const overlay = document.querySelector(".risk-warning-overlay");
  if (!overlay) return;
  openRiskReviewForActiveConsultation(getRouteConsultationContext())?.catch(() => {
    showToast("问诊状态同步失败");
  });
  setOverlayOpen(overlay, true, { focusSelector: ".risk-warning-dialog__close" });
}

function closeRiskWarningDialog() {
  const overlay = document.querySelector(".risk-warning-overlay");
  if (!overlay) return;
  const wasOpen = overlay.classList.contains("is-open");
  setOverlayOpen(overlay, false);
  if (wasOpen) {
    submitPrescriptionForActiveConsultation(getRouteConsultationContext())?.catch(() => {
      showToast("处方状态同步失败");
    });
    enableEndConsultButton();
  }
}

function openConsultAttachmentDialog(button, event) {
  stopEvent(event);
  const overlay = document.querySelector(".consult-attachment-overlay");
  if (!overlay) return;
  const index = button?.dataset.consultAttachmentIndex || "1";
  const total = button?.dataset.consultAttachmentTotal || "4";
  const title = button?.dataset.consultAttachmentTitle || `附件${index}`;
  const image = button?.dataset.consultAttachmentImage || "";
  const titleNode = overlay.querySelector("[data-consult-attachment-dialog-title]");
  const pagerNode = overlay.querySelector("[data-consult-attachment-dialog-pager]");
  const imageNode = overlay.querySelector(".consult-attachment-dialog__image");
  if (titleNode) titleNode.textContent = title;
  if (pagerNode) pagerNode.textContent = `${index}/${total}`;
  if (imageNode && image) {
    imageNode.src = image;
    imageNode.alt = title;
  }
  overlay.dataset.consultAttachmentIndex = index;
  setOverlayOpen(overlay, true, { focusSelector: ".consult-attachment-dialog__close" });
}

function switchConsultAttachment(direction, event) {
  stopEvent(event);
  const overlay = document.querySelector(".consult-attachment-overlay");
  if (!overlay) return;
  const buttons = Array.from(document.querySelectorAll(".consult-attachment"));
  if (!buttons.length) return;
  const currentIndex = Number(overlay.dataset.consultAttachmentIndex || "1") - 1;
  const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
  openConsultAttachmentDialog(buttons[nextIndex]);
}

function closeConsultAttachmentDialog(event) {
  closeOverlay(".consult-attachment-overlay", event);
}

function openConsultConfirmDialog(kind) {
  openOverlay(`.consult-confirm-overlay[data-confirm-kind="${kind}"]`, ".consult-confirm-submit");
}

function closeConsultConfirmDialog(kind) {
  closeOverlay(`.consult-confirm-overlay[data-confirm-kind="${kind}"]`);
}

function closeAllConsultConfirmDialogs() {
  document.querySelectorAll(".consult-confirm-overlay.is-open").forEach((overlay) => {
    closeConsultConfirmDialog(overlay.dataset.confirmKind);
  });
}

async function handleConsultConfirm(kind) {
  closeConsultConfirmDialog(kind);
  let result = null;
  try {
    result = await resolveActiveConsultation(kind, getRouteConsultationContext());
  } catch {
    showToast("问诊状态同步失败");
    result = { message: kind === "cancel" ? "已取消问诊" : "问诊已结束", redirectHref: getRoomHref() };
  }
  updateRoomMessageList();
  showToast(result?.message || "问诊状态已更新");
  window.location.href = result?.redirectHref || getRoomHref();
}

function bindConsultConfirmDialogs() {
  document.querySelectorAll(".consult-confirm-overlay").forEach((overlay) => {
    if (overlay.dataset.confirmBound === "true") return;
    overlay.dataset.confirmBound = "true";
    const kind = overlay.dataset.confirmKind;
    overlay.querySelector(".consult-confirm-dialog__close")?.addEventListener("click", () => {
      closeConsultConfirmDialog(kind);
    });
    overlay.querySelector(".consult-confirm-dismiss")?.addEventListener("click", () => {
      closeConsultConfirmDialog(kind);
    });
    overlay.querySelector(".consult-confirm-submit")?.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleConsultConfirm(kind);
    });
    overlay.querySelector(".consult-confirm-submit")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeConsultConfirmDialog(kind);
      }
    });
    overlay.querySelector(".consult-confirm-dialog")?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  });
}

function openAnnouncementDialog(event) {
  stopEvent(event);
  const overlay = document.querySelector(".announcement-overlay");
  if (!overlay) return;
  const announcementId =
    event?.currentTarget?.dataset?.announcementId || event?.target?.closest("[data-announcement-id]")?.dataset?.announcementId;
  const announcement = getAnnouncementById(announcementId);
  overlay.querySelector(".announcement-dialog__meta h3").textContent = announcement.title;
  overlay.querySelector(".announcement-dialog__meta span").textContent = announcement.date;
  overlay.querySelector(".announcement-dialog__body p").textContent = announcement.content;
  overlay.querySelector(".announcement-dialog__publisher").textContent = announcement.publisher;
  setOverlayOpen(overlay, true, { focusSelector: ".announcement-dialog__close" });
}

function closeAnnouncementDialog(event) {
  closeOverlay(".announcement-overlay", event);
}

function openAnnouncementListDialog(event) {
  openOverlay(".announcement-list-overlay", ".announcement-list-dialog__close", event);
}

function closeAnnouncementListDialog(event) {
  closeOverlay(".announcement-list-overlay", event);
}

function openQuickEntryDialog(event, editingCard = null) {
  quickEntryEditingCard = editingCard;
  const overlay = openOverlay(".quick-entry-overlay", ".quick-entry-dialog__close", event);
  const title = overlay?.querySelector("#quick-entry-title");
  if (title) title.textContent = quickEntryEditingCard ? "编辑快捷入口" : "添加快捷入口";
}

function closeQuickEntryDialog(event) {
  closeOverlay(".quick-entry-overlay", event);
  quickEntryEditingCard = null;
}

const userMenuConfig = {
  menuSelector: ".user-menu",
  containerSelector: ".user-chip, .room-user",
  triggerSelector: ".user-menu-trigger"
};

const doctorStatusMenuConfig = {
  menuSelector: ".doctor-status-menu",
  containerSelector: ".doctor-status-control",
  triggerSelector: ".doctor-status-trigger"
};

function toggleUserMenu(trigger, forceOpen) {
  togglePopupMenu(trigger, userMenuConfig, forceOpen);
}

function closeUserMenus() {
  closePopupMenus(userMenuConfig);
}

function closeDoctorStatusMenus() {
  closePopupMenus(doctorStatusMenuConfig);
}

function toggleDoctorStatusMenu(trigger, forceOpen) {
  togglePopupMenu(trigger, doctorStatusMenuConfig, forceOpen);
}

function bindDoctorStatusMenus() {
  if (bindDoctorStatusMenus.bound) return;
  bindDoctorStatusMenus.bound = true;

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".doctor-status-trigger");
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      closeUserMenus();
      toggleDoctorStatusMenu(trigger);
      return;
    }

    const item = event.target.closest(".doctor-status-menu__item");
    if (item) {
      event.preventDefault();
      event.stopPropagation();
      changeDoctorStatus(item.dataset.doctorStatus);
      closeDoctorStatusMenus();
      return;
    }

    if (!event.target.closest(".doctor-status-menu")) {
      closeDoctorStatusMenus();
    }
  });
}

function bindUserMenus() {
  if (bindUserMenus.bound) return;
  bindUserMenus.bound = true;

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".user-menu-trigger");
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      toggleUserMenu(trigger);
      return;
    }

    const item = event.target.closest(".user-menu__item");
    if (item) {
      event.preventDefault();
      event.stopPropagation();
      closeUserMenus();
      showToast(item.dataset.action || item.textContent.trim());
      return;
    }

    if (!event.target.closest(".user-menu")) {
      closeUserMenus();
    }
  });
}

function getRoomFilters() {
  const messageList = document.querySelector(".message-list");
  return {
    type: messageList?.dataset.filterType || "all",
    state: messageList?.dataset.filterState || "ongoing"
  };
}

function updateRoomMessageList() {
  const messageList = document.querySelector(".message-list");
  syncWaitingQueueToMessages();
  if (!messageList) return;
  const filters = getRoomFilters();
  const activeId = document.querySelector(".message-item.is-active")?.dataset.recordId || "";
  messageList.innerHTML = renderMessageList({ ...filters, activeRecord: activeId });
  bindMessageItems();
}

function restoreOngoingMain() {
  const main = getConsultMainElement();
  if (!main) return;
  if (appView === "text") {
    main.outerHTML = renderTextMain();
  } else if (appView === "video") {
    main.outerHTML = renderVideoMain();
  } else {
    main.outerHTML = renderRoomMain();
  }
}

function showPrescriptionTrace(record) {
  const main = getConsultMainElement();
  if (!main) return;
  window.clearInterval(startOngoingTimers.timer);
  main.outerHTML = renderPrescriptionTraceMain(record);
  setConsultShellReadonly(true);
  bindPrescriptionTraceCards();
}

function handleMessageItemClick(item) {
  if (item.dataset.videoLocked === "true" || item.getAttribute("aria-disabled") === "true") {
    showToast(videoConsultationLockedMessage, { tone: "warning", duration: 3200 });
    return;
  }
  if (item.dataset.badgeKey) {
    rememberMessageBadgeDismissed(item.dataset.badgeKey);
  }
  item.querySelector(".message-item__badge")?.remove();
  const messageList = item.closest(".message-list");
  messageList?.querySelectorAll(".message-item").forEach((node) => node.classList.remove("is-active"));
  item.classList.add("is-active");
  const record = getConsultationRecordById(item.dataset.recordId);
  if (record?.state === "ended") {
    showPrescriptionTrace(record);
    return;
  }

  setConsultShellReadonly(false);

  if (isConsultReadonlyView() && (appView === "text" || appView === "video") && record?.id === getSessionIdParam()) {
    restoreOngoingMain();
    bindConsultWorkspace();
    startOngoingTimers();
    return;
  }

  const targetView = item.dataset.targetView || (record?.type === "video" ? "video" : record ? "text" : "");
  if (targetView === "video") {
    if (record?.id) {
      activateVideoConsultation(record.id);
    }
    if (!openConsultationInCurrentPage(record, "video")) {
      window.location.href = getVideoHref(record?.id);
    }
  } else if (targetView === "text") {
    if (!openConsultationInCurrentPage(record, "text")) {
      window.location.href = getTextHref(record?.id);
    }
  }
}

function updateConsultRoute(targetView, sessionId) {
  const href = targetView === "video" ? getVideoHref(sessionId) : getTextHref(sessionId);
  const nextUrl = new URL(href, window.location.href);
  if (nextUrl.href !== window.location.href) {
    window.history.pushState({ view: targetView, sessionId }, "", nextUrl);
  }
}

function setConsultPageMode(targetView) {
  document.title = targetView === "video" ? "嘉虹健康视频问诊" : "嘉虹健康图文问诊";
  document.body.classList.remove("page-view-room", "page-view-text", "page-view-video", "page-view-history");
  document.body.classList.add(`page-view-${targetView}`);
  const shell = document.querySelector(".app-shell");
  if (!shell) return;
  shell.classList.add("room-shell", "consult-shell", "text-shell");
  shell.classList.toggle("video-shell", targetView === "video");
  shell.classList.remove("history-shell");
}

function openConsultationInCurrentPage(record, targetView) {
  if (!record?.id || !document.querySelector(".room-shell")) return false;
  const main = getConsultMainElement();
  if (!main) return false;

  updateConsultRoute(targetView, record.id);
  setConsultPageMode(targetView);
  setConsultShellReadonly(false);
  main.outerHTML = targetView === "video" ? renderVideoMain() : renderTextMain();
  bindConsultWorkspace();
  bindChatMessageMenu();
  bindConsultConfirmDialogs();
  startOngoingTimers();
  return true;
}

function bindMessageItems() {
  document.querySelectorAll(".message-item").forEach((item) => {
    if (item.dataset.bound === "true") return;
    item.dataset.bound = "true";
    item.addEventListener("click", () => handleMessageItemClick(item));
    item.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      handleMessageItemClick(item);
    });
  });
}

function bindPrescriptionTraceCards() {
  document.querySelectorAll(".prescription-history-open").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const recordId = document.querySelector(".message-item.is-active")?.dataset.recordId;
      window.location.href = getHistoryHref(recordId);
    });
  });
}

function closeChatMessageMenu() {
  const menu = document.querySelector(".chat-message-menu");
  if (!menu) return;
  menu.hidden = true;
  menu.classList.remove("is-open");
  menu.setAttribute("aria-hidden", "true");
  menu.style.left = "";
  menu.style.top = "";
  delete menu.dataset.messageId;
  delete menu.dataset.chatKey;
}

function openChatMessageMenu(bubble, event) {
  if (isConsultReadonlyView()) return;
  event.preventDefault();
  const menu = document.querySelector(".chat-message-menu");
  if (!menu) return;

  const chatKey = bubble.closest("[data-chat-key]")?.dataset.chatKey || getActiveChatKey() || "";
  menu.dataset.messageId = bubble.dataset.messageId || "";
  menu.dataset.chatKey = chatKey;
  menu.hidden = false;
  menu.classList.add("is-open");
  menu.setAttribute("aria-hidden", "false");

  const offset = 4;
  menu.style.left = `${event.clientX + offset}px`;
  menu.style.top = `${event.clientY + offset}px`;

  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    const left = Math.min(event.clientX + offset, window.innerWidth - rect.width - 8);
    const top = Math.min(event.clientY + offset, window.innerHeight - rect.height - 8);
    menu.style.left = `${Math.max(8, left)}px`;
    menu.style.top = `${Math.max(8, top)}px`;
  });
}

async function copyChatMessageText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("已复制");
  } catch {
    showToast("复制失败");
  }
}

function handleChatMessageMenuAction(action) {
  const menu = document.querySelector(".chat-message-menu");
  if (!menu) return;
  const chatKey = menu.dataset.chatKey;
  const messageId = menu.dataset.messageId;
  const message = getOngoingChatMessage(chatKey, messageId);
  if (!message || message.recalled) {
    closeChatMessageMenu();
    return;
  }

  if (action === "recall") {
    recallOngoingChatMessage(chatKey, messageId);
    refreshChatThread(renderChatThread, chatKey);
    showToast("消息已撤回");
  } else if (action === "copy") {
    copyChatMessageText(message.text);
  } else if (action === "quote") {
    fillChatInput(`引用：${message.text}`, { append: true });
    showToast("已引用到输入框");
  }

  closeChatMessageMenu();
}

function appendActiveDoctorChatMessage(text) {
  const chatKey = getActiveChatKey();
  const message = appendDoctorChatMessage(chatKey, text);
  if (!message) return null;
  refreshChatThread(renderChatThread, chatKey);
  bindChatMessageMenu();
  bindDragScrollContainers();
  const thread = document.querySelector(`[data-chat-key="${chatKey}"]`);
  if (thread) thread.scrollTop = thread.scrollHeight;
  return { chatKey, message };
}

function fillChatInput(text = "", { append = false } = {}) {
  const input = document.querySelector(".jh-chat-input textarea");
  if (!input) return false;
  const nextText = String(text).trim();
  if (!nextText) return false;
  input.value = append && input.value.trim() ? `${input.value.trim()}\n${nextText}` : nextText;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
  input.setSelectionRange?.(input.value.length, input.value.length);
  return true;
}

async function appendMockPatientReply(chatKey, doctorMessage) {
  try {
    const reply = await generatePatientReplyForChat(chatKey, doctorMessage);
    if (!reply) return;
    refreshChatThread(renderChatThread, chatKey);
    bindChatMessageMenu();
    bindDragScrollContainers();
    const thread = document.querySelector(`[data-chat-key="${chatKey}"]`);
    if (thread) thread.scrollTop = thread.scrollHeight;
  } catch {
    showToast("病人自动回复失败");
  }
}

function sendChatInputMessage(input) {
  if (isConsultReadonlyView()) return;
  const text = input?.value.trim();
  if (!text) return;
  const sent = appendActiveDoctorChatMessage(text);
  if (!sent) {
    showToast("当前会话不可发送");
    return;
  }
  input.value = "";
  input.focus();
  appendMockPatientReply(sent.chatKey, sent.message);
}

const maxQuickActionCards = 8;
let quickEntryEditingCard = null;

function renderQuickCardMarkup({ title = "", desc = "添加快捷入口", icon = "plus", isAdd = false } = {}) {
  const classes = `quick-card${isAdd ? " quick-card--add" : " quick-card--custom"}`;
  return `
    <div class="${classes}" role="button" tabindex="0" data-action="${desc}"${isAdd ? "" : ' data-custom-quick-entry="true"'}>
      ${
        isAdd
          ? ""
          : `<button class="quick-card__delete" type="button" aria-label="删除快捷入口：${title}"></button>
             <button class="quick-card__drag" type="button" aria-label="拖动排序：${title}" draggable="true"></button>`
      }
      <span class="quick-card__body">
        <span class="icon-box">${renderQuickEntryIcon(icon)}</span>
        ${title ? `<span class="quick-card__title">${title}</span>` : ""}
        <span class="quick-card__desc">${desc}</span>
      </span>
    </div>`;
}

function getQuickActionCount(grid = document) {
  return grid.querySelectorAll(".quick-card:not(.quick-card--add)").length;
}

function ensureQuickAddCard(grid) {
  const addCard = grid.querySelector(".quick-card--add");
  const shouldShowAdd = getQuickActionCount(grid) < maxQuickActionCards;
  if (shouldShowAdd && !addCard) {
    grid.insertAdjacentHTML("beforeend", renderQuickCardMarkup({ isAdd: true }));
  } else if (!shouldShowAdd) {
    addCard?.remove();
  }
}

function addCustomQuickCard(option) {
  const grid = document.querySelector(".quick-grid");
  if (!grid) return false;
  if (getQuickActionCount(grid) >= maxQuickActionCards) {
    showToast(`最多添加${maxQuickActionCards}个快捷入口`);
    return false;
  }
  const addCard = grid.querySelector(".quick-card--add");
  const markup = renderQuickCardMarkup(option);
  if (addCard) {
    addCard.insertAdjacentHTML("beforebegin", markup);
  } else {
    grid.insertAdjacentHTML("beforeend", markup);
  }
  ensureQuickAddCard(grid);
  return true;
}

function replaceQuickCard(card, option) {
  if (!card || !option) return false;
  card.outerHTML = renderQuickCardMarkup(option);
  return true;
}

function removeCustomQuickCard(card) {
  const grid = card.closest(".quick-grid");
  card.remove();
  if (grid) ensureQuickAddCard(grid);
}

function activateQuickCard(card, event) {
  if (event?.target.closest(".quick-card__delete, .quick-card__drag")) return;
  if (card.classList.contains("quick-card--add")) {
    openQuickEntryDialog(event);
    return;
  }
  if (card.closest(".quick-entry-card")?.classList.contains("is-editing")) {
    openQuickEntryDialog(event, card);
    return;
  }
  showToast(card.dataset.action);
}

function bindChatMessageMenu() {
  const menu = document.querySelector(".chat-message-menu");
  if (!menu || menu.dataset.bound === "true") return;
  menu.dataset.bound = "true";

  document.addEventListener("contextmenu", (event) => {
    if (!document.querySelector(".text-card:not(.text-card--readonly)")) return;
    const bubble = event.target.closest(
      '.chat-bubble--doctor[data-chat-context="doctor"]:not(.chat-bubble--recalled)'
    );
    if (!bubble) return;
    openChatMessageMenu(bubble, event);
  });

  menu.querySelectorAll(".chat-message-menu__item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      handleChatMessageMenuAction(item.dataset.action);
    });
  });

  document.addEventListener("click", (event) => {
    if (!menu.classList.contains("is-open")) return;
    if (menu.contains(event.target)) return;
    closeChatMessageMenu();
  });

  document.addEventListener("scroll", closeChatMessageMenu, true);
}

function refreshActivePrescriptionPanel(record = getActiveConsultationRecord(getRouteConsultationContext())) {
  const panel = document.querySelector(".prescription-panel:not(.prescription-panel--readonly)");
  if (!panel || !record) return;
  const scrollTop = panel.scrollTop;
  const scrollBottom = panel.scrollHeight - panel.clientHeight - scrollTop;
  panel.outerHTML = record.type === "consult" ? renderConsultationPanel({ record }) : renderPrescriptionPanel({ record });
  bindConsultWorkspace();
  const nextPanel = document.querySelector(".prescription-panel:not(.prescription-panel--readonly)");
  if (nextPanel) {
    const restoreScroll = () => {
      nextPanel.scrollTop = scrollTop > 0
        ? Math.max(0, nextPanel.scrollHeight - nextPanel.clientHeight - scrollBottom)
        : 0;
    };
    restoreScroll();
    window.requestAnimationFrame(restoreScroll);
    window.setTimeout(restoreScroll, 0);
  }
}

async function renderDiagnosisDropdown(input) {
  const panel = input.closest(".prescription-panel");
  const dropdown = panel?.querySelector(".diagnosis-options");
  if (!dropdown) return;
  const requestId = `${Date.now()}-${Math.random()}`;
  input.dataset.diagnosisRequestId = requestId;
  const context = getRouteConsultationContext();
  const options = await getDiagnosisOptions(input.value, context);
  if (input.dataset.diagnosisRequestId !== requestId) return;
  dropdown.innerHTML = "";
  options.forEach((diagnosis) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "diagnosis-option";
    button.setAttribute("role", "option");
    button.textContent = diagnosis;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handlePrescriptionResult(addDiagnosisToActiveRecord(diagnosis, context));
    });
    dropdown.appendChild(button);
  });
  dropdown.hidden = options.length === 0;
  input.setAttribute("aria-expanded", String(options.length > 0));
}

function closeDiagnosisDropdown(input) {
  const panel = input.closest(".prescription-panel");
  const dropdown = panel?.querySelector(".diagnosis-options");
  if (!dropdown) return;
  dropdown.hidden = true;
  input.setAttribute("aria-expanded", "false");
}

async function renderMedicineDropdown(input) {
  const panel = input.closest(".prescription-panel");
  const dropdown = panel?.querySelector(".medicine-options");
  if (!dropdown) return;
  const requestId = `${Date.now()}-${Math.random()}`;
  input.dataset.medicineRequestId = requestId;
  const context = getRouteConsultationContext();
  const options = await getMedicineOptions(input.value, context);
  if (input.dataset.medicineRequestId !== requestId) return;
  dropdown.innerHTML = "";
  options.forEach((medicine) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "medicine-option";
    button.setAttribute("role", "option");
    button.innerHTML = `<span>${medicine.name}</span><small>${medicine.spec}</small>`;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handlePrescriptionResult(addMedicineToActiveRecord(medicine, context));
    });
    dropdown.appendChild(button);
  });
  dropdown.hidden = options.length === 0;
  input.setAttribute("aria-expanded", String(options.length > 0));
}

function closeMedicineDropdown(input) {
  const panel = input.closest(".prescription-panel");
  const dropdown = panel?.querySelector(".medicine-options");
  if (!dropdown) return;
  dropdown.hidden = true;
  input.setAttribute("aria-expanded", "false");
}

function closeMedicineUnitDropdown(control) {
  const dropdown = control?.querySelector(".medicine-unit-options");
  const trigger = control?.querySelector(".medicine-unit-select");
  if (!dropdown || !trigger) return;
  dropdown.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
}

function closeMedicineUnitDropdowns(exceptControl = null) {
  document.querySelectorAll(".medicine-unit-control").forEach((control) => {
    if (control !== exceptControl) closeMedicineUnitDropdown(control);
  });
}

function positionOpenMedicineUnitDropdowns() {
  document.querySelectorAll('.medicine-unit-select[aria-expanded="true"]').forEach((trigger) => {
    positionMedicineUnitDropdown(trigger.closest(".medicine-unit-control"));
  });
}

function positionMedicineUnitDropdown(control) {
  const trigger = control?.querySelector(".medicine-unit-select");
  const dropdown = control?.querySelector(".medicine-unit-options");
  if (!trigger || !dropdown) return;
  const triggerRect = trigger.getBoundingClientRect();
  const menuWidth = dropdown.offsetWidth || 64;
  const left = Math.min(triggerRect.right + 8, window.innerWidth - menuWidth - 8);
  const top = Math.max(8, triggerRect.top - 8);
  dropdown.style.setProperty("--medicine-unit-menu-left", `${Math.max(8, left)}px`);
  dropdown.style.setProperty("--medicine-unit-menu-top", `${top}px`);
}

function openMedicineUnitDropdown(control) {
  const dropdown = control?.querySelector(".medicine-unit-options");
  const trigger = control?.querySelector(".medicine-unit-select");
  if (!dropdown || !trigger) return;
  closeMedicineUnitDropdowns(control);
  dropdown.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  positionMedicineUnitDropdown(control);
}

async function handlePrescriptionResult(resultOrPromise) {
  const result = await resultOrPromise;
  if (result?.record) {
    refreshActivePrescriptionPanel(result.record);
  }
  if (result?.message) {
    showToast(result.message);
  }
}

function bindPrescriptionEditor() {
  const panel = document.querySelector(".prescription-panel:not(.prescription-panel--readonly)");
  if (!panel || panel.dataset.editorBound === "true") return;
  panel.dataset.editorBound = "true";

  panel.querySelectorAll(".diagnosis-tag__close-btn[data-diagnosis-tag]").forEach((button) => {
    const removeDiagnosis = (event) => {
      event.preventDefault();
      event.stopPropagation();
      handlePrescriptionResult(
        removeDiagnosisFromActiveRecord(button.dataset.diagnosisTag, getRouteConsultationContext())
      );
    };
    button.addEventListener("pointerdown", removeDiagnosis);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });
  const diagnosisInput = panel.querySelector(".diagnosis-select-input");
  diagnosisInput?.addEventListener("focus", () => {
    renderDiagnosisDropdown(diagnosisInput);
  });
  diagnosisInput?.addEventListener("input", () => {
    renderDiagnosisDropdown(diagnosisInput);
  });
  diagnosisInput?.addEventListener("blur", () => {
    window.setTimeout(() => closeDiagnosisDropdown(diagnosisInput), 0);
  });
  diagnosisInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    const diagnosisText = event.currentTarget.value.trim();
    if (!diagnosisText) return;
    handlePrescriptionResult(addDiagnosisToActiveRecord(diagnosisText, getRouteConsultationContext()));
  });
  const medicineInput = panel.querySelector(".medicine-search input");
  medicineInput?.setAttribute("aria-expanded", "false");
  medicineInput?.addEventListener("focus", () => {
    renderMedicineDropdown(medicineInput);
  });
  medicineInput?.addEventListener("input", () => {
    renderMedicineDropdown(medicineInput);
  });
  medicineInput?.addEventListener("blur", () => {
    window.setTimeout(() => closeMedicineDropdown(medicineInput), 0);
  });
  medicineInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    handlePrescriptionResult(addMedicineToActiveRecord(event.currentTarget.value, getRouteConsultationContext()));
  });
  if (!bindPrescriptionEditor.dropdownDismissBound) {
    bindPrescriptionEditor.dropdownDismissBound = true;
    document.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".diagnosis-combobox")) {
        document.querySelectorAll(".diagnosis-select-input").forEach((input) => closeDiagnosisDropdown(input));
      }
      if (!event.target.closest(".medicine-search-combobox")) {
        document.querySelectorAll(".medicine-search input").forEach((input) => closeMedicineDropdown(input));
      }
      if (!event.target.closest(".medicine-unit-control")) {
        closeMedicineUnitDropdowns();
      }
    });
    window.addEventListener("resize", () => closeMedicineUnitDropdowns());
    document.addEventListener("scroll", positionOpenMedicineUnitDropdowns, true);
  }
  panel.querySelectorAll(".medicine-delete-btn").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const row = button.closest("[data-medicine-name]");
      handlePrescriptionResult(
        removeMedicineFromActiveRecord(row?.dataset.medicineName, getRouteConsultationContext())
      );
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });
  panel.querySelectorAll(".medicine-unit-select").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const control = button.closest(".medicine-unit-control");
      const expanded = button.getAttribute("aria-expanded") === "true";
      if (expanded) {
        closeMedicineUnitDropdown(control);
      } else {
        openMedicineUnitDropdown(control);
      }
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener("keydown", (event) => {
      const control = button.closest(".medicine-unit-control");
      if (event.key === "Escape") {
        closeMedicineUnitDropdown(control);
        button.focus();
      }
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMedicineUnitDropdown(control);
        control?.querySelector(".medicine-unit-option.is-active, .medicine-unit-option")?.focus();
      }
    });
  });
  panel.querySelectorAll(".medicine-unit-option[data-medicine-unit]").forEach((option) => {
    option.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const control = option.closest(".medicine-unit-control");
      const row = option.closest("[data-medicine-index]");
      const trigger = control?.querySelector(".medicine-unit-select");
      const unit = option.dataset.medicineUnit || "";
      updateMedicineFieldInActiveRecord(
        row?.dataset.medicineIndex,
        "unit",
        unit,
        getRouteConsultationContext()
      );
      if (trigger) {
        trigger.querySelector("span").textContent = unit;
      }
      control?.querySelectorAll(".medicine-unit-option").forEach((item) => {
        const active = item === option;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      closeMedicineUnitDropdown(control);
    });
    option.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    option.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        const control = option.closest(".medicine-unit-control");
        closeMedicineUnitDropdown(control);
        control?.querySelector(".medicine-unit-select")?.focus();
      }
    });
  });
  panel.querySelectorAll(".medicine-edit-field[data-medicine-field]").forEach((input) => {
    input.addEventListener("input", () => {
      const row = input.closest("[data-medicine-index]");
      updateMedicineFieldInActiveRecord(
        row?.dataset.medicineIndex,
        input.dataset.medicineField,
        input.value,
        getRouteConsultationContext()
      );
    });
    input.addEventListener("change", () => {
      const row = input.closest("[data-medicine-index]");
      updateMedicineFieldInActiveRecord(
        row?.dataset.medicineIndex,
        input.dataset.medicineField,
        input.value,
        getRouteConsultationContext()
      );
    });
  });
}

function bindDragScrollContainers(root = document) {
  root
    .querySelectorAll(".message-list, .chat-thread, .video-chat-thread, .quick-reply-categories, .quick-reply-list, .prescription-panel")
    .forEach((node) => {
      if (node.dataset.dragScrollBound === "true") return;
      node.dataset.dragScrollBound = "true";
      let startY = 0;
      let startScrollTop = 0;
      let didDrag = false;
      let pointerId = null;

      node.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || node.scrollHeight <= node.clientHeight) return;
        pointerId = event.pointerId;
        startY = event.clientY;
        startScrollTop = node.scrollTop;
        didDrag = false;
        node.classList.add("is-drag-scroll-active");
        node.setPointerCapture?.(event.pointerId);
      });

      node.addEventListener("pointermove", (event) => {
        if (pointerId !== event.pointerId) return;
        const deltaY = event.clientY - startY;
        if (Math.abs(deltaY) > 4) didDrag = true;
        if (!didDrag) return;
        event.preventDefault();
        node.scrollTop = startScrollTop - deltaY;
      });

      const endDrag = (event) => {
        if (pointerId !== event.pointerId) return;
        pointerId = null;
        node.classList.remove("is-drag-scroll-active");
        node.releasePointerCapture?.(event.pointerId);
      };

      node.addEventListener("pointerup", endDrag);
      node.addEventListener("pointercancel", endDrag);
      node.addEventListener(
        "click",
        (event) => {
          if (!didDrag) return;
          event.preventDefault();
          event.stopPropagation();
          didDrag = false;
        },
        true
      );
    });
}

function bindConsultWorkspace() {
  bindDragScrollContainers();
  bindPrescriptionEditor();

  document.querySelectorAll(".ai-reply__options button").forEach((option) => {
    if (option.dataset.bound === "true") return;
    option.dataset.bound = "true";
    option.addEventListener("click", () => {
      fillChatInput(option.textContent);
    });
  });

  document.querySelectorAll(".quick-reply-trigger").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", openQuickReplyDialog);
  });

  document.querySelectorAll(".consult-attachment").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", (event) => openConsultAttachmentDialog(button, event));
  });

  document.querySelectorAll(".jh-chat-input").forEach((chatInput) => {
    if (chatInput.dataset.sendBound === "true") return;
    chatInput.dataset.sendBound = "true";
    const textarea = chatInput.querySelector("textarea");
    const sendButton = chatInput.querySelector(".jh-chat-input__actions .jh-btn--primary");
    sendButton?.addEventListener("click", () => {
      sendChatInputMessage(textarea);
    });
    textarea?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
      event.preventDefault();
      sendChatInputMessage(textarea);
    });
  });

  document.querySelectorAll(".jh-prescription-submit").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openRiskWarningDialog();
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });

  document.querySelectorAll(".cancel-consult-trigger").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      openConsultConfirmDialog("cancel");
    });
  });

  document.querySelectorAll(".end-consult-trigger").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (button.disabled) return;
      openConsultConfirmDialog("end");
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });

  bindVideoControls();
}

function syncVideoWindowControls(videoWindow) {
  if (!videoWindow) return;
  const { cameraOn, micOn } = videoMediaState;
  const pip = videoWindow.querySelector(".video-window__pip--local");
  pip?.classList.toggle("is-camera-off", !cameraOn);
  const pipOff = pip?.querySelector(".video-window__pip-off");
  if (pipOff) pipOff.setAttribute("aria-hidden", String(cameraOn));
  videoWindow.classList.toggle("is-media-off", !cameraOn || !micOn);
  setLocalCameraEnabled(cameraOn);
  setLocalMicrophoneEnabled(micOn);

  videoWindow.querySelectorAll("[data-video-action]").forEach((button) => {
    const isCamera = button.dataset.videoAction === "toggle-camera";
    const enabled = isCamera ? cameraOn : micOn;
    const label = isCamera
      ? enabled
        ? "关闭摄像头"
        : "开启摄像头"
      : enabled
        ? "关闭麦克风"
        : "开启麦克风";

    button.classList.toggle("is-off", !enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    const icon = button.querySelector(".video-control-icon");
    if (icon) {
      icon.outerHTML = renderVideoMediaIcon(isCamera ? "camera" : "mic", enabled);
    }
  });
}

async function setupLocalCamera(videoWindow, { forceRetry = false } = {}) {
  const video = videoWindow.querySelector("[data-local-camera]");
  const pip = videoWindow.querySelector(".video-window__pip--local");
  const status = videoWindow.querySelector("[data-camera-status]");
  if (!video || (video.dataset.cameraBound === "true" && !forceRetry)) return;

  video.dataset.cameraBound = "true";
  const mediaStatus = getLocalMediaStatus();
  const shouldShowLoading = forceRetry || mediaStatus.status === "idle" || mediaStatus.status === "pending";
  pip?.classList.toggle("is-camera-loading", shouldShowLoading);
  if (status) {
    status.textContent = mediaStatus.hasStream
      ? "医生摄像头已连接"
      : shouldShowLoading
        ? "正在连接摄像头"
        : mediaStatus.reason === "NotAllowedError"
          ? "摄像头权限未开启"
          : "无法连接摄像头";
  }

  const result = await attachLocalCamera(video, { ...videoMediaState, forceRetry });
  pip?.classList.remove("is-camera-loading");
  pip?.classList.toggle("is-camera-ready", result.ok);
  pip?.classList.toggle("is-camera-error", !result.ok);

  if (status) {
    status.textContent = result.ok
      ? "医生摄像头已连接"
      : result.reason === "NotAllowedError"
        ? "摄像头权限未开启"
        : "无法连接摄像头";
  }
}

function bindVideoControls() {
  document.querySelectorAll(".video-window[data-video-controls]").forEach((videoWindow) => {
    if (videoWindow.dataset.bound === "true") return;
    videoWindow.dataset.bound = "true";
    setupLocalCamera(videoWindow);

    videoWindow.querySelectorAll("[data-video-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (button.dataset.videoAction === "toggle-camera") {
          videoMediaState.cameraOn = !videoMediaState.cameraOn;
          showToast(videoMediaState.cameraOn ? "摄像头已开启" : "摄像头已关闭");
          if (videoMediaState.cameraOn && videoWindow.querySelector(".video-window__pip--local.is-camera-error")) {
            setupLocalCamera(videoWindow, { forceRetry: true });
          }
        } else if (button.dataset.videoAction === "toggle-mic") {
          videoMediaState.micOn = !videoMediaState.micOn;
          showToast(videoMediaState.micOn ? "麦克风已开启" : "麦克风已关闭");
        }
        syncVideoWindowControls(videoWindow);
      });
    });
  });
}

export function startOngoingTimers() {
  window.clearInterval(startOngoingTimers.timer);
  if (isConsultReadonlyView() || !document.querySelector("[data-duration-timer]")) {
    return;
  }
  const tick = () => {
    document.querySelectorAll("[data-ongoing-timer], [data-duration-timer]").forEach((node) => {
      const nextSeconds = Number(node.dataset.elapsed || 0) + 1;
      node.dataset.elapsed = String(nextSeconds);
      if (node.matches("[data-duration-timer]")) {
        syncActiveElapsedSeconds(nextSeconds, getRouteConsultationContext());
      }
      const text = formatDuration(nextSeconds);
      if (node.matches("[data-duration-timer]")) {
        node.setAttribute("aria-label", `问诊持续时长：${text}`);
        const value = node.querySelector(".jh-duration-chip__value");
        if (value) value.textContent = text;
        const label = node.querySelector("strong");
        if (label && !value) label.textContent = `问诊持续时长：${text}`;
      } else {
        node.textContent = `持续 ${text}`;
      }
    });
  };
  startOngoingTimers.timer = window.setInterval(tick, 1000);
}

export function startRealtimeMockUpdates() {
  window.clearInterval(startRealtimeMockUpdates.timer);
  const refresh = async () => {
    try {
      const snapshot = await refreshRealtimeState();
      if (snapshot.addedConsultation) {
        updateRoomMessageList();
        showToast(`新增${snapshot.addedConsultation.record.typeLabel}问诊`);
      }
    } catch {
      showToast("实时状态更新失败");
    }
  };
  startRealtimeMockUpdates.timer = window.setInterval(refresh, 3000);
}

export function bindInteractions() {
  subscribeToRuntimeState(applyRuntimeStateToDom);
  applyRuntimeStateToDom();
  bindDragScrollContainers();
  bindSidebarToggle();
  bindSidebarScrollIsolation();

  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".menu-item").forEach((node) => {
        node.classList.remove("is-active");
      });
      item.classList.add("is-active");
    });
  });

  bindDoctorStatusMenus();

  document.querySelectorAll(".jh-switch").forEach((switchButton) => {
    if (switchButton.dataset.bound === "true") return;
    switchButton.dataset.bound = "true";
    switchButton.addEventListener("click", () => {
      changeDoctorStatus(getDoctorStatus() === "offline" ? "online" : "offline");
    });
  });

  const serviceList = document.querySelector(".service-list");
  if (serviceList) {
    serviceList.querySelectorAll(".service-tile").forEach((tile) => {
      const serviceKey = tile.dataset.serviceKey;
      setServiceTileState(tile, getServiceAvailability(serviceKey), { sync: false });
    });

    serviceList.addEventListener("click", (event) => {
      const currentTile = event.target.closest(".service-tile");
      if (!currentTile || !serviceList.contains(currentTile)) return;
      event.preventDefault();
      event.stopPropagation();
      const serviceKey = currentTile.dataset.serviceKey;
      setServiceTileState(currentTile, !getServiceAvailability(serviceKey));
    });
  }

  bindConsultWorkspace();
  bindChatMessageMenu();
  bindConsultConfirmDialogs();

  const quickReplyOverlay = document.querySelector(".quick-reply-overlay");

  if (quickReplyOverlay) {
    bindOverlayDismiss(quickReplyOverlay, {
      close: closeQuickReplyDialog,
      closeSelector: ".quick-reply-dialog__close"
    });

    quickReplyOverlay.querySelectorAll(".quick-reply-category").forEach((category) => {
      category.addEventListener("click", () => {
        quickReplyOverlay
          .querySelectorAll(".quick-reply-category")
          .forEach((node) => node.classList.remove("is-active"));
        category.classList.add("is-active");
      });
    });

    const applyQuickReplyMessage = (message, event) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (fillChatInput(message.textContent)) {
        closeQuickReplyDialog();
      }
    };

    quickReplyOverlay.querySelectorAll(".quick-reply-message").forEach((message) => {
      message.addEventListener("pointerdown", (event) => applyQuickReplyMessage(message, event));
      message.addEventListener("click", (event) => event.preventDefault());
    });
  }

  const riskWarningOverlay = document.querySelector(".risk-warning-overlay");

  if (riskWarningOverlay) {
    bindOverlayDismiss(riskWarningOverlay, {
      close: closeRiskWarningDialog,
      closeSelector: ".risk-warning-dialog__close"
    });
  }

  const consultAttachmentOverlay = document.querySelector(".consult-attachment-overlay");

  if (consultAttachmentOverlay) {
    bindOverlayDismiss(consultAttachmentOverlay, {
      close: closeConsultAttachmentDialog,
      closeSelector: ".consult-attachment-dialog__close",
      dialogSelector: ".consult-attachment-dialog"
    });
    consultAttachmentOverlay.querySelector(".consult-attachment-dialog__page--prev")?.addEventListener("click", (event) => {
      switchConsultAttachment(-1, event);
    });
    consultAttachmentOverlay.querySelector(".consult-attachment-dialog__page--next")?.addEventListener("click", (event) => {
      switchConsultAttachment(1, event);
    });
  }

  const announcementOverlay = document.querySelector(".announcement-overlay");
  const announcementListOverlay = document.querySelector(".announcement-list-overlay");
  const quickEntryOverlay = document.querySelector(".quick-entry-overlay");
  document.querySelectorAll(".announcement__detail-trigger").forEach((button) => {
    button.addEventListener("click", openAnnouncementDialog);
  });
  document.querySelectorAll(".announcement-list-trigger").forEach((button) => {
    button.addEventListener("click", openAnnouncementListDialog);
  });

  if (announcementOverlay) {
    bindOverlayDismiss(announcementOverlay, {
      close: closeAnnouncementDialog,
      closeSelector: ".announcement-dialog__close",
      dialogSelector: ".announcement-dialog"
    });
  }

  if (announcementListOverlay) {
    bindOverlayDismiss(announcementListOverlay, {
      close: closeAnnouncementListDialog,
      closeSelector: ".announcement-list-dialog__close",
      dialogSelector: ".announcement-list-dialog"
    });
    announcementListOverlay.querySelectorAll(".announcement-list-item").forEach((item) => {
      item.addEventListener("click", (event) => {
        closeAnnouncementListDialog(event);
        openAnnouncementDialog(event);
      });
    });
  }

  if (quickEntryOverlay) {
    bindOverlayDismiss(quickEntryOverlay, {
      close: closeQuickEntryDialog,
      closeSelector: ".quick-entry-dialog__close",
      dialogSelector: ".quick-entry-dialog"
    });
    quickEntryOverlay.querySelectorAll(".quick-entry-option").forEach((optionButton) => {
      optionButton.addEventListener("click", (event) => {
        const option = getQuickEntryOption(optionButton.dataset.optionIndex);
        if (!option) return;
        const editingCard = quickEntryEditingCard;
        const updated = editingCard ? replaceQuickCard(editingCard, option) : addCustomQuickCard(option);
        closeQuickEntryDialog(event);
        if (updated) showToast(`${editingCard ? "已更新" : "已添加"}${option.title}`);
      });
    });
  }

  const consultCard = document.querySelector(".consult-card");
  if (consultCard) {
    const setSelected = (selected) => {
      consultCard.classList.toggle("is-selected", selected);
    };
    consultCard.addEventListener("pointerdown", () => setSelected(true));
    consultCard.addEventListener("pointerup", () => setSelected(false));
    consultCard.addEventListener("pointercancel", () => setSelected(false));
    consultCard.addEventListener("pointerleave", () => setSelected(false));
    consultCard.addEventListener("blur", () => setSelected(false));
    consultCard.addEventListener("click", () => {
      window.location.href = getRoomHref();
    });
  }

  document.querySelectorAll(".quick-entry-card__edit").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const card = button.closest(".quick-entry-card");
      const editing = !card?.classList.contains("is-editing");
      card?.classList.toggle("is-editing", editing);
      button.setAttribute("aria-pressed", String(editing));
      button.querySelector(".quick-entry-card__edit-text").textContent = editing ? "完成" : "编辑";
    });
  });

  document.querySelectorAll(".quick-grid").forEach((grid) => {
    if (grid.dataset.bound === "true") return;
    grid.dataset.bound = "true";
    grid.addEventListener("click", (event) => {
      const deleteButton = event.target.closest(".quick-card__delete");
      if (deleteButton) {
        event.preventDefault();
        event.stopPropagation();
        const card = deleteButton.closest(".quick-card--custom");
        if (!card || !card.closest(".quick-entry-card")?.classList.contains("is-editing")) return;
        removeCustomQuickCard(card);
        showToast("已删除快捷入口");
        return;
      }
      const card = event.target.closest(".quick-card");
      if (!card || !grid.contains(card)) return;
      activateQuickCard(card, event);
    });
    grid.addEventListener("dragstart", (event) => {
      const handle = event.target.closest(".quick-card__drag");
      const card = handle?.closest(".quick-card--custom");
      if (!card || !grid.closest(".quick-entry-card")?.classList.contains("is-editing")) {
        event.preventDefault();
        return;
      }
      card.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", "");
    });
    grid.addEventListener("dragover", (event) => {
      const dragging = grid.querySelector(".quick-card.is-dragging");
      if (!dragging) return;
      const target = event.target.closest(".quick-card--custom");
      if (!target || target === dragging || !grid.contains(target)) return;
      event.preventDefault();
      const targetRect = target.getBoundingClientRect();
      const insertAfter = event.clientY > targetRect.top + targetRect.height / 2;
      grid.insertBefore(dragging, insertAfter ? target.nextElementSibling : target);
    });
    grid.addEventListener("dragend", () => {
      grid.querySelector(".quick-card.is-dragging")?.classList.remove("is-dragging");
    });
    grid.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest(".quick-card");
      if (!card || !grid.contains(card)) return;
      event.preventDefault();
      activateQuickCard(card, event);
    });
  });

  document
    .querySelectorAll(".topbar__actions .jh-btn, .room-service-btn")
    .forEach((button) => {
      button.addEventListener("click", () => {
        showToast(button.textContent.trim());
      });
    });

  bindUserMenus();

  const roomRefresh = document.querySelector(".room-refresh");
  if (roomRefresh) {
    roomRefresh.addEventListener("click", () => {
      window.location.href = getTextHref();
    });
  }

  document.querySelectorAll(".room-tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      const group = tag.closest(".room-tags");
      group.querySelectorAll(".room-tag").forEach((node) => node.classList.remove("is-active"));
      tag.classList.add("is-active");
      const messageList = document.querySelector(".message-list");
      if (messageList) {
        if (tag.dataset.filterType) {
          messageList.dataset.filterType = tag.dataset.filterType;
        }
        if (tag.dataset.filterState) {
          messageList.dataset.filterState = tag.dataset.filterState;
        }
        updateRoomMessageList();
        const filters = getRoomFilters();
        if (filters.state === "ended") {
          const firstEnded = getFirstEndedConsultationRecord({ type: filters.type });
          if (firstEnded) {
            showPrescriptionTrace(firstEnded);
            document.querySelector(`.message-item[data-record-id="${firstEnded.id}"]`)?.classList.add("is-active");
          }
        } else if (filters.state === "ongoing") {
          setConsultShellReadonly(false);
          if (isConsultReadonlyView()) {
            restoreOngoingMain();
            bindConsultWorkspace();
            startOngoingTimers();
          }
        }
      }
    });
  });

  document.querySelectorAll(".room-service-check").forEach((button) => {
    button.addEventListener("click", () => {
      const enabled = button.getAttribute("aria-checked") === "true";
      const nextState = !enabled;
      setServiceTileState(button, nextState);
    });
  });

  bindMessageItems();

  bindPrescriptionTraceCards();

  document.querySelectorAll(".history-back").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = getRoomHref();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeQuickReplyDialog();
      closeRiskWarningDialog();
      closeAnnouncementDialog(event);
      closeAnnouncementListDialog(event);
      closeQuickEntryDialog(event);
      closeUserMenus();
      closeDoctorStatusMenus();
      closeChatMessageMenu();
      closeAllConsultConfirmDialogs();
    }
  });
}
