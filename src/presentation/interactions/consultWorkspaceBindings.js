import { fillChatInput, sendChatInputMessage } from "./chatBindings.js";
import {
  openConsultAttachmentDialog,
  openConsultConfirmDialog,
  openQuickReplyDialog,
  requestPrescriptionSubmit
} from "./consultDialogBindings.js?v=20260527-35";
import { bindDragScrollContainers } from "./dragScrollBindings.js";
import { bindPrescriptionEditor } from "./prescriptionEditorBindings.js";
import { bindVideoControls } from "./videoControls.js";
import { bindVideoPrescriptionSubmitCountdown } from "./videoSubmitLockBindings.js";

function bindAiReplyOptions() {
  document.querySelectorAll(".ai-reply__options button").forEach((option) => {
    if (option.dataset.bound === "true") return;
    option.dataset.bound = "true";
    option.addEventListener("click", () => {
      fillChatInput(option.textContent);
    });
  });
}

function bindQuickReplyTriggers() {
  document.querySelectorAll(".quick-reply-trigger").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", openQuickReplyDialog);
  });
}

function bindConsultAttachments() {
  document.querySelectorAll(".consult-attachment").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", (event) => openConsultAttachmentDialog(button, event));
  });
}

function bindChatInputs() {
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
}

function bindPrescriptionSubmitTriggers() {
  document.querySelectorAll(".jh-prescription-submit").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    const submit = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (button.disabled || button.getAttribute("aria-disabled") === "true") return;
      requestPrescriptionSubmit();
    };
    button.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    button.addEventListener("click", submit);
  });
}

function bindConsultFinishTriggers() {
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
}

export function bindConsultWorkspace() {
  bindDragScrollContainers();
  bindPrescriptionEditor();
  bindAiReplyOptions();
  bindQuickReplyTriggers();
  bindConsultAttachments();
  bindChatInputs();
  bindPrescriptionSubmitTriggers();
  bindVideoPrescriptionSubmitCountdown();
  bindConsultFinishTriggers();
  bindVideoControls();
}
