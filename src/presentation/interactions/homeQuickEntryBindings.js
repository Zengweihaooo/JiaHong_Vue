import { getQuickEntryOption } from "../../application/controllers/contentController.js";
import { escapeHtml } from "../ui/html.js";
import { renderQuickEntryIcon } from "../ui/icons.js";
import { bindOverlayDismiss, closeOverlay, openOverlay, showToast } from "../ui/interactionPrimitives.js?v=20260527-31";

const maxQuickActionCards = 8;
const quickGridAnimationMs = 280;
let quickEntryEditingCard = null;
let activeQuickCardDrag = null;

function shouldReduceMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function getQuickGridCards(grid) {
  return Array.from(grid.querySelectorAll(".quick-card"));
}

function getQuickGridCustomCards(grid) {
  return Array.from(grid.querySelectorAll(".quick-card--custom"));
}

function captureQuickGridRects(grid) {
  return new Map(getQuickGridCards(grid).map((card) => [card, card.getBoundingClientRect()]));
}

function animateQuickGridFrom(grid, previousRects) {
  if (shouldReduceMotion()) return;
  getQuickGridCards(grid).forEach((card) => {
    if (card.classList.contains("is-dragging") || card.classList.contains("is-removing")) return;
    const previousRect = previousRects.get(card);
    if (!previousRect) return;
    const nextRect = card.getBoundingClientRect();
    const deltaX = previousRect.left - nextRect.left;
    const deltaY = previousRect.top - nextRect.top;
    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;
    if (typeof card.animate === "function") {
      card.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: "translate(0, 0)" }
        ],
        {
          duration: quickGridAnimationMs,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)"
        }
      );
      return;
    }
    card.style.transition = "none";
    card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    card.getBoundingClientRect();
    window.requestAnimationFrame(() => {
      card.style.transition = `transform ${quickGridAnimationMs}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      card.style.transform = "";
      window.setTimeout(() => {
        card.style.transition = "";
      }, quickGridAnimationMs);
    });
  });
}

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

function renderQuickCardMarkup({ title = "", desc = "添加快捷入口", icon = "plus", isAdd = false } = {}) {
  const classes = `quick-card${isAdd ? " quick-card--add" : " quick-card--custom"}`;
  return `
    <div class="${classes}" role="button" tabindex="0" data-action="${escapeHtml(desc)}" data-quick-title="${escapeHtml(title)}"${isAdd ? "" : ' data-custom-quick-entry="true"'}>
      ${
        isAdd
          ? ""
          : `<button class="quick-card__delete" type="button" aria-label="删除快捷入口：${escapeHtml(title)}"></button>
             <button class="quick-card__drag" type="button" aria-label="拖动排序：${escapeHtml(title)}" draggable="true"></button>`
      }
      <span class="quick-card__body">
        <span class="icon-box">${renderQuickEntryIcon(icon)}</span>
        ${title ? `<span class="quick-card__title">${escapeHtml(title)}</span>` : ""}
        <span class="quick-card__desc">${escapeHtml(desc)}</span>
      </span>
    </div>`;
}

function setQuickCardEditControlsState(scope, editing) {
  scope.querySelectorAll(".quick-card__delete, .quick-card__drag").forEach((control) => {
    if (editing) {
      control.style.setProperty("opacity", "1", "important");
      control.style.setProperty("pointer-events", "auto", "important");
      control.style.setProperty("transform", "translateY(0) scale(1)", "important");
      control.style.setProperty("visibility", "visible", "important");
      return;
    }
    control.style.removeProperty("opacity");
    control.style.removeProperty("pointer-events");
    control.style.removeProperty("transform");
    control.style.removeProperty("visibility");
  });
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
  if (grid.closest(".quick-entry-card")?.classList.contains("is-editing")) {
    setQuickCardEditControlsState(grid, true);
  }
  ensureQuickAddCard(grid);
  return true;
}

function replaceQuickCard(card, option) {
  if (!card || !option) return false;
  const editing = card.closest(".quick-entry-card")?.classList.contains("is-editing");
  card.outerHTML = renderQuickCardMarkup(option);
  if (editing) {
    const grid = document.querySelector(".quick-grid");
    if (grid) setQuickCardEditControlsState(grid, true);
  }
  return true;
}

function removeCustomQuickCard(card) {
  const grid = card.closest(".quick-grid");
  const previousRects = grid ? captureQuickGridRects(grid) : null;
  card.remove();
  if (grid) {
    ensureQuickAddCard(grid);
    animateQuickGridFrom(grid, previousRects);
  }
}

function removeCustomQuickCardWithMotion(card) {
  if (shouldReduceMotion()) {
    removeCustomQuickCard(card);
    return;
  }
  card.classList.add("is-removing");
  window.setTimeout(() => {
    removeCustomQuickCard(card);
  }, quickGridAnimationMs);
}

function getGridInsertIndex(event, grid, dragging) {
  const cards = getQuickGridCustomCards(grid).filter((card) => card !== dragging);
  if (!cards.length) return 0;
  const rects = cards.map((card, index) => ({
    card,
    index,
    rect: card.getBoundingClientRect()
  }));
  const rowPadding = Math.max(8, rects[0].rect.height * 0.18);
  const rowRects = rects.filter(({ rect }) => (
    event.clientY >= rect.top - rowPadding && event.clientY <= rect.bottom + rowPadding
  ));

  if (rowRects.length) {
    for (const item of rowRects) {
      if (event.clientX < item.rect.left + item.rect.width / 2) return item.index;
    }
    return rowRects[rowRects.length - 1].index + 1;
  }

  for (const item of rects) {
    if (event.clientY < item.rect.top + item.rect.height / 2) return item.index;
  }
  return cards.length;
}

function getGridInsertReference(event, grid, dragging) {
  const cards = getQuickGridCustomCards(grid).filter((card) => card !== dragging);
  const insertIndex = getGridInsertIndex(event, grid, dragging);
  const addCard = grid.querySelector(".quick-card--add");
  return {
    insertIndex,
    reference: cards[insertIndex] || addCard || null
  };
}

function moveDraggingQuickCard(event, grid, dragging) {
  const { insertIndex, reference } = getGridInsertReference(event, grid, dragging);
  if (insertIndex === activeQuickCardDrag?.slotIndex) return;
  if (reference === dragging || reference === dragging.nextElementSibling) return;
  const previousRects = captureQuickGridRects(grid);
  grid.insertBefore(dragging, reference);
  if (activeQuickCardDrag) activeQuickCardDrag.slotIndex = insertIndex;
  animateQuickGridFrom(grid, previousRects);
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
  moveDraggingQuickCard(event, activeQuickCardDrag.grid, activeQuickCardDrag.card);
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
  if (card.dataset.quickTitle === "排班管理") {
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
      moveDraggingQuickCard(event, grid, dragging);
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
