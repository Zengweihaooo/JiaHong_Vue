import { assetUrl, getHomeHref } from "../../shared/core.js";
import { renderData, renderRuntime } from "../../application/viewModels/renderViewModel.js";
import { getDoctorStatusLabel, renderButton, renderCheckbox, renderStatusBadge } from "../components/primitives.js";
import { icons } from "../ui/icons.js";

export function renderDoctorStatusMenu() {
  const options = [
    { value: "online", label: "在线" },
    { value: "busy", label: "忙碌" },
    { value: "offline", label: "离线" }
  ];
  return `
    <div class="doctor-status-menu" role="menu" aria-hidden="true">
      ${options
        .map(
          (option) => `
            <button
              class="doctor-status-menu__item${renderRuntime.doctorStatus === option.value ? " is-active" : ""}"
              type="button"
              role="menuitemradio"
              aria-checked="${renderRuntime.doctorStatus === option.value}"
              data-doctor-status="${option.value}"
            >
              ${renderStatusBadge(option.value, "", { live: false })}
            </button>`
        )
        .join("")}
    </div>`;
}

export function renderMenu() {
  return renderData.menuGroups
    .map(
      (group) => `
        <div class="menu-section">${group.title}</div>
        ${group.items
          .map(
            (item) => `
              <button class="menu-item${item.active ? " is-active" : ""}" type="button" data-menu="${item.label}">
                ${icons[item.icon]}
                <span>${item.label}</span>
              </button>`
          )
          .join("")}`
    )
    .join("");
}

export function renderSidebar() {
  return `
    <aside class="sidebar" aria-label="主菜单">
      <div class="sidebar__brand">${icons.logo}</div>
      <nav class="sidebar__content">${renderMenu()}</nav>
      <div class="sidebar__footer">
        <button class="sidebar-toggle" type="button" aria-label="收起主菜单" aria-expanded="true">
          ${icons.menu}
        </button>
      </div>
    </aside>`;
}

export function renderTopbar() {
  return `
    <header class="topbar">
      <div class="topbar__left"></div>
      <div class="topbar__right">
        <div class="certificate">
          <span>证书到期时间</span>
          <span>2027-01-15</span>
        </div>
        <div class="topbar__actions">
          ${renderButton({ text: "在线客服", tone: "primary", size: "md" })}
          ${renderButton({ text: "医生招聘", tone: "outline-secondary", size: "md" })}
        </div>
        <div class="user-chip">
          <button class="user-chip__body user-menu-trigger" type="button" aria-expanded="false" aria-haspopup="menu">
            <span class="avatar" aria-hidden="true">
              <img src="${assetUrl("assets/figma-home/avatar-source.png")}" alt="" />
            </span>
            <span>张医生</span>
          </button>
          ${renderUserMenu()}
        </div>
      </div>
    </header>`;
}

export function renderUserMenu() {
  return `
    <div class="user-menu" role="menu" aria-hidden="true">
      <button class="user-menu__item" type="button" role="menuitem" data-action="个人中心">个人中心</button>
      <button class="user-menu__item" type="button" role="menuitem" data-action="账号安全">账号安全</button>
      <button class="user-menu__item" type="button" role="menuitem" data-action="消息通知">消息通知</button>
      <div class="user-menu__divider"></div>
      <button class="user-menu__item user-menu__item--danger" type="button" role="menuitem" data-action="退出登录">退出登录</button>
    </div>`;
}

export function renderRoomCheckbox(label) {
  return renderCheckbox({ label, className: "room-check", labelClassName: "room-check__label" });
}

function getOrderedRoomServices() {
  const order = ["video", "text"];
  return renderData.services.filter((service) => order.includes(service.key)).sort((left, right) => {
    const leftIndex = order.indexOf(left.key);
    const rightIndex = order.indexOf(right.key);
    return (leftIndex === -1 ? order.length : leftIndex) - (rightIndex === -1 ? order.length : rightIndex);
  });
}

function renderRoomServiceSwitches() {
  return getOrderedRoomServices()
    .map(
      (service) => `
        <button
          class="room-service-check${renderRuntime.serviceState[service.key] ? " is-selected" : ""}"
          type="button"
          role="checkbox"
          aria-checked="${Boolean(renderRuntime.serviceState[service.key])}"
          data-service-key="${service.key}"
        >
          ${renderRoomCheckbox(service.label)}
        </button>`
    )
    .join("");
}

export function renderRoomTopbar() {
  return `
    <header class="room-topbar">
      <div class="room-topbar__inner">
        <a class="jh-btn jh-btn--md jh-btn--neutral jh-btn--icon room-back-btn" href="${getHomeHref()}" aria-label="返回首页">
          <img src="${assetUrl("assets/figma-consult/back.svg")}" alt="" />
          <span>返回首页</span>
        </a>
        <div class="room-topbar__right">
          ${renderButton({ text: "在线客服", tone: "primary", size: "md", className: "room-service-btn" })}
          <div class="doctor-status-control room-status-control">
            <button class="room-status doctor-status-trigger" type="button" aria-label="出诊状态：${getDoctorStatusLabel()}，展开状态菜单" aria-expanded="false" aria-haspopup="menu">
              ${renderStatusBadge(renderRuntime.doctorStatus, "room-status__badge")}
              <span class="room-status__chevron doctor-status-trigger__chevron" aria-hidden="true">
                <img src="${assetUrl("assets/figma-consult/chevron-down.svg")}" alt="" />
              </span>
            </button>
            ${renderDoctorStatusMenu()}
          </div>
          <div class="room-service-switches" aria-label="服务类型">
            ${renderRoomServiceSwitches()}
          </div>
          <div class="room-user">
            <span class="room-user__divider" aria-hidden="true">
              <img src="${assetUrl("assets/figma-consult/topbar-divider.svg")}" alt="" />
            </span>
            <button class="room-user__body user-menu-trigger" type="button" aria-expanded="false" aria-haspopup="menu">
              <span class="avatar" aria-hidden="true">
                <img src="${assetUrl("assets/figma-consult/avatar-source.png")}" alt="" />
              </span>
              <span>张医生</span>
            </button>
            ${renderUserMenu()}
          </div>
        </div>
      </div>
    </header>`;
}

export function renderRoomMain() {
  return `
    <main class="room-main">
      <section class="room-card" aria-label="候诊室">
        ${renderButton({ text: "刷新列表", tone: "outline-secondary", size: "md", className: "room-refresh" })}
        <div class="room-empty">
          <img class="room-empty__icon" src="${assetUrl("assets/room-empty.svg")}" alt="" aria-hidden="true" />
          <div class="room-empty__copy">
            <h2>暂无待接诊订单</h2>
            <p>保持在线后，系统将自动接收新的图文或视频问诊</p>
          </div>
        </div>
      </section>
    </main>`;
}
