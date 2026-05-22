import {
  getDoctorStatus,
  getServiceAvailability,
  getServiceAvailabilityEntries,
  getWaitingQueueState,
  setDoctorStatusState,
  setServiceAvailabilityState
} from "../../application/controllers/runtimeController.js";
import { getDoctorStatusLabel } from "../components/primitives.js";
import {
  closePopupMenus,
  showToast,
  togglePopupMenu
} from "../ui/interactionPrimitives.js";

const userMenuConfig = {
  menuSelector: ".user-menu",
  containerSelector: ".user-chip, .room-user",
  triggerSelector: ".user-menu-trigger"
};

const doctorStatusMenuConfig = {
  menuSelector: ".doctor-status-menu",
  containerSelector: ".doctor-status-control",
  triggerSelector: ".doctor-status-trigger"
};

export function isServiceAvailable(serviceKey) {
  return getServiceAvailability(serviceKey);
}

export function setServiceTileState(tile, enabled, { sync = true } = {}) {
  const serviceKey = tile.dataset.serviceKey;
  if (serviceKey) {
    setServiceAvailabilityState(serviceKey, enabled, { sync }).catch(() => {
      showToast("服务状态同步失败");
    });
  }
  tile.setAttribute("aria-checked", String(enabled));
  tile.classList.toggle("is-selected", enabled);
  if (serviceKey) applyServiceStateToDom(serviceKey, enabled);
}

function applyServiceStateToDom(serviceKey, enabled) {
  document.querySelectorAll(`[data-service-key="${serviceKey}"]`).forEach((node) => {
    node.setAttribute("aria-checked", String(enabled));
    node.classList.toggle("is-selected", enabled);
  });
}

export function applyRuntimeStateToDom() {
  const status = getDoctorStatus();
  const statusLabel = getDoctorStatusLabel(status);

  document.querySelectorAll("[data-status-text]").forEach((node) => {
    node.textContent = statusLabel;
    node.classList.remove("jh-status-badge--online", "jh-status-badge--busy", "jh-status-badge--offline");
    node.classList.add(`jh-status-badge--${status}`);
  });

  document.querySelectorAll(".room-status").forEach((button) => {
    button.setAttribute("aria-label", `出诊状态：${statusLabel}，展开状态菜单`);
  });

  document.querySelectorAll(".doctor-status-trigger").forEach((button) => {
    button.setAttribute("aria-label", `出诊状态：${statusLabel}，展开状态菜单`);
  });

  document.querySelectorAll(".doctor-status-menu__item").forEach((item) => {
    const active = item.dataset.doctorStatus === status;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-checked", String(active));
  });

  document.querySelectorAll(".jh-switch").forEach((button) => {
    const enabled = status !== "offline";
    button.classList.toggle("is-on", enabled);
    button.setAttribute("aria-pressed", String(enabled));
  });

  const waitingQueue = getWaitingQueueState();
  document.querySelectorAll("[data-waiting-total]").forEach((node) => {
    node.textContent = String(waitingQueue.total);
  });
  document.querySelectorAll("[data-waiting-type]").forEach((node) => {
    node.textContent = String(waitingQueue.byType[node.dataset.waitingType] ?? 0);
  });

  getServiceAvailabilityEntries().forEach(([serviceKey, enabled]) => {
    applyServiceStateToDom(serviceKey, enabled);
  });
}

export function changeDoctorStatus(nextStatus, { sync = true } = {}) {
  setDoctorStatusState(nextStatus, { sync }).catch(() => {
    showToast("出诊状态同步失败");
  });
}

export function toggleDoctorOnlineStatus() {
  changeDoctorStatus(getDoctorStatus() === "offline" ? "online" : "offline");
}

function setSidebarCollapsed(collapsed) {
  const shell = document.querySelector(".app-shell");
  shell?.classList.toggle("is-sidebar-collapsed", collapsed);
  shell?.classList.toggle("is-sidebar-expanded", !collapsed);
  document.querySelector(".sidebar-toggle")?.setAttribute("aria-expanded", String(!collapsed));
  document.querySelector(".sidebar-toggle")?.setAttribute("aria-label", collapsed ? "展开主菜单" : "收起主菜单");
}

export function bindSidebarToggle() {
  document.querySelectorAll(".sidebar-toggle").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const shell = button.closest(".app-shell");
      const sidebarWidth = document.querySelector(".sidebar")?.getBoundingClientRect().width || 0;
      const isCollapsed = shell?.classList.contains("is-sidebar-collapsed") || sidebarWidth <= 80;
      setSidebarCollapsed(!isCollapsed);
    });
  });
}

export function bindSidebarScrollIsolation() {
  document.querySelectorAll(".sidebar").forEach((sidebar) => {
    if (sidebar.dataset.scrollBound === "true") return;
    sidebar.dataset.scrollBound = "true";
    sidebar.addEventListener(
      "wheel",
      (event) => {
        const content = sidebar.querySelector(".sidebar__content");
        if (!content) return;
        if (content.scrollHeight > content.clientHeight) {
          content.scrollTop += event.deltaY;
        }
        event.preventDefault();
        event.stopPropagation();
      },
      { passive: false }
    );
  });
}

function toggleUserMenu(trigger, forceOpen) {
  togglePopupMenu(trigger, userMenuConfig, forceOpen);
}

export function closeUserMenus() {
  closePopupMenus(userMenuConfig);
}

export function closeDoctorStatusMenus() {
  closePopupMenus(doctorStatusMenuConfig);
}

function toggleDoctorStatusMenu(trigger, forceOpen) {
  togglePopupMenu(trigger, doctorStatusMenuConfig, forceOpen);
}

export function bindDoctorStatusMenus() {
  if (bindDoctorStatusMenus.bound) return;
  bindDoctorStatusMenus.bound = true;

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".doctor-status-trigger");
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      closeUserMenus();
      toggleDoctorStatusMenu(trigger);
      return;
    }

    const item = event.target.closest(".doctor-status-menu__item");
    if (item) {
      event.preventDefault();
      event.stopPropagation();
      changeDoctorStatus(item.dataset.doctorStatus);
      closeDoctorStatusMenus();
      return;
    }

    if (!event.target.closest(".doctor-status-menu")) {
      closeDoctorStatusMenus();
    }
  });
}

export function bindUserMenus() {
  if (bindUserMenus.bound) return;
  bindUserMenus.bound = true;

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".user-menu-trigger");
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      toggleUserMenu(trigger);
      return;
    }

    const item = event.target.closest(".user-menu__item");
    if (item) {
      event.preventDefault();
      event.stopPropagation();
      closeUserMenus();
      showToast(item.dataset.action || item.textContent.trim());
      return;
    }

    if (!event.target.closest(".user-menu")) {
      closeUserMenus();
    }
  });
}
