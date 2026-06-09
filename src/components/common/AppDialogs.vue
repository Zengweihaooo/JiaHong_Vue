<template>
  <div :class="['announcement-overlay', { 'is-open': store.announcementDialogVisible }]" :aria-hidden="!store.announcementDialogVisible" @click.self="store.announcementDialogVisible = false">
    <section v-if="store.selectedAnnouncement" class="announcement-dialog" role="dialog" aria-modal="true" aria-labelledby="announcement-dialog-title">
      <header class="announcement-dialog__header">
        <h2 id="announcement-dialog-title">公告详情</h2>
        <button class="announcement-dialog__close" type="button" aria-label="关闭公告详情" @click="store.announcementDialogVisible = false">
          <img :src="assetUrl('assets/quick-reply-close.svg')" alt="" aria-hidden="true" />
        </button>
      </header>
      <div class="announcement-dialog__body">
        <div class="announcement-dialog__meta">
          <h3>{{ store.selectedAnnouncement.title }}</h3>
          <span>{{ store.selectedAnnouncement.date }}</span>
        </div>
        <p>{{ store.selectedAnnouncement.content }}</p>
        <div class="announcement-dialog__publisher">{{ store.selectedAnnouncement.publisher }}</div>
      </div>
    </section>
  </div>

  <div :class="['announcement-list-overlay', { 'is-open': store.announcementListVisible }]" :aria-hidden="!store.announcementListVisible" @click.self="store.announcementListVisible = false">
    <section class="announcement-list-dialog" role="dialog" aria-modal="true" aria-labelledby="announcement-list-title">
      <header class="announcement-dialog__header">
        <h2 id="announcement-list-title">历史公告</h2>
        <button class="announcement-list-dialog__close announcement-dialog__close" type="button" aria-label="关闭历史公告" @click="store.announcementListVisible = false">
          <img :src="assetUrl('assets/quick-reply-close.svg')" alt="" aria-hidden="true" />
        </button>
      </header>
      <div class="announcement-list-dialog__body">
        <button
          v-for="announcement in store.announcements"
          :key="announcement.id"
          class="announcement-list-item"
          type="button"
          :data-announcement-id="announcement.id"
          @click="openAnnouncement(announcement.id)"
        >
          <span class="announcement-list-item__main">
            <span class="announcement-list-item__title">
              <span class="announcement-list-item__title-text">{{ announcement.title }}</span>
              <span v-if="announcement.unread" class="announcement-list-item__unread-dot" aria-label="未读公告"></span>
            </span>
            <span class="announcement-list-item__summary">{{ announcement.content.split("\n")[0] }}</span>
          </span>
          <span class="announcement-list-item__date">{{ announcement.date }}</span>
        </button>
      </div>
    </section>
  </div>

  <div :class="['quick-entry-overlay', { 'is-open': store.quickEntryDialogVisible }]" :aria-hidden="!store.quickEntryDialogVisible" @click.self="store.closeQuickEntryDialog()">
    <section class="quick-entry-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-entry-title">
      <header class="announcement-dialog__header">
        <h2 id="quick-entry-title">{{ store.quickEntryEditingIndex >= 0 ? "编辑快捷入口" : "添加快捷入口" }}</h2>
        <button class="quick-entry-dialog__close announcement-dialog__close" type="button" aria-label="关闭添加快捷入口" @click="store.closeQuickEntryDialog()">
          <img :src="assetUrl('assets/quick-reply-close.svg')" alt="" aria-hidden="true" />
        </button>
      </header>
      <div class="quick-entry-dialog__body">
        <button
          v-for="(option, index) in store.availableQuickEntryOptions"
          :key="option.title"
          class="quick-entry-option"
          type="button"
          :data-option-index="index"
          @click="store.selectQuickEntryOption(option)"
        >
          <span class="icon-box">
            <template v-if="option.icon === 'quickCalendar'">
              <span class="quick-icon quick-icon--schedule" aria-hidden="true">
                <img class="quick-icon__base" :src="assetUrl('assets/figma-home/quick-schedule-box.svg')" alt="" />
                <img class="quick-icon__mark" :src="assetUrl('assets/figma-home/quick-schedule-mark.svg')" alt="" />
              </span>
            </template>
            <template v-else-if="option.icon === 'clock'">
              <span class="quick-icon quick-icon--clock" aria-hidden="true">
                <img class="quick-icon__base" :src="assetUrl('assets/figma-home/quick-clock-circle.svg')" alt="" />
                <img class="quick-icon__hand" :src="assetUrl('assets/figma-home/quick-clock-hand.svg')" alt="" />
              </span>
            </template>
            <img v-else-if="option.icon === 'document'" class="quick-icon quick-icon--document" :src="assetUrl('assets/figma-home/quick-doc.svg')" alt="" aria-hidden="true" />
            <img v-else-if="option.icon === 'plus'" class="quick-icon quick-icon--plus" :src="assetUrl('assets/figma-home/quick-plus.svg')" alt="" aria-hidden="true" />
            <span v-else :class="['quick-icon quick-icon--menu', `quick-icon--menu-${option.icon}`]" aria-hidden="true"></span>
          </span>
          <span class="quick-entry-option__copy">
            <span class="quick-entry-option__title">{{ option.title }}</span>
            <span class="quick-entry-option__desc">{{ option.desc }}</span>
          </span>
        </button>
        <p class="quick-entry-dialog__empty" :hidden="store.availableQuickEntryOptions.length > 0">暂无可添加的快捷入口</p>
      </div>
    </section>
  </div>

  <div :class="['quick-reply-overlay', { 'is-open': store.quickReplyDialogVisible }]" :aria-hidden="!store.quickReplyDialogVisible" @click.self="store.quickReplyDialogVisible = false">
    <section class="quick-reply-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-reply-title">
      <header class="quick-reply-dialog__header">
        <h2 id="quick-reply-title">快捷用语</h2>
        <button class="quick-reply-dialog__close" type="button" aria-label="关闭快捷用语" @click="store.quickReplyDialogVisible = false">
          <img :src="assetUrl('assets/quick-reply-close.svg')" alt="" />
        </button>
      </header>
      <div class="quick-reply-dialog__body">
        <nav class="quick-reply-categories" aria-label="快捷回复分类">
          <button
            v-for="(category, index) in store.quickReplyCategories"
            :key="category"
            :class="['quick-reply-category', { 'is-active': index === activeQuickReplyCategoryIndex }]"
            type="button"
            @click="activeQuickReplyCategoryIndex = index"
          >
            {{ category }}
          </button>
        </nav>
        <div class="quick-reply-list" role="list">
          <button
            v-for="message in store.quickReplyMessages"
            :key="message"
            class="quick-reply-message"
            type="button"
            role="listitem"
            @pointerdown="applyQuickReplyMessage(message, $event)"
            @click.prevent.stop
          >
            <span>{{ message }}</span>
          </button>
        </div>
      </div>
      <footer class="quick-reply-dialog__footer">单击快捷用语填入输入框并关闭，双击即可发送</footer>
    </section>
  </div>

  <div
    :class="['chat-message-menu', { 'is-open': store.chatMessageMenu.visible }]"
    role="menu"
    :aria-hidden="!store.chatMessageMenu.visible"
    :hidden="!store.chatMessageMenu.visible"
    :style="chatMessageMenuStyle"
  >
    <button type="button" class="chat-message-menu__item" role="menuitem" data-action="recall" @click="store.runChatMessageAction('recall')">撤回</button>
    <button type="button" class="chat-message-menu__item" role="menuitem" data-action="copy" @click="store.runChatMessageAction('copy')">复制</button>
    <button type="button" class="chat-message-menu__item" role="menuitem" data-action="quote" @click="store.runChatMessageAction('quote')">引用</button>
  </div>

  <div
    :class="[
      'toast',
      toastToneClass,
      { 'toast--home-status': store.toast.placement === 'home-status', 'is-visible': store.toast.visible }
    ]"
    :style="toastStyle"
    :role="toastRole"
    aria-live="polite"
  >
    <span v-if="toastIcon" class="toast__icon" aria-hidden="true">{{ toastIcon }}</span>
    <span class="toast__label">{{ store.toast.message }}</span>
  </div>

  <div :class="['risk-warning-overlay', { 'is-open': store.riskWarningDialogVisible }]" :aria-hidden="!store.riskWarningDialogVisible">
    <section class="risk-warning-dialog" role="dialog" aria-modal="false" aria-labelledby="risk-warning-title">
      <header class="risk-warning-dialog__header">
        <h2 id="risk-warning-title">风险检测提醒</h2>
        <button class="risk-warning-dialog__close" type="button" aria-label="关闭风险检测提醒" @click="store.closeRiskWarningDialog()">
          <img :src="assetUrl('assets/quick-reply-close.svg')" alt="" />
        </button>
      </header>
      <div class="risk-warning-dialog__legend" aria-label="风险状态说明">
        <div v-for="item in riskLegendItems" :key="item.status" class="risk-warning-legend-item">
          <span class="risk-warning-legend-item__icon" aria-hidden="true">
            <span :class="['risk-warning-status', `risk-warning-status--${item.status}`]"></span>
          </span>
          <span class="risk-warning-legend-item__label">{{ item.label }}</span>
        </div>
      </div>
      <div class="risk-warning-dialog__table-wrap">
        <div class="risk-warning-table" role="table" aria-label="风险检测提醒">
          <div class="risk-warning-row risk-warning-row--head" role="row">
            <div v-for="header in riskHeaders" :key="header" class="risk-warning-cell" role="columnheader">
              <span v-if="compactRiskHeaders[header]" class="risk-warning-cell__stack">
                <span v-for="line in compactRiskHeaders[header]" :key="line">{{ line }}</span>
              </span>
              <template v-else>{{ header }}</template>
            </div>
          </div>
          <div
            v-for="row in riskRows"
            :key="row.name"
            :class="['risk-warning-row', { 'risk-warning-row--linked': row.linked }]"
            role="row"
          >
            <div class="risk-warning-cell risk-warning-cell--name" role="cell">{{ row.name }}</div>
            <div v-for="(_, index) in riskHeaders.slice(1)" :key="index" class="risk-warning-cell risk-warning-cell--status" role="cell">
              <span v-if="row.warnings[index + 1]" :class="['risk-warning-status', `risk-warning-status--${row.warnings[index + 1]}`]" aria-hidden="true"></span>
            </div>
          </div>
        </div>
      </div>
      <div class="risk-warning-dialog__divider"></div>
      <div class="risk-warning-dialog__message-wrap">
        <div class="risk-warning-message-list" aria-label="警示与建议信息">
          <button
            v-for="item in riskMessageItems"
            :key="item.copyText"
            :class="['risk-warning-message-item', `risk-warning-message-item--${item.tone}`]"
            type="button"
            :data-copy-text="item.copyText"
            title="点击复制"
            @click="copyRiskWarningMessage(item.copyText, $event)"
          >
            <span class="risk-warning-message-item__label">[{{ item.label }}]</span>
            <span class="risk-warning-message-item__content">{{ item.content }}</span>
            <span class="risk-warning-message-item__copy">点击复制</span>
          </button>
        </div>
      </div>
    </section>
  </div>

  <div v-if="store.selectedAttachment" class="consult-attachment-overlay is-open" role="dialog" aria-modal="true" @click.self="store.selectedAttachment = null">
    <div class="consult-attachment-dialog">
      <div class="consult-attachment-dialog__header">
        <h2>
          <span class="consult-attachment-dialog__icon" aria-hidden="true"></span>
          <span>{{ store.selectedAttachment?.title || "附件1" }}</span>
        </h2>
        <button class="consult-attachment-dialog__close" type="button" aria-label="关闭附件预览" @click="store.selectedAttachment = null"></button>
      </div>
      <div class="consult-attachment-dialog__body">
        <img class="consult-attachment-dialog__image" :src="store.selectedAttachment?.image || assetUrl('assets/figma-consult/attachment-preview.png')" alt="附件预览" />
        <span class="consult-attachment-dialog__scrub consult-attachment-dialog__scrub--prev" aria-hidden="true"></span>
        <span class="consult-attachment-dialog__scrub consult-attachment-dialog__scrub--next" aria-hidden="true"></span>
        <span class="consult-attachment-dialog__scrub consult-attachment-dialog__scrub--pager" aria-hidden="true"></span>
        <span class="consult-attachment-dialog__pager">{{ attachmentPager }}</span>
        <button class="consult-attachment-dialog__page consult-attachment-dialog__page--prev" type="button" aria-label="上一页" @click="switchConsultAttachment(-1, $event)"></button>
        <button class="consult-attachment-dialog__page consult-attachment-dialog__page--next" type="button" aria-label="下一页" @click="switchConsultAttachment(1, $event)"></button>
      </div>
    </div>
  </div>

  <div :class="['consult-confirm-overlay', { 'is-open': store.consultConfirmKind === 'cancel' }]" data-confirm-kind="cancel" :aria-hidden="store.consultConfirmKind !== 'cancel'">
    <section
      class="consult-confirm-dialog consult-confirm-dialog--cancel-reason"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="consult-confirm-title-cancel"
    >
      <header class="consult-confirm-dialog__header">
        <h2 id="consult-confirm-title-cancel">取消问诊原因</h2>
        <button type="button" class="consult-confirm-dialog__close" aria-label="关闭" @click="store.consultConfirmKind = ''">
          <img :src="assetUrl('assets/quick-reply-close.svg')" alt="" />
        </button>
      </header>
      <div class="consult-cancel-reasons">
        <div class="consult-cancel-reasons__head">
          <span>取消原因类型</span>
          <span>具体内容</span>
        </div>
        <div class="consult-cancel-reasons__body">
          <nav class="consult-cancel-reason-types" aria-label="取消原因类型">
            <button
              v-for="group in cancelReasonGroups"
              :key="group.key"
              :class="['consult-cancel-reason-type', { 'is-active': group.key === activeCancelReasonGroup }]"
              type="button"
              :aria-pressed="group.key === activeCancelReasonGroup"
              :data-cancel-reason-type="group.key"
              @click="activeCancelReasonGroup = group.key"
            >
              {{ group.label }}
            </button>
          </nav>
          <div class="consult-cancel-reason-list" role="list" aria-label="具体内容">
            <button
              v-for="reason in activeCancelReasons"
              :key="reason"
              :class="['consult-cancel-reason', { 'is-active': reason === selectedCancelReason }]"
              type="button"
              role="listitem"
              :aria-pressed="reason === selectedCancelReason"
              :data-cancel-reason="reason"
              :data-cancel-reason-group="activeCancelReasonGroup"
              @click="selectedCancelReason = reason"
            >
              {{ reason }}
            </button>
          </div>
        </div>
      </div>
      <footer class="consult-confirm-dialog__footer">
        <button class="jh-btn jh-btn--md jh-btn--outline-secondary consult-confirm-dismiss" type="button" @click="store.consultConfirmKind = ''">取消</button>
        <button class="jh-btn jh-btn--md jh-btn--primary consult-confirm-submit" type="button" @click="confirmConsultAction('CANCEL')">确定</button>
      </footer>
    </section>
  </div>

  <div :class="['consult-confirm-overlay', { 'is-open': store.consultConfirmKind === 'end' }]" data-confirm-kind="end" :aria-hidden="store.consultConfirmKind !== 'end'">
    <section
      class="consult-confirm-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="consult-confirm-title-end"
      aria-describedby="consult-confirm-desc-end"
    >
      <header class="consult-confirm-dialog__header">
        <h2 id="consult-confirm-title-end">结束问诊</h2>
        <button type="button" class="consult-confirm-dialog__close" aria-label="关闭" @click="store.consultConfirmKind = ''">
          <img :src="assetUrl('assets/quick-reply-close.svg')" alt="" />
        </button>
      </header>
      <div class="consult-confirm-dialog__body">
        <p id="consult-confirm-desc-end">确定要结束本次问诊吗？结束后将无法继续与患者沟通。</p>
      </div>
      <footer class="consult-confirm-dialog__footer">
        <button class="jh-btn jh-btn--md jh-btn--outline-secondary consult-confirm-dismiss" type="button" @click="store.consultConfirmKind = ''">再想想</button>
        <button class="jh-btn jh-btn--md jh-btn--danger consult-confirm-submit" type="button" @click="confirmConsultAction('END')">确定结束</button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { getMedicineRiskWarnings, prescriptionRiskCategories } from "@/domain/prescriptionRisk";
import { useAppStore } from "@/stores/app";
import { assetUrl } from "@jiahong/ui";

const store = useAppStore();
const activeCancelReasonGroup = ref("patient");
const selectedCancelReason = ref("");
const activeQuickReplyCategoryIndex = ref(0);
const lastQuickReplyPointerAt = new Map();
let closeQuickReplyTimer = 0;
const chatMessageMenuStyle = computed(() => ({
  left: `${Math.max(8, store.chatMessageMenu.x || 0)}px`,
  top: `${Math.max(8, store.chatMessageMenu.y || 0)}px`
}));
const toastIcons = {
  success: "✓",
  offline: "!",
  info: "i",
  warning: "!"
};
const toastIcon = computed(() => toastIcons[store.toast.tone] || "");
const toastToneClass = computed(() => (store.toast.tone === "default" ? "" : `toast--${store.toast.tone}`));
const toastRole = computed(() => (store.toast.tone === "warning" || store.toast.tone === "offline" ? "alert" : "status"));
const toastStyle = computed(() => {
  if (store.toast.placement !== "home-status" || !store.toast.x || !store.toast.y) return {};
  return {
    "--toast-home-left": `${store.toast.x}px`,
    "--toast-home-top": `${store.toast.y}px`
  };
});
const attachmentPager = computed(() => {
  const attachment = store.selectedAttachment;
  const index = Number(attachment?.index || 1);
  const total = Number(attachment?.total || attachment?.attachmentList?.length || 4);
  return `${index}/${total}`;
});
const cancelReasonGroups = [
  {
    key: "patient",
    label: "患者原因",
    reasons: ["患者原因不进行购买了", "患者只进行咨询", "用户取消", "药店端无患者", "有视频无人应答"]
  },
  {
    key: "medicine",
    label: "药品禁忌",
    reasons: ["药品与性别不符", "药品与年龄不符", "处方内药品配伍冲突", "病情特殊存在用药禁忌", "重复用药", "违规药品，拒绝开方"]
  },
  {
    key: "scope",
    label: "诊疗范围",
    reasons: ["疾病与科室不符", "诊断与拟购药品不符", "首诊开方", "危急重症开方", "动植物开方", "超疗程处方"]
  },
  {
    key: "prescription",
    label: "处方信息",
    reasons: ["药品名称错误", "药品规格错误", "凭证不符", "实名制药品超限"]
  },
  {
    key: "connection",
    label: "连接异常",
    reasons: ["没有视频接不通", "问诊中对方视频中断", "医生超时未开方"]
  }
];
const activeCancelReasons = computed(() => cancelReasonGroups.find((group) => group.key === activeCancelReasonGroup.value)?.reasons || []);
const riskLegendItems = [
  { status: "must", label: "必须处理" },
  { status: "severe", label: "严重警告" },
  { status: "general", label: "一般警告" }
];
const riskHeaders = ["药品名称", ...prescriptionRiskCategories];
const compactRiskHeaders = {
  患者条件: ["患者", "条件"],
  重复用药: ["重复", "用药"],
  用法用量: ["用法", "用量"],
  给药途径: ["给药", "途径"],
  相互作用: ["相互", "作用"],
  生化指标: ["生化", "指标"]
};
const riskRows = computed(() => {
  const medicines = store.activeRecord?.prescriptionMedicines || [];
  const linkedMedicine = medicines.find((medicine) => medicine.warningMessage);
  const rows = medicines.map((medicine) => ({
    name: medicine.name,
    linked: medicine === linkedMedicine,
    warnings: Object.fromEntries(
      getMedicineRiskWarnings(medicine).map((warning) => [prescriptionRiskCategories.indexOf(warning.category) + 1, warning.level])
    )
  }));
  return rows.length ? rows : [{ name: "暂无用药数据", warnings: {} }];
});
const riskMessageItems = computed(() => {
  const medicines = store.activeRecord?.prescriptionMedicines || [];
  const fallbackName = riskRows.value[0]?.name || "当前药品";
  const warningMessage = `[警示信息]${fallbackName}需完成风险核对`;
  const warningSuggestion = "[建议信息]请结合患者基础信息、过敏史和用药风险完成处方确认。";
  const messageItems = (medicines.length ? medicines : [{ warningMessage, warningSuggestion }])
    .flatMap((medicine) => [medicine.warningMessage, medicine.warningSuggestion])
    .filter(Boolean);
  const source = messageItems.length ? messageItems : [warningMessage, warningSuggestion];
  return source.map((message) => {
    const match = String(message).match(/^\[([^\]]+)\](.*)$/);
    const label = match ? match[1] : "提示信息";
    return {
      label,
      content: match ? match[2] : message,
      copyText: message,
      tone: label.includes("警示") ? "warning" : "suggestion"
    };
  });
});

function openAnnouncement(id) {
  store.selectedAnnouncementId = id;
  store.announcementListVisible = false;
  store.markAnnouncementRead(id);
  store.announcementDialogVisible = true;
}

function fillQuickReply(message) {
  if (store.activeRecordId) {
    store.chatDrafts[store.activeRecordId] = message;
  } else {
    return false;
  }
  nextTick(() => {
    const input = document.querySelector(".jh-chat-input textarea");
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });
  return true;
}

async function sendQuickReply(message) {
  store.quickReplyDialogVisible = false;
  await store.sendDoctorMessage(message);
}

function applyQuickReplyMessage(message, event) {
  event?.preventDefault();
  event?.stopPropagation();
  const now = Date.now();
  const lastPointerAt = Number(lastQuickReplyPointerAt.get(message) || 0);
  const shouldSend = now - lastPointerAt <= 320;
  lastQuickReplyPointerAt.set(message, shouldSend ? 0 : now);
  const didFill = fillQuickReply(message);
  if (!didFill) return;
  if (shouldSend) {
    window.clearTimeout(closeQuickReplyTimer);
    store.sendDoctorMessage(message);
    window.setTimeout(() => {
      store.quickReplyDialogVisible = false;
    }, 120);
  } else {
    window.clearTimeout(closeQuickReplyTimer);
    closeQuickReplyTimer = window.setTimeout(() => {
      store.quickReplyDialogVisible = false;
    }, 360);
  }
}

async function copyRiskWarningMessage(text, event) {
  event?.preventDefault();
  event?.stopPropagation();
  try {
    await navigator.clipboard.writeText(text || "");
    store.showToast("已复制警示信息");
  } catch {
    store.showToast("复制失败");
  }
}

function switchConsultAttachment(direction, event) {
  event?.preventDefault();
  event?.stopPropagation();
  const attachment = store.selectedAttachment;
  const list = attachment?.attachmentList || [];
  if (!attachment || !list.length) return;
  const currentIndex = Number(attachment.index || 1) - 1;
  const nextIndex = (currentIndex + direction + list.length) % list.length;
  store.selectedAttachment = {
    ...list[nextIndex],
    index: nextIndex + 1,
    total: list.length,
    attachmentList: list
  };
}

async function confirmConsultAction(event) {
  if (event === "CANCEL" && !selectedCancelReason.value) {
    store.showToast("请选择取消原因");
    return;
  }
  store.consultConfirmKind = "";
  await store.endActiveConsultation(event);
}

watch(
  () => store.consultConfirmKind,
  (kind) => {
    if (kind !== "cancel") return;
    activeCancelReasonGroup.value = cancelReasonGroups[0]?.key || "";
    selectedCancelReason.value = "";
  }
);
</script>
