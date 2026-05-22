import { assetUrl, appView } from "../shared/core.js";
import {
  formatDuration,
  getDoctorStatusLabel as getPrimitiveDoctorStatusLabel,
  renderButton,
  renderDurationChip,
  renderLabelTag,
  renderRiskTag,
  renderSwitch
} from "./components/primitives.js";
import {
  renderConsultConfirmDialogs,
  renderQuickReplyDialogView,
  renderRiskWarningDialogView
} from "./components/dialogs.js";
import { renderData, renderRuntime } from "../application/viewModels/renderViewModel.js";
import {
  renderAnnouncementDialog,
  renderAnnouncementListDialog,
  renderMain,
  renderQuickEntryDialog
} from "./views/homeView.js";
import {
  renderConsultationPanel,
  renderPrescriptionPanel
} from "./views/prescriptionPanels.js";
import { renderHistoryPage } from "./views/historyView.js";
import {
  renderVideoToolbar,
  videoMediaState
} from "./views/videoMedia.js";
import { getActiveConsultationRecord } from "./views/renderRecordSelectors.js";
import {
  renderChatInput,
  renderChatMessageMenu,
  renderChatPanel,
  renderChatThread,
  renderConsultAttachmentDialog
} from "./views/chatView.js";
import {
  renderRoomMain,
  renderRoomSidebar,
  renderRoomTopbar,
  renderSidebar,
  renderTopbar
} from "./views/roomShellView.js";

export {
  formatDuration,
  renderButton,
  renderCheckbox,
  renderCheckboxMark,
  renderDurationChip,
  renderLabelTag,
  renderReadTag,
  renderRiskTag,
  renderStatusBadge,
  renderSwitch
} from "./components/primitives.js";
export { renderConsultConfirmDialogs } from "./components/dialogs.js";
export {
  renderAnnouncementDialog,
  renderAnnouncementListDialog,
  renderConsultCard,
  renderMain,
  renderNoticeCard,
  renderQuickActions,
  renderQuickEntryDialog,
  renderServiceCard,
  renderWaitingCard
} from "./views/homeView.js";
export {
  defaultPatientDetail,
  defaultPrescriptionMedicines,
  renderConsultationPanel,
  renderDiagnosisSelectInput,
  renderDiagnosisTags,
  renderMedicineSearchCombobox,
  renderMedicineTableRow,
  renderPatientInfoGrid,
  renderPrescriptionPanel,
  renderPrescriptionRemarkSelect,
  renderSearchField,
  renderSelectField
} from "./views/prescriptionPanels.js";
export {
  renderVideoMediaIcon,
  renderVideoToolbar,
  videoMediaState
} from "./views/videoMedia.js";

export function getDoctorStatusLabel(status = renderRuntime.doctorStatus) {
  return getPrimitiveDoctorStatusLabel(status);
}

export function renderQuickReplyDialog() {
  return renderQuickReplyDialogView({
    categories: renderData.quickReplyCategories,
    messages: renderData.quickReplyMessages
  });
}

export function renderRiskWarningDialog() {
  const record = getActiveConsultationRecord();
  const medicines = record?.prescriptionMedicines?.length ? record.prescriptionMedicines : [];
  return renderRiskWarningDialogView({ medicines });
}

export function renderRoom() {
  return `
    <div class="app-shell room-shell app-shell--responsive">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      ${renderRoomMain()}
      ${renderQuickReplyDialog()}
      ${renderRiskWarningDialog()}
      ${renderConsultConfirmDialogs()}
      ${renderChatMessageMenu()}
      ${renderConsultAttachmentDialog()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

function getRecordMedicineTypeLabel(record) {
  if (record?.type === "consult") return record.consultationAttribute === "with-medicine" ? "带药" : "珮文";
  return "中药";
}

function getConsultMainTitle(record) {
  if (record?.type === "consult" && (!record.title || record.title.includes("图文咨询"))) {
    return "武汉市好药师大药房";
  }
  return record?.title || "图文问诊";
}

function renderConsultMainShell({ label, title, elapsedSeconds = 0, chatPanel, prescriptionPanel, record = null }) {
  return `
    <main class="text-main consult-room-main">
      <section class="text-card consult-room-card" aria-label="${label}">
        <div class="pharmacy-bar">
          <div class="pharmacy-bar__left">
            <h2>${title}</h2>
            ${renderRiskTag({ text: "迎检", size: "lg", className: "risk-tag--inspection" })}
            ${renderLabelTag({ text: getRecordMedicineTypeLabel(record), tone: "focus", size: "lg", className: "risk-tag--medicine medicine-type-tag" })}
          </div>
          <div class="pharmacy-bar__right">
            ${renderDurationChip("icon", elapsedSeconds)}
            ${renderButton({ text: "取消问诊", tone: "danger", size: "md", className: "cancel-consult-trigger" })}
          </div>
        </div>
        <div class="consult-workspace">
          ${chatPanel}
          ${prescriptionPanel}
        </div>
      </section>
    </main>`;
}

export function renderTextMain() {
  const record = getActiveConsultationRecord("text");
  const isConsult = record?.type === "consult";
  return renderConsultMainShell({
    label: isConsult ? "图文咨询" : "图文问诊",
    title: getConsultMainTitle(record),
    elapsedSeconds: record?.elapsedSeconds ?? 0,
    chatPanel: renderChatPanel(record?.id, { record }),
    prescriptionPanel: isConsult ? renderConsultationPanel({ record }) : renderPrescriptionPanel({ record }),
    record
  });
}


function renderConsultPage({ shellClass = "", main }) {
  return `
    <div class="app-shell room-shell consult-shell${shellClass ? ` ${shellClass}` : ""} app-shell--responsive">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      ${main}
      ${renderQuickReplyDialog()}
      ${renderRiskWarningDialog()}
      ${renderConsultConfirmDialogs()}
      ${renderChatMessageMenu()}
      ${renderConsultAttachmentDialog()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

export function renderTextPage() {
  return renderConsultPage({ shellClass: "text-shell", main: renderTextMain() });
}

export function renderVideoChatPanel() {
  const { cameraOn } = videoMediaState;
  const record = getActiveConsultationRecord("video");
  return `
    <section class="chat-panel video-chat-panel" aria-label="视频聊天区域">
      <div class="video-window" data-video-controls="true">
        <img class="video-window__main" src="${assetUrl("assets/video-main.png")}" alt="患者视频画面" />
        <div class="video-window__pip video-window__pip--local${cameraOn ? "" : " is-camera-off"}">
          <video class="video-window__local-video" data-local-camera autoplay muted playsinline aria-label="医生摄像头画面"></video>
          <div class="video-window__camera-status" data-camera-status>正在连接摄像头</div>
          <div class="video-window__pip-off" aria-hidden="${cameraOn}">摄像头已关闭</div>
        </div>
        ${renderVideoToolbar()}
      </div>
      ${renderChatThread(record?.id, { threadClass: "video-chat-thread" })}
      <div class="video-input-wrap">
        ${renderChatInput()}
      </div>
    </section>`;
}

export function renderVideoMain() {
  const record = getActiveConsultationRecord("video");
  return renderConsultMainShell({
    label: "视频问诊",
    title: record?.title || "视频问诊",
    elapsedSeconds: record?.elapsedSeconds ?? 0,
    chatPanel: renderVideoChatPanel(),
    prescriptionPanel: renderPrescriptionPanel({ record })
  });
}

export function renderVideoPage() {
  return renderConsultPage({ shellClass: "text-shell video-shell", main: renderVideoMain() });
}

export function renderAppMarkup() {
  return appView === "room"
    ? renderRoom()
    : appView === "text"
      ? renderTextPage()
      : appView === "video"
        ? renderVideoPage()
        : appView === "history"
          ? renderHistoryPage({
              quickReplyDialog: renderQuickReplyDialog(),
              riskWarningDialog: renderRiskWarningDialog()
            })
    : `
    <div class="app-shell app-shell--responsive">
      ${renderTopbar()}
      ${renderSidebar()}
      ${renderMain()}
      ${renderAnnouncementDialog()}
      ${renderAnnouncementListDialog()}
      ${renderQuickEntryDialog()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}
