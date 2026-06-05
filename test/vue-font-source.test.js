import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue app loads H5 Microsoft YaHei fonts from shared UI before page styles", async () => {
  const [main, uiFonts, uiVariables] = await Promise.all([
    readFile(new URL("../src/main.js", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/fonts.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/variables.css", import.meta.url), "utf8")
  ]);

  assert.match(main, /import "@jiahong\/ui\/fonts\.css";\nimport "@jiahong\/ui\/styles\.css";\nimport "@\/styles\/main\.css";/);
  assert.match(uiFonts, /font-family: "Microsoft YaHei"/);
  assert.match(uiFonts, /微软雅黑\.ttf/);
  assert.match(uiFonts, /msyhbd\.ttc/);
  assert.match(uiVariables, /--jh-font-family: "Microsoft YaHei", "微软雅黑"/);
});
