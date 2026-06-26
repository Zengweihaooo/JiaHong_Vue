<template>
  <section :class="['chat-panel', { 'video-chat-panel': video, 'chat-panel--ab-smart-popup': smartReplyVariant === 'c' }]" aria-label="聊天区域">
    <VideoCallWindow
      v-if="video"
      ref="videoWindow"
      :camera-on="cameraOn"
      :mic-on="micOn"
      :camera-loading="cameraLoading"
      :camera-ready="cameraReady"
      :camera-error="cameraError"
      :camera-status-text="cameraStatusText"
      @toggle-camera="toggleCamera"
      @toggle-microphone="toggleMicrophone"
    />

    <ConsultInfoCard
      v-if="consultInfoCard"
      :key="record?.id"
      :description="consultInfoCard.description"
      :images="consultInfoCard.images"
      :voices="consultInfoCard.voices"
      @preview-image="openConsultAttachment"
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
      <div
        v-if="smartReplyVariant !== 'c'"
        :class="[
          'ai-reply',
          store.aiCollapsed ? 'ai-reply--collapsed' : 'ai-reply--expanded',
          smartReplyVariant ? `ai-reply--ab-${smartReplyVariant}` : ''
        ]"
        :data-ai-reply-state="store.aiCollapsed ? 'collapsed' : 'expanded'"
      >
        <div class="ai-reply__head">
          <button
            class="ai-reply__title ai-reply__toggle"
            type="button"
            :aria-label="store.aiCollapsed ? `展开${smartReplyButtonText}` : `${smartReplyTitle}已展开`"
            :aria-expanded="!store.aiCollapsed"
            @click="expandAiReply"
          >
            <span class="ai-spark" aria-hidden="true"></span>
            <h3>{{ smartReplyTitle }}</h3>
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
        <div
          :class="['ai-reply__options', { 'ai-reply__options--long': aiOptionsAreLong }]"
          :data-layout-threshold="aiReplyLayoutTextThreshold"
        >
          <button
            v-for="option in aiOptions"
            :key="option.text"
            class="jh-btn jh-btn--md jh-btn--outline-primary jh-btn--ai-pill"
            type="button"
            :data-reply-text="option.text"
            @click="draft = option.text"
            @dblclick="sendAiOption(option.text, $event)"
          >
            <span class="jh-btn--ai-pill__text">
              <template v-for="segment in aiReplyTextSegments(option)">
                <strong
                  v-if="segment.highlight"
                  :key="`${option.text}-${segment.index}-highlight`"
                  class="jh-btn--ai-pill__keyword"
                >{{ segment.text }}</strong>
                <span v-else :key="`${option.text}-${segment.index}-text`">{{ segment.text }}</span>
              </template>
            </span>
            <span v-if="option.tag" class="jh-btn--ai-pill__tag">{{ option.tag }}</span>
          </button>
        </div>
        <p class="ai-reply__notice">AI辅助内容基于患者档案与对话语境生成，仅供医生参考，发送前请核实。</p>
        <div class="jh-chat-input">
          <div class="jh-chat-input__top">
            <div v-if="smartReplyVariant === 'b' && store.aiCollapsed" class="ab-reply-toolbar">
              <button class="jh-btn jh-btn--sm jh-btn--outline-primary ab-smart-reply-trigger" type="button" @click="expandAiReply">智能回复</button>
              <button class="jh-btn jh-btn--sm jh-btn--outline-primary quick-reply-trigger" type="button" @click="openQuickReplyDialog">快捷回复</button>
            </div>
            <button v-else class="jh-btn jh-btn--sm jh-btn--outline-primary quick-reply-trigger" type="button" @click="openQuickReplyDialog">快捷回复</button>
            <textarea v-model="draft" aria-label="回复内容" placeholder="输入回复内容，或点击上方AI推荐快速填充..." @keydown.enter.exact.prevent="send"></textarea>
          </div>
          <div class="jh-chat-input__actions">
            <button class="jh-btn jh-btn--md jh-btn--primary" type="button" @click="send">发送</button>
          </div>
        </div>
      </div>
      <div v-else class="ai-reply ai-reply--ab-c ai-reply--collapsed" data-ai-reply-state="collapsed">
        <div class="jh-chat-input">
          <div class="jh-chat-input__top">
            <div class="ab-reply-toolbar">
              <button class="jh-btn jh-btn--sm jh-btn--outline-primary ab-smart-reply-trigger" type="button" @click="openAiReplyPopup">智能回复</button>
              <button class="jh-btn jh-btn--sm jh-btn--outline-primary quick-reply-trigger" type="button" @click="openQuickReplyDialog">快捷回复</button>
            </div>
            <textarea v-model="draft" aria-label="回复内容" placeholder="输入回复内容，或点击上方AI推荐快速填充..." @keydown.enter.exact.prevent="send"></textarea>
          </div>
          <div class="jh-chat-input__actions">
            <button class="jh-btn jh-btn--md jh-btn--primary" type="button" @click="send">发送</button>
          </div>
        </div>
        <section v-if="aiReplyPopupVisible" class="ab-ai-popup" role="dialog" aria-modal="false" aria-labelledby="ab-ai-popup-title">
          <header class="ai-reply__head">
            <span class="ai-reply__title">
              <span class="ai-spark" aria-hidden="true"></span>
              <h3 id="ab-ai-popup-title">智能推荐回复</h3>
            </span>
            <div class="ai-reply__actions">
              <button class="ai-reply__refresh" type="button" aria-label="换一批智能推荐回复" @click="refreshAiOptions">
                <el-icon><Refresh /></el-icon>
                <span>换一批</span>
              </button>
              <button class="ai-reply__close" type="button" aria-label="关闭智能推荐回复" @click="aiReplyPopupVisible = false">
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </header>
          <div :class="['ai-reply__options', { 'ai-reply__options--long': aiOptionsAreLong }]">
            <button
              v-for="option in aiOptions"
              :key="option.text"
              class="jh-btn jh-btn--md jh-btn--outline-primary jh-btn--ai-pill"
              type="button"
              :data-reply-text="option.text"
              @click="draft = option.text"
              @dblclick="sendAiOption(option.text, $event)"
            >
              <span class="jh-btn--ai-pill__text">
                <template v-for="segment in aiReplyTextSegments(option)">
                  <strong
                    v-if="segment.highlight"
                    :key="`${option.text}-${segment.index}-popup-highlight`"
                    class="jh-btn--ai-pill__keyword"
                  >{{ segment.text }}</strong>
                  <span v-else :key="`${option.text}-${segment.index}-popup-text`">{{ segment.text }}</span>
                </template>
              </span>
              <span v-if="option.tag" class="jh-btn--ai-pill__tag">{{ option.tag }}</span>
            </button>
          </div>
          <p class="ai-reply__notice">AI辅助内容基于患者档案与对话语境生成，仅供医生参考，发送前请核实。</p>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { Close, Refresh } from "@element-plus/icons-vue";
import { getDoctorReadState } from "@/domain/chatReadState";
import { useAppStore } from "@/stores/app";
import { ConsultInfoCard, VideoCallWindow } from "@jiahong/ui";
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
  },
  smartReplyVariant: {
    type: String,
    default: "",
    validator: (value) => ["", "a", "b", "c"].includes(value)
  }
});

const store = useAppStore();
const cameraOn = ref(true);
const micOn = ref(true);
const videoWindow = ref(null);
const chatThread = ref(null);
const cameraLoading = ref(false);
const cameraReady = ref(false);
const cameraError = ref(false);
const cameraStatusText = ref("正在连接摄像头");
const aiRotation = ref(0);
const aiReplyPopupVisible = ref(false);
const draft = computed({
  get: () => store.chatDrafts[props.record?.id] || "",
  set: (value) => {
    if (props.record?.id) store.chatDrafts[props.record.id] = value;
  }
});
const chat = computed(() => store.ongoingChats[props.record?.id] || null);
const chatMessages = computed(() => chat.value?.messages || []);
const consultInfoCard = computed(() => getConsultInfoCard(props.record));
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
  if (options.length < 2) return options.map(normalizeAiOption);
  const rotation = aiRotation.value % options.length;
  return options.map((_, index) => normalizeAiOption(options[(index + rotation) % options.length]));
});
const aiOptionsAreLong = computed(() =>
  Math.max(0, ...aiOptions.value.map((option) => option.text.length)) >= aiReplyLayoutTextThreshold
);
const smartReplyVariant = computed(() => props.smartReplyVariant);
const smartReplyTitle = computed(() => (props.smartReplyVariant === "b" && store.aiCollapsed ? "智能回复" : "智能推荐回复"));
const smartReplyButtonText = computed(() => (props.smartReplyVariant === "b" ? "智能回复" : "智能推荐回复"));

const defaultMessageIntervalSeconds = 58;
const minimumInitialCameraErrorDelayMs = 2200;
const minimumRetryCameraErrorDelayMs = 900;
const defaultAiReplyHighlights = ["多久", "体温", "几天", "位置", "程度", "痰色", "胸闷气促", "呼吸", "低头", "热敷", "活动颈部"];
const aiReplyLayoutTextThreshold = "这是一串智能回复的文字内容，并且这是一行的最长字符数".length;
const followUpVoucherVariants = ["image", "voice", "mixed"];
const defaultConsultAttachments = [
  { title: "附件1", image: "assets/consult-materials/allergic-rhinitis.png" },
  { title: "附件2", image: "assets/consult-materials/pediatric-fever.png" },
  { title: "附件3", image: "assets/consult-materials/sore-throat.png" },
  { title: "附件4", image: "assets/consult-materials/skin-rash.png" }
];
const followUpVoucherImages = [
  { title: "病例图片1", image: "assets/consult-materials/allergic-rhinitis.png" },
  { title: "病例图片2", image: "assets/consult-materials/pediatric-fever.png" },
  { title: "病例图片3", image: "assets/consult-materials/sore-throat.png" },
  { title: "病例图片4", image: "assets/consult-materials/skin-rash.png" }
];
const followUpVoucherVoices = [
  { title: "病例语音1", duration: 8 },
  { title: "病例语音2", duration: 7 }
];
const defaultConsultCaseVoices = [{ title: "病例信息语音", duration: 7 }];
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
  const localVideo = getLocalVideoElement();
  if (!props.video || !localVideo) return;
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

  const result = await attachLocalCamera(localVideo, {
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

function getLocalVideoElement() {
  const exposedLocalVideo = videoWindow.value?.localVideo;
  return exposedLocalVideo?.value || exposedLocalVideo || null;
}

function normalizeAiOption(option) {
  if (typeof option === "string") {
    return {
      text: option,
      tag: "",
      highlights: getAiReplyHighlights(option)
    };
  }
  const text = option?.text || "";
  return {
    text,
    tag: option?.tag || "",
    highlights: option?.highlights || getAiReplyHighlights(text)
  };
}

function getAiReplyHighlights(text = "") {
  return defaultAiReplyHighlights.filter((keyword) => String(text).includes(keyword));
}

function aiReplyTextSegments(option) {
  const source = String(option?.text || "");
  const matches = (option?.highlights || [])
    .map((keyword) => {
      const value = String(keyword || "");
      return value ? { keyword: value, index: source.indexOf(value) } : null;
    })
    .filter((match) => match && match.index >= 0)
    .sort((left, right) => left.index - right.index || right.keyword.length - left.keyword.length)
    .reduce((result, match) => {
      const previous = result[result.length - 1];
      if (previous && match.index < previous.index + previous.keyword.length) return result;
      return [...result, match];
    }, []);

  if (!matches.length) {
    return [{ text: source, highlight: false, index: 0 }];
  }

  const segments = [];
  let cursor = 0;
  matches.forEach((match) => {
    if (match.index > cursor) {
      segments.push({ text: source.slice(cursor, match.index), highlight: false, index: cursor });
    }
    segments.push({
      text: source.slice(match.index, match.index + match.keyword.length),
      highlight: true,
      index: match.index
    });
    cursor = match.index + match.keyword.length;
  });
  if (cursor < source.length) {
    segments.push({ text: source.slice(cursor), highlight: false, index: cursor });
  }
  return segments;
}

function normalizeVoices(voices = [], fallback = []) {
  const source = Array.isArray(voices) && voices.length ? voices : fallback;
  return source.map((voice, index) =>
    typeof voice === "string"
      ? { title: voice, duration: index === 0 ? 8 : 7 }
      : { title: voice.title || `语音${index + 1}`, duration: Number(voice.duration || 0) || (index === 0 ? 8 : 7) }
  );
}

function getFollowUpVoucher(record = {}) {
  const source = record?.followUpVoucher;
  if (!source) return null;

  const hasImages = Array.isArray(source.images) && source.images.length > 0;
  const hasVoices = Array.isArray(source.voices) && source.voices.length > 0;
  const inferredType = hasImages && hasVoices ? "mixed" : hasImages ? "image" : hasVoices ? "voice" : "";
  const type = followUpVoucherVariants.includes(source.type) ? source.type : inferredType;
  if (!type) return null;

  const images = hasImages ? source.images : followUpVoucherImages;
  const voices = hasVoices ? source.voices : followUpVoucherVoices;
  return {
    type,
    images: type === "voice" ? [] : images.slice(0, 4),
    voices: type === "image" ? [] : voices.slice(0, 2)
  };
}

function normalizeConsultImage(image, index) {
  if (typeof image === "string") {
    return {
      title: image || `附件${index + 1}`,
      image: "assets/figma-consult/attachment-preview.png"
    };
  }
  return {
    title: image.title || `附件${index + 1}`,
    image: image.image || image.src || "assets/figma-consult/attachment-preview.png"
  };
}

function getConsultInfoCard(record = {}) {
  const voucher = getFollowUpVoucher(record);
  const hasConsultInfo = Boolean(record?.consultInfo);
  const hasConsultAttachments = Array.isArray(record?.consultInfo?.attachments) && record.consultInfo.attachments.length > 0;
  if (record?.type !== "consult" && !hasConsultInfo && !voucher) return null;

  const images = [
    ...(hasConsultAttachments ? record.consultInfo.attachments : record?.type === "consult" ? defaultConsultAttachments : []),
    ...(voucher?.images || [])
  ].map(normalizeConsultImage);
  const voices = [
    ...normalizeVoices(record?.consultInfo?.caseVoices, record?.type === "consult" || hasConsultInfo ? defaultConsultCaseVoices : []),
    ...normalizeVoices(voucher?.voices || [])
  ];
  const description = record?.consultInfo?.description || (record?.type === "consult" ? "颈部酸痛僵硬，转头活动受限，久坐后痛感加重" : "");

  if (!description && !images.length && !voices.length) return null;
  return {
    description,
    images,
    voices
  };
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

function openConsultAttachment({ image, index = 0, images = [] } = {}) {
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

function openAiReplyPopup(event) {
  event?.preventDefault();
  event?.stopPropagation();
  aiReplyPopupVisible.value = true;
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
  scrollChatThreadToBottom();
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
  () => props.smartReplyVariant,
  (value) => {
    if (!value) return;
    store.aiCollapsed = true;
    aiReplyPopupVisible.value = false;
  },
  { immediate: true }
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

watch(
  () => [props.record?.id, store.chatScrollNonce],
  () => {
    scrollChatThreadToBottom();
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
  return getDoctorReadState(message, chatMessages.value, index);
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
  if (!chatThread.value) return;
  requestAnimationFrame(() => {
    if (!chatThread.value) return;
    chatThread.value.scrollTop = chatThread.value.scrollHeight;
  });
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

<style scoped>
.ai-reply--ab-b.ai-reply--collapsed {
  overflow: visible;
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.chat-panel--ab-smart-popup {
  overflow: visible;
}

.ai-reply--ab-b.ai-reply--collapsed > .ai-reply__head {
  display: none;
}

.ai-reply--ab-b.ai-reply--collapsed > .ai-reply__options,
.ai-reply--ab-b.ai-reply--collapsed > .ai-reply__notice {
  display: none;
}

.ai-reply--ab-c {
  position: relative;
  overflow: visible;
  min-height: auto;
  padding: 0;
  border: 0;
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.ai-reply--ab-b.ai-reply--collapsed .jh-chat-input,
.ai-reply--ab-c .jh-chat-input {
  display: flex;
  position: relative;
  box-sizing: border-box;
  min-height: 150px;
  padding: 16px 16px 52px;
  overflow: visible;
  border: 1px solid #eceef0;
  border-radius: 8px;
  background: #ffffff;
}

.ai-reply--ab-b.ai-reply--collapsed .jh-chat-input__top,
.ai-reply--ab-c .jh-chat-input__top {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  min-height: 82px;
}

.ab-reply-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ab-smart-reply-trigger {
  width: 88px;
  min-width: 88px;
  height: 32px;
  border-color: #7f63ff;
  color: #6f55ff;
  font-weight: 700;
}

.ab-reply-toolbar .quick-reply-trigger {
  width: 88px;
  min-width: 88px;
  height: 32px;
}

.ai-reply--ab-b.ai-reply--collapsed textarea,
.ai-reply--ab-c textarea {
  width: 100%;
  min-height: 54px;
  padding-right: 120px;
}

.ai-reply--ab-b.ai-reply--collapsed .jh-chat-input__actions,
.ai-reply--ab-c .jh-chat-input__actions {
  position: absolute;
  right: 16px;
  bottom: 16px;
}

.ai-reply--ab-b.ai-reply--collapsed .jh-chat-input__actions .jh-btn,
.ai-reply--ab-c .jh-chat-input__actions .jh-btn {
  width: 88px;
  height: 40px;
}

.ab-ai-popup {
  position: absolute;
  left: calc(100% + 20px);
  bottom: 74px;
  z-index: 80;
  width: 398px;
  padding: 14px;
  border: 1px solid #dcd6ff;
  border-radius: 8px;
  background: linear-gradient(180deg, #fbfaff 0%, #f5f8ff 100%);
  box-shadow: 0 16px 36px rgba(63, 48, 143, 0.18);
}

.ab-ai-popup .ai-reply__head {
  position: relative;
  padding-right: 24px;
}

.ab-ai-popup .ai-reply__refresh,
.ab-ai-popup .ai-reply__close {
  display: inline-flex;
}

.ab-ai-popup .ai-reply__close {
  position: absolute;
  top: 2px;
  right: 0;
}

.ab-ai-popup .ai-reply__options {
  display: flex;
  margin-top: 10px;
}

.ab-ai-popup .ai-reply__notice {
  display: block;
  margin: 8px 0 0;
}

.ab-ai-popup .jh-btn--ai-pill {
  min-height: 28px;
  padding: 4px 10px;
  font-size: 12px;
  line-height: 18px;
}

@media (max-width: 1280px) {
  .ab-ai-popup {
    right: 0;
    bottom: 100%;
    margin-bottom: 12px;
  }
}
</style>
