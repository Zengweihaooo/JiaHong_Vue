import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue topbars use shared UI avatar assets and H5 menu dismissal behavior", async () => {
  const [topbar, roomTopbar, userMenu] = await Promise.all([
    readFile(new URL("../src/components/layout/Topbar.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/RoomTopbar.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/UserMenu.vue", import.meta.url), "utf8")
  ]);

  assert.match(topbar, /import \{ Avatar, assetUrl \} from "@jiahong\/ui"/);
  assert.match(topbar, /<Avatar :src="assetUrl\('assets\/figma-home\/avatar-source\.png'\)"/);

  assert.match(roomTopbar, /import \{ Avatar, assetUrl \} from "@jiahong\/ui"/);
  assert.match(roomTopbar, /<Avatar :src="assetUrl\('assets\/figma-consult\/avatar-source\.png'\)"/);

  assert.match(userMenu, /ref="menuRoot"/);
  assert.match(userMenu, /document\.addEventListener\("click", handleDocumentClick\)/);
  assert.match(userMenu, /document\.addEventListener\("keydown", handleDocumentKeydown\)/);
  assert.match(userMenu, /closest\?\.\("\.user-menu-trigger"\)/);
  assert.match(userMenu, /event\.key === "Escape"/);
});
