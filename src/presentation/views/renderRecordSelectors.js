import { appView, getSessionIdParam } from "../../shared/core.js";
import { getMessageListRecords } from "../../domain/consultationQueue.js";
import { renderData, renderRuntime } from "../../application/viewModels/renderViewModel.js?v=20260528-06";

export function getDefaultOngoingRenderRecord(type = appView) {
  if (!type || type === "room") {
    return getMessageListRecords(renderData.consultationRecords, {
      type: "all",
      state: "ongoing",
      activeVideoRecordId: renderRuntime.activeVideoConsultationId
    })[0];
  }
  if (type === "video") {
    return (
      renderData.consultationRecords.find(
        (record) => record.id === renderRuntime.activeVideoConsultationId && record.type === "video" && record.state === "ongoing"
      ) ||
      renderData.consultationRecords.find((record) => record.state === "ongoing" && record.targetView === type) ||
      renderData.consultationRecords.find((record) => record.state === "ongoing" && record.type === type) ||
      null
    );
  }
  return (
    renderData.consultationRecords.find((record) => record.state === "ongoing" && record.targetView === type) ||
    renderData.consultationRecords.find((record) => record.state === "ongoing" && record.type === type) ||
    renderData.consultationRecords.find((record) => record.state === "ongoing")
  );
}

export function getDefaultEndedRenderRecord() {
  return getMessageListRecords(renderData.consultationRecords, { type: "all", state: "ended" })[0];
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
    renderRuntime.activeVideoConsultationId,
    appView === "video" ? urlSessionId : "",
    activeRecord
  ].filter(Boolean);
  return (
    candidates
      .map((recordId) =>
        renderData.consultationRecords.find((record) => record.id === recordId && record.type === "video" && record.state === "ongoing")
      )
      .find(Boolean)?.id || ""
  );
}
