import { assetUrl } from "../../shared/core.js";

export function renderCheckboxMark() {
  return `<img class="jh-checkbox__mark" src="${assetUrl("assets/figma-home/checkmark.svg")}" alt="" aria-hidden="true" />`;
}

export function renderCheckbox({ label, className = "", labelClassName = "" } = {}) {
  return `
    <span class="jh-checkbox${className ? ` ${className}` : ""}">
      <span class="jh-checkbox__icon" aria-hidden="true">${renderCheckboxMark()}</span>
      ${label ? `<span class="jh-checkbox__label${labelClassName ? ` ${labelClassName}` : ""}">${label}</span>` : ""}
    </span>`;
}

export function renderSwitch({ checked = false, label = "切换开关", className = "" } = {}) {
  return `<button class="jh-switch${checked ? " is-on" : ""}${className ? ` ${className}` : ""}" type="button" aria-label="${label}" aria-pressed="${checked}"></button>`;
}

export function renderButton({ text, tone = "primary", size = "md", className = "", type = "button", disabled = false } = {}) {
  const safeTone = [
    "primary",
    "outline-primary",
    "outline-secondary",
    "block-outline",
    "danger",
    "soft-danger",
    "neutral",
    "text"
  ].includes(tone)
    ? tone
    : "primary";
  const sizeClass = ["sm", "md", "lg"].includes(size) ? ` jh-btn--${size}` : "";
  return `<button class="jh-btn${sizeClass} jh-btn--${safeTone}${className ? ` ${className}` : ""}" type="${type}"${disabled ? " disabled" : ""}>${text}</button>`;
}

export function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function renderDurationChip(variant = "icon", elapsedSeconds = 0) {
  const safeVariant = ["icon", "pill", "plain"].includes(variant) ? variant : "icon";
  const durationText = formatDuration(elapsedSeconds);
  return `
    <span class="jh-duration-chip jh-duration-chip--${safeVariant}" data-duration-timer data-elapsed="${elapsedSeconds}" aria-label="问诊持续时长：${durationText}">
      ${
        safeVariant === "icon"
          ? `<svg class="jh-duration-chip__clock" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path d="M9 3.75V9.08229L12.6818 10.8597" stroke="#E36D6D" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="0.7" y="0.7" width="16.6" height="16.6" rx="8.3" stroke="#E36D6D" stroke-width="1.4"/>
            </svg>`
          : ""
      }
      <strong><span class="jh-duration-chip__prefix">问诊持续时长：</span><span class="jh-duration-chip__value">${durationText}</span></strong>
    </span>`;
}

export function renderLabelTag({ text = "默认标签", tone = "light", size = "sm", weight = "regular", className = "" } = {}) {
  const safeTone = ["dark", "light", "focus"].includes(tone) ? tone : "light";
  const safeSize = ["sm", "md", "lg"].includes(size) ? size : "sm";
  const weightClass = weight === "bold" ? " jh-tag--bold" : "";
  return `<span class="jh-tag jh-tag--${safeTone} jh-tag--${safeSize}${weightClass}${className ? ` ${className}` : ""}">${text}</span>`;
}

export function getDoctorStatusLabel(status = "offline") {
  const labels = {
    online: "在线",
    busy: "忙碌",
    offline: "离线"
  };
  return labels[status] || labels.offline;
}

export function renderStatusBadge(status = "online", className = "", { live = true } = {}) {
  const safeStatus = ["online", "busy", "offline"].includes(status) ? status : "online";
  return `<span class="jh-status-badge jh-status-badge--${safeStatus}${className ? ` ${className}` : ""}"${live ? " data-status-text" : ""}>${getDoctorStatusLabel(safeStatus)}</span>`;
}

export function renderReadTag(status = "unread", className = "") {
  const safeStatus = status === "read" ? "read" : "unread";
  const label = safeStatus === "read" ? "已读" : "未读";
  return `<span class="jh-read-tag jh-read-tag--${safeStatus}${className ? ` ${className}` : ""}">${label}</span>`;
}

export function renderRiskTag({ text = "高", size = "sm", className = "" } = {}) {
  const safeSize = size === "lg" ? "lg" : "sm";
  return `<span class="jh-risk-tag jh-risk-tag--${safeSize}${className ? ` ${className}` : ""}">${text}</span>`;
}
