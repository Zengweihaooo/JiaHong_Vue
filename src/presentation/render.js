import { appView } from "../shared/core.js";
import {
  renderConsultConfirmDialogs,
  renderQuickReplyDialogView,
  renderRiskWarningDialogView
} from "./components/dialogs.js?v=20260527-41";
import { renderData } from "../application/viewModels/renderViewModel.js";
import {
  renderAnnouncementDialog,
  renderAnnouncementListDialog,
  renderMain,
  renderQuickEntryDialog
} from "./views/homeView.js?v=20260527-36";
import {
  renderTextPage,
  renderVideoPage
} from "./views/consultRoomView.js?v=20260527-39";
import { renderHistoryPage } from "./views/historyView.js";
import { getActiveConsultationRecord } from "./views/renderRecordSelectors.js";
import {
  renderChatMessageMenu,
  renderConsultAttachmentDialog
} from "./views/chatView.js?v=20260527-39";
import {
  renderRoomMain,
  renderRoomTopbar,
  renderSidebar,
  renderTopbar
} from "./views/roomShellView.js";
import { renderRoomSidebar } from "./views/roomMessageListView.js";

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

function renderConsultOverlays() {
  return `
      ${renderQuickReplyDialog()}
      ${renderRiskWarningDialog()}
      ${renderConsultConfirmDialogs()}
      ${renderChatMessageMenu()}
      ${renderConsultAttachmentDialog()}`;
}

export function renderRoom() {
  return `
    <div class="app-shell room-shell app-shell--responsive">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      ${renderRoomMain()}
      ${renderConsultOverlays()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

export function renderAppMarkup() {
  return appView === "room"
    ? renderRoom()
    : appView === "text"
      ? renderTextPage({ overlays: renderConsultOverlays() })
      : appView === "video"
        ? renderVideoPage({ overlays: renderConsultOverlays() })
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
