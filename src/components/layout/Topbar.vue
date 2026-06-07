<template>
  <header class="topbar">
    <div class="topbar__left"></div>
    <div class="topbar__right">
      <div class="certificate">
        <span>证书到期时间</span>
        <span>2027-01-15</span>
      </div>
      <div class="topbar__actions">
        <Button tone="primary" size="md">在线客服</Button>
        <Button tone="secondary" size="md">医生招聘</Button>
      </div>
      <div class="user-chip">
        <button
          class="user-chip__body user-menu-trigger"
          type="button"
          :aria-expanded="String(store.userMenuVisible)"
          aria-haspopup="menu"
          @click="store.userMenuVisible = !store.userMenuVisible"
        >
          <DoctorAvatar :name="store.doctor?.name || '张医生'" context="home" size="sm" />
          <span>{{ store.doctor?.name || "张医生" }}</span>
        </button>
        <UserMenu :visible="store.userMenuVisible" />
      </div>
    </div>
  </header>
</template>

<script setup>
import UserMenu from "@/components/layout/UserMenu.vue";
import { useAppStore } from "@/stores/app";
import { Button, DoctorAvatar } from "@jiahong/ui";

const store = useAppStore();
</script>
