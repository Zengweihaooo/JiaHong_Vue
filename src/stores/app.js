import { defineStore } from "pinia";
import { normalizeArchivedConsultationRecord } from "@/domain/archivedConsultation";
import {
  buildWaitingQueueFromRecords,
  getMessageListRecords,
  getNextOngoingVideoConsultationRecord
} from "@/domain/consultationQueue";
import {
  getMessageBadgeKey,
  isMessageBadgeDismissed,
  readDismissedMessageBadges,
  rememberDismissedMessageBadge
} from "@/domain/messageBadges";
import { isQuickEntryAlreadyUsed, maxQuickActionCards } from "@/domain/quickEntries";
import { appService } from "@/services/appService";

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

const activeVideoStorageKey = "jh.activeVideoConsultationId.v1";
let toastTimer = 0;

function readActiveVideoRecordId() {
  try {
    return window.sessionStorage.getItem(activeVideoStorageKey) || "";
  } catch {
    return "";
  }
}

function writeActiveVideoRecordId(recordId = "") {
  try {
    if (recordId) {
      window.sessionStorage.setItem(activeVideoStorageKey, recordId);
    } else {
      window.sessionStorage.removeItem(activeVideoStorageKey);
    }
  } catch {
    // Runtime storage is a progressive enhancement in browser contexts.
  }
}

function createDoctorMessage(text) {
  return {
    id: `doctor-${Date.now()}`,
    from: "doctor",
    text,
    sentAt: new Date().toISOString(),
    readStatus: "unread"
  };
}

function formatEndedAt(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const useAppStore = defineStore("app", {
  state: () => ({
    ready: false,
    loading: false,
    error: null,
    schemaVersion: null,
    doctor: null,
    waitingQueue: {
      total: 0,
      byType: { text: 0, video: 0, consult: 0 },
      updatedAt: null
    },
    menuGroups: [],
    quickActions: [],
    quickEntryOptions: [],
    announcements: [],
    services: [],
    consultationRecords: [],
    ongoingChats: {},
    quickReplyCategories: [],
    quickReplyMessages: [],
    activeRecordId: "",
    activeVideoRecordId: "",
    messageFilterState: "ongoing",
    messageFilterType: "all",
    userMenuVisible: false,
    announcementDialogVisible: false,
    announcementListVisible: false,
    quickEntryDialogVisible: false,
    quickEntryEditingIndex: -1,
    quickReplyDialogVisible: false,
    riskWarningDialogVisible: false,
    consultConfirmKind: "",
    sidebarCollapsed: false,
    chatMessageMenu: {
      visible: false,
      messageId: "",
      text: "",
      x: 0,
      y: 0
    },
    toast: {
      visible: false,
      message: "",
      tone: "default",
      placement: "default",
      x: 0,
      y: 0
    },
    selectedAnnouncementId: "",
    selectedAttachment: null,
    chatDrafts: {},
    aiCollapsed: true,
    sidebarInteractionStarted: false,
    dismissedMessageBadges: readDismissedMessageBadges()
  }),
  getters: {
    doctorStatus(state) {
      return state.doctor?.status || "offline";
    },
    serviceState(state) {
      return Object.fromEntries(state.services.map((service) => [service.key, Boolean(service.enabled)]));
    },
    latestAnnouncement(state) {
      return state.announcements[0] || null;
    },
    selectedAnnouncement(state) {
      return state.announcements.find((item) => item.id === state.selectedAnnouncementId) || state.announcements[0] || null;
    },
    availableQuickEntryOptions(state) {
      return state.quickEntryOptions.filter(
        (option) => !isQuickEntryAlreadyUsed(state.quickActions, option, state.quickEntryEditingIndex)
      );
    },
    ongoingRecords(state) {
      return getMessageListRecords(state.consultationRecords, {
        type: "all",
        state: "ongoing",
        activeVideoRecordId: state.activeVideoRecordId
      });
    },
    endedRecords(state) {
      return getMessageListRecords(state.consultationRecords, { type: "all", state: "ended" });
    },
    activeRecord(state) {
      return state.consultationRecords.find((record) => record.id === state.activeRecordId) || null;
    },
    activeChat(state) {
      return state.ongoingChats[state.activeRecordId] || null;
    },
    messageList(state) {
      return getMessageListRecords(state.consultationRecords, {
        type: state.messageFilterType,
        state: state.messageFilterState,
        activeVideoRecordId: state.activeVideoRecordId,
        collapseVideoQueue: true
      });
    }
  },
  actions: {
    async bootstrap() {
      this.loading = true;
      this.error = null;
      try {
        const payload = await appService.getAppBootstrap();
        this.schemaVersion = payload.schemaVersion ?? null;
        this.doctor = clone(payload.doctor) || { name: "张医生", status: "offline" };
        this.menuGroups = clone(payload.navigation?.menuGroups) || [];
        this.quickActions = clone(payload.home?.quickActions) || [];
        this.quickEntryOptions = clone(payload.home?.quickEntryOptions) || [];
        this.announcements = clone(payload.home?.announcements) || [];
        this.services = clone(payload.services) || [];
        this.consultationRecords = clone(payload.consultations?.records) || [];
        this.ongoingChats = clone(payload.consultations?.ongoingChats) || {};
        this.syncWaitingQueue();
        this.quickReplyCategories = clone(payload.quickReplies?.categories) || [];
        this.quickReplyMessages = clone(payload.quickReplies?.messages) || [];
        const storedActiveVideoId = readActiveVideoRecordId();
        const storedActiveVideo = this.consultationRecords.find(
          (record) => record.id === storedActiveVideoId && record.type === "video" && record.state === "ongoing"
        );
        this.activeVideoRecordId =
          storedActiveVideo?.id || getNextOngoingVideoConsultationRecord(this.consultationRecords)?.id || "";
        writeActiveVideoRecordId(this.activeVideoRecordId);
        this.ensureActiveRecord();
        this.ready = true;
      } catch (error) {
        this.error = error;
        this.ready = false;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    ensureActiveRecord(preferredId = "") {
      const preferred = preferredId && this.consultationRecords.find((record) => record.id === preferredId);
      if (preferred) {
        this.activeRecordId = preferred.id;
        this.messageFilterState = preferred.state || this.messageFilterState;
        return;
      }
      const source = this.messageFilterState === "ended" ? this.endedRecords : this.ongoingRecords;
      this.activeRecordId = source[0]?.id || "";
    },
    setActiveRecord(recordId) {
      const record = this.consultationRecords.find((item) => item.id === recordId);
      if (!record) return false;
      if (
        record.type === "video" &&
        record.state === "ongoing" &&
        this.activeVideoRecordId &&
        this.activeVideoRecordId !== record.id
      ) {
        this.showToast("当前视频问诊未结束，暂不可进入新的视频问诊", { tone: "warning", duration: 3200 });
        return false;
      }
      this.activeRecordId = record.id;
      this.messageFilterState = record.state;
      this.markConsultationRecordRead(record);
      if (record.type === "video" && record.state === "ongoing") {
        this.activeVideoRecordId = record.id;
        writeActiveVideoRecordId(record.id);
      }
      return true;
    },
    markConsultationRecordRead(record) {
      if (!record) return;
      record.unreadCount = 0;
      record.badge = 0;
      this.dismissedMessageBadges = rememberDismissedMessageBadge(
        getMessageBadgeKey(record.id),
        this.dismissedMessageBadges
      );
    },
    isMessageBadgeDismissed(recordId = "") {
      return isMessageBadgeDismissed(recordId, this.dismissedMessageBadges);
    },
    syncWaitingQueue() {
      this.waitingQueue = buildWaitingQueueFromRecords(this.consultationRecords);
    },
    setMessageFilter({ type = this.messageFilterType, state = this.messageFilterState } = {}) {
      this.messageFilterType = type;
      this.messageFilterState = state;
      this.ensureActiveRecord();
    },
    markAnnouncementRead(announcementId = "") {
      const announcement = this.announcements.find((item) => item.id === announcementId) || this.latestAnnouncement;
      if (!announcement) return null;
      announcement.unread = false;
      return announcement;
    },
    async toggleDoctorStatus() {
      const nextStatus = this.doctorStatus === "offline" ? "online" : "offline";
      await appService.updateDoctorStatus(nextStatus);
      this.doctor = { ...(this.doctor || {}), status: nextStatus };
      this.showToast(nextStatus === "online" ? "上线成功" : "你已下线", {
        tone: nextStatus === "online" ? "success" : "offline",
        placement: "home-status"
      });
    },
    async toggleService(serviceKey) {
      const service = this.services.find((item) => item.key === serviceKey);
      if (!service) return;
      const enabled = !service.enabled;
      await appService.updateServiceAvailability(serviceKey, enabled);
      service.enabled = enabled;
      this.showToast("出诊状态已切换", { tone: "info", placement: "home-status" });
    },
    openQuickEntryDialog(editingIndex = -1) {
      this.quickEntryEditingIndex = Number.isInteger(editingIndex) ? editingIndex : -1;
      this.quickEntryDialogVisible = true;
    },
    closeQuickEntryDialog() {
      this.quickEntryDialogVisible = false;
      this.quickEntryEditingIndex = -1;
    },
    selectQuickEntryOption(option) {
      if (!option) return;
      const editingIndex = this.quickEntryEditingIndex;
      if (isQuickEntryAlreadyUsed(this.quickActions, option, editingIndex)) {
        this.showToast("该快捷入口已存在");
        return;
      }
      const action = clone(option);
      const actionCount = this.quickActions.filter((item) => !item.isAdd).length;
      const insertIndex = this.quickActions.findIndex((item) => item.isAdd);
      const hasCapacity = actionCount < maxQuickActionCards;
      let updated = false;

      if (editingIndex >= 0 && this.quickActions[editingIndex] && !this.quickActions[editingIndex].isAdd) {
        this.quickActions.splice(editingIndex, 1, action);
        updated = true;
      } else if (hasCapacity) {
        this.quickActions.splice(insertIndex >= 0 ? insertIndex : this.quickActions.length, 0, action);
        updated = true;
      } else {
        this.showToast(`最多添加${maxQuickActionCards}个快捷入口`);
      }

      const nextCount = this.quickActions.filter((item) => !item.isAdd).length;
      const addCardIndex = this.quickActions.findIndex((item) => item.isAdd);
      if (nextCount >= maxQuickActionCards && addCardIndex >= 0) {
        this.quickActions.splice(addCardIndex, 1);
      } else if (nextCount < maxQuickActionCards && addCardIndex < 0) {
        this.quickActions.push({ title: "", desc: "添加快捷入口", icon: "plus", isAdd: true });
      }

      this.closeQuickEntryDialog();
      if (updated) this.showToast(`${editingIndex >= 0 ? "已更新" : "已添加"}${option.title}`);
    },
    removeQuickAction(index) {
      const action = this.quickActions[index];
      if (!action || action.isAdd) return;
      this.quickActions.splice(index, 1);
      if (!this.quickActions.some((item) => item.isAdd)) {
        this.quickActions.push({ title: "", desc: "添加快捷入口", icon: "plus", isAdd: true });
      }
      this.showToast("已删除快捷入口");
    },
    reorderQuickAction(fromIndex, toIndex) {
      const sourceIndex = Number(fromIndex);
      const targetIndex = Number(toIndex);
      const source = this.quickActions[sourceIndex];
      const target = this.quickActions[targetIndex];
      if (
        !Number.isInteger(sourceIndex) ||
        !Number.isInteger(targetIndex) ||
        sourceIndex === targetIndex ||
        !source ||
        !target ||
        source.isAdd ||
        target.isAdd
      ) {
        return;
      }
      const [action] = this.quickActions.splice(sourceIndex, 1);
      this.quickActions.splice(targetIndex, 0, action);
      this.showToast("已调整快捷入口顺序");
    },
    async refreshRealtime() {
      const snapshot = await appService.getRealtimeSnapshot();
      if (snapshot.doctorStatus && this.doctor) this.doctor.status = snapshot.doctorStatus;
      if (snapshot.newConsultation?.record?.id) {
        const exists = this.consultationRecords.some((record) => record.id === snapshot.newConsultation.record.id);
        if (!exists) {
          this.consultationRecords.unshift(snapshot.newConsultation.record);
        }
        if (snapshot.newConsultation.chat) {
          this.ongoingChats[snapshot.newConsultation.record.id] = snapshot.newConsultation.chat;
        }
        if (!this.activeVideoRecordId) {
          this.activeVideoRecordId = getNextOngoingVideoConsultationRecord(this.consultationRecords)?.id || "";
          writeActiveVideoRecordId(this.activeVideoRecordId);
        }
      }
      this.syncWaitingQueue();
    },
    async endActiveConsultation(event = "END") {
      const record = this.activeRecord;
      if (!record) return;
      const shouldAutoEnterNextVideo = event === "END" && record.type === "video" && this.activeVideoRecordId === record.id;
      const nextVideoRecord = shouldAutoEnterNextVideo
        ? getNextOngoingVideoConsultationRecord(this.consultationRecords, {
            excludeRecordId: record.id
          })
        : null;
      record.state = event === "END" ? "ended" : "cancelled";
      record.badge = 0;
      record.unreadCount = 0;
      if (record.state === "ended" && !record.endedAt) {
        record.endedAt = formatEndedAt();
      }
      if (record.type === "video" && this.activeVideoRecordId === record.id) {
        this.activeVideoRecordId = nextVideoRecord?.id || "";
        writeActiveVideoRecordId(this.activeVideoRecordId);
      }
      this.syncWaitingQueue();
      await appService.updateConsultationStatus(record.id, event, record);
      if (nextVideoRecord) {
        this.messageFilterState = "ongoing";
        this.messageFilterType = "all";
        this.activeRecordId = nextVideoRecord.id;
        this.showToast("问诊已结束，已自动接入下一位视频问诊");
        return;
      }
      if (record.state === "ended") {
        this.messageFilterState = "ended";
        this.ensureActiveRecord(record.id);
      } else {
        this.messageFilterState = "ongoing";
        this.ensureActiveRecord();
      }
      this.showToast(event === "END" ? "问诊已结束" : "问诊已取消");
    },
    async sendDoctorMessage(text) {
      const content = String(text || "").trim();
      if (!content || !this.activeRecordId) return;
      const recordId = this.activeRecordId;
      const message = createDoctorMessage(content);
      const chat = this.ongoingChats[recordId] || { sessionDate: formatEndedAt(), messages: [] };
      chat.messages = [...(chat.messages || []), message];
      this.ongoingChats[recordId] = chat;
      this.chatDrafts[recordId] = "";
      const response = await appService.generatePatientAutoReply({
        recordId,
        doctorMessage: message,
        record: this.consultationRecords.find((record) => record.id === recordId),
        chat
      });
      if (response?.message && this.ongoingChats[recordId]) {
        this.ongoingChats[recordId].messages.push(response.message);
      }
    },
    recallMessage(messageId) {
      const message = this.activeChat?.messages?.find((item) => item.id === messageId);
      if (message?.from === "doctor") {
        message.recalled = true;
      }
    },
    toggleSidebarCollapsed() {
      this.sidebarInteractionStarted = true;
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    openChatMessageMenu({ messageId = "", text = "", x = 0, y = 0 } = {}) {
      this.chatMessageMenu = {
        visible: true,
        messageId,
        text,
        x,
        y
      };
    },
    closeChatMessageMenu() {
      this.chatMessageMenu.visible = false;
    },
    async runChatMessageAction(action) {
      const { messageId, text } = this.chatMessageMenu;
      if (action === "recall") {
        this.recallMessage(messageId);
        this.showToast("消息已撤回");
      } else if (action === "copy") {
        try {
          await navigator.clipboard.writeText(text || "");
          this.showToast("已复制");
        } catch {
          this.showToast("复制失败");
        }
      } else if (action === "quote" && this.activeRecordId && text) {
        const current = this.chatDrafts[this.activeRecordId]?.trim();
        this.chatDrafts[this.activeRecordId] = current ? `${current}\n引用：${text}` : `引用：${text}`;
        this.showToast("已引用到输入框");
      }
      this.closeChatMessageMenu();
    },
    openRiskWarningDialog() {
      this.riskWarningDialogVisible = true;
    },
    closeRiskWarningDialog() {
      this.riskWarningDialogVisible = false;
    },
    async submitActivePrescription() {
      const record = this.activeRecord;
      if (!record || record.prescriptionSubmitted) return;
      record.prescriptionSubmitted = true;
      record.inlineRiskWarningVisible = false;
      await appService.updateConsultationStatus(record.id, "SUBMIT_PRESCRIPTION", record);
      this.showToast("处方已提交");
    },
    showToast(message, { tone = "default", placement = "default", duration = 1500 } = {}) {
      window.clearTimeout(toastTimer);
      let x = 0;
      let y = 0;
      if (placement === "home-status") {
        const consultCard = document.querySelector(".consult-card");
        const rect = consultCard?.getBoundingClientRect();
        if (rect) {
          x = rect.left + rect.width / 2;
          y = rect.top;
        }
      }
      this.toast = {
        visible: true,
        message,
        tone,
        placement,
        x,
        y
      };
      toastTimer = window.setTimeout(() => {
        this.toast.visible = false;
      }, duration);
    },
    normalizeArchived(record) {
      return normalizeArchivedConsultationRecord(record, this.ongoingChats[record?.id]);
    }
  }
});
