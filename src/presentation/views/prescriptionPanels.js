import { escapeHtml } from "../ui/html.js";
import { renderMedicineTable } from "../components/medicineTable.js";
import { renderPrescriptionActions } from "../components/prescriptionActions.js";
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
