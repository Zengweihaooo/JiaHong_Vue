import { appView, getSessionIdParam } from "../../shared/core.js";
import { getMessageListRecords } from "../../domain/consultationQueue.js";
import { renderData, renderRuntime } from "../../application/viewModels/renderViewModel.js";
import {
  getActiveVideoConsultationRecordId,
  getDefaultEndedRenderRecord,
  getDefaultOngoingRenderRecord
} from "./renderRecordSelectors.js";

function renderRoomFilterButton({ text, type, state, active = false, wide = false }) {
  const dataAttr = type ? `data-filter-type="${type}"` : `data-filter-state="${state}"`;
  return `<button class="jh-btn jh-btn--md jh-btn--outline-secondary room-tag${wide ? " room-tag--wide" : ""}${active ? " is-active" : ""}" type="button" ${dataAttr}>${text}</button>`;
}

function getInitialActiveRecordId() {
  return (
    getSessionIdParam() ||
    (appView === "history" ? getDefaultEndedRenderRecord()?.id : getDefaultOngoingRenderRecord(appView)?.id) ||
    ""
  );
}

export function renderRoomSidebar() {
  const activeRecord = getInitialActiveRecordId();
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
