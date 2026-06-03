<template>
  <div :class="['app-shell room-shell consult-shell text-shell', { 'video-shell': isVideo }, 'app-shell--responsive']">
    <RoomTopbar />
    <RoomSidebar />
    <main class="text-main consult-room-main">
      <section class="text-card consult-room-card" :aria-label="isVideo ? '视频问诊' : '图文问诊'">
        <div class="pharmacy-bar">
          <div class="pharmacy-bar__left">
            <h2>{{ title }}</h2>
            <span class="jh-risk-tag jh-risk-tag--lg risk-tag--inspection">迎检</span>
            <span class="jh-tag jh-tag--focus jh-tag--lg risk-tag--medicine medicine-type-tag">{{ medicineTypeLabel }}</span>
          </div>
          <div class="pharmacy-bar__right">
            <DurationChip :seconds="record?.elapsedSeconds || 0" />
            <button class="jh-btn jh-btn--md jh-btn--outline-secondary cancel-consult-trigger" type="button" :disabled="record?.prescriptionSubmitted" @click="store.consultConfirmKind = 'cancel'">取消问诊</button>
          </div>
        </div>
        <div class="consult-workspace">
          <ChatPanel :record="record" :video="isVideo" />
          <PrescriptionPanel :record="record" :consultation="record?.type === 'consult'" :video-submit-lock="isVideo" />
        </div>
      </section>
    </main>
    <AppDialogs />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import AppDialogs from "@/components/common/AppDialogs.vue";
import DurationChip from "@/components/common/DurationChip.vue";
import ChatPanel from "@/components/consultation/ChatPanel.vue";
import PrescriptionPanel from "@/components/consultation/PrescriptionPanel.vue";
import RoomSidebar from "@/components/consultation/RoomSidebar.vue";
import RoomTopbar from "@/components/layout/RoomTopbar.vue";
import { useAppStore } from "@/stores/app";

const props = defineProps({
  mode: {
    type: String,
    default: "text"
  }
});

const route = useRoute();
const store = useAppStore();
const isVideo = computed(() => props.mode === "video");
const record = computed(() => store.activeRecord);
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
</script>
