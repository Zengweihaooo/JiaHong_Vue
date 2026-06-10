<template>
  <div class="app-shell room-shell app-shell--responsive">
    <RoomTopbar />
    <RoomSidebar />
    <main class="room-main">
      <section v-if="archivedRecord" class="text-card text-card--readonly" aria-label="历史问诊回看">
        <div class="pharmacy-bar">
          <div class="pharmacy-bar__left">
            <h2>{{ archivedRecord.title }}</h2>
            <span class="jh-read-tag jh-read-tag--read readonly-seal-tag">已封存</span>
            <span class="jh-tag jh-tag--focus jh-tag--lg risk-tag--medicine medicine-type-tag">{{ archivedTypeDisplay }}</span>
          </div>
          <div class="pharmacy-bar__right">
            <span class="readonly-ended-time">结束时间：{{ archivedRecord.endedAt }}</span>
          </div>
        </div>
        <div class="consult-workspace">
          <section class="chat-panel archived-consult-panel" aria-label="历史聊天记录">
            <div class="archived-consult-panel__scroll">
              <div class="chat-thread chat-thread--archived">
                <template v-for="(message, index) in archivedRecord.transcript" :key="`${message.from}-${message.time}-${index}`">
                  <p class="chat-date">{{ message.time || "" }}</p>
                  <div :class="['chat-bubble', message.from === 'doctor' ? 'chat-bubble--doctor' : 'chat-bubble--patient']">
                    <p>{{ message.text }}</p>
                  </div>
                </template>
              </div>
            </div>
            <div class="archived-consult-panel__disabled-input">问诊已封存，仅支持回看</div>
          </section>
          <PrescriptionPanel
            :record="archivedRecord"
            readonly
            :consultation="archivedRecord.type === 'consult'"
            @open-history="openArchivedHistory"
          />
        </div>
      </section>
      <RoomPendingWorkspace v-else-if="hasWaitingQueue" @refresh="openTextConsultation" />
      <section v-else class="room-card room-card--pending-consult" aria-label="候诊室">
        <div class="room-pending-toolbar">
          <button class="jh-btn jh-btn--md jh-btn--outline-secondary room-refresh" type="button" @click="openTextConsultation">刷新列表</button>
        </div>
        <div class="room-empty">
          <img class="room-empty__icon" :src="assetUrl('assets/room-empty.svg')" alt="" aria-hidden="true" />
          <div class="room-empty__copy">
            <h2>暂无待接诊订单</h2>
            <p>保持在线后，系统将自动接收新的图文或视频问诊</p>
          </div>
        </div>
      </section>
    </main>
    <AppDialogs />
  </div>
</template>

<script setup>
import { computed } from "vue";
import AppDialogs from "@/components/common/AppDialogs.vue";
import PrescriptionPanel from "@/components/consultation/PrescriptionPanel.vue";
import RoomSidebar from "@/components/consultation/RoomSidebar.vue";
import RoomTopbar from "@/components/layout/RoomTopbar.vue";
import { useAppStore } from "@/stores/app";
import { RoomPendingWorkspace, assetUrl } from "@jiahong/ui";
import { useRouter } from "vue-router";

const router = useRouter();
const store = useAppStore();
const archivedRecord = computed(() => {
  const record = store.activeRecord;
  if (store.messageFilterState !== "ended" || record?.state !== "ended") return null;
  return store.normalizeArchived(record);
});
const archivedTypeDisplay = computed(() => {
  if (archivedRecord.value?.type === "consult") return "咨询";
  return `${archivedRecord.value?.typeLabel || "图文"}问诊`;
});
const hasWaitingQueue = computed(() => Number(store.waitingQueue?.total || 0) > 0);

function openTextConsultation() {
  router.push("/text/");
}

function openArchivedHistory() {
  if (!archivedRecord.value?.id) {
    router.push("/history/");
    return;
  }
  router.push({ path: "/history/", query: { sessionId: archivedRecord.value.id } });
}
</script>
