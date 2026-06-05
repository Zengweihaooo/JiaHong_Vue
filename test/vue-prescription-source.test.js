import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue prescription panel uses shared UI medicine risk tip with H5 row selection", async () => {
  const [prescriptionPanel, legacyStyles, uiStyles, uiExports] = await Promise.all([
    readFile(new URL("../src/components/consultation/PrescriptionPanel.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/src/components/index.js", import.meta.url), "utf8")
  ]);

  assert.match(prescriptionPanel, /import \{ MedicineRiskTip, assetUrl \} from "@jiahong\/ui"/);
  assert.match(prescriptionPanel, /<MedicineRiskTip/);
  assert.match(prescriptionPanel, /function selectRiskMedicine/);
  assert.match(prescriptionPanel, /function hideMedicineRiskTip/);
  assert.match(prescriptionPanel, /medicine-table__row--warning-active/);
  assert.match(prescriptionPanel, /data-warning-level/);
  assert.match(prescriptionPanel, /getHighestMedicineRiskLevel/);

  assert.match(uiExports, /MedicineRiskTip/);
  assert.match(uiStyles, /\.medicine-risk-tip\s*\{/);
  assert.match(uiStyles, /\.medicine-table__row--warning-active/);
  assert.doesNotMatch(legacyStyles, /\.medicine-risk-tip\s*\{/);
});
