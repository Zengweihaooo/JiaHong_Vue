<template>
  <section :class="['card quick-entry-card', { 'is-editing': editing, 'is-schedule-open': scheduleOpen }]" aria-label="高频操作入口">
    <div class="quick-entry-card__header">
      <h2 class="card__title">高频操作入口</h2>
      <button class="quick-entry-card__edit" type="button" aria-label="编辑高频操作入口" :aria-pressed="editing" @click="editing = !editing">
        <span class="quick-entry-card__edit-icon" aria-hidden="true"></span>
        <span class="quick-entry-card__edit-text">{{ editing ? "完成" : "编辑" }}</span>
      </button>
    </div>
    <div class="quick-grid">
      <div
        v-for="(action, index) in store.quickActions"
        :key="`${index}-${action.title || action.desc}`"
        :class="['quick-card', action.isAdd ? 'quick-card--add' : 'quick-card--custom']"
        :data-action="action.title || action.desc"
        :data-quick-feature="getQuickEntryFeature(action)"
        role="button"
        tabindex="0"
        @click="handleAction(action, index, $event)"
        @keydown.enter.prevent="handleAction(action, index, $event)"
        @keydown.space.prevent="handleAction(action, index, $event)"
      >
        <button v-if="!action.isAdd" class="quick-card__delete" type="button" :aria-label="`删除快捷入口：${action.title}`" @click.stop="removeAction(index)">
          <svg class="quick-card__delete-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M4 4L12 12M12 4L4 12" />
          </svg>
        </button>
        <button v-if="!action.isAdd" class="quick-card__drag" type="button" :aria-label="`拖动排序：${action.title}`" draggable="true"></button>
        <span class="quick-card__body">
          <span class="icon-box">
            <template v-if="action.icon === 'quickCalendar'">
              <span class="quick-icon quick-icon--schedule" aria-hidden="true">
                <img class="quick-icon__base" :src="assetUrl('assets/figma-home/quick-schedule-box.svg')" alt="" />
                <img class="quick-icon__mark" :src="assetUrl('assets/figma-home/quick-schedule-mark.svg')" alt="" />
              </span>
            </template>
            <template v-else-if="action.icon === 'clock'">
              <span class="quick-icon quick-icon--clock" aria-hidden="true">
                <img class="quick-icon__base" :src="assetUrl('assets/figma-home/quick-clock-circle.svg')" alt="" />
                <img class="quick-icon__hand" :src="assetUrl('assets/figma-home/quick-clock-hand.svg')" alt="" />
              </span>
            </template>
            <img v-else-if="action.icon === 'document'" class="quick-icon quick-icon--document" :src="assetUrl('assets/figma-home/quick-doc.svg')" alt="" aria-hidden="true" />
            <img v-else-if="action.icon === 'plus'" class="quick-icon quick-icon--plus" :src="assetUrl('assets/figma-home/quick-plus.svg')" alt="" aria-hidden="true" />
            <span v-else :class="['quick-icon quick-icon--menu', `quick-icon--menu-${action.icon}`]" aria-hidden="true"></span>
          </span>
          <span v-if="action.title" class="quick-card__title">{{ action.title }}</span>
          <span class="quick-card__desc">{{ action.desc }}</span>
        </span>
      </div>
    </div>
    <section class="schedule-panel" aria-label="近期排班" :hidden="!scheduleOpen">
      <header class="schedule-panel__header">
        <span class="schedule-panel__title">
          <strong>近期排班</strong>
          <span>11分钟前已变更</span>
        </span>
        <span class="schedule-panel__actions">
          <button class="schedule-panel__detail" type="button" @click="store.showToast('排班详情暂未开放')">查看详情</button>
          <button class="schedule-panel__back" type="button" @click="closeSchedulePanel">返回入口</button>
        </span>
      </header>
      <nav class="schedule-panel__tabs" aria-label="排班时间段">
        <button class="schedule-panel__arrow" type="button" aria-label="上一个时间段">‹</button>
        <button
          v-for="(slot, index) in scheduleTimeSlots"
          :key="slot"
          :class="['schedule-panel__tab', { 'is-active': index === 1 }]"
          type="button"
        >
          {{ slot }}
        </button>
        <button class="schedule-panel__arrow" type="button" aria-label="下一个时间段">›</button>
      </nav>
      <div class="schedule-board">
        <div v-for="(row, index) in scheduleRows" :key="row.label" class="schedule-board__date" :style="{ gridRow: String(index + 1) }">
          <span>{{ row.label }}</span>
          <span>{{ row.sub }}</span>
        </div>
        <article
          v-for="item in scheduleItems"
          :key="`${item.row}-${item.col}-${item.title}`"
          :class="['schedule-event', `schedule-event--${item.tone}`, { 'is-active': item.active }]"
          :style="{ gridRow: String(item.row), gridColumn: `${item.col} / span ${item.span}` }"
        >
          <strong>{{ item.title }}</strong>
          <span>{{ item.time }}</span>
          <em v-if="item.active" aria-hidden="true">进行中</em>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getQuickEntryFeature } from "@/domain/quickEntries";
import { useAppStore } from "@/stores/app";
import { assetUrl } from "@/utils/assets";

const router = useRouter();
const store = useAppStore();
const editing = ref(false);
const scheduleOpen = ref(false);
const scheduleTimeSlots = ["10:00–11:00", "11:00–12:00", "12:00–13:00", "14:00–15:00", "15:00–16:00", "16:00–17:00"];
const scheduleRows = [
  { label: "5-04", sub: "今日" },
  { label: "5-05", sub: "周一" },
  { label: "5-06", sub: "周二" }
];
const scheduleItems = [
  { row: 1, col: 2, span: 3, tone: "blue", title: "线下药店续方服务", time: "10:00-13:00", active: true },
  { row: 1, col: 6, span: 1, tone: "cyan", title: "妙手阿里-兜底科室报班", time: "07:00-08:00" },
  { row: 2, col: 2, span: 3, tone: "blue", title: "线下药店续方服务", time: "10:00-13:00" },
  { row: 2, col: 5, span: 1, tone: "amber", title: "九州通美团-兜底科室报班", time: "14:00-15:00" },
  { row: 2, col: 6, span: 1, tone: "cyan", title: "妙手阿里-兜底科室报班", time: "07:00-08:00" },
  { row: 3, col: 2, span: 1, tone: "red", title: "拼多多-自由报班", time: "10:00-11:00" },
  { row: 3, col: 4, span: 1, tone: "cyan", title: "九州通阿里-固定值班", time: "12:00-13:00" },
  { row: 3, col: 5, span: 2, tone: "amber", title: "九州通美团-自由报班", time: "14:00-16:00" }
];

function openSchedulePanel() {
  editing.value = false;
  scheduleOpen.value = true;
}

function closeSchedulePanel(event) {
  event?.preventDefault();
  event?.stopPropagation();
  scheduleOpen.value = false;
}

function handleAction(action, index, event) {
  if (event?.target?.closest?.(".quick-card__delete, .quick-card__drag")) return;
  if (action.isAdd) {
    store.openQuickEntryDialog();
    return;
  }
  if (editing.value) {
    store.openQuickEntryDialog(index);
    return;
  }
  const feature = getQuickEntryFeature(action);
  if (feature === "schedule") {
    openSchedulePanel();
    return;
  }
  if (feature === "history" || action.title?.includes("历史")) {
    router.push("/history/");
    return;
  }
  if (feature === "elements") {
    router.push("/elements/");
    return;
  }
  store.showToast(action.title || action.desc);
}

function removeAction(index) {
  if (!editing.value) return;
  store.removeQuickAction(index);
}
</script>
