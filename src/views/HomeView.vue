<template>
  <div
    :class="[
      'app-shell app-shell--responsive',
      store.sidebarCollapsed ? 'is-sidebar-collapsed' : store.sidebarInteractionStarted ? 'is-sidebar-expanded' : ''
    ]"
  >
    <Topbar />
    <Sidebar />
    <HomeDashboard />
    <AppDialogs />
  </div>
</template>

<script setup>
import AppDialogs from "@/components/common/AppDialogs.vue";
import HomeDashboard from "@/components/home/HomeDashboard.vue";
import Sidebar from "@/components/layout/Sidebar.vue";
import Topbar from "@/components/layout/Topbar.vue";
import { useAppStore } from "@/stores/app";

const store = useAppStore();
</script>
