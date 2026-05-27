import { renderButton, renderRiskTag } from "../components/primitives.js?v=20260527-31";
import { escapeHtml } from "../ui/html.js";
import {
  renderDiagnosisSelectInput,
  renderDiagnosisTags,
  renderMedicineSearchCombobox,
  renderPrescriptionRemarkSelect
} from "./prescriptionFormFields.js";

export {
  renderDiagnosisSelectInput,
  renderDiagnosisTags,
  renderMedicineSearchCombobox,
  renderPrescriptionRemarkSelect,
  renderSearchField,
  renderSelectField
} from "./prescriptionFormFields.js";


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

function getMedicineWarningFields(row = {}) {
  return new Set(Array.isArray(row.warningFields) ? row.warningFields : []);
}

function getMedicineWarningClass(warningFields, field) {
  return warningFields.has(field) ? " medicine-warning-target" : "";
}

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
  const warningFields = getMedicineWarningFields(row);
  const renderEditableBox = (field, label) => {
    const value = row[field] ?? "";
    const warningClass = getMedicineWarningClass(warningFields, field);
    if (readonly) return `<span class="table-input${warningClass}">${escapeHtml(value)}</span>`;
    return `<input class="table-input medicine-edit-field${warningClass}" type="text" value="${escapeHtml(value)}" aria-label="${label}" data-medicine-field="${field}" />`;
  };
  const renderUnitSelector = () => {
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
  };
  const rowWarningClass = warningFields.size ? " medicine-table__row--warning-linked" : "";
  const riskClass = "risk-small";

  return `
    <div class="medicine-table__row${rowWarningClass}" data-medicine-index="${row.index}" data-medicine-name="${escapeHtml(row.name)}">
      <span>${row.index}</span>
      <span class="${getMedicineWarningClass(warningFields, "name").trim()}">${escapeHtml(row.name)}</span>
      <span>${escapeHtml(row.type)}</span>
      <span class="medicine-spec-text">${escapeHtml(row.spec)}</span>
      ${renderEditableBox("usage", "用法")}
      ${renderEditableBox("frequency", "服用频次")}
      ${renderEditableBox("dose", "用量")}
      <span>${escapeHtml(row.quantity)}</span>
      ${renderUnitSelector()}
      ${renderRiskTag({ text: row.risk, size: "sm", className: riskClass })}
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

function getPatientName(record) {
  return record
    ? `${record.patient}&nbsp;&nbsp;${record.patientGender || ""}&nbsp;&nbsp;${record.age}`
    : "暂无患者信息";
}

function getDiagnosisTags(record, { excludeConsultationTag = false } = {}) {
  const tags = record ? record.diagnosisTags || [record.diagnosis].filter(Boolean) : [];
  return excludeConsultationTag ? tags.filter((tag) => !tag.includes("咨询")) : tags;
}

function renderPatientSection(record) {
  const patientDetail = record?.patientDetail ? record.patientDetail : defaultPatientDetail;
  return `
      <div class="patient-info">
        <div class="patient-info__name">${getPatientName(record)}</div>
        <div class="patient-info__grid">${renderPatientInfoGrid(patientDetail)}</div>
      </div>`;
}

function renderReadonlyDiagnosisValue(diagnosisTags) {
  return `<span class="jh-input-field jh-input-field--lg diagnosis-select diagnosis-select--readonly" aria-disabled="true">${diagnosisTags[0] || ""}</span>`;
}

function renderDiagnosisSection({ title, diagnosisTags, readonly = false, className = "", treatmentAdvice = "" }) {
  return `
      <div class="diagnosis-section${className ? ` ${className}` : ""}">
        <h3>${title}</h3>
        <div class="diagnosis-row">
          <label><span>*</span>诊断</label>
          ${readonly ? renderReadonlyDiagnosisValue(diagnosisTags) : renderDiagnosisSelectInput()}
          <div class="diagnosis-input">
            ${renderDiagnosisTags(diagnosisTags, readonly)}
          </div>
        </div>
        ${
          treatmentAdvice === null
            ? ""
            : `<div class="diagnosis-row consultation-treatment-row">
          <label><span>*</span>处理意见</label>
          <textarea class="jh-input-field jh-input-field--lg consultation-treatment-input" placeholder="请输入治疗处理意见" aria-label="请输入治疗处理意见">${escapeHtml(treatmentAdvice)}</textarea>
        </div>`
        }
      </div>`;
}

function renderMedicineSection({ medicines, readonly = false, className = "" }) {
  return `
      <div class="medicine-section${className ? ` ${className}` : ""}">
        <h3>所需药品</h3>
        <div class="medicine-scroll-area">
          ${readonly ? "" : renderMedicineSearchCombobox()}
          ${renderMedicineTable(medicines, readonly)}
        </div>
      </div>`;
}

function renderArchivedActionHint(readonly) {
  return readonly ? `<span class="prescription-actions__hint">已封存，仅支持查看</span>` : renderPrescriptionRemarkSelect();
}

function renderVideoSubmitCountdown() {
  return `
    <span class="video-submit-countdown" data-video-submit-countdown data-remaining="10" aria-live="polite">
      <span class="video-submit-countdown__icon" aria-hidden="true"></span>
      <span class="video-submit-countdown__value">10s</span>
    </span>`;
}

function renderPrescriptionActionButtons({ readonly = false, consultation = false, videoSubmitLock = false } = {}) {
  if (readonly) {
    return renderButton({ text: "查看开方历史", tone: "primary", size: "md", className: "prescription-history-open" });
  }
  if (consultation) {
    return renderButton({ text: "完成问诊", tone: "primary", size: "md", className: "end-consult-trigger consultation-complete-trigger" });
  }
  const submitButton = renderButton({
    text: "提交处方",
    tone: "primary",
    size: "md",
    className: "jh-prescription-submit",
    disabled: videoSubmitLock
  });
  return `${renderButton({ text: "结束问诊", tone: "success", size: "md", className: "end-consult-trigger", disabled: true })}
          ${
            videoSubmitLock
              ? `<span class="video-prescription-submit-wrap">${renderVideoSubmitCountdown()}${submitButton}</span>`
              : submitButton
          }`;
}

function renderPrescriptionActions({ readonly = false, consultation = false, videoSubmitLock = false } = {}) {
  return `
      <div class="prescription-actions${consultation ? " consultation-actions" : ""}${readonly ? " prescription-actions--readonly" : ""}">
        ${renderArchivedActionHint(readonly)}
        <div class="prescription-actions__controls">
          ${renderPrescriptionActionButtons({ readonly, consultation, videoSubmitLock })}
        </div>
      </div>`;
}

export function renderPrescriptionPanel(options = {}) {
  const normalized = typeof options === "boolean" ? { includeSecondMedicine: options } : options;
  const { includeSecondMedicine = false, readonly = false, record = null, videoSubmitLock = false } = normalized;

  const diagnosisTags = getDiagnosisTags(record);
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
      ${renderPatientSection(record)}
      <div class="section-divider"></div>
      ${renderDiagnosisSection({ title: "疾病信息", diagnosisTags, readonly, treatmentAdvice: null })}
      <div class="section-divider"></div>
      ${renderMedicineSection({ medicines: medicineRows, readonly })}
      ${renderPrescriptionActions({ readonly, videoSubmitLock })}
    </section>`;
}

export function renderConsultationPanel(options = {}) {
  const { readonly = false, record = null } = options;
  const diagnosisTags = getDiagnosisTags(record, { excludeConsultationTag: true });
  const medicines = record?.prescriptionMedicines?.length ? record.prescriptionMedicines : [];

  return `
    <section class="prescription-panel consultation-panel${readonly ? " prescription-panel--readonly" : ""}" aria-label="咨询处理信息">
      ${renderPatientSection(record)}
      <div class="section-divider"></div>
      ${renderDiagnosisSection({
        title: "诊断意见",
        diagnosisTags,
        readonly,
        className: "consultation-diagnosis-section",
        treatmentAdvice: record?.treatmentAdvice || ""
      })}
      <div class="section-divider"></div>
      ${renderMedicineSection({ medicines, readonly, className: "consultation-medicine-section" })}
      ${renderPrescriptionActions({ readonly, consultation: true })}
    </section>`;
}
