import { appView, getSessionIdParam } from "../../shared/core.js";
import { renderData, renderRuntime } from "../../application/viewModels/renderViewModel.js";

export function getDefaultOngoingRenderRecord(type = appView) {
  return (
    renderData.consultationRecords.find((record) => record.state === "ongoing" && record.targetView === type) ||
    renderData.consultationRecords.find((record) => record.state === "ongoing" && record.type === type) ||
    renderData.consultationRecords.find((record) => record.state === "ongoing")
  );
}

export function getDefaultEndedRenderRecord() {
  return renderData.consultationRecords.find((record) => record.state === "ended");
}

export function getActiveConsultationRecord(type = appView) {
  const sessionId = getSessionIdParam();
  return (
    renderData.consultationRecords.find((record) => record.id === sessionId && record.state === "ongoing") ||
    getDefaultOngoingRenderRecord(type)
  );
}

export function getActiveChatKey() {
  const sessionId = getSessionIdParam();
  if (sessionId && renderData.ongoingChatState[sessionId]) return sessionId;
  const record = getDefaultOngoingRenderRecord(appView);
  return record?.id || null;
}

export function getActiveVideoConsultationRecordId(activeRecord = "") {
  const urlSessionId = getSessionIdParam();
  const candidates = [
    activeRecord,
    appView === "video" ? urlSessionId : "",
    renderRuntime.activeVideoConsultationId
  ].filter(Boolean);
  return (
    candidates
      .map((recordId) =>
        renderData.consultationRecords.find((record) => record.id === recordId && record.type === "video" && record.state === "ongoing")
      )
      .find(Boolean)?.id || ""
  );
}
