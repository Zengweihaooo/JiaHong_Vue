import { renderButton, renderRiskTag } from "./primitives.js?v=20260527-35";
import { escapeHtml } from "../ui/html.js";

const medicineUnitOptions = ["盒", "瓶", "支", "袋", "板", "片"];

function getMedicineWarningFields(row = {}) {
  return new Set(Array.isArray(row.warningFields) ? row.warningFields : []);
}

function getMedicineWarningClass(warningFields, field) {
  return warningFields.has(field) ? " medicine-warning-target" : "";
}

function renderEditableBox(row, warningFields, field, label, readonly = false) {
  const value = row[field] ?? "";
  const warningClass = getMedicineWarningClass(warningFields, field);
  if (readonly) return `<span class="table-input${warningClass}">${escapeHtml(value)}</span>`;
  return `<input class="table-input medicine-edit-field${warningClass}" type="text" value="${escapeHtml(value)}" aria-label="${label}" data-medicine-field="${field}" />`;
}

function renderUnitSelector(row, warningFields, readonly = false) {
  const value = row.unit ?? "";
  const warningClass = getMedicineWarningClass(warningFields, "unit");
  if (readonly) return `<span class="table-input${warningClass}">${escapeHtml(value)}</span>`;
  const selectedValue = value || medicineUnitOptions[0];
  const optionValues = Array.from(new Set([selectedValue, ...medicineUnitOptions].filter(Boolean)));
  return `
    <div class="medicine-unit-control">
      <button
        class="table-input medicine-unit-select${warningClass}"
        type="button"
        aria-label="单位"
        aria-haspopup="listbox"
        aria-expanded="false"
        data-medicine-field="unit"
      >
        <span>${escapeHtml(selectedValue)}</span>
      </button>
      <div class="medicine-unit-options" role="listbox" hidden>
        ${optionValues
          .map(
            (unit) => `
              <button
                class="medicine-unit-option${unit === selectedValue ? " is-active" : ""}"
                type="button"
                role="option"
                aria-selected="${unit === selectedValue ? "true" : "false"}"
                data-medicine-unit="${escapeHtml(unit)}"
              >
                ${escapeHtml(unit)}
              </button>`
          )
          .join("")}
      </div>
    </div>`;
}

export function renderMedicineTableRow(row, readonly = false) {
  const warningFields = getMedicineWarningFields(row);
  const rowWarningClass = warningFields.size ? " medicine-table__row--warning-linked" : "";

  return `
    <div class="medicine-table__row${rowWarningClass}" data-medicine-index="${row.index}" data-medicine-name="${escapeHtml(row.name)}">
      <span>${row.index}</span>
      <span class="${getMedicineWarningClass(warningFields, "name").trim()}">${escapeHtml(row.name)}</span>
      <span>${escapeHtml(row.type)}</span>
      <span class="medicine-spec-text">${escapeHtml(row.spec)}</span>
      ${renderEditableBox(row, warningFields, "usage", "用法", readonly)}
      ${renderEditableBox(row, warningFields, "frequency", "服用频次", readonly)}
      ${renderEditableBox(row, warningFields, "dose", "用量", readonly)}
      <span>${escapeHtml(row.quantity)}</span>
      ${renderUnitSelector(row, warningFields, readonly)}
      ${renderRiskTag({ text: row.risk, size: "sm", className: "risk-small" })}
      ${
        readonly
          ? ""
          : renderButton({ text: "删除", tone: "text", size: "", className: "medicine-delete-btn" })
      }
    </div>`;
}

export function renderMedicineTable(medicines = [], readonly = false) {
  if (!medicines.length) {
    return `<div class="medicine-empty-state">暂无药品信息</div>`;
  }

  return `
    <div class="medicine-table${medicines.length === 1 ? " medicine-table--single" : ""}">
      <div class="medicine-table__row medicine-table__head">
        <span>序号</span><span>药品名称</span><span>类型</span><span>规格</span><span>用法</span><span>服用频次</span><span>用量</span><span>数量</span><span>单位</span><span>风险</span><span>操作</span>
      </div>
      ${medicines.map((row) => renderMedicineTableRow(row, readonly)).join("")}
    </div>`;
}
