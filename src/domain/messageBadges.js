export const dismissedBadgeStorageKey = "jh.dismissedMessageBadges.v2";

export function getMessageBadgeKey(recordId = "") {
  return recordId ? `record:${recordId}` : "";
}

export function readDismissedMessageBadges() {
  if (typeof window === "undefined") return new Set();
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(dismissedBadgeStorageKey) || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function rememberDismissedMessageBadge(badgeKey, badges = readDismissedMessageBadges()) {
  if (!badgeKey) return badges;
  const next = badges instanceof Set ? new Set(badges) : new Set();
  next.add(badgeKey);
  try {
    window.sessionStorage.setItem(dismissedBadgeStorageKey, JSON.stringify(Array.from(next)));
  } catch {
    // Runtime storage is a progressive enhancement in browser contexts.
  }
  return next;
}

export function isMessageBadgeDismissed(recordId, badges = readDismissedMessageBadges()) {
  return badges.has(getMessageBadgeKey(recordId));
}
