<template>
  <header class="room-topbar">
    <div class="room-topbar__inner">
      <RouterLink class="jh-btn jh-btn--md jh-btn--neutral jh-btn--icon room-back-btn" to="/" aria-label="返回首页">
        <img :src="assetUrl('assets/figma-consult/back.svg')" alt="" />
        <span>返回首页</span>
      </RouterLink>
      <div class="room-topbar__right">
        <button class="jh-btn jh-btn--md jh-btn--primary room-service-btn" type="button">在线客服</button>
        <div class="room-user">
          <span class="room-user__divider" aria-hidden="true">
            <img :src="assetUrl('assets/figma-consult/topbar-divider.svg')" alt="" />
          </span>
          <button
            class="room-user__body user-menu-trigger"
            type="button"
            :aria-expanded="String(store.userMenuVisible)"
            aria-haspopup="menu"
            @click="store.userMenuVisible = !store.userMenuVisible"
          >
            <DoctorAvatar :name="store.doctor?.name || '张医生'" context="room" size="sm" />
            <span>{{ store.doctor?.name || "张医生" }}</span>
            <span class="room-user__chevron" aria-hidden="true">
              <img :src="assetUrl('assets/figma-consult/chevron-down.svg')" alt="" />
            </span>
          </button>
          <UserMenu :visible="store.userMenuVisible" />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import UserMenu from "@/components/layout/UserMenu.vue";
import { useAppStore } from "@/stores/app";
import { DoctorAvatar, assetUrl } from "@jiahong/ui";

const store = useAppStore();
</script>
