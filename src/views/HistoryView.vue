<template>
  <div class="app-shell room-shell history-shell app-shell--responsive">
    <RoomTopbar />
    <RoomSidebar />
    <main class="room-main">
      <section v-if="archivedRecord" class="room-card prescription-history" aria-label="开方历史">
        <div class="prescription-history__header">
          <div>
            <p>开方历史</p>
            <h1>{{ archivedRecord.patient }}的处方留痕记录</h1>
          </div>
          <el-button @click="returnToRoom">返回问诊室</el-button>
        </div>
        <div class="prescription-history__summary">
          <span><em>问诊类型</em><strong>{{ typeDisplay }}</strong></span>
          <span><em>诊断</em><strong>{{ archivedRecord.diagnosis }}</strong></span>
          <span><em>处方编号</em><strong>{{ archivedRecord.prescriptionNo }}</strong></span>
          <span><em>归档时间</em><strong>{{ archivedRecord.endedAt }}</strong></span>
        </div>
        <div class="prescription-history__content">
          <section class="history-panel">
            <h2>处方明细</h2>
            <div class="history-medicine-table">
              <div v-for="medicine in medicines" :key="medicine.index || medicine.name">
                <strong>{{ medicine.name }}</strong>
                <span>{{ medicine.spec }}｜{{ medicine.usage }}｜{{ medicine.frequency }}｜{{ medicine.quantity }}{{ medicine.unit }}</span>
              </div>
              <div v-if="!medicines.length"><strong>暂无处方药品</strong><span>本次问诊未生成处方明细</span></div>
            </div>
          </section>
          <section class="history-panel">
            <h2>操作留痕</h2>
            <div class="history-trace-list">
              <div v-for="item in archivedRecord.trace" :key="`${item.label}-${item.time}`">
                <strong>{{ item.label }}<span>{{ item.time }}</span></strong>
                <p>{{ item.detail }}</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
    <AppDialogs />
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppDialogs from "@/components/common/AppDialogs.vue";
import RoomSidebar from "@/components/consultation/RoomSidebar.vue";
import RoomTopbar from "@/components/layout/RoomTopbar.vue";
import { useAppStore } from "@/stores/app";

const route = useRoute();
const router = useRouter();
const store = useAppStore();
const archivedRecord = computed(() => {
  const record =
    store.consultationRecords.find((item) => item.id === store.activeRecordId && item.state === "ended") ||
    store.endedRecords[0];
  return record ? store.normalizeArchived(record) : null;
});
const typeDisplay = computed(() => (archivedRecord.value?.type === "consult" ? "咨询" : `${archivedRecord.value?.typeLabel || "图文"}问诊`));
const medicines = computed(() => archivedRecord.value?.prescriptionMedicines || []);

onMounted(() => {
  store.messageFilterState = "ended";
  store.ensureActiveRecord(String(route.query.sessionId || route.query.record || ""));
});

function returnToRoom() {
  store.setMessageFilter({ state: "ongoing", type: "all" });
  router.push("/room/");
}
</script>
