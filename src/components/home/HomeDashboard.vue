<template>
  <main class="main">
    <div class="content-stack">
      <div class="row row--top">
        <section class="card card--compact waiting-card" aria-label="当前候诊状态">
          <div class="waiting-card__left">
            <div class="waiting-card__heading">
              <h1 class="card__title">当前候诊状态</h1>
              <p class="waiting-card__label">当前候诊人数</p>
            </div>
            <p class="waiting-card__number">{{ store.waitingQueue.total }}</p>
            <p class="waiting-card__hint">请及时接诊患者</p>
          </div>
          <div class="waiting-card__right">
            <div class="queue-chip">
              <span class="queue-chip__name">图文问诊</span>
              <span class="queue-chip__value">{{ store.waitingQueue.byType.text }}</span>
            </div>
            <div class="queue-chip">
              <span class="queue-chip__name">视频问诊</span>
              <span class="queue-chip__value">{{ store.waitingQueue.byType.video }}</span>
            </div>
            <div class="queue-chip">
              <span class="queue-chip__name">图文咨询</span>
              <span class="queue-chip__value">{{ store.waitingQueue.byType.consult }}</span>
            </div>
          </div>
        </section>

        <button
          :class="['consult-card', { 'consult-card--has-queue': store.waitingQueue.total > 0 }]"
          type="button"
          aria-label="进入问诊室"
          @click="$router.push('/room/')"
        >
          <img class="consult-card__bg" :src="assetUrl('assets/figma-home/consult-bg.png')" alt="" aria-hidden="true" />
          <div class="consult-card__content">
            <div class="consult-card__icon">
              <img class="consult-card__icon-img" :src="assetUrl('assets/figma-home/consult-icon.svg')" alt="" aria-hidden="true" />
            </div>
            <h2>进入问诊室</h2>
            <p>点击开始接诊患者</p>
          </div>
        </button>

        <section class="card card--compact service-card" aria-label="接诊状态与服务开关">
          <h2 class="card__title">接诊状态与服务开关</h2>
          <div class="status-row">
            <div class="status-row__left">
              <span>出诊状态</span>
              <StatusBadge :status="store.doctorStatus" />
            </div>
            <button
              :class="['jh-switch', { 'is-on': store.doctorStatus !== 'offline' }]"
              type="button"
              aria-label="切换出诊状态"
              :aria-pressed="store.doctorStatus !== 'offline'"
              @click="store.toggleDoctorStatus()"
            ></button>
          </div>
          <div class="service-list">
            <button
              v-for="service in store.services"
              :key="service.key"
              class="service-tile"
              type="button"
              role="checkbox"
              :aria-checked="service.enabled"
              @click="store.toggleService(service.key)"
            >
              <span class="jh-checkbox">
                <span class="jh-checkbox__icon" aria-hidden="true">
                  <img class="jh-checkbox__mark" :src="assetUrl('assets/figma-home/checkmark.svg')" alt="" />
                </span>
                <span class="jh-checkbox__label">{{ service.label }}</span>
              </span>
            </button>
          </div>
        </section>
      </div>

      <div class="row row--bottom">
        <NoticeCard />
        <QuickActions />
      </div>
      <footer class="footer">嘉虹健康　copyright © 2017-2026　鄂ICP备2024037712号-1</footer>
    </div>
  </main>
</template>

<script setup>
import { StatusBadge, assetUrl } from "@jiahong/ui";
import NoticeCard from "@/components/home/NoticeCard.vue";
import QuickActions from "@/components/home/QuickActions.vue";
import { useAppStore } from "@/stores/app";

const store = useAppStore();
</script>
