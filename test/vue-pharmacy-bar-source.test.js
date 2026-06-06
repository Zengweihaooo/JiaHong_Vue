import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue consult pharmacy bar uses H5 styles from the shared UI stylesheet", async () => {
  const [consultRoomView, roomView, legacyStyles, uiStyles] = await Promise.all([
    readFile(new URL("../src/views/ConsultRoomView.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/views/RoomView.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8")
  ]);

  assert.match(consultRoomView, /class="pharmacy-bar"/);
  assert.match(consultRoomView, /class="pharmacy-bar__left"/);
  assert.match(consultRoomView, /class="pharmacy-bar__right"/);
  assert.match(roomView, /class="pharmacy-bar"/);

  assert.match(uiStyles, /^\.pharmacy-bar\s*\{/m);
  assert.match(uiStyles, /^\.pharmacy-bar__left,\n\.pharmacy-bar__right\s*\{/m);
  assert.match(uiStyles, /^\.pharmacy-bar h2\s*\{/m);
  assert.match(uiStyles, /@media \(max-width: 1180px\)\s*\{[\s\S]*?\.consult-shell \.pharmacy-bar\s*\{/);
  assert.match(uiStyles, /\.consult-shell \.pharmacy-bar h2\s*\{\s*max-width: 180px;/);

  assert.doesNotMatch(legacyStyles, /^\.pharmacy-bar\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.pharmacy-bar__left,\n\.pharmacy-bar__right\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.pharmacy-bar h2\s*\{/m);
});
