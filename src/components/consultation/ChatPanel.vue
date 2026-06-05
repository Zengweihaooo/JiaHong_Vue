<template>
  <section :class="['chat-panel', { 'video-chat-panel': video }]" aria-label="聊天区域">
    <div v-if="video" class="video-window" data-video-controls>
      <img class="video-window__main" :src="assetUrl('assets/video-main.png')" alt="患者视频画面" />
      <div
        :class="[
          'video-window__pip video-window__pip--local',
          {
            'is-camera-off': !cameraOn,
            'is-camera-loading': cameraLoading,
            'is-camera-ready': cameraReady,
            'is-camera-error': cameraError
          }
        ]"
      >
        <video ref="localVideo" class="video-window__local-video" data-local-camera autoplay muted playsinline aria-label="医生摄像头画面"></video>
        <div class="video-window__camera-status" data-camera-status>{{ cameraStatusText }}</div>
        <div class="video-window__pip-off" :aria-hidden="cameraOn">摄像头已关闭</div>
      </div>
      <div class="video-toolbar">
        <button
          type="button"
          :class="['video-toolbar__btn', { 'is-off': !cameraOn }]"
          :aria-pressed="cameraOn"
          :title="cameraOn ? '关闭摄像头' : '开启摄像头'"
          :aria-label="cameraOn ? '关闭摄像头' : '开启摄像头'"
          @click="toggleCamera"
        >
          <svg v-if="cameraOn" class="video-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h4l2-2h4l2 2h4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <circle cx="12" cy="13" r="3.2" stroke="currentColor" stroke-width="1.6"/>
          </svg>
          <svg v-else class="video-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h4l2-2h4l2 2h4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="m3 3 18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
        <button
          type="button"
          :class="['video-toolbar__btn', { 'is-off': !micOn }]"
          :aria-pressed="micOn"
          :title="micOn ? '关闭麦克风' : '开启麦克风'"
          :aria-label="micOn ? '关闭麦克风' : '开启麦克风'"
          @click="toggleMicrophone"
        >
          <svg v-if="micOn" class="video-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" stroke="currentColor" stroke-width="1.6"/>
            <path d="M6 11v1a6 6 0 0 0 12 0v-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M12 18v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <svg v-else class="video-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 11v1a6 6 0 0 0 9.2 5.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M12 18v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="m4 4 16 16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <section v-if="record?.type === 'consult'" class="consult-info-card" aria-label="咨询信息">
      <h3>咨询信息</h3>
      <div class="consult-info-card__row">
        <span class="consult-info-card__label">病情描述：</span>
        <p>{{ record.consultInfo?.description || "颈部酸痛僵硬，转头活动受限，久坐后痛感加重" }}</p>
      </div>
      <div class="consult-info-card__row">
        <span class="consult-info-card__label">病例信息：</span>
        <div class="consult-attachments">
          <button
            v-for="(attachment, index) in consultAttachments"
            :key="attachment.title"
            class="consult-attachment"
            type="button"
            :aria-label="`预览${attachment.title}`"
            @click="openConsultAttachment(index)"
          >
            <span class="consult-attachment__thumb">
              <img :src="attachment.image" :alt="attachment.title" loading="lazy" />
            </span>
          </button>
        </div>
      </div>
    </section>

    <FollowUpVoucher
      v-if="followUpVoucher"
      title="复诊凭证"
      :variant="followUpVoucher.variant"
      :images="followUpVoucher.images"
      :voices="followUpVoucher.voices"
      @preview-image="openFollowUpImage"
    />

    <div ref="chatThread" :class="video ? 'video-chat-thread' : 'chat-thread'">
      <p v-if="chat?.sessionDate" class="chat-date">{{ chat.sessionDate }}</p>
      <div
        v-for="(message, index) in chatMessages"
        :key="message.id || index"
        :class="['chat-message', `chat-message--${message.from === 'doctor' ? 'doctor' : 'patient'}`]"
      >
        <div v-if="messageTime(message, index)" class="chat-message__meta">
          <time class="chat-message__time">{{ messageTime(message, index) }}</time>
        </div>
        <div
          :class="[
            'chat-bubble',
            `chat-bubble--${message.from === 'doctor' ? 'doctor' : 'patient'}`,
            { 'chat-bubble--recalled': message.recalled, 'chat-bubble--actionable': message.from === 'doctor' }
          ]"
          :data-message-id="message.id"
          :data-chat-context="message.from === 'doctor' ? 'doctor' : undefined"
          @contextmenu.prevent="openMessageMenu(message, $event)"
        >
          <p>{{ message.recalled ? "您撤回了一条消息" : message.text }}</p>
        </div>
        <span v-if="message.from === 'doctor'" :class="['chat-message__read-state', `chat-message__read-state--${doctorReadState(index, message)}`]">
          {{ doctorReadState(index, message) === "read" ? "已读" : "未读" }}
        </span>
      </div>
    </div>

    <div :class="{ 'video-input-wrap': video }">
      <div :class="['ai-reply', store.aiCollapsed ? 'ai-reply--collapsed' : 'ai-reply--expanded']" :data-ai-reply-state="store.aiCollapsed ? 'collapsed' : 'expanded'">
        <div class="ai-reply__head">
          <button
            class="ai-reply__title ai-reply__toggle"
            type="button"
            :aria-label="store.aiCollapsed ? '展开智能推荐回复' : '智能推荐回复已展开'"
            :aria-expanded="!store.aiCollapsed"
            @click="expandAiReply"
          >
            <span class="ai-spark" aria-hidden="true"></span>
            <h3>智能推荐回复</h3>
          </button>
          <div class="ai-reply__actions">
            <button class="ai-reply__refresh" type="button" aria-label="换一批智能推荐回复" @click="refreshAiOptions">
              <el-icon><Refresh /></el-icon>
              <span>换一批</span>
            </button>
            <button class="ai-reply__close" type="button" aria-label="关闭智能推荐回复" @click="collapseAiReply">
              <el-icon><Close /></el-icon>
            </button>
          </div>
        </div>
        <div class="ai-reply__options">
          <button
            v-for="option in aiOptions"
            :key="option.text"
            class="jh-btn jh-btn--md jh-btn--outline-primary jh-btn--ai-pill"
            type="button"
            :data-reply-text="option.text"
            @click="draft = option.text"
            @dblclick="sendAiOption(option.text, $event)"
          >
            <span class="jh-btn--ai-pill__text">{{ option.text }}</span>
            <span v-if="option.tag" class="jh-btn--ai-pill__tag">{{ option.tag }}</span>
          </button>
        </div>
        <p class="ai-reply__notice">AI辅助内容基于患者档案与对话语境生成，仅供医生参考，发送前请核实。</p>
        <div class="jh-chat-input">
          <div class="jh-chat-input__top">
            <button class="jh-btn jh-btn--sm jh-btn--outline-primary quick-reply-trigger" type="button" @click="openQuickReplyDialog">快捷回复</button>
            <textarea v-model="draft" aria-label="回复内容" placeholder="输入回复内容，或点击上方AI推荐快速填充..." @keydown.enter.exact.prevent="send"></textarea>
          </div>
          <div class="jh-chat-input__actions">
            <button class="jh-btn jh-btn--md jh-btn--primary" type="button" @click="send">发送</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { Close, Refresh } from "@element-plus/icons-vue";
import { useAppStore } from "@/stores/app";
import { FollowUpVoucher, assetUrl } from "@jiahong/ui";
import {
  attachLocalCamera,
  getLocalMediaStatus,
  setLocalCameraEnabled,
  setLocalMicrophoneEnabled
} from "@/presentation/ui/localMedia";

const props = defineProps({
  record: {
    type: Object,
    default: null
  },
  video: {
    type: Boolean,
    default: false
  }
});

const store = useAppStore();
const cameraOn = ref(true);
const micOn = ref(true);
const localVideo = ref(null);
const chatThread = ref(null);
const cameraLoading = ref(false);
const cameraReady = ref(false);
const cameraError = ref(false);
const cameraStatusText = ref("正在连接摄像头");
const aiRotation = ref(0);
const draft = computed({
  get: () => store.chatDrafts[props.record?.id] || "",
  set: (value) => {
    if (props.record?.id) store.chatDrafts[props.record.id] = value;
  }
});
const chat = computed(() => store.ongoingChats[props.record?.id] || null);
const chatMessages = computed(() => chat.value?.messages || []);
const consultAttachments = computed(() => {
  const fallback = [
    { title: "附件1", image: "assets/consult-materials/allergic-rhinitis.png" },
    { title: "附件2", image: "assets/consult-materials/pediatric-fever.png" },
    { title: "附件3", image: "assets/consult-materials/sore-throat.png" },
    { title: "附件4", image: "assets/consult-materials/skin-rash.png" }
  ];
  const attachments = props.record?.consultInfo?.attachments?.length ? props.record.consultInfo.attachments : fallback;
  return attachments.map((attachment, index) => ({
    title: attachment.title || `附件${index + 1}`,
    image: assetUrl(attachment.image || "assets/figma-consult/attachment-preview.png")
  }));
});
const followUpVoucher = computed(() => {
  if (props.record?.type !== "text" && props.record?.type !== "video") return null;

  const variants = ["image", "voice", "mixed"];
  const fallbackImages = [
    { title: "图片凭证1", image: "assets/consult-materials/allergic-rhinitis.png" },
    { title: "图片凭证2", image: "assets/consult-materials/pediatric-fever.png" },
    { title: "图片凭证3", image: "assets/consult-materials/sore-throat.png" },
    { title: "图片凭证4", image: "assets/consult-materials/skin-rash.png" }
  ];
  const fallbackVoices = [
    { title: "语音凭证1", duration: 8 },
    { title: "语音凭证2", duration: 7 }
  ];
  const explicitVariant = props.record.followUpVoucher?.type;
  const stableIndex =
    Array.from(String(props.record.id || props.record.title || props.record.type)).reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0
    ) % variants.length;
  const variant = variants.includes(explicitVariant) ? explicitVariant : variants[stableIndex];
  const images = props.record.followUpVoucher?.images?.length ? props.record.followUpVoucher.images : fallbackImages;
  const voices = props.record.followUpVoucher?.voices?.length ? props.record.followUpVoucher.voices : fallbackVoices;

  return {
    variant,
    images,
    voices
  };
});
const baseAiOptions = computed(() => {
  if (props.record?.type === "consult") {
    return [
      { text: "考虑颈部肌肉劳损，多休息少低头", tag: "休息姿势" },
      { text: "颈椎姿势不良引发不适，局部热敷缓解", tag: "热敷缓解" },
      { text: "颈肩筋膜炎，避免久坐适当活动颈部", tag: "活动建议" }
    ];
  }
  if (props.record?.type === "video") {
    return [
      { text: "我先看一下您的咳嗽情况，请把镜头对准面部", tag: "视频确认" },
      { text: "请描述痰色、体温和胸闷气促情况", tag: "症状追问" },
      { text: "如果呼吸明显费力，建议尽快线下就诊", tag: "风险提示" }
    ];
  }
  return [
    { text: "头痛发烧多久啦？体温多少度？", tag: "时间体温" },
    { text: "持续几天了？头痛具体位置在哪，程度如何？", tag: "位置程度" },
    { text: "这是一串智能回复的文字内容，并且这是一行的最长字符数", tag: "语义简介" }
  ];
});
const aiOptions = computed(() => {
  const options = baseAiOptions.value;
  if (options.length < 2) return options;
  const rotation = aiRotation.value % options.length;
  return options.map((_, index) => options[(index + rotation) % options.length]);
});

const defaultMessageIntervalSeconds = 58;
const minimumInitialCameraErrorDelayMs = 2200;
const minimumRetryCameraErrorDelayMs = 900;
let cameraSetupSerial = 0;
let revealCameraErrorRequested = false;
let revealCameraErrorNow = null;

function getCameraErrorText(reason = "") {
  return reason === "NotAllowedError" ? "摄像头权限未开启" : "无法连接摄像头";
}

function requestCameraErrorReveal() {
  revealCameraErrorRequested = true;
  if (revealCameraErrorNow) revealCameraErrorNow();
}

async function setupLocalCamera({ forceRetry = false } = {}) {
  if (!props.video || !localVideo.value) return;
  const setupId = ++cameraSetupSerial;
  const startedAt = window.performance.now();
  revealCameraErrorRequested = false;
  revealCameraErrorNow = null;
  const mediaStatus = getLocalMediaStatus();
  const shouldShowLoading = forceRetry || mediaStatus.status === "idle" || mediaStatus.status === "pending";
  cameraLoading.value = shouldShowLoading;
  cameraStatusText.value = mediaStatus.hasStream
    ? "医生摄像头已连接"
    : shouldShowLoading
      ? "正在连接摄像头"
      : getCameraErrorText(mediaStatus.reason);

  const result = await attachLocalCamera(localVideo.value, {
    cameraOn: cameraOn.value,
    micOn: micOn.value,
    forceRetry
  });
  if (setupId !== cameraSetupSerial) return;
  if (!result.ok) {
    const minimumErrorDelayMs = forceRetry ? minimumRetryCameraErrorDelayMs : minimumInitialCameraErrorDelayMs;
    const elapsed = window.performance.now() - startedAt;
    if (!revealCameraErrorRequested && elapsed < minimumErrorDelayMs) {
      await new Promise((resolve) => {
        const timer = window.setTimeout(resolve, minimumErrorDelayMs - elapsed);
        revealCameraErrorNow = () => {
          window.clearTimeout(timer);
          resolve();
        };
      });
      revealCameraErrorNow = null;
    }
  }
  if (setupId !== cameraSetupSerial) return;
  cameraLoading.value = false;
  cameraReady.value = result.ok;
  cameraError.value = !result.ok;
  cameraStatusText.value = result.ok ? "医生摄像头已连接" : getCameraErrorText(result.reason);
}

async function toggleCamera() {
  cameraOn.value = !cameraOn.value;
  setLocalCameraEnabled(cameraOn.value);
  if (cameraOn.value && cameraError.value) {
    await setupLocalCamera({ forceRetry: true });
  }
}

function toggleMicrophone() {
  micOn.value = !micOn.value;
  setLocalMicrophoneEnabled(micOn.value);
}

function openConsultAttachment(index) {
  const attachments = consultAttachments.value;
  const attachment = attachments[index];
  if (!attachment) return;
  store.selectedAttachment = {
    ...attachment,
    index: index + 1,
    total: attachments.length,
    attachmentList: attachments
  };
}

function openFollowUpImage({ image, index = 0, images = [] } = {}) {
  if (!image) return;
  store.selectedAttachment = {
    ...image,
    index: index + 1,
    total: images.length,
    attachmentList: images
  };
}

function refreshAiOptions() {
  if (baseAiOptions.value.length < 2) return;
  aiRotation.value = (aiRotation.value + 1) % baseAiOptions.value.length;
}

function openQuickReplyDialog(event) {
  event?.preventDefault();
  event?.stopPropagation();
  store.quickReplyDialogVisible = true;
}

function expandAiReply(event) {
  event?.preventDefault();
  event?.stopPropagation();
  if (!store.aiCollapsed) return;
  store.aiCollapsed = false;
}

function collapseAiReply(event) {
  event?.preventDefault();
  event?.stopPropagation();
  store.aiCollapsed = true;
}

onMounted(async () => {
  await nextTick();
  setupLocalCamera();
});

watch(
  () => props.video,
  async (isVideo) => {
    if (!isVideo) return;
    await nextTick();
    setupLocalCamera();
  }
);

watch(
  () => [store.quickReplyDialogVisible, store.consultConfirmKind],
  ([quickReplyVisible, confirmKind]) => {
    if (props.video && (quickReplyVisible || confirmKind)) {
      requestCameraErrorReveal();
    }
  }
);

watch(
  () => chatMessages.value.length,
  (length, previousLength) => {
    if (previousLength !== undefined && length > previousLength) {
      scrollChatThreadToBottom();
    }
  }
);

function parseMessageDate(value = "") {
  if (!value) return null;
  const normalized = String(value).replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTime(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function messageTime(message, index) {
  const explicitDate = parseMessageDate(message.time || message.sentAt || message.createdAt);
  if (explicitDate) return formatTime(explicitDate);
  const sessionDate = parseMessageDate(chat.value?.sessionDate);
  if (!sessionDate) return "";
  return formatTime(new Date(sessionDate.getTime() + index * defaultMessageIntervalSeconds * 1000));
}

function doctorReadState(index, message) {
  if (message.readStatus === "read" || message.read === true) return "read";
  if (message.readStatus === "unread" || message.read === false) return "unread";
  return chatMessages.value.slice(index + 1).some((item) => item.from === "patient") ? "read" : "unread";
}

async function send() {
  await store.sendDoctorMessage(draft.value);
  scrollChatThreadToBottom();
}

async function sendAiOption(text, event) {
  event?.preventDefault();
  event?.stopPropagation();
  draft.value = text;
  await store.sendDoctorMessage(text);
  scrollChatThreadToBottom();
}

async function scrollChatThreadToBottom() {
  await nextTick();
  if (chatThread.value) {
    chatThread.value.scrollTop = chatThread.value.scrollHeight;
  }
}

function openMessageMenu(message, event) {
  if (message.from !== "doctor" || message.recalled) return;
  store.openChatMessageMenu({
    messageId: message.id,
    text: message.text,
    x: event.clientX + 4,
    y: event.clientY + 4
  });
}
</script>
