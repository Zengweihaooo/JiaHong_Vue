import { getRoomHref } from "../../shared/core.js";
import {
  openRiskReviewForActiveConsultation,
  resolveActiveConsultation,
  submitPrescriptionForActiveConsultation
} from "../../application/controllers/consultationController.js";
import {
  bindOverlayDismiss,
  closeOverlay,
  openOverlay,
  setOverlayOpen,
  showToast,
  stopEvent
} from "../ui/interactionPrimitives.js";
import { fillChatInput } from "./chatBindings.js";

let getConsultContext = () => ({ sessionId: "", view: "" });
let onConsultResolved = () => {};

export function configureConsultDialogBindings({ getContext, onResolved } = {}) {
  getConsultContext = typeof getContext === "function" ? getContext : getConsultContext;
  onConsultResolved = typeof onResolved === "function" ? onResolved : onConsultResolved;
}

export function openQuickReplyDialog() {
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

export function openRiskWarningDialog() {
  const overlay = document.querySelector(".risk-warning-overlay");
  if (!overlay) return;
  openRiskReviewForActiveConsultation(getConsultContext())?.catch(() => {
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
    submitPrescriptionForActiveConsultation(getConsultContext())?.catch(() => {
      showToast("处方状态同步失败");
    });
    enableEndConsultButton();
  }
}

export function openConsultAttachmentDialog(button, event) {
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

export function openConsultConfirmDialog(kind) {
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
    result = await resolveActiveConsultation(kind, getConsultContext());
  } catch {
    showToast("问诊状态同步失败");
    result = { message: kind === "cancel" ? "已取消问诊" : "问诊已结束", redirectHref: getRoomHref() };
  }
  onConsultResolved(result);
  showToast(result?.message || "问诊状态已更新");
  window.location.href = result?.redirectHref || getRoomHref();
}

export function bindConsultConfirmDialogs() {
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

function bindQuickReplyOverlay() {
  const quickReplyOverlay = document.querySelector(".quick-reply-overlay");
  if (!quickReplyOverlay) return;

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

function bindRiskWarningOverlay() {
  const riskWarningOverlay = document.querySelector(".risk-warning-overlay");
  if (!riskWarningOverlay) return;
  bindOverlayDismiss(riskWarningOverlay, {
    close: closeRiskWarningDialog,
    closeSelector: ".risk-warning-dialog__close"
  });
}

function bindConsultAttachmentOverlay() {
  const consultAttachmentOverlay = document.querySelector(".consult-attachment-overlay");
  if (!consultAttachmentOverlay) return;
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

export function bindConsultDialogOverlays() {
  bindQuickReplyOverlay();
  bindRiskWarningOverlay();
  bindConsultAttachmentOverlay();
}

export function closeConsultDialogOverlays(event) {
  closeQuickReplyDialog();
  closeRiskWarningDialog();
  closeConsultAttachmentDialog(event);
  closeAllConsultConfirmDialogs();
}
