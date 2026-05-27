export const maxVisibleOngoingConsultations = 6;

function getRecordSortMinutes(record = {}) {
  const match = String(record.time || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return -1;
  return Number(match[1]) * 60 + Number(match[2]);
}

function sortRecordsByRecentTime(records = []) {
  return records
    .map((record, index) => ({ record, index }))
    .sort((left, right) => {
      const timeDiff = getRecordSortMinutes(right.record) - getRecordSortMinutes(left.record);
      return timeDiff || left.index - right.index;
    })
    .map((item) => item.record);
}

export function getMessageListRecords(records = [], { type = "all", state = "ongoing" } = {}) {
  const filteredRecords = records.filter(
    (record) => (type === "all" || record.type === type) && record.state === state
  );
  return state === "ongoing"
    ? sortRecordsByRecentTime(filteredRecords).slice(0, maxVisibleOngoingConsultations)
    : filteredRecords;
}

export function buildWaitingQueueFromRecords(records = [], date = new Date()) {
  const visibleOngoingRecords = getMessageListRecords(records, { type: "all", state: "ongoing" }).filter(
    (record) => record.type === "text" || record.type === "video" || record.type === "consult"
  );
  const byType = visibleOngoingRecords.reduce(
    (counts, record) => {
      const type = record.type || "consult";
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    },
    { text: 0, video: 0, consult: 0 }
  );

  return {
    total: visibleOngoingRecords.length,
    byType: {
      text: byType.text || 0,
      video: byType.video || 0,
      consult: byType.consult || 0
    },
    updatedAt: date.toISOString()
  };
}
