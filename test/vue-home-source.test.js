import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue home consult entry card keeps latest H5 background in shared UI", async () => {
  const [app, homeDashboard, legacyStyles, uiStyles, consultEntryCard, serviceStatusCard] = await Promise.all([
    readFile(new URL("../src/App.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/components/home/HomeDashboard.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/src/components/ConsultEntryCard/ConsultEntryCard.vue", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/src/components/ServiceStatusCard/ServiceStatusCard.vue", import.meta.url), "utf8")
  ]);

  assert.match(homeDashboard, /ConsultEntryCard/);
  assert.match(homeDashboard, /const consultEntryVariant = computed/);
  assert.match(homeDashboard, /store\.waitingQueue\.total > 0 \? "yellow" : "blue"/);
  assert.match(consultEntryCard, /class="consult-card__bg"/);
  assert.match(consultEntryCard, /variant:/);
  assert.match(consultEntryCard, /consult-card--\$\{resolvedVariant\}/);
  assert.match(consultEntryCard, /consult-card--yellow/);
  assert.match(consultEntryCard, /assets\/figma-home\/consult-bg\.png/);
  assert.match(consultEntryCard, /\.consult-card__bg\s*\{/);
  assert.match(consultEntryCard, /height: 100%;\n  min-height: 240px;/);
  assert.match(uiStyles, /\.consult-card__bg\s*\{/);
  assert.match(uiStyles, /\.consult-card--yellow/);

  assert.doesNotMatch(legacyStyles, /\.consult-card\s*\{/);
  assert.doesNotMatch(legacyStyles, /\.consult-card__content\s*\{/);
  assert.doesNotMatch(legacyStyles, /\.consult-card__bg\s*\{/);

  assert.match(serviceStatusCard, /\.service-tile \.jh-checkbox__label\s*\{[\s\S]*white-space: nowrap;/);
  assert.match(serviceStatusCard, /word-break: keep-all/);
  assert.match(legacyStyles, /\.service-tile \.jh-checkbox__label\s*\{[\s\S]*white-space: nowrap;/);
  assert.match(app, /store\.refreshRealtime\(\)\.catch\(\(\) => \{\}\)/);
});
