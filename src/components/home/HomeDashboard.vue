<template>
  <main class="main">
    <div class="content-stack">
      <div class="row row--top">
        <WaitingStatusCard :total="store.waitingQueue.total" :items="queueItems" />

        <ConsultEntryCard
          :variant="consultEntryVariant"
          :has-queue="store.waitingQueue.total > 0"
          @click="$router.push('/room/')"
        />

        <ServiceStatusCard
          :status="store.doctorStatus"
          :services="store.services"
          @toggle-status="store.toggleDoctorStatus()"
          @toggle-service="toggleService"
        />
      </div>

      <div class="row row--bottom">
        <LatestAnnouncementCard
          :announcement="store.latestAnnouncement"
          @detail="openAnnouncementDetail"
          @history="store.announcementListVisible = true"
        />
        <QuickActionsPanel
          :actions="store.quickActions"
          @add="store.openQuickEntryDialog()"
          @edit="editQuickAction"
          @remove="removeQuickAction"
          @reorder="reorderQuickAction"
          @select="selectQuickAction"
          @schedule-detail="store.showToast('排班详情暂未开放')"
          @schedule-punch="store.showToast('打卡成功')"
        />
      </div>
      <footer class="footer">嘉虹健康　copyright © 2017-2026　鄂ICP备2024037712号-1</footer>
    </div>
  </main>
</template>

<script setup>
import { computed } from "vue";
import { useAppStore } from "@/stores/app";
import { ConsultEntryCard, LatestAnnouncementCard, QuickActionsPanel, ServiceStatusCard, WaitingStatusCard } from "@jiahong/ui";
import { useRouter } from "vue-router";

const store = useAppStore();
const router = useRouter();
const queueItems = computed(() => [
  { key: "text", label: "图文问诊", value: store.waitingQueue.byType.text },
  { key: "video", label: "视频问诊", value: store.waitingQueue.byType.video },
  { key: "consult", label: "图文咨询", value: store.waitingQueue.byType.consult }
]);
const consultEntryVariant = computed(() => (store.waitingQueue.total > 0 ? "yellow" : "blue"));

function toggleService(service) {
  store.toggleService(service.key);
}

function openAnnouncementDetail(announcement) {
  if (!announcement?.id) return;
  store.selectedAnnouncementId = announcement.id;
  store.markAnnouncementRead(announcement.id);
  store.announcementDialogVisible = true;
}

function editQuickAction({ index }) {
  store.openQuickEntryDialog(index);
}

function removeQuickAction({ index }) {
  store.removeQuickAction(index);
}

function reorderQuickAction({ fromIndex, toIndex }) {
  store.reorderQuickAction(fromIndex, toIndex);
}

function selectQuickAction({ action, feature }) {
  if (feature === "history" || action.title?.includes("历史")) {
    router.push("/history/");
    return;
  }
  if (feature === "elements") {
    router.push("/elements/");
    return;
  }
  store.showToast(action.title || action.desc);
}
</script>
