<template>
  <aside class="sidebar" aria-label="主菜单">
    <div class="sidebar__brand">
      <img class="brand-mark" :src="assetUrl('assets/figma-home/logo.png')" alt="嘉虹健康" />
    </div>
    <nav class="sidebar__content">
      <template v-for="group in store.menuGroups" :key="group.title">
        <div class="menu-section">{{ group.title }}</div>
        <button
          v-for="item in group.items"
          :key="item.label"
          :class="['menu-item', { 'is-active': item.active }]"
          type="button"
        >
          <img class="menu-icon" :src="menuIcon(item.icon)" alt="" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </button>
      </template>
    </nav>
    <div class="sidebar__footer">
      <button
        class="sidebar-toggle"
        type="button"
        :aria-label="store.sidebarCollapsed ? '展开主菜单' : '收起主菜单'"
        :aria-expanded="!store.sidebarCollapsed"
        @click="store.toggleSidebarCollapsed()"
      >
        <img class="menu-icon" :src="assetUrl('assets/figma-home/menu-icon.svg')" alt="" aria-hidden="true" />
      </button>
    </div>
  </aside>
</template>

<script setup>
import { useAppStore } from "@/stores/app";
import { assetUrl } from "@/utils/assets";

const store = useAppStore();
const iconMap = {
  home: "assets/figma-home/home.svg",
  dashboard: "assets/figma-home/trello.svg",
  circle: "assets/figma-home/disc.svg",
  clipboard: "assets/figma-home/clipboard.svg",
  checkSquare: "assets/figma-home/check-square.svg",
  briefcase: "assets/figma-home/briefcase.svg",
  calendar: "assets/figma-home/calendar.svg",
  user: "assets/figma-home/user.svg",
  shield: "assets/figma-home/pocket.svg"
};

function menuIcon(name) {
  return assetUrl(iconMap[name] || iconMap.clipboard);
}
</script>
