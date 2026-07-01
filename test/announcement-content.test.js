import test from "node:test";
import assert from "node:assert/strict";
import {
  parseAnnouncementContent,
  parseAnnouncementLine,
  stripAnnouncementHighlights
} from "../../JiaHong_UI/src/utils/announcementContent.js";

test("announcement content parser highlights wrapped segments", () => {
  assert.deepEqual(parseAnnouncementLine("请完成**风险检测结果**核对"), [
    { type: "text", value: "请完成" },
    { type: "highlight", value: "风险检测结果" },
    { type: "text", value: "核对" }
  ]);

  const lines = parseAnnouncementContent("第一行**重点**\n第二行普通", { maxLines: 2 });
  assert.equal(lines.length, 2);
  assert.deepEqual(lines[0][1], { type: "highlight", value: "重点" });
  assert.equal(stripAnnouncementHighlights("**禁止开具处方**"), "禁止开具处方");
});
