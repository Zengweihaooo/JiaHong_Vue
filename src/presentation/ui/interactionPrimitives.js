export function showToast(message) {
  const toast = document.querySelector(".toast");
  if (!toast) return;
  window.clearTimeout(showToast.timer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1500);
}

export function stopEvent(event) {
  event?.preventDefault();
  event?.stopPropagation();
}

export function setOverlayOpen(overlayOrSelector, open, { focusSelector = "" } = {}) {
  const overlay =
    typeof overlayOrSelector === "string" ? document.querySelector(overlayOrSelector) : overlayOrSelector;
  if (!overlay) return null;
  overlay.classList.toggle("is-open", open);
  overlay.setAttribute("aria-hidden", String(!open));
  if (open && focusSelector) {
    overlay.querySelector(focusSelector)?.focus();
  }
  return overlay;
}

export function openOverlay(selector, focusSelector, event) {
  stopEvent(event);
  return setOverlayOpen(selector, true, { focusSelector });
}

export function closeOverlay(selector, event) {
  stopEvent(event);
  return setOverlayOpen(selector, false);
}

export function bindOverlayDismiss(overlay, { close, closeSelector, dialogSelector } = {}) {
  if (!overlay || overlay.dataset.overlayBound === "true") return;
  overlay.dataset.overlayBound = "true";
  if (closeSelector) {
    overlay.querySelector(closeSelector)?.addEventListener("click", close);
  }
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close(event);
  });
  if (dialogSelector) {
    overlay.querySelector(dialogSelector)?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }
}

export function setPopupMenuOpen(menu, open, containerSelector, triggerSelector) {
  menu.classList.toggle("is-open", open);
  menu.setAttribute("aria-hidden", String(!open));
  menu.closest(containerSelector)?.querySelector(triggerSelector)?.setAttribute("aria-expanded", String(open));
}

export function closePopupMenus({ menuSelector, containerSelector, triggerSelector }) {
  document.querySelectorAll(`${menuSelector}.is-open`).forEach((menu) => {
    setPopupMenuOpen(menu, false, containerSelector, triggerSelector);
  });
}

export function togglePopupMenu(trigger, { menuSelector, containerSelector, triggerSelector }, forceOpen) {
  const menu = trigger.closest(containerSelector)?.querySelector(menuSelector);
  if (!menu) return;
  const isOpen = menu.classList.contains("is-open");
  const nextOpen = typeof forceOpen === "boolean" ? forceOpen : !isOpen;
  document.querySelectorAll(`${menuSelector}.is-open`).forEach((node) => {
    if (node !== menu) {
      setPopupMenuOpen(node, false, containerSelector, triggerSelector);
    }
  });
  setPopupMenuOpen(menu, nextOpen, containerSelector, triggerSelector);
}
