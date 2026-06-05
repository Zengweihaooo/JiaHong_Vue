export const consultationDurationToneThresholds = {
  warning: 179,
  danger: 600
};

export function formatDuration(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function durationTone(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  if (safeSeconds >= consultationDurationToneThresholds.danger) return "danger";
  if (safeSeconds >= consultationDurationToneThresholds.warning) return "warning";
  return "normal";
}

export function doctorStatusLabel(status = "offline") {
  return {
    online: "在线",
    busy: "忙碌",
    offline: "离线"
  }[status] || "离线";
}

export function consultationTypeLabel(type = "consult") {
  return {
    video: "视频",
    text: "图文",
    consult: "咨询"
  }[type] || "咨询";
}
