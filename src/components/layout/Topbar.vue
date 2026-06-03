<template>
  <header class="topbar">
    <div class="topbar__left"></div>
    <div class="topbar__right">
      <div class="certificate">
        <span>证书到期时间</span>
        <span>2027-01-15</span>
      </div>
      <div class="topbar__actions">
        <el-button type="primary">在线客服</el-button>
        <el-button>医生招聘</el-button>
      </div>
      <div class="user-chip">
        <button class="user-chip__body user-menu-trigger" type="button" @click="store.userMenuVisible = !store.userMenuVisible">
          <span class="avatar" aria-hidden="true">
            <img :src="assetUrl('assets/figma-home/avatar-source.png')" alt="" />
          </span>
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
import { assetUrl } from "@/utils/assets";

const store = useAppStore();
</script>
