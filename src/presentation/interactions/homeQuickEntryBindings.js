import { getQuickEntryOption } from "../../application/controllers/contentController.js";
import { maxQuickActionCards } from "../../domain/quickEntries.js";
import { bindOverlayDismiss, closeOverlay, openOverlay, showToast } from "../ui/interactionPrimitives.js?v=20260527-36";
import {
  addCustomQuickCardToGrid,
  ensureQuickAddCard,
  getQuickGridCustomCards,
  moveDraggingQuickCard,
  removeCustomQuickCardWithMotion,
  replaceQuickCard,
  setQuickCardEditControlsState
} from "./quickEntryGridDom.js";

let quickEntryEditingCard = null;
let activeQuickCardDrag = null;

function openQuickEntryDialog(event, editingCard = null) {
  quickEntryEditingCard = editingCard;
  const overlay = openOverlay(".quick-entry-overlay", ".quick-entry-dialog__close", event);
  const title = overlay?.querySelector("#quick-entry-title");
  if (title) title.textContent = quickEntryEditingCard ? "编辑快捷入口" : "添加快捷入口";
}

export function closeQuickEntryDialog(event) {
  closeOverlay(".quick-entry-overlay", event);
  quickEntryEditingCard = null;
}

function addCustomQuickCard(option) {
  const grid = document.querySelector(".quick-grid");
  const result = addCustomQuickCardToGrid(grid, option);
  if (result.reason === "limit") {
    showToast(`最多添加${maxQuickActionCards}个快捷入口`);
  }
  return result.ok;
}

function beginQuickCardDrag(event, grid, card) {
  activeQuickCardDrag = {
    grid,
    card,
    slotIndex: getQuickGridCustomCards(grid).indexOf(card)
  };
  card.classList.add("is-dragging");
}

function updateQuickCardDrag(event) {
  if (!activeQuickCardDrag) return;
  event.preventDefault();
  moveDraggingQuickCard(event, activeQuickCardDrag.grid, activeQuickCardDrag.card, activeQuickCardDrag);
}

function endPointerQuickCardDrag() {
  activeQuickCardDrag?.card.classList.remove("is-dragging");
  activeQuickCardDrag = null;
}

function endMouseQuickCardDrag() {
  document.removeEventListener("mousemove", updateQuickCardDrag);
  document.removeEventListener("mouseup", endMouseQuickCardDrag);
  endPointerQuickCardDrag();
}

function openQuickSchedulePanel(card, event) {
  event?.preventDefault();
  event?.stopPropagation();
  const quickEntryCard = card.closest(".quick-entry-card");
  const panel = quickEntryCard?.querySelector(".schedule-panel");
  if (!quickEntryCard || !panel) return false;
  quickEntryCard.classList.remove("is-editing");
  quickEntryCard.querySelector(".quick-entry-card__edit")?.setAttribute("aria-pressed", "false");
  const editText = quickEntryCard.querySelector(".quick-entry-card__edit-text");
  if (editText) editText.textContent = "编辑";
  setQuickCardEditControlsState(quickEntryCard, false);
  quickEntryCard.classList.add("is-schedule-open");
  panel.hidden = false;
  panel.querySelector(".schedule-panel__back")?.focus();
  return true;
}

export function closeQuickSchedulePanel(event) {
  document.querySelectorAll(".quick-entry-card.is-schedule-open").forEach((quickEntryCard) => {
    event?.preventDefault();
    event?.stopPropagation();
    quickEntryCard.classList.remove("is-schedule-open");
    const panel = quickEntryCard.querySelector(".schedule-panel");
    if (panel) panel.hidden = true;
  });
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
  if (card.dataset.quickFeature === "schedule") {
    openQuickSchedulePanel(card, event);
    return;
  }
  showToast(card.dataset.action);
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
      if (card) setQuickCardEditControlsState(card, editing);
      button.setAttribute("aria-pressed", String(editing));
      button.querySelector(".quick-entry-card__edit-text").textContent = editing ? "完成" : "编辑";
    });
  });
}

function bindQuickSchedulePanel() {
  document.querySelectorAll(".schedule-panel__back").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", closeQuickSchedulePanel);
  });
  document.querySelectorAll(".schedule-panel__detail").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      showToast("排班详情暂未开放");
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
        removeCustomQuickCardWithMotion(card);
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
      event.preventDefault();
      moveDraggingQuickCard(event, grid, dragging, activeQuickCardDrag);
    });
    grid.addEventListener("dragend", () => {
      grid.querySelector(".quick-card.is-dragging")?.classList.remove("is-dragging");
    });
    grid.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".quick-card__delete")) return;
      const handle = event.target.closest(".quick-card__drag");
      const card = event.target.closest(".quick-card--custom");
      if (!card || !grid.closest(".quick-entry-card")?.classList.contains("is-editing")) return;
      event.preventDefault();
      beginQuickCardDrag(event, grid, card);
      (handle || card).setPointerCapture?.(event.pointerId);
    });
    grid.addEventListener("pointermove", (event) => {
      if (!activeQuickCardDrag || activeQuickCardDrag.grid !== grid) return;
      updateQuickCardDrag(event);
    });
    grid.addEventListener("pointerup", endPointerQuickCardDrag);
    grid.addEventListener("pointercancel", endPointerQuickCardDrag);
    grid.addEventListener("mousedown", (event) => {
      if (typeof PointerEvent === "function") return;
      if (event.target.closest(".quick-card__delete")) return;
      const card = event.target.closest(".quick-card--custom");
      if (!card || !grid.closest(".quick-entry-card")?.classList.contains("is-editing")) return;
      event.preventDefault();
      beginQuickCardDrag(event, grid, card);
      document.addEventListener("mousemove", updateQuickCardDrag);
      document.addEventListener("mouseup", endMouseQuickCardDrag, { once: true });
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

export function bindQuickEntryInteractions() {
  bindQuickEntryDialog();
  bindQuickEntryEditButtons();
  bindQuickSchedulePanel();
  bindQuickGrid();
}
