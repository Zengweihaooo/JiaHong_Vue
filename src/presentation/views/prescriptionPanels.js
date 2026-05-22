import { assetUrl } from "../../shared/core.js";
import { renderButton, renderRiskTag } from "../components/primitives.js";
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


export const defaultPrescriptionMedicines = [];

const medicineUnitOptions = ["盒", "瓶", "支", "袋", "板", "片"];

export const defaultPatientDetail = {
  weight: "--",
  pregnancy: "--",
  phone: "--",
  liverAbnormal: "--",
  idCard: "--",
  kidneyAbnormal: "--",
  allergies: "--"
};

export function renderPatientInfoGrid(patientDetail = defaultPatientDetail) {
  return `
    <span>体重 /KG：${patientDetail.weight}</span>
    <span>*妊娠哺乳：　${patientDetail.pregnancy}</span>
    <span>手机号：${patientDetail.phone}</span>
    <span>*肝功能异常：　${patientDetail.liverAbnormal}</span>
    <span>证件号：${patientDetail.idCard}</span>
    <span>*肾功能异常：　${patientDetail.kidneyAbnormal}</span>
    <span>过敏史：${patientDetail.allergies}</span>`;
}

export function renderMedicineTableRow(row, readonly = false) {
  const renderEditableBox = (field, label) => {
    const value = row[field] ?? "";
    if (readonly) return `<span class="table-input">${escapeHtml(value)}</span>`;
    return `<input class="table-input medicine-edit-field" type="text" value="${escapeHtml(value)}" aria-label="${label}" data-medicine-field="${field}" />`;
  };
  const renderUnitSelector = () => {
    const value = row.unit ?? "";
    if (readonly) return `<span class="table-input">${escapeHtml(value)}</span>`;
    const selectedValue = value || medicineUnitOptions[0];
    const optionValues = Array.from(new Set([selectedValue, ...medicineUnitOptions].filter(Boolean)));
    return `
      <div class="medicine-unit-control">
        <button
          class="table-input medicine-unit-select"
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
  };

  return `
    <div class="medicine-table__row" data-medicine-index="${row.index}" data-medicine-name="${escapeHtml(row.name)}">
      <span>${row.index}</span>
      <span>${escapeHtml(row.name)}</span>
      <span>${escapeHtml(row.type)}</span>
      <span class="medicine-spec-text">${escapeHtml(row.spec)}</span>
      ${renderEditableBox("usage", "用法")}
      ${renderEditableBox("frequency", "服用频次")}
      ${renderEditableBox("dose", "用量")}
      <span>${escapeHtml(row.quantity)}</span>
      ${renderUnitSelector()}
      ${renderRiskTag({ text: row.risk, size: "sm", className: "risk-small" })}
      ${
        readonly
          ? ""
          : renderButton({ text: "删除", tone: "text", size: "", className: "medicine-delete-btn" })
      }
    </div>`;
}

function renderMedicineTable(medicines = [], readonly = false) {
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

export function renderPrescriptionPanel(options = {}) {
  const normalized = typeof options === "boolean" ? { includeSecondMedicine: options } : options;
  const { includeSecondMedicine = false, readonly = false, record = null } = normalized;

  const patientName =
    record
      ? `${record.patient}&nbsp;&nbsp;${record.patientGender || ""}&nbsp;&nbsp;${record.age}`
      : "暂无患者信息";
  const patientDetail = record?.patientDetail ? record.patientDetail : defaultPatientDetail;
  const diagnosisTags =
    record
      ? record.diagnosisTags || [record.diagnosis].filter(Boolean)
      : [];
  const medicines =
    record?.prescriptionMedicines?.length
      ? record.prescriptionMedicines
      : defaultPrescriptionMedicines;
  let medicineRows = medicines;
  if (!readonly && includeSecondMedicine && medicines.length === 1) {
    medicineRows = [...medicines, { ...medicines[0], index: 2 }];
  }

  const panelLabel = readonly ? "只读处方信息" : "处方信息";

  return `
    <section class="prescription-panel${readonly ? " prescription-panel--readonly" : ""}" aria-label="${panelLabel}">
      <div class="patient-info">
        <div class="patient-info__name">${patientName}</div>
        <div class="patient-info__grid">${renderPatientInfoGrid(patientDetail)}</div>
      </div>
      <div class="section-divider"></div>
      <div class="diagnosis-section">
        <h3>疾病信息</h3>
        <div class="diagnosis-row">
          <label><span>*</span>诊断</label>
          ${
            readonly
              ? `<span class="jh-input-field jh-input-field--lg diagnosis-select diagnosis-select--readonly" aria-disabled="true">${diagnosisTags[0] || ""}</span>`
              : renderDiagnosisSelectInput()
          }
          <div class="diagnosis-input">
            ${renderDiagnosisTags(diagnosisTags, readonly)}
          </div>
        </div>
      </div>
      <div class="section-divider"></div>
      <div class="medicine-section">
        <h3>所需药品</h3>
        <div class="medicine-scroll-area">
          ${readonly ? "" : renderMedicineSearchCombobox()}
          ${renderMedicineTable(medicineRows, readonly)}
        </div>
      </div>
      <div class="prescription-actions${readonly ? " prescription-actions--readonly" : ""}">
        ${
          readonly
            ? `<span class="prescription-actions__hint">已封存，仅支持查看</span>`
            : renderPrescriptionRemarkSelect()
        }
        <div class="prescription-actions__controls">
          ${
            readonly
              ? renderButton({
                  text: "查看开方历史",
                  tone: "primary",
                  size: "md",
                  className: "prescription-history-open"
                })
              : `${renderButton({ text: "结束问诊", tone: "soft-danger", size: "md", className: "end-consult-trigger", disabled: true })}
          ${renderButton({ text: "提交处方", tone: "primary", size: "md", className: "jh-prescription-submit" })}`
          }
        </div>
      </div>
    </section>`;
}

export function renderConsultationPanel(options = {}) {
  const { readonly = false, record = null } = options;
  const patientName =
    record
      ? `${record.patient}&nbsp;&nbsp;${record.patientGender || ""}&nbsp;&nbsp;${record.age}`
      : "暂无患者信息";
  const patientDetail = record?.patientDetail ? record.patientDetail : defaultPatientDetail;
  const diagnosisTags =
    record
      ? (record.diagnosisTags || [record.diagnosis].filter(Boolean)).filter((tag) => !tag.includes("咨询"))
      : [];
  const medicines = record?.prescriptionMedicines?.length ? record.prescriptionMedicines : [];

  return `
    <section class="prescription-panel consultation-panel${readonly ? " prescription-panel--readonly" : ""}" aria-label="咨询处理信息">
      <div class="patient-info">
        <div class="patient-info__name">${patientName}</div>
        <div class="patient-info__grid">${renderPatientInfoGrid(patientDetail)}</div>
      </div>
      <div class="section-divider"></div>
      <div class="diagnosis-section consultation-diagnosis-section">
        <h3>诊断意见</h3>
        <div class="diagnosis-row">
          <label><span>*</span>诊断</label>
          ${readonly ? `<span class="jh-input-field jh-input-field--lg diagnosis-select diagnosis-select--readonly" aria-disabled="true">${diagnosisTags[0] || ""}</span>` : renderDiagnosisSelectInput()}
          <div class="diagnosis-input">
            ${renderDiagnosisTags(diagnosisTags, readonly)}
          </div>
        </div>
        <div class="diagnosis-row consultation-treatment-row">
          <label><span>*</span>处理意见</label>
          <textarea class="jh-input-field jh-input-field--lg consultation-treatment-input" placeholder="请输入治疗处理意见" aria-label="请输入治疗处理意见">${escapeHtml(record?.treatmentAdvice || "")}</textarea>
        </div>
      </div>
      <div class="section-divider"></div>
      <div class="medicine-section consultation-medicine-section">
        <h3>所需药品</h3>
        <div class="medicine-scroll-area">
          ${readonly ? "" : renderMedicineSearchCombobox()}
          ${renderMedicineTable(medicines, readonly)}
        </div>
      </div>
      <div class="prescription-actions consultation-actions${readonly ? " prescription-actions--readonly" : ""}">
        ${readonly ? `<span class="prescription-actions__hint">已封存，仅支持查看</span>` : renderPrescriptionRemarkSelect()}
        <div class="prescription-actions__controls">
          ${
            readonly
              ? renderButton({ text: "查看开方历史", tone: "primary", size: "md", className: "prescription-history-open" })
              : renderButton({ text: "完成问诊", tone: "primary", size: "md", className: "end-consult-trigger consultation-complete-trigger" })
          }
        </div>
      </div>
    </section>`;
}
