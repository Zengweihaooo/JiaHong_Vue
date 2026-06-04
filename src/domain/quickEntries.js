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

export function getQuickEntryIdentity(entry = {}) {
  const feature = getQuickEntryFeature(entry);
  if (feature) return `feature:${feature}`;
  const title = String(entry.title || "").trim();
  return title ? `title:${title}` : "";
}

export function getUsedQuickEntryIdentities(entries = [], excludedIndex = -1) {
  return new Set(
    entries
      .filter((entry, index) => !entry?.isAdd && index !== excludedIndex)
      .map(getQuickEntryIdentity)
      .filter(Boolean)
  );
}

export function isQuickEntryAlreadyUsed(entries = [], option = {}, excludedIndex = -1) {
  const identity = getQuickEntryIdentity(option);
  return Boolean(identity && getUsedQuickEntryIdentities(entries, excludedIndex).has(identity));
}
