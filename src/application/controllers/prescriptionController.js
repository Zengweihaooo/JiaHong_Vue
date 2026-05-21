import { searchDiagnosisCatalog, searchMedicineCatalog } from "../../infrastructure/api/appApi.js";
import { getActiveOngoingConsultationRecord } from "../state/dataStore.js";

export async function getDiagnosisOptions(keyword = "", context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  const response = await searchDiagnosisCatalog({
    keyword,
    exclude: record?.diagnosisTags || []
  });
  return response.items;
}

export function addDiagnosisToActiveRecord(diagnosisText = "", context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  if (!record) return { ok: false, message: "当前会话不可编辑" };
  normalizeRecordDiagnosis(record);
  const nextDiagnosis = diagnosisText.trim() || `补充诊断${record.diagnosisTags.length + 1}`;
  if (record.diagnosisTags.includes(nextDiagnosis)) {
    return { ok: false, record, message: "该诊断已存在" };
  }
  record.diagnosisTags.push(nextDiagnosis);
  normalizeRecordDiagnosis(record);
  return { ok: true, record, message: `已添加诊断：${nextDiagnosis}` };
}

export function removeDiagnosisFromActiveRecord(tag, context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  if (!record || !tag) return { ok: false, message: "当前诊断不可删除" };
  normalizeRecordDiagnosis(record);
  record.diagnosisTags = record.diagnosisTags.filter((item) => item !== tag);
  normalizeRecordDiagnosis(record, { allowEmpty: true });
  return { ok: true, record, message: "诊断已更新" };
}

export async function getMedicineOptions(keyword = "", context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  const response = await searchMedicineCatalog({
    keyword,
    exclude: (record?.prescriptionMedicines || []).map((medicine) => medicine.name)
  });
  return response.items;
}

export async function addMedicineToActiveRecord(input = "", context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  if (!record) return { ok: false, message: "当前会话不可编辑" };
  record.prescriptionMedicines = record.prescriptionMedicines || [];
  const keyword = typeof input === "string" ? input.trim() : input?.name || "";
  if (!keyword) return { ok: false, record, message: "请输入药品名称" };
  const options = typeof input === "object" && input ? [input] : await getMedicineOptions(keyword, context);
  const suggestion = options.find((medicine) => medicine.name === keyword) || options[0];
  if (!suggestion) return { ok: false, record, message: "未找到匹配药品" };
  if (record.prescriptionMedicines.some((medicine) => medicine.name === suggestion.name)) {
    return { ok: false, record, message: "该药品已在处方中" };
  }
  record.prescriptionMedicines.push({
    index: record.prescriptionMedicines.length + 1,
    ...suggestion
  });
  normalizeMedicines(record);
  return { ok: true, record, message: `已添加药品：${suggestion.name}` };
}

export function removeMedicineFromActiveRecord(name, context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  if (!record || !name) return { ok: false, message: "当前药品不可删除" };
  record.prescriptionMedicines = (record.prescriptionMedicines || []).filter((medicine) => medicine.name !== name);
  normalizeMedicines(record);
  return { ok: true, record, message: "药品已删除" };
}

export function updateMedicineFieldInActiveRecord(index, field, value, context = {}) {
  const record = getActiveOngoingConsultationRecord(context);
  if (!record || !index || !field) return { ok: false };
  const medicine = (record.prescriptionMedicines || []).find((item) => Number(item.index) === Number(index));
  if (!medicine) return { ok: false, record };
  medicine[field] = value.trim();
  return { ok: true, record };
}

function normalizeRecordDiagnosis(record, { allowEmpty = false } = {}) {
  const tags = Array.isArray(record.diagnosisTags) ? record.diagnosisTags.filter(Boolean) : [];
  const normalizedTags = record.type === "consult"
    ? tags.filter((tag) => !tag.includes("咨询"))
    : tags;
  if (!allowEmpty && !normalizedTags.length && record.diagnosis && !record.diagnosis.includes("咨询")) normalizedTags.push(record.diagnosis);
  record.diagnosisTags = Array.from(new Set(normalizedTags));
  record.diagnosis = record.diagnosisTags[0] || "";
}

function normalizeMedicines(record) {
  record.prescriptionMedicines = (record.prescriptionMedicines || []).map((medicine, index) => ({
    ...medicine,
    index: index + 1
  }));
}
