const toastToneClasses = ["toast--success", "toast--offline", "toast--info", "toast--warning"];
const toastPlacementClasses = ["toast--home-status"];

const toastToneConfig = {
  success: { icon: "✓" },
  offline: { icon: "!" },
  info: { icon: "i" },
  warning: { icon: "!" }
};

function setHomeStatusToastPosition(toast) {
  const consultCard = document.querySelector(".consult-card");
  if (!consultCard) return false;
  const rect = consultCard.getBoundingClientRect();
  toast.style.setProperty("--toast-home-left", `${rect.left + rect.width / 2}px`);
  toast.style.setProperty("--toast-home-top", `${rect.top}px`);
  return true;
}

export function showToast(message, options = {}) {
  const toast = document.querySelector(".toast");
  if (!toast) return;
  const { tone = "default", placement = "default", duration = 1500 } = options;
  const toneConfig = toastToneConfig[tone];
  window.clearTimeout(showToast.timer);
  toast.textContent = "";
  toast.classList.remove(...toastToneClasses);
  toast.classList.remove(...toastPlacementClasses);
  if (toneConfig) {
    const icon = document.createElement("span");
    icon.className = "toast__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = toneConfig.icon;
    toast.append(icon);
    toast.classList.add(`toast--${tone}`);
  }
  const label = document.createElement("span");
  label.className = "toast__label";
  label.textContent = message;
  toast.append(label);
  if (placement === "home-status" && setHomeStatusToastPosition(toast)) {
    toast.classList.add("toast--home-status");
  }
  toast.setAttribute("role", tone === "warning" || tone === "offline" ? "alert" : "status");
  toast.classList.add("is-visible");
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, duration);
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
