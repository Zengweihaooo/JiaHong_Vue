import { assetUrl, appView, getHomeHref, getSessionIdParam } from "../../shared/core.js";
import { getMessageListRecords } from "../../domain/consultationQueue.js";
import { renderData, renderRuntime } from "../../application/viewModels/renderViewModel.js";
import { getDoctorStatusLabel, renderButton, renderCheckbox, renderStatusBadge } from "../components/primitives.js";
import { icons } from "../ui/icons.js";
import { getActiveVideoConsultationRecordId, getDefaultEndedRenderRecord, getDefaultOngoingRenderRecord } from "./renderRecordSelectors.js";

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

export function renderRoomFilterButton({ text, type, state, active = false, wide = false }) {
  const dataAttr = type ? `data-filter-type="${type}"` : `data-filter-state="${state}"`;
  return `<button class="jh-btn jh-btn--md jh-btn--outline-secondary room-tag${wide ? " room-tag--wide" : ""}${active ? " is-active" : ""}" type="button" ${dataAttr}>${text}</button>`;
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

export function renderRoomSidebar() {
  const activeRecord =
    getSessionIdParam() ||
    (appView === "history" ? getDefaultEndedRenderRecord()?.id : getDefaultOngoingRenderRecord(appView)?.id) ||
    "";
  const initialState = appView === "history" ? "ended" : "ongoing";
  return `
    <aside class="room-sidebar" aria-label="问诊消息栏">
      <div class="room-sidebar__section room-sidebar__section--head">
        <div class="room-title-row">
          <h1>问诊室</h1>
          <div class="room-waiting">
            <span>待接诊</span>
            <strong data-waiting-total>${renderRuntime.waitingQueue.total}</strong>
          </div>
        </div>
      </div>
      <div class="room-sidebar__section room-sidebar__section--filters">
        <div class="room-tags room-tags--type">
          ${renderRoomFilterButton({ text: "全部", type: "all", active: true })}
          ${renderRoomFilterButton({ text: "图文", type: "text" })}
          ${renderRoomFilterButton({ text: "视频", type: "video" })}
          ${renderRoomFilterButton({ text: "咨询", type: "consult" })}
        </div>
        <div class="room-tags room-tags--state">
          ${renderRoomFilterButton({ text: "进行中", state: "ongoing", active: initialState === "ongoing", wide: true })}
          ${renderRoomFilterButton({ text: "已结束", state: "ended", active: initialState === "ended", wide: true })}
        </div>
      </div>
      <div class="message-list" aria-label="会话列表" data-filter-type="all" data-filter-state="${initialState}">
        ${renderMessageList({ state: initialState, activeRecord })}
      </div>
    </aside>`;
}

export function renderMessageList({ type = "all", state = "ongoing", activeRecord = "" } = {}) {
  const activeVideoRecordId = getActiveVideoConsultationRecordId(activeRecord);
  return getMessageListRecords(renderData.consultationRecords, { type, state })
    .map((record, index) => renderMessageItem(record, record.id === activeRecord, index, activeVideoRecordId))
    .join("");
}

export function renderMessageItem(record, active, index = 0, activeVideoRecordId = "") {
  const badgeKey = renderRuntime.getMessageBadgeKey(record.id);
  const unreadCount = Number(record.unreadCount ?? record.badge ?? 0);
  const showBadge = unreadCount > 0 && !renderRuntime.isMessageBadgeDismissed(record.id);
  const videoLocked =
    !active && record.type === "video" && record.state === "ongoing" && activeVideoRecordId && record.id !== activeVideoRecordId;
  const lockedAttrs = videoLocked
    ? ` aria-disabled="true" data-video-locked="true" title="当前视频问诊未结束，暂不可进入新的视频问诊"`
    : "";
  return `
    <button class="message-item${active ? " is-active" : ""}${videoLocked ? " is-video-locked" : ""}" type="button" data-record-id="${record.id}" data-target-view="${record.targetView || ""}" data-record-state="${record.state}" data-badge-key="${badgeKey}"${lockedAttrs}>
      <span class="message-item__stripe" aria-hidden="true"></span>
      <span class="message-item__body">
        <span class="message-item__meta">
          <span class="message-item__type message-item__type--${record.type}">${record.typeLabel}</span>
          <span class="message-item__time">${record.time}</span>
        </span>
        <span class="message-item__title">${record.title}</span>
        <span class="message-item__preview">${record.preview}</span>
        ${videoLocked ? `<span class="message-item__lock-hint">请先结束当前视频问诊</span>` : ""}
      </span>
      ${showBadge ? `<span class="message-item__badge">${unreadCount}</span>` : ""}
    </button>`;
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
