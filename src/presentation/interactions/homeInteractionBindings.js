import { getRoomHref } from "../../shared/core.js";
import { getAnnouncementById, getQuickEntryOption } from "../../application/controllers/contentController.js";
import { renderQuickEntryIcon } from "../ui/icons.js";
import {
  bindOverlayDismiss,
  closeOverlay,
  openOverlay,
  setOverlayOpen,
  showToast,
  stopEvent
} from "../ui/interactionPrimitives.js";

const maxQuickActionCards = 8;
let quickEntryEditingCard = null;

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

function bindQuickEntryDialog() {
  const quickEntryOverlay = document.querySelector(".quick-entry-overlay");
  if (!quickEntryOverlay) return;
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

function bindQuickEntryEditButtons() {
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
}

function bindQuickGrid() {
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
}

export function bindHomeInteractions() {
  bindAnnouncementDialogs();
  bindQuickEntryDialog();
  bindConsultCard();
  bindQuickEntryEditButtons();
  bindQuickGrid();
}

export function closeHomeOverlays(event) {
  closeAnnouncementDialog(event);
  closeAnnouncementListDialog(event);
  closeQuickEntryDialog(event);
}
