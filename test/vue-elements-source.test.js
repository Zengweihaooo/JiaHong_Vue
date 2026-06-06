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
    "DurationChip",
    "EmptyState",
    "FollowUpVoucher",
    "MedicineRiskTip",
    "QuickActionsPanel",
    "ReadTag",
    "RoomPendingWorkspace",
    "ServiceStatusCard",
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
  assert.match(elementsView, /\{ id: "catalog", name: "组件总览", count: "19" \}/);
  assert.match(elementsView, /const componentCatalog = \[/);
  assert.equal((elementsView.match(/importName:/g) || []).length, sharedComponents.length);
});
