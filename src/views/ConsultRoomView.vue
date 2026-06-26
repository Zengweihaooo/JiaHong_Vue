<template>
  <div :class="['app-shell room-shell consult-shell text-shell', { 'video-shell': isVideo }, 'app-shell--responsive']">
    <RoomTopbar :use-back-action="useBackAction" @back="$emit('back')" />
    <RoomSidebar />
    <main class="text-main consult-room-main">
      <section class="text-card consult-room-card" :aria-label="isVideo ? '视频问诊' : '图文问诊'">
        <div class="pharmacy-bar">
          <div class="pharmacy-bar__left">
            <h2>{{ title }}</h2>
            <img v-if="tagVariant === 'b'" class="ab-pharmacy-tag-image ab-pharmacy-tag-image--inspection" :src="inspectionTagImage" alt="迎检" />
            <span v-else :class="inspectionClass">迎检</span>
            <img v-if="tagVariant === 'b'" class="ab-pharmacy-tag-image ab-pharmacy-tag-image--medicine" :src="medicineTagImage" :alt="medicineTypeLabel" />
            <span v-else :class="medicineTypeClass">{{ medicineTypeLabel }}</span>
          </div>
          <div class="pharmacy-bar__right">
            <DurationChip :seconds="activeElapsedSeconds" label="问诊持续时长：" />
            <button class="jh-btn jh-btn--md jh-btn--outline-secondary cancel-consult-trigger" type="button" :disabled="record?.prescriptionSubmitted" @click="store.consultConfirmKind = 'cancel'">取消问诊</button>
          </div>
        </div>
        <div class="consult-workspace">
          <ChatPanel :record="record" :video="isVideo" :smart-reply-variant="smartReplyVariant" />
          <PrescriptionPanel :record="record" :consultation="record?.type === 'consult'" :video-submit-lock="isVideo" />
        </div>
      </section>
    </main>
    <AppDialogs />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import inspectionTagImage from "@/assets/ab/tag-inspection-b.png";
import medicineTagImage from "@/assets/ab/tag-medicine-b.png";
import AppDialogs from "@/components/common/AppDialogs.vue";
import { DurationChip } from "@jiahong/ui";
import ChatPanel from "@/components/consultation/ChatPanel.vue";
import PrescriptionPanel from "@/components/consultation/PrescriptionPanel.vue";
import RoomSidebar from "@/components/consultation/RoomSidebar.vue";
import RoomTopbar from "@/components/layout/RoomTopbar.vue";
import { useAppStore } from "@/stores/app";

const props = defineProps({
  mode: {
    type: String,
    default: "text"
  },
  tagVariant: {
    type: String,
    default: "",
    validator: (value) => ["", "a", "b"].includes(value)
  },
  smartReplyVariant: {
    type: String,
    default: "",
    validator: (value) => ["", "a", "b", "c"].includes(value)
  },
  useBackAction: {
    type: Boolean,
    default: false
  }
});

defineEmits(["back"]);

const route = useRoute();
const store = useAppStore();
const isVideo = computed(() => props.mode === "video");
const record = computed(() => store.activeRecord);
const activeElapsedSeconds = ref(0);
let elapsedTimer = 0;
const title = computed(() => {
  if (record.value?.type === "consult" && (!record.value.title || record.value.title.includes("图文咨询"))) {
    return "武汉市好药师大药房";
  }
  return record.value?.title || (isVideo.value ? "视频问诊" : "图文问诊");
});
const medicineTypeLabel = computed(() => {
  if (record.value?.type === "consult") return record.value.consultationAttribute === "with-medicine" ? "带药" : "珮文";
  return "中药";
});
const inspectionClass = computed(() =>
  props.tagVariant === "b"
    ? "ab-pharmacy-chip ab-pharmacy-chip--inspection"
    : "jh-risk-tag jh-risk-tag--lg risk-tag--inspection"
);
const medicineTypeClass = computed(() =>
  props.tagVariant === "b"
    ? "ab-pharmacy-chip ab-pharmacy-chip--medicine"
    : "jh-tag jh-tag--focus jh-tag--lg risk-tag--medicine medicine-type-tag"
);

function syncActiveRecord() {
  const sessionId = route.query.sessionId || route.query.record;
  if (sessionId) {
    store.setActiveRecord(String(sessionId));
    return;
  }
  if (isVideo.value && store.activeVideoRecordId) {
    store.ensureActiveRecord(store.activeVideoRecordId);
    return;
  }
  const matched = store.consultationRecords.find(
    (item) => item.state === "ongoing" && (item.targetView === props.mode || item.type === props.mode)
  );
  store.ensureActiveRecord(matched?.id);
}

onMounted(syncActiveRecord);
watch(() => route.query.sessionId, syncActiveRecord);

function clearElapsedTimer() {
  if (!elapsedTimer) return;
  window.clearInterval(elapsedTimer);
  elapsedTimer = 0;
}

function startElapsedTimer() {
  clearElapsedTimer();
  if (!record.value || record.value.state !== "ongoing") return;
  elapsedTimer = window.setInterval(() => {
    activeElapsedSeconds.value += 1;
    if (record.value) record.value.elapsedSeconds = activeElapsedSeconds.value;
  }, 1000);
}

watch(
  () => [record.value?.id, record.value?.state],
  () => {
    activeElapsedSeconds.value = Number(record.value?.elapsedSeconds || 0);
    startElapsedTimer();
  },
  { immediate: true }
);

onBeforeUnmount(clearElapsedTimer);
</script>

<style scoped>
.ab-pharmacy-chip {
  display: inline-flex;
  height: 28px;
  min-width: 48px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: 1px solid #d8dde1;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(16, 42, 67, 0.08);
  cursor: default;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}

.ab-pharmacy-chip--inspection {
  border-color: #f0b9b5;
  color: #d54941;
}

.ab-pharmacy-chip--medicine {
  border-color: #9ac7ff;
  color: #006ef9;
}

.ab-pharmacy-tag-image {
  display: inline-block;
  flex: 0 0 auto;
  height: 24px;
  object-fit: contain;
  vertical-align: middle;
}

.ab-pharmacy-tag-image--inspection {
  width: 56px;
}

.ab-pharmacy-tag-image--medicine {
  width: 36px;
}
</style>
