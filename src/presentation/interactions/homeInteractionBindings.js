import { getRoomHref } from "../../shared/core.js";
import { getAnnouncementById } from "../../application/controllers/contentController.js";
import {
  bindOverlayDismiss,
  closeOverlay,
  openOverlay,
  setOverlayOpen,
  stopEvent
} from "../ui/interactionPrimitives.js";
import { bindQuickEntryInteractions, closeQuickEntryDialog, closeQuickSchedulePanel } from "./homeQuickEntryBindings.js?v=20260527-30";

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

function bindAnnouncementDialogs() {
  const announcementOverlay = document.querySelector(".announcement-overlay");
  const announcementListOverlay = document.querySelector(".announcement-list-overlay");
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
}

function bindConsultCard() {
  const consultCard = document.querySelector(".consult-card");
  if (!consultCard) return;
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

export function bindHomeInteractions() {
  bindAnnouncementDialogs();
  bindConsultCard();
  bindQuickEntryInteractions();
}

export function closeHomeOverlays(event) {
  closeAnnouncementDialog(event);
  closeAnnouncementListDialog(event);
  closeQuickEntryDialog(event);
  closeQuickSchedulePanel(event);
}
