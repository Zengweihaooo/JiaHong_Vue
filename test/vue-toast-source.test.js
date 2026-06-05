import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue toast uses the latest H5 shared UI styles", async () => {
  const [dialogs, uiStyles, legacyStyles] = await Promise.all([
    readFile(new URL("../src/components/common/AppDialogs.vue", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8")
  ]);

  assert.match(dialogs, /class="\[\s*'toast'/);
  assert.match(dialogs, /toastToneClass/);
  assert.match(dialogs, /toast--home-status/);
  assert.match(dialogs, /class="toast__label"/);

  assert.match(uiStyles, /\.toast\s*\{[\s\S]*?top: 24px;[\s\S]*?left: calc\(var\(--sidebar-width\) \+ \(100vw - var\(--sidebar-width\)\) \/ 2\);[\s\S]*?z-index: 80;/);
  assert.match(uiStyles, /\.toast\s*\{[\s\S]*?background: #eef6ff;[\s\S]*?font-weight: 700;[\s\S]*?transform: translate\(-50%, -8px\);/);
  assert.match(uiStyles, /\.toast__label\s*\{[\s\S]*?min-width: 0;[\s\S]*?white-space: normal;/);
  assert.match(uiStyles, /\.toast--home-status\s*\{[\s\S]*?width: auto;[\s\S]*?max-width: min\(560px, calc\(100vw - var\(--sidebar-width\) - 48px\)\);/);
  assert.match(uiStyles, /\.toast--success\s*\{[\s\S]*?background: #edfff5;/);
  assert.match(uiStyles, /\.toast--warning\s*\{[\s\S]*?max-width: min\(520px, calc\(100vw - 48px\)\);[\s\S]*?transform: translate\(-50%, -8px\);/);

  assert.doesNotMatch(legacyStyles, /\.toast\s*\{/);
  assert.doesNotMatch(legacyStyles, /\.toast--home-status\s*\{/);
  assert.doesNotMatch(legacyStyles, /\.toast__label\s*\{/);
});
