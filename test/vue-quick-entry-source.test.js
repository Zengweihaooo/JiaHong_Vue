import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue quick entry dialog filters already used entries and keeps elements route entry", async () => {
  const [dialogs, homeDashboard, quickActionsPanel, store] = await Promise.all([
    readFile(new URL("../src/components/common/AppDialogs.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/components/home/HomeDashboard.vue", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/src/components/QuickActionsPanel/QuickActionsPanel.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/stores/app.js", import.meta.url), "utf8")
  ]);

  assert.match(dialogs, /store\.availableQuickEntryOptions/);
  assert.match(dialogs, /quick-entry-dialog__empty/);
  assert.doesNotMatch(dialogs, /v-for="\(option, index\) in store\.quickEntryOptions"/);

  assert.match(homeDashboard, /QuickActionsPanel/);
  assert.match(homeDashboard, /router\.push\("\/elements\/"\)/);
  assert.match(homeDashboard, /@reorder="reorderQuickAction"/);
  assert.match(homeDashboard, /@schedule-punch="store\.showToast\('打卡成功'\)"/);
  assert.match(quickActionsPanel, /quick-card__attention-dot/);
  assert.match(quickActionsPanel, /data-attention/);
  assert.match(quickActionsPanel, /!punchDone\.value && !action\.isAdd && featureOf\(action\) === props\.attentionFeature/);
  assert.match(quickActionsPanel, /data-custom-quick-entry/);
  assert.match(quickActionsPanel, /@dragstart\.stop="startDrag\(index, \$event\)"/);
  assert.match(quickActionsPanel, /emit\('reorder'/);
  assert.match(quickActionsPanel, /emit\('schedule-punch'\)/);
  assert.match(quickActionsPanel, /class="schedule-dialog"/);
  assert.match(quickActionsPanel, /schedule-day-grid/);
  assert.match(quickActionsPanel, /schedule-panel__punch/);
  assert.match(quickActionsPanel, /function punchSchedule/);
  assert.doesNotMatch(quickActionsPanel, /schedule-board/);
  assert.doesNotMatch(quickActionsPanel, /scheduleSlots/);

  assert.match(store, /availableQuickEntryOptions\(state\)/);
  assert.match(store, /isQuickEntryAlreadyUsed\(state\.quickActions, option, state\.quickEntryEditingIndex\)/);
  assert.match(store, /showToast\("该快捷入口已存在"\)/);
  assert.match(store, /reorderQuickAction\(fromIndex, toIndex\)/);
  assert.match(store, /showToast\("已调整快捷入口顺序"\)/);
  assert.doesNotMatch(store, /const maxQuickActionCards = 8/);
});
