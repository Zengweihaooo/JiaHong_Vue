import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue quick reply dialog follows latest H5 single-click close behavior", async () => {
  const dialogs = await readFile(new URL("../src/components/common/AppDialogs.vue", import.meta.url), "utf8");

  assert.match(dialogs, /单击快捷用语填入输入框并关闭，双击即可发送/);
  assert.match(dialogs, /let closeQuickReplyTimer = 0/);
  assert.match(dialogs, /const didFill = fillQuickReply\(message\)/);
  assert.match(dialogs, /closeQuickReplyTimer = window\.setTimeout/);
  assert.match(dialogs, /360/);
  assert.match(dialogs, /120/);

  assert.doesNotMatch(dialogs, /单击快捷用语填入输入框，双击即可发送/);
});
