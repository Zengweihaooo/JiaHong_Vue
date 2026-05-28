function fallbackEndedAt(record = {}) {
  return record.endedAt || record.time || "刚刚";
}

function fallbackTraceTime(record = {}) {
  const endedAt = fallbackEndedAt(record);
  const match = String(endedAt).match(/(\d{2}:\d{2})/);
  return match?.[1] || endedAt;
}

function fallbackDiagnosis(record = {}) {
  return record.diagnosis || record.diagnosisTags?.[0] || "待补充诊断";
}

function getMedicineSummary(record = {}) {
  const medicines = Array.isArray(record.prescriptionMedicines) ? record.prescriptionMedicines : [];
  if (!medicines.length) return "本次问诊未生成处方明细";
  const names = medicines.map((medicine) => medicine.name).filter(Boolean);
  return `${names.slice(0, 2).join("、")}${names.length > 2 ? "等" : ""} ${medicines.length} 项药品已归档`;
}

function normalizeTranscriptMessage(message, index, fallbackTime) {
  return {
    from: message.from === "doctor" ? "doctor" : "patient",
    time: message.time || fallbackTime,
    text: message.recalled ? "医生撤回了一条消息" : message.text || `第 ${index + 1} 条问诊消息`
  };
}

export function buildArchivedTranscript(record = {}, chat = null) {
  const endedAt = fallbackEndedAt(record);
  const transcript = Array.isArray(record.transcript) ? record.transcript : [];
  if (transcript.length) {
    return transcript.map((message, index) => normalizeTranscriptMessage(message, index, endedAt));
  }

  const chatMessages = Array.isArray(chat?.messages) ? chat.messages : [];
  if (chatMessages.length) {
    return chatMessages.map((message, index) => normalizeTranscriptMessage(message, index, chat?.sessionDate || endedAt));
  }

  return [
    {
      from: "patient",
      time: endedAt,
      text: record.preview || "本次问诊主诉已归档。"
    },
    {
      from: "doctor",
      time: endedAt,
      text: `本次问诊已结束，诊断：${fallbackDiagnosis(record)}。`
    }
  ];
}

export function buildArchivedTrace(record = {}) {
  const trace = Array.isArray(record.trace) ? record.trace : [];
  if (trace.length) return trace;

  const time = fallbackTraceTime(record);
  const typeLabel = record.typeLabel || (record.type === "video" ? "视频" : record.type === "consult" ? "咨询" : "图文");
  return [
    {
      label: "问诊结束",
      time,
      detail: `医生完成${typeLabel}问诊，本次记录已封存`
    },
    {
      label: "诊断记录",
      time,
      detail: `诊断：${fallbackDiagnosis(record)}`
    },
    {
      label: "处方记录",
      time,
      detail: getMedicineSummary(record)
    }
  ];
}

export function normalizeArchivedConsultationRecord(record = {}, chat = null) {
  const typeLabel = record.typeLabel || (record.type === "video" ? "视频" : record.type === "consult" ? "咨询" : "图文");
  return {
    ...record,
    typeLabel,
    diagnosis: fallbackDiagnosis(record),
    diagnosisTags: record.diagnosisTags?.length ? record.diagnosisTags : [fallbackDiagnosis(record)],
    prescriptionNo: record.prescriptionNo || "归档中",
    endedAt: fallbackEndedAt(record),
    transcript: buildArchivedTranscript(record, chat),
    trace: buildArchivedTrace(record)
  };
}
