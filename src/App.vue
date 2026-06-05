<template>
  <el-config-provider namespace="el">
    <div v-if="store.loading && !store.ready" class="app-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在加载医生端工作台</span>
    </div>
    <el-result
      v-else-if="store.error"
      icon="error"
      title="应用初始化失败"
      :sub-title="store.error?.message || '请稍后重试'"
    >
      <template #extra>
        <el-button type="primary" @click="store.bootstrap()">重新加载</el-button>
      </template>
    </el-result>
    <RouterView v-else />
  </el-config-provider>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { Loading } from "@element-plus/icons-vue";
import { useAppStore } from "@/stores/app";

const store = useAppStore();
let timer = null;

function closeUserMenuOnOutsideClick(event) {
  if (!store.userMenuVisible) return;
  if (event.target?.closest?.(".user-menu, .user-menu-trigger")) return;
  store.userMenuVisible = false;
}

onMounted(async () => {
  if (!store.ready) {
    await store.bootstrap();
  }
  document.addEventListener("click", closeUserMenuOnOutsideClick);
  timer = window.setInterval(() => {
    if (store.doctorStatus === "online") {
      store.refreshRealtime().catch(() => {});
    }
  }, 3000);
});

onUnmounted(() => {
  document.removeEventListener("click", closeUserMenuOnOutsideClick);
  if (timer) window.clearInterval(timer);
});
</script>
