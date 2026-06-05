<template>
  <WorkspaceShell
    :collapsed="store.sidebarCollapsed"
    :expanded="!store.sidebarCollapsed && store.sidebarInteractionStarted"
  >
    <template #topbar>
      <Topbar />
    </template>
    <template #sidebar>
      <WorkspaceSidebar
        :menu-groups="store.menuGroups"
        :collapsed="store.sidebarCollapsed"
        @toggle="store.toggleSidebarCollapsed()"
      />
    </template>
    <HomeDashboard />
    <template #dialogs>
      <AppDialogs />
    </template>
  </WorkspaceShell>
</template>

<script setup>
import AppDialogs from "@/components/common/AppDialogs.vue";
import HomeDashboard from "@/components/home/HomeDashboard.vue";
import Topbar from "@/components/layout/Topbar.vue";
import { useAppStore } from "@/stores/app";
import { WorkspaceShell, WorkspaceSidebar } from "@jiahong/ui";

const store = useAppStore();
</script>
