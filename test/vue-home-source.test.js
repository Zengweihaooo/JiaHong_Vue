import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue home consult entry card keeps latest H5 background in shared UI", async () => {
  const [homeDashboard, legacyStyles, consultEntryCard] = await Promise.all([
    readFile(new URL("../src/components/home/HomeDashboard.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/src/components/ConsultEntryCard/ConsultEntryCard.vue", import.meta.url), "utf8")
  ]);

  assert.match(homeDashboard, /ConsultEntryCard/);
  assert.match(consultEntryCard, /class="consult-card__bg"/);
  assert.match(consultEntryCard, /assets\/figma-home\/consult-bg\.png/);
  assert.match(consultEntryCard, /\.consult-card__bg\s*\{/);

  assert.doesNotMatch(legacyStyles, /\.consult-card\s*\{/);
  assert.doesNotMatch(legacyStyles, /\.consult-card__content\s*\{/);
  assert.doesNotMatch(legacyStyles, /\.consult-card__bg\s*\{/);
});
