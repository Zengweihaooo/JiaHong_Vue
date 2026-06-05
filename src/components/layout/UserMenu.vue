<template>
  <div :class="['user-menu', { 'is-open': visible }]" role="menu" :aria-hidden="!visible">
    <section class="user-menu-status" aria-label="接诊状态与服务开关">
      <div class="user-menu-status__row">
        <div class="user-menu-status__left">
          <span>出诊状态</span>
          <StatusBadge :status="store.doctorStatus" />
        </div>
        <button
          :class="['jh-switch user-menu-status__switch', { 'is-on': store.doctorStatus !== 'offline' }]"
          type="button"
          aria-label="切换出诊状态"
          :aria-pressed="store.doctorStatus !== 'offline'"
          @click="store.toggleDoctorStatus()"
        ></button>
      </div>
      <div class="user-menu-services" aria-label="服务类型">
        <button
          v-for="service in orderedServices"
          :key="service.key"
          :class="['user-menu-service', { 'is-selected': service.enabled }]"
          type="button"
          role="checkbox"
          :aria-checked="service.enabled"
          :data-service-key="service.key"
          @click="store.toggleService(service.key)"
        >
          <span class="jh-checkbox user-menu-service__check">
            <span class="jh-checkbox__icon" aria-hidden="true">
              <img class="jh-checkbox__mark" :src="assetUrl('assets/figma-home/checkmark.svg')" alt="" />
            </span>
            <span class="jh-checkbox__label user-menu-service__label">{{ service.label }}</span>
          </span>
        </button>
      </div>
    </section>
    <div class="user-menu-actions">
      <button class="user-menu__item user-menu__item--settings" type="button" role="menuitem" data-action="账号设置" @click="runMenuAction('账号设置')">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 7a7 7 0 0 1 14 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
        </svg>
        <span>账号设置</span>
      </button>
      <span class="user-menu-actions__divider" aria-hidden="true"></span>
      <button class="user-menu__item user-menu__item--logout" type="button" role="menuitem" data-action="退出登录" @click="runMenuAction('退出登录')">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2m-3-1 4-4-4-4m4 4H3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
        </svg>
        <span>退出登录</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { StatusBadge } from "@jiahong/ui";
import { useAppStore } from "@/stores/app";
import { assetUrl } from "@/utils/assets";

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const store = useAppStore();
const serviceOrder = ["text", "video", "consult"];
const orderedServices = computed(() =>
  store.services
    .filter((service) => serviceOrder.includes(service.key))
    .slice()
    .sort((left, right) => serviceOrder.indexOf(left.key) - serviceOrder.indexOf(right.key))
);

function runMenuAction(action) {
  store.userMenuVisible = false;
  store.showToast(action);
}
</script>
