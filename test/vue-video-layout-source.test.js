import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue video consultation layout uses the H5 video workspace rule from the shared UI stylesheet", async () => {
  const [view, legacyStyles, uiStyles, uiVariables] = await Promise.all([
    readFile(new URL("../src/views/ConsultRoomView.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/variables.css", import.meta.url), "utf8")
  ]);

  assert.match(view, /'video-shell': isVideo/);
  assert.match(view, /<DurationChip :seconds="record\?\.elapsedSeconds \|\| 0" label="问诊持续时长：" \/>/);
  assert.match(uiVariables, /--jh-consult-chat-width: 424px;/);
  assert.match(uiVariables, /--jh-consult-prescription-width: 728px;/);
  assert.match(uiVariables, /--jh-consult-card-width: 1152px;/);
  assert.match(uiStyles, /^\.text-main,\n\.consult-room-main\s*\{/m);
  assert.match(uiStyles, /^\.text-card,\n\.consult-room-card\s*\{/m);
  assert.match(uiStyles, /^\.consult-workspace\s*\{/m);
  assert.match(uiStyles, /\.video-shell \.consult-workspace\s*\{\s*grid-template-columns: minmax\(424px, 3fr\) minmax\(0, 5fr\);/);
  assert.match(uiStyles, /^\.video-window\s*\{/m);
  assert.match(uiStyles, /^\.video-window__stage\s*\{\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\);/m);
  assert.match(uiStyles, /^\.video-window__pane \+ \.video-window__pane\s*\{/m);
  assert.match(uiStyles, /^\.video-toolbar\s*\{/m);
  assert.match(uiStyles, /^\.video-window__main\s*\{/m);
  assert.match(uiStyles, /\.jh-duration-chip\s*\{[\s\S]*?display: inline-flex;[\s\S]*?color: rgba\(0, 0, 0, 0\.6\);/);
  assert.match(uiStyles, /\.jh-duration-chip--warning\s*\{\s*color: #e37318;/);
  assert.match(uiStyles, /@media \(max-width: 1180px\)\s*\{[\s\S]*?\.consult-shell \.jh-duration-chip__prefix\s*\{\s*display: none;/);
  assert.match(uiStyles, /@media \(max-width: 1180px\)\s*\{[\s\S]*?\.consult-shell \.consult-workspace\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\);/);
  assert.doesNotMatch(legacyStyles, /--jh-consult-chat-width:/);
  assert.doesNotMatch(legacyStyles, /^\.text-main,\n\.consult-room-main\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.text-card,\n\.consult-room-card\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.consult-workspace\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.video-shell \.consult-workspace\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.jh-duration-chip\s*\{/m);
});
