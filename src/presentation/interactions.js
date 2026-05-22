import { appView, assetUrl, getSessionIdParam } from "../shared/core.js";
import {
  getActiveConsultationRecord,
  syncActiveElapsedSeconds
} from "../application/controllers/consultationController.js";
import { refreshRealtimeState } from "../application/controllers/realtimeController.js";
import { subscribeToRuntimeState } from "../application/controllers/runtimeController.js";
import { isConsultReadonlyView } from "./ui/dom.js";
import { showToast } from "./ui/interactionPrimitives.js";
import { formatDuration } from "./components/primitives.js";
import {
  applyRuntimeStateToDom,
  bindDoctorStatusMenus,
  bindSidebarScrollIsolation,
  bindSidebarToggle,
  bindUserMenus,
  closeDoctorStatusMenus,
  closeUserMenus,
  isServiceAvailable,
  setServiceTileState,
  toggleDoctorOnlineStatus
} from "./interactions/runtimeUiBindings.js";
import { bindVideoControls } from "./interactions/videoControls.js";
import {
  bindChatMessageMenu,
  closeChatMessageMenu,
  configureChatBindings,
  fillChatInput,
  sendChatInputMessage
} from "./interactions/chatBindings.js";
import {
  bindPrescriptionEditor,
  configurePrescriptionEditorBindings
} from "./interactions/prescriptionEditorBindings.js";
import { bindHomeInteractions, closeHomeOverlays } from "./interactions/homeInteractionBindings.js";
import {
  bindConsultConfirmDialogs,
  bindConsultDialogOverlays,
  closeConsultDialogOverlays,
  configureConsultDialogBindings,
  openConsultAttachmentDialog,
  openConsultConfirmDialog,
  openQuickReplyDialog,
  openRiskWarningDialog
} from "./interactions/consultDialogBindings.js";
import {
  bindRoomInteractions,
  configureRoomInteractionBindings,
  updateRoomMessageList
} from "./interactions/roomInteractionBindings.js";

function getRouteConsultationContext() {
  return {
    sessionId: getSessionIdParam(),
    view: appView
  };
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

export function stopOngoingTimers() {
  window.clearInterval(startOngoingTimers.timer);
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
  configureChatBindings({ onThreadRendered: bindDragScrollContainers });
  configurePrescriptionEditorBindings({ getContext: getRouteConsultationContext, onPanelRendered: bindConsultWorkspace });
  configureConsultDialogBindings({ getContext: getRouteConsultationContext, onResolved: updateRoomMessageList });
  configureRoomInteractionBindings({
    bindWorkspace: bindConsultWorkspace,
    startTimers: startOngoingTimers,
    stopTimers: stopOngoingTimers
  });
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
      toggleDoctorOnlineStatus();
    });
  });

  const serviceList = document.querySelector(".service-list");
  if (serviceList) {
    serviceList.querySelectorAll(".service-tile").forEach((tile) => {
      const serviceKey = tile.dataset.serviceKey;
      setServiceTileState(tile, isServiceAvailable(serviceKey), { sync: false });
    });

    serviceList.addEventListener("click", (event) => {
      const currentTile = event.target.closest(".service-tile");
      if (!currentTile || !serviceList.contains(currentTile)) return;
      event.preventDefault();
      event.stopPropagation();
      const serviceKey = currentTile.dataset.serviceKey;
      setServiceTileState(currentTile, !isServiceAvailable(serviceKey));
    });
  }

  bindConsultWorkspace();
  bindChatMessageMenu();
  bindConsultConfirmDialogs();
  bindConsultDialogOverlays();

  bindHomeInteractions();

  document
    .querySelectorAll(".topbar__actions .jh-btn, .room-service-btn")
    .forEach((button) => {
      button.addEventListener("click", () => {
        showToast(button.textContent.trim());
      });
    });

  bindUserMenus();
  bindRoomInteractions();

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeConsultDialogOverlays(event);
      closeHomeOverlays(event);
      closeUserMenus();
      closeDoctorStatusMenus();
      closeChatMessageMenu();
    }
  });
}
