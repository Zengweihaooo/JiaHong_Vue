export const maxQuickActionCards = 8;
export const scheduleQuickEntryTitle = "排班管理";

export function getQuickEntryFeature(entry = {}) {
  if (entry.feature) return entry.feature;
  return entry.title === scheduleQuickEntryTitle ? "schedule" : "";
}
