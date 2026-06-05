import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vue prescription panel uses shared UI medicine risk tip with H5 row selection", async () => {
  const [prescriptionPanel, legacyStyles, uiStyles, uiExports, store, consultBindings] = await Promise.all([
    readFile(new URL("../src/components/consultation/PrescriptionPanel.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/src/components/index.js", import.meta.url), "utf8"),
    readFile(new URL("../src/stores/app.js", import.meta.url), "utf8"),
    readFile(new URL("../src/presentation/interactions/consultDialogBindings.js", import.meta.url), "utf8")
  ]);

  assert.match(prescriptionPanel, /import \{ MedicineRiskTip, assetUrl \} from "@jiahong\/ui"/);
  assert.match(prescriptionPanel, /<MedicineRiskTip/);
  assert.match(prescriptionPanel, /function selectRiskMedicine/);
  assert.match(prescriptionPanel, /function hideMedicineRiskTip/);
  assert.match(prescriptionPanel, /medicine-table__row--warning-active/);
  assert.match(prescriptionPanel, /data-warning-level/);
  assert.match(prescriptionPanel, /getHighestMedicineRiskLevel/);
  assert.match(prescriptionPanel, /function requestPrescriptionSubmit/);
  assert.match(prescriptionPanel, /store\.showToast\("存在用药风险，请点击高亮药品行查看具体提示并完成修改"\)/);
  assert.match(prescriptionPanel, /store\.submitActivePrescription\(\)/);
  assert.doesNotMatch(prescriptionPanel, /inline-risk-warning|data-inline-risk-warning|has-inline-risk-warning/);

  assert.match(uiExports, /MedicineRiskTip/);
  assert.match(uiStyles, /\.medicine-risk-tip\s*\{/);
  assert.match(uiStyles, /\.medicine-table\s*\{[\s\S]*?min-width: var\(--jh-table-width\);/);
  assert.match(uiStyles, /\.medicine-table__row\s*\{[\s\S]*?display: grid;[\s\S]*?grid-template-columns:/);
  assert.match(uiStyles, /\.medicine-table__head\s*\{[\s\S]*?background: var\(--jh-table-head-bg\);/);
  assert.match(uiStyles, /\.medicine-table__row--warning-active/);
  assert.doesNotMatch(legacyStyles, /\.medicine-risk-tip\s*\{/);
  assert.doesNotMatch(legacyStyles, /\.medicine-table__row\s*\{[\s\S]*?grid-template-columns:/);
  assert.doesNotMatch(legacyStyles, /\.inline-risk-warning\s*\{|has-inline-risk-warning/);

  assert.match(store, /async submitActivePrescription\(\)/);
  assert.match(store, /updateConsultationStatus\(record\.id, "SUBMIT_PRESCRIPTION", record\)/);
  assert.doesNotMatch(store, /riskWarningRevealInlineOnClose/);

  assert.match(consultBindings, /存在用药风险，请点击高亮药品行查看具体提示并完成修改/);
  assert.doesNotMatch(consultBindings, /revealInlineOnClose|data-inline-risk-warning/);
});

test("Vue prescription panel keeps H5 spacing through the shared UI stylesheet", async () => {
  const [legacyStyles, uiStyles] = await Promise.all([
    readFile(new URL("../src/styles/legacy-app.css", import.meta.url), "utf8"),
    readFile(new URL("../../JiaHong_UI/styles/components.css", import.meta.url), "utf8")
  ]);

  for (const styles of [legacyStyles, uiStyles]) {
    assert.match(styles, /\.prescription-panel\s*\{/);
    assert.match(styles, /\.patient-info\s*\{[\s\S]*?gap: 16px;[\s\S]*?margin: 10px 24px;[\s\S]*?padding: 16px 0;/);
    assert.match(styles, /\.patient-info__meta\s*\{[\s\S]*?line-height: 20px;/);
    assert.match(styles, /\.patient-info__grid\s*\{[\s\S]*?gap: 12px clamp\(32px, 7%, 72px\);[\s\S]*?line-height: 20px;/);
    assert.match(styles, /\.patient-info__field\s*\{[\s\S]*?gap: 12px;/);
    assert.match(styles, /\.patient-info__field-value\s*\{[\s\S]*?height: 34px;[\s\S]*?padding: 6px 12px;/);
    assert.match(styles, /\.medicine-search-combobox\s*\{[\s\S]*?width: max\(100%, var\(--jh-table-width\)\);[\s\S]*?min-width: var\(--jh-table-width\);/);
  }

  assert.match(legacyStyles, /\.medicine-table__row > span\.medicine-warning-target\s*\{/);
  assert.match(legacyStyles, /\.medicine-table__row > span:nth-child\(8\),\s*\.medicine-table__row > input\[data-medicine-field="quantity"\]\s*\{[\s\S]*?text-align: center;/);
  assert.match(legacyStyles, /\.medicine-delete-btn\s*\{[\s\S]*?color: var\(--jh-text-tertiary\);[\s\S]*?transition: color 160ms ease;/);
  assert.match(legacyStyles, /\.medicine-delete-btn:hover,\s*\.medicine-delete-btn:focus-visible\s*\{[\s\S]*?color: var\(--jh-table-action\);/);
});
