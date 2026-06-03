<template>
  <div class="app-shell room-shell app-shell--responsive">
    <RoomTopbar />
    <RoomSidebar />
    <main class="room-main">
      <section class="room-card" aria-label="候诊室">
        <el-button class="room-refresh" @click="openTextConsultation">刷新列表</el-button>
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
import AppDialogs from "@/components/common/AppDialogs.vue";
import RoomSidebar from "@/components/consultation/RoomSidebar.vue";
import RoomTopbar from "@/components/layout/RoomTopbar.vue";
import { assetUrl } from "@/utils/assets";
import { useRouter } from "vue-router";

const router = useRouter();

function openTextConsultation() {
  router.push("/text/");
}
</script>
