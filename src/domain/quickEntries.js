export const maxQuickActionCards = 8;
export const scheduleQuickEntryTitle = "排班管理";
export const elementsQuickEntryTitle = "组件系统";

const quickEntryFeaturesByTitle = new Map([
  [scheduleQuickEntryTitle, "schedule"],
  ["历史问诊", "history"],
  ["医生佣金条", "commission"],
  ["佣金明细", "commission"],
  [elementsQuickEntryTitle, "elements"]
]);

export function getQuickEntryFeature(entry = {}) {
  if (entry.feature) return entry.feature;
  return quickEntryFeaturesByTitle.get(entry.title) || "";
}
