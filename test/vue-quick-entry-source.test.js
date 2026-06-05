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
  assert.match(quickActionsPanel, /quick-card__attention-dot/);
  assert.match(quickActionsPanel, /data-attention/);

  assert.match(store, /availableQuickEntryOptions\(state\)/);
  assert.match(store, /isQuickEntryAlreadyUsed\(state\.quickActions, option, state\.quickEntryEditingIndex\)/);
  assert.match(store, /showToast\("该快捷入口已存在"\)/);
  assert.doesNotMatch(store, /const maxQuickActionCards = 8/);
});
