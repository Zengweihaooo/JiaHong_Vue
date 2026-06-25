<template>
  <section :class="['card notice-card ab-notice-card', `ab-notice-card--time-${timeLayout}`]" :aria-label="ariaLabel">
    <div v-if="announcement" class="notice-card__inner">
      <div class="notice-card__head">
        <div class="notice-card__title-row">
          <h2 class="card__title">{{ title }}</h2>
          <span v-if="timeLayout === 'a'" class="notice-card__date">{{ announcement.date }}</span>
          <span v-if="timeLayout === 'b' && announcement.unread" class="ab-notice-card__header-dot" aria-label="有未读公告"></span>
        </div>
        <div class="divider"></div>
      </div>
      <article class="announcement">
        <div class="announcement__top">
          <div class="announcement__title-row">
            <h3 class="announcement__title">{{ announcement.title }}</h3>
            <span v-if="timeLayout === 'b'" class="ab-notice-card__title-date">{{ compactDate }}</span>
            <span v-if="timeLayout === 'a' && announcement.unread" class="announcement__unread-dot" aria-label="有未读公告"></span>
          </div>
          <div class="announcement__body">
            {{ summary }}
            <button class="announcement__detail-trigger ab-notice-card__detail-trigger" type="button" @click="$emit('detail', announcement)">……展开详情</button>
          </div>
        </div>
        <time v-if="timeLayout === 'c'" class="ab-notice-card__footer-date">{{ compactDate }}</time>
        <p class="announcement__footer">{{ announcement.publisher }}</p>
      </article>
      <button class="jh-btn jh-btn--block-outline announcement-list-trigger" type="button" @click="$emit('history')">
        {{ historyText }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  announcement: {
    type: Object,
    default: null
  },
  timeLayout: {
    type: String,
    default: "a",
    validator: (value) => ["a", "b", "c"].includes(value)
  },
  title: {
    type: String,
    default: "最新公告"
  },
  historyText: {
    type: String,
    default: "查看历史公告"
  },
  ariaLabel: {
    type: String,
    default: "最新公告"
  }
});

defineEmits(["detail", "history"]);

const summary = computed(() => props.announcement?.content?.split("\n").slice(0, 2).join("\n") || "");
const compactDate = computed(() => props.announcement?.date?.slice(5) || "");
</script>

<style scoped>
.ab-notice-card {
  align-items: stretch;
  height: 476px;
  min-height: 476px;
}

.ab-notice-card :deep(.notice-card__inner) {
  height: 100%;
  min-height: 0;
}

.ab-notice-card :deep(.announcement) {
  flex: 1 1 auto;
  min-height: 0;
}

.ab-notice-card :deep(.announcement__top) {
  flex: 1 1 auto;
  min-height: 0;
}

.ab-notice-card :deep(.announcement-list-trigger) {
  flex: 0 0 auto;
  margin-top: auto;
}

.ab-notice-card__detail-trigger {
  display: block;
  margin-top: 0;
}

.ab-notice-card__header-dot {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  margin-right: 4px;
  border-radius: 50%;
  background: #f53f3f;
  box-shadow: 0 0 0 4px rgba(245, 63, 63, 0.14);
}

.ab-notice-card__title-date {
  display: block;
  color: var(--jh-text-primary);
  font-size: 16px;
  line-height: 24px;
}

.ab-notice-card__footer-date {
  display: block;
  color: var(--jh-text-primary);
  width: 100%;
  font-size: 13.5px;
  line-height: 20px;
}

.ab-notice-card__title-date {
  flex: 0 0 auto;
  margin-left: 16px;
}

.ab-notice-card__footer-date {
  margin-top: auto;
  text-align: right;
}

.ab-notice-card :deep(.announcement__body) {
  text-align: left;
}

.ab-notice-card--time-a :deep(.announcement__title-row) {
  height: auto;
  min-height: 24px;
}

.ab-notice-card--time-a :deep(.announcement__unread-dot) {
  width: 8px;
  height: 8px;
  margin-right: 4px;
  background: #f53f3f;
}

.ab-notice-card--time-b :deep(.announcement__title-row),
.ab-notice-card--time-c :deep(.announcement__title-row) {
  height: auto;
  min-height: 24px;
}

.ab-notice-card--time-b :deep(.announcement__title) {
  font-size: 16px;
  line-height: 24px;
}

.ab-notice-card--time-b :deep(.announcement__footer) {
  margin-top: 26px;
}

.ab-notice-card--time-c :deep(.announcement__title-row) {
  justify-content: center;
}

.ab-notice-card--time-c :deep(.announcement__title) {
  flex: 0 1 auto;
  text-align: center;
}

.ab-notice-card--time-b :deep(.announcement__body),
.ab-notice-card--time-c :deep(.announcement__body) {
  height: auto;
  min-height: 176px;
}

.ab-notice-card--time-c :deep(.announcement__footer) {
  margin: 8px 0 0;
}
</style>
