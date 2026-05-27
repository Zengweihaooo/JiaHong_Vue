import {
  getDoctorStatus,
  getServiceAvailability,
  setDoctorStatusState,
  setServiceAvailabilityState
} from "../../application/controllers/runtimeController.js";
import { applyRuntimeStateToDom, applyServiceStateToDom } from "./runtimeDomSync.js";
import {
  closePopupMenus,
  showToast,
  togglePopupMenu
} from "../ui/interactionPrimitives.js?v=20260527-36";

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

function showDoctorStatusToast(status) {
  if (status === "online") {
    showToast("上线成功", { tone: "success", placement: "home-status" });
    return;
  }
  if (status === "offline") {
    showToast("你已下线", { tone: "offline", placement: "home-status" });
    return;
  }
  showToast("出诊状态已切换", { tone: "info", placement: "home-status" });
}

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
  if (sync) {
    showToast("出诊状态已切换", { tone: "info", placement: "home-status" });
  }
}

export { applyRuntimeStateToDom };

export function changeDoctorStatus(nextStatus, { sync = true } = {}) {
  const previousStatus = getDoctorStatus();
  setDoctorStatusState(nextStatus, { sync }).catch(() => {
    showToast("出诊状态同步失败");
  });
  if (sync && previousStatus !== nextStatus) {
    showDoctorStatusToast(nextStatus);
  }
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
