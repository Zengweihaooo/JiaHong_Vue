import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue topbars use shared UI avatar assets and H5 menu dismissal behavior", async () => {
  const [topbar, roomTopbar, userMenu, legacyStyles, uiStyles] = await Promise.all([
    readFile(new URL("../src/components/layout/Topbar.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/RoomTopbar.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/UserMenu.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8")
  ]);

  assert.match(topbar, /import \{ Avatar, assetUrl \} from "@jiahong\/ui"/);
  assert.match(topbar, /<Avatar :src="assetUrl\('assets\/figma-home\/avatar-source\.png'\)"/);

  assert.match(roomTopbar, /import \{ Avatar, assetUrl \} from "@jiahong\/ui"/);
  assert.match(roomTopbar, /<Avatar :src="assetUrl\('assets\/figma-consult\/avatar-source\.png'\)"/);
  assert.match(roomTopbar, /class="jh-btn jh-btn--md jh-btn--neutral jh-btn--icon room-back-btn"/);

  assert.match(userMenu, /ref="menuRoot"/);
  assert.match(userMenu, /document\.addEventListener\("click", handleDocumentClick\)/);
  assert.match(userMenu, /document\.addEventListener\("keydown", handleDocumentKeydown\)/);
  assert.match(userMenu, /closest\?\.\("\.user-menu-trigger"\)/);
  assert.match(userMenu, /event\.key === "Escape"/);

  assert.match(uiStyles, /^\.user-chip\s*\{/m);
  assert.match(uiStyles, /^\.user-menu\s*\{/m);
  assert.match(uiStyles, /^\.user-menu-service\s*\{/m);
  assert.match(uiStyles, /^\.room-user\s*\{/m);
  assert.match(uiStyles, /^\.room-back-btn\s*\{/m);
  assert.match(uiStyles, /\.room-back-btn img\s*\{/m);
  assert.match(uiStyles, /@media \(max-width: 620px\)\s*\{[\s\S]*?\.user-chip::before,[\s\S]*?\.room-user__divider/);
  assert.doesNotMatch(legacyStyles, /^\.user-chip\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.user-menu\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.user-menu-service\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.room-user\s*\{/m);
  assert.doesNotMatch(legacyStyles, /^\.room-back-btn\s*\{/m);
});
