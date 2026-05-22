import { assetUrl } from "../../shared/core.js";
import { escapeHtml } from "../ui/html.js";

export function renderSearchField({ className = "", placeholder = "请输入药品名称或首字母做模糊查询", disabled = false } = {}) {
  return `
    <label class="jh-search-field${className ? ` ${className}` : ""}${disabled ? " is-disabled" : ""}">
      <span class="jh-search-field__icon" aria-hidden="true">
        <img src="${assetUrl("assets/search-icon.png")}" alt="" />
      </span>
      <input type="text" placeholder="${placeholder}" aria-label="${placeholder}"${disabled ? " disabled" : ""} />
    </label>`;
}

export function renderMedicineSearchCombobox() {
  return `
    <div class="medicine-search-combobox">
      ${renderSearchField({ className: "medicine-search" })}
      <div class="medicine-options" role="listbox" hidden></div>
    </div>`;
}

export function renderSelectField({ label = "请选择", size = "sm", className = "", showChevron = true } = {}) {
  const safeSize = size === "lg" ? "lg" : "sm";
  return `
    <button class="jh-input-field jh-input-field--${safeSize}${className ? ` ${className}` : ""}" type="button">
      <span>${label}</span>
      ${
        showChevron
          ? `<span class="jh-input-field__chevron" aria-hidden="true">
              <img src="${assetUrl("assets/figma-consult/chevron-down.svg")}" alt="" />
            </span>`
          : ""
      }
    </button>`;
}

const prescriptionRemarkOptions = [
  "益生菌需与抗生素间隔两小时使用",
  "蒙脱石散需与其它药前后间隔两小时使用",
  "联合用药中的补充用药",
  "为老人带药",
  "处方中儿童药品为15岁孩子带药",
  "按疗程使用",
  "微信支付",
  "现金支付",
  "支付宝支付",
  "阿托伐他汀需与其它药物分开使用",
  "其他"
];

export function renderPrescriptionRemarkSelect() {
  return `
    <label class="prescription-remark-field">
      <span class="prescription-remark-field__label">处方备注：</span>
      <select class="jh-input-field jh-input-field--sm prescription-remark-select" aria-label="处方备注">
        <option value="">请选择</option>
        ${prescriptionRemarkOptions
          .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
          .join("")}
      </select>
    </label>`;
}

export function renderDiagnosisTags(tags, readonly = false) {
  return tags
    .map((tag) => {
      const safeTag = escapeHtml(tag);
      return `
        ${
          readonly
            ? `<span class="diagnosis-tag diagnosis-tag--readonly">`
            : `<span class="diagnosis-tag" data-diagnosis-tag="${safeTag}">`
        }
          <span>${safeTag}</span>
          ${
            readonly
              ? ""
              : `<button class="diagnosis-tag__close diagnosis-tag__close-btn" type="button" data-diagnosis-tag="${safeTag}" aria-label="移除诊断：${safeTag}">
                  <img src="${assetUrl("assets/diagnosis-tag-close.svg")}" alt="" />
                </button>`
          }
        </span>`;
    })
    .join("");
}

export function renderDiagnosisSelectInput() {
  return `
    <div class="diagnosis-combobox">
      <input
        class="jh-input-field jh-input-field--lg diagnosis-select diagnosis-select-input"
        type="text"
        aria-label="请选择诊断"
        aria-expanded="false"
        autocomplete="off"
        placeholder="请选择诊断"
      />
      <div class="diagnosis-options" role="listbox" hidden></div>
    </div>`;
}
