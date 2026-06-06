import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue consult confirm dialogs use H5 styles from the shared UI stylesheet", async () => {
  const [dialogs, legacyStyles, uiStyles] = await Promise.all([
    readFile(new URL("../src/components/common/AppDialogs.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8")
  ]);

  assert.match(dialogs, /class="\['consult-confirm-overlay'/);
  assert.match(dialogs, /consult-confirm-dialog--cancel-reason/);
  assert.match(dialogs, /consult-cancel-reason-type/);
  assert.match(dialogs, /consult-cancel-reason-list/);
  assert.match(dialogs, /consult-confirm-submit/);

  assert.match(uiStyles, /\.consult-confirm-overlay\s*\{[\s\S]*?z-index: 95;[\s\S]*?background: rgba\(122, 136, 152, 0\.3\);/);
  assert.match(uiStyles, /\.consult-confirm-dialog\s*\{[\s\S]*?width: min\(420px, calc\(100vw - 32px\)\);[\s\S]*?border-radius: 8px;/);
  assert.match(uiStyles, /\.consult-confirm-dialog--cancel-reason\s*\{[\s\S]*?width: min\(520px, calc\(100vw - 32px\)\);/);
  assert.match(uiStyles, /\.consult-confirm-dialog__header\s*\{[\s\S]*?min-height: 48px;[\s\S]*?padding: 12px 16px;/);
  assert.match(uiStyles, /\.consult-cancel-reasons__head\s*\{[\s\S]*?grid-template-columns: 108px minmax\(0, 1fr\);/);
  assert.match(uiStyles, /\.consult-cancel-reasons__body\s*\{[\s\S]*?min-height: 192px;/);
  assert.match(uiStyles, /\.consult-cancel-reason-type,\s*\.consult-cancel-reason\s*\{[\s\S]*?min-height: 32px;/);
  assert.match(uiStyles, /\.consult-confirm-dialog--cancel-reason \.consult-confirm-dialog__footer\s*\{[\s\S]*?gap: 24px;[\s\S]*?border-top: 0\.667px solid #e5e8eb;/);

  assert.match(legacyStyles, /\.consult-shell--readonly \.quick-reply-overlay,\s*\.consult-shell--readonly \.risk-warning-overlay,\s*\.consult-shell--readonly \.consult-confirm-overlay/);
  assert.doesNotMatch(legacyStyles, /^\.consult-confirm-overlay\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.consult-confirm-dialog\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.consult-cancel-reasons\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.consult-cancel-reason-type,\s*\n\.consult-cancel-reason\s*\{/m);
});
