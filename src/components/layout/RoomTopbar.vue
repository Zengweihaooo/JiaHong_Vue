<template>
  <header class="room-topbar">
    <div class="room-topbar__inner">
      <RouterLink class="jh-btn jh-btn--md jh-btn--neutral jh-btn--icon room-back-btn" to="/" aria-label="返回首页">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回首页</span>
      </RouterLink>
      <div class="room-topbar__right">
        <el-button class="room-service-btn" type="primary">在线客服</el-button>
        <div class="room-user">
          <span class="room-user__divider" aria-hidden="true">
            <img :src="assetUrl('assets/figma-consult/topbar-divider.svg')" alt="" />
          </span>
          <button class="room-user__body user-menu-trigger" type="button" @click="store.userMenuVisible = !store.userMenuVisible">
            <span class="avatar" aria-hidden="true">
              <img :src="assetUrl('assets/figma-consult/avatar-source.png')" alt="" />
            </span>
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
import { ArrowLeft } from "@element-plus/icons-vue";
import UserMenu from "@/components/layout/UserMenu.vue";
import { useAppStore } from "@/stores/app";
import { assetUrl } from "@/utils/assets";

const store = useAppStore();
</script>
