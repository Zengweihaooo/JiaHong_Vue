import { maxQuickActionCards } from "../../domain/quickEntries.js";
import { renderQuickCardMarkup } from "../components/quickEntryCards.js";

export const quickGridAnimationMs = 280;

export function shouldReduceMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function getQuickGridCards(grid) {
  return Array.from(grid.querySelectorAll(".quick-card"));
}

export function getQuickGridCustomCards(grid) {
  return Array.from(grid.querySelectorAll(".quick-card--custom"));
}

export function setQuickCardEditControlsState(scope, editing) {
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

export function getQuickActionCount(grid = document) {
  return grid.querySelectorAll(".quick-card:not(.quick-card--add)").length;
}

export function ensureQuickAddCard(grid) {
  const addCard = grid.querySelector(".quick-card--add");
  const shouldShowAdd = getQuickActionCount(grid) < maxQuickActionCards;
  if (shouldShowAdd && !addCard) {
    grid.insertAdjacentHTML("beforeend", renderQuickCardMarkup({ isAdd: true }));
  } else if (!shouldShowAdd) {
    addCard?.remove();
  }
}

export function addCustomQuickCardToGrid(grid, option) {
  if (!grid) return { ok: false, reason: "missing-grid" };
  if (getQuickActionCount(grid) >= maxQuickActionCards) {
    return { ok: false, reason: "limit", limit: maxQuickActionCards };
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
  return { ok: true };
}

export function replaceQuickCard(card, option) {
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

export function removeCustomQuickCardWithMotion(card) {
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

export function moveDraggingQuickCard(event, grid, dragging, activeDrag = null) {
  const { insertIndex, reference } = getGridInsertReference(event, grid, dragging);
  if (insertIndex === activeDrag?.slotIndex) return;
  if (reference === dragging || reference === dragging.nextElementSibling) return;
  const previousRects = captureQuickGridRects(grid);
  grid.insertBefore(dragging, reference);
  if (activeDrag) activeDrag.slotIndex = insertIndex;
  animateQuickGridFrom(grid, previousRects);
}
