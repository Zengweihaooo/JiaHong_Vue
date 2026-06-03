export const maxQuickActionCards = 8;
export const scheduleQuickEntryTitle = "排班管理";
export const elementsQuickEntryTitle = "组件系统";

export function getQuickEntryFeature(entry = {}) {
  if (entry.feature) return entry.feature;
  if (entry.title === scheduleQuickEntryTitle) return "schedule";
  if (entry.title === elementsQuickEntryTitle) return "elements";
  return "";
}
