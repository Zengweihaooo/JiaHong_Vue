<template>
  <section :class="['card notice-card', { 'notice-card--unread': announcement?.unread }]" aria-label="最新公告">
    <div v-if="announcement" class="notice-card__inner">
      <div class="notice-card__head">
        <div class="notice-card__title-row">
          <h2 class="card__title">最新公告</h2>
          <span class="notice-card__date">{{ announcement.date }}</span>
        </div>
        <div class="divider"></div>
      </div>
      <article class="announcement">
        <div class="announcement__top">
          <div class="announcement__title-row">
            <h3 class="announcement__title">{{ announcement.title }}</h3>
            <span v-if="announcement.unread" class="announcement__unread-dot" aria-label="有未读公告"></span>
          </div>
          <div class="announcement__body">
            {{ summary }}
            <button class="announcement__detail-trigger" type="button" @click="openDetail(announcement.id)">……展开详情</button>
          </div>
        </div>
        <p class="announcement__footer">{{ announcement.publisher }}</p>
      </article>
      <button class="jh-btn jh-btn--block-outline announcement-list-trigger" type="button" @click="store.announcementListVisible = true">
        查看历史公告
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useAppStore } from "@/stores/app";

const store = useAppStore();
const announcement = computed(() => store.latestAnnouncement);
const summary = computed(() => announcement.value?.content?.split("\n").slice(0, 2).join("\n") || "");

function openDetail(id) {
  store.selectedAnnouncementId = id;
  store.markAnnouncementRead(id);
  store.announcementDialogVisible = true;
}
</script>
