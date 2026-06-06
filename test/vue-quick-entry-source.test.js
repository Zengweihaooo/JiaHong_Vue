import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue quick entry dialog filters already used entries and keeps elements route entry", async () => {
  const [dialogs, homeDashboard, quickActionsPanel, store, uiStyles, legacyStyles] = await Promise.all([
    readFile(new URL("../src/components/common/AppDialogs.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/components/home/HomeDashboard.vue", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/src/components/QuickActionsPanel/QuickActionsPanel.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/stores/app.js", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8")
  ]);

  assert.match(dialogs, /store\.availableQuickEntryOptions/);
  assert.match(dialogs, /quick-entry-dialog__empty/);
  assert.match(dialogs, /quick-icon--menu-\$\{option\.icon\}/);
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

  assert.match(uiStyles, /^\.icon-box\s*\{/m);
  assert.match(uiStyles, /^\.quick-icon\s*\{/m);
  assert.match(uiStyles, /^\.quick-icon--schedule \.quick-icon__base\s*\{/m);
  assert.match(uiStyles, /^\.quick-icon--menu-user\s*\{/m);
  assert.match(uiStyles, /@jiahong\/ui\/assets\/figma-home\/user\.svg/);
  assert.doesNotMatch(legacyStyles, /^\.icon-box\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.quick-icon\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.quick-icon--menu-user\s*\{/m);
});

test("Vue quick schedule panel keeps latest H5 dialog styles in shared UI", async () => {
  const [homeDashboard, legacyStyles, quickActionsPanel, uiStyles] = await Promise.all([
    readFile(new URL("../src/components/home/HomeDashboard.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/src/components/QuickActionsPanel/QuickActionsPanel.vue", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8")
  ]);

  assert.match(homeDashboard, /@schedule-detail="store\.showToast\('排班详情暂未开放'\)"/);
  assert.match(quickActionsPanel, /data-schedule-active-status/);
  assert.match(quickActionsPanel, /schedule-day-block__status--done/);
  assert.doesNotMatch(legacyStyles, /schedule-board|schedule-panel__tabs/);

  for (const styles of [quickActionsPanel, uiStyles]) {
    assert.match(styles, /\.schedule-dialog\s*\{[\s\S]*?width: min\(706px, calc\(100vw - 48px\)\);[\s\S]*?height: min\(715px, calc\(100vh - 48px\)\);/);
    assert.match(styles, /\.schedule-panel__header\s*\{[\s\S]*?flex: 0 0 48px;[\s\S]*?padding: 12px 16px;/);
    assert.match(styles, /\.schedule-panel__summary\s*\{[\s\S]*?flex: 0 0 52px;[\s\S]*?padding: 20px 24px 0;/);
    assert.match(styles, /\.schedule-day-grid\s*\{[\s\S]*?width: 658px;[\s\S]*?height: 579px;/);
    assert.match(styles, /\.schedule-day-grid__hours\s*\{[\s\S]*?grid-template-rows: repeat\(12, 44px\);/);
    assert.match(styles, /\.schedule-day-block\s*\{[\s\S]*?top: calc\(var\(--start-hour\) \* 44px\);[\s\S]*?height: calc\(var\(--duration-hours\) \* 44px\);/);
    assert.match(styles, /\.schedule-day-grid__missed-callout\s*\{[\s\S]*?top: 300px;/);
    assert.match(styles, /\.schedule-day-grid__current-line\s*\{[\s\S]*?top: 352px;[\s\S]*?background: #e12727;/);
  }

  assert.doesNotMatch(legacyStyles, /^\.schedule-dialog\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.schedule-panel\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.schedule-day-grid\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.schedule-day-block\s*\{/m);
});

test("legacy quick entry bindings open the H5 schedule dialog and update punch state", async () => {
  const bindings = await readFile(
    new URL("../src/presentation/interactions/homeQuickEntryBindings.js", import.meta.url),
    "utf8"
  );
  const render = await readFile(new URL("../src/presentation/render.js", import.meta.url), "utf8");
  const homeView = await readFile(new URL("../src/presentation/views/homeView.js", import.meta.url), "utf8");

  assert.match(render, /renderScheduleDialog/);
  assert.match(render, /\$\{renderScheduleDialog\(\)\}/);
  assert.match(homeView, /export \{ renderScheduleDialog \}/);
  assert.doesNotMatch(homeView, /renderSchedulePanel\(\)/);

  assert.match(bindings, /openOverlay\("\.schedule-overlay", "\.schedule-panel__back", event\)/);
  assert.match(bindings, /bindOverlayDismiss\(scheduleOverlay/);
  assert.match(bindings, /button\.classList\.add\("schedule-panel__punch--done"\)/);
  assert.match(bindings, /data-schedule-punched-count/);
  assert.match(bindings, /quick-card\[data-attention="unpunched-schedule"\]/);
  assert.match(bindings, /showToast\("打卡成功"\)/);
  assert.match(bindings, /quickCardControlEventUntil/);
});
