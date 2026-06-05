<template>
  <header class="topbar">
    <div class="topbar__left"></div>
    <div class="topbar__right">
      <div class="certificate">
        <span>证书到期时间</span>
        <span>2027-01-15</span>
      </div>
      <div class="topbar__actions">
        <button class="jh-btn jh-btn--md jh-btn--primary" type="button">在线客服</button>
        <button class="jh-btn jh-btn--md jh-btn--outline-secondary" type="button">医生招聘</button>
      </div>
      <div class="user-chip">
        <button
          class="user-chip__body user-menu-trigger"
          type="button"
          :aria-expanded="String(store.userMenuVisible)"
          aria-haspopup="menu"
          @click="store.userMenuVisible = !store.userMenuVisible"
        >
          <Avatar :src="assetUrl('assets/figma-home/avatar-source.png')" :name="store.doctor?.name || '张医生'" size="sm" />
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
import { Avatar, assetUrl } from "@jiahong/ui";

const store = useAppStore();
</script>
