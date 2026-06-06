import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue video consultation layout uses the H5 video workspace rule from the shared UI stylesheet", async () => {
  const [view, legacyStyles, uiStyles] = await Promise.all([
    readFile(new URL("../src/views/ConsultRoomView.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8")
  ]);

  assert.match(view, /'video-shell': isVideo/);
  assert.match(view, /<DurationChip :seconds="record\?\.elapsedSeconds \|\| 0" label="问诊持续时长：" \/>/);
  assert.match(uiStyles, /\.video-shell \.consult-workspace\s*\{\s*grid-template-columns: minmax\(424px, 3fr\) minmax\(0, 5fr\);/);
  assert.match(uiStyles, /\.jh-duration-chip\s*\{[\s\S]*?display: inline-flex;[\s\S]*?color: rgba\(0, 0, 0, 0\.6\);/);
  assert.match(uiStyles, /\.jh-duration-chip--warning\s*\{\s*color: #e37318;/);
  assert.match(uiStyles, /@media \(max-width: 1180px\)\s*\{[\s\S]*?\.consult-shell \.jh-duration-chip__prefix\s*\{\s*display: none;/);
  assert.doesNotMatch(legacyStyles, /^\.video-shell \.consult-workspace\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.jh-duration-chip\s*\{/m);
});
