export const videoPrescriptionSubmitLockSeconds = 10;

export const consultationDurationToneThresholds = {
  warning: 179,
  danger: 600
};

export function getConsultationDurationTone(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  if (safeSeconds >= consultationDurationToneThresholds.danger) return "danger";
  if (safeSeconds >= consultationDurationToneThresholds.warning) return "warning";
  return "normal";
}
