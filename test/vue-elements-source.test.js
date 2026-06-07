import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue Elements page showcases every shared UI component export", async () => {
  const [elementsView, uiExports] = await Promise.all([
    readFile(new URL("../src/views/ElementsView.vue", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/src/components/index.js", import.meta.url), "utf8")
  ]);

  const sharedComponents = [
    "Avatar",
    "Button",
    "Card",
    "ConsultEntryCard",
    "ConsultInfoCard",
    "DoctorAvatar",
    "DurationChip",
    "EmptyState",
    "FollowUpVoucher",
    "LatestAnnouncementCard",
    "MedicineRiskTip",
    "QuickActionsPanel",
    "ReadTag",
    "RoomPendingWorkspace",
    "ServiceStatusCard",
    "ServiceStatusPanel",
    "StatusBadge",
    "TypeIcon",
    "VideoCallWindow",
    "WaitingStatusCard",
    "WorkspaceShell",
    "WorkspaceSidebar"
  ];

  for (const componentName of sharedComponents) {
    assert.match(uiExports, new RegExp(`\\b${componentName}\\b`));
    assert.match(elementsView, new RegExp(`\\b${componentName}\\b`));
  }

  assert.match(elementsView, /组件来源统一指向 @jiahong\/ui/);
  assert.match(elementsView, /elements-consult-card-pair/);
  assert.match(elementsView, /<ConsultEntryCard variant="blue" \/>/);
  assert.match(elementsView, /<ConsultEntryCard variant="yellow" :has-queue="true" \/>/);
  assert.match(elementsView, /\{ id: "catalog", name: "组件总览", count: "22" \}/);
  assert.match(elementsView, /\{ id: "workspace", name: "工作台", count: "8" \}/);
  assert.match(elementsView, /<ServiceStatusPanel status="online" :services="workspaceServices" density="compact" \/>/);
  assert.match(elementsView, /<LatestAnnouncementCard :announcement="latestAnnouncement" \/>/);
  assert.match(elementsView, /const componentCatalog = \[/);
  assert.equal((elementsView.match(/importName:/g) || []).length, sharedComponents.length);
});
