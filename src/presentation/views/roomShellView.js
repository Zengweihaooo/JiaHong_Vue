import { assetUrl, getHomeHref } from "../../shared/core.js";
import { renderData, renderRuntime } from "../../application/viewModels/renderViewModel.js?v=20260528-06";
import { renderButton, renderCheckbox, renderStatusBadge, renderSwitch } from "../components/primitives.js";
import { icons } from "../ui/icons.js";

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
            <span>张医生</span>
          </button>
          ${renderUserMenu()}
        </div>
      </div>
    </header>`;
}

export function renderUserMenu() {
  const serviceOrder = ["text", "video", "consult"];
  const orderedServices = renderData.services
    .filter((service) => serviceOrder.includes(service.key))
    .sort((left, right) => serviceOrder.indexOf(left.key) - serviceOrder.indexOf(right.key));
  return `
    <div class="user-menu" role="menu" aria-hidden="true">
      <section class="user-menu-status" aria-label="接诊状态与服务开关">
        <div class="user-menu-status__row">
          <div class="user-menu-status__left">
            <span>出诊状态</span>
            ${renderStatusBadge(renderRuntime.doctorStatus)}
          </div>
          ${renderSwitch({ checked: renderRuntime.doctorStatus !== "offline", label: "切换出诊状态", className: "user-menu-status__switch" })}
        </div>
        <div class="user-menu-services" aria-label="服务类型">
          ${orderedServices
            .map(
              (service) => `
                <button class="user-menu-service${renderRuntime.serviceState[service.key] ? " is-selected" : ""}" type="button" role="checkbox" aria-checked="${Boolean(renderRuntime.serviceState[service.key])}" data-service-key="${service.key}">
                  ${renderCheckbox({ label: service.label, className: "user-menu-service__check", labelClassName: "user-menu-service__label" })}
                </button>`
            )
            .join("")}
        </div>
      </section>
      <div class="user-menu-actions">
        <button class="user-menu__item user-menu__item--settings" type="button" role="menuitem" data-action="账号设置">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 7a7 7 0 0 1 14 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
          </svg>
          <span>账号设置</span>
        </button>
        <span class="user-menu-actions__divider" aria-hidden="true"></span>
        <button class="user-menu__item user-menu__item--logout" type="button" role="menuitem" data-action="退出登录">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2m-3-1 4-4-4-4m4 4H3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
          </svg>
          <span>退出登录</span>
        </button>
      </div>
    </div>`;
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
          <div class="room-user">
            <span class="room-user__divider" aria-hidden="true">
              <img src="${assetUrl("assets/figma-consult/topbar-divider.svg")}" alt="" />
            </span>
            <button class="room-user__body user-menu-trigger" type="button" aria-expanded="false" aria-haspopup="menu">
              <span>张医生</span>
              <span class="room-user__chevron" aria-hidden="true">
                <img src="${assetUrl("assets/figma-consult/chevron-down.svg")}" alt="" />
              </span>
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
