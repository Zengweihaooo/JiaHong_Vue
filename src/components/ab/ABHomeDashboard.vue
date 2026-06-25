<template>
  <main class="main ab-main">
    <div class="content-stack">
      <div class="row row--top">
        <WaitingStatusCard :total="store.waitingQueue.total" :items="queueItems" />

        <ConsultEntryCard
          :variant="consultEntryVariant"
          :has-queue="store.waitingQueue.total > 0"
          @click="store.showToast('AB 测试中暂不进入问诊室')"
        />

        <ServiceStatusCard
          :status="store.doctorStatus"
          :services="store.services"
          @toggle-status="store.showToast('AB 测试中暂不切换在线状态')"
          @toggle-service="store.showToast('AB 测试中暂不切换出诊状态')"
        />
      </div>

      <div :class="['row row--bottom', { 'row--bottom-announcement-right': isAnnouncementRight }]">
        <template v-if="isAnnouncementRight">
          <ABQuickActionsPanel
            :actions="localActions"
            :drag-mode="dragMode"
            :drag-hint="dragHint"
            attention-feature="__ab-disabled__"
            @add="store.showToast('AB 测试中暂不添加入口')"
            @edit="store.showToast('请通过删除或拖拽完成测试')"
            @remove="removeQuickAction"
            @reorder="reorderQuickAction"
            @select="selectQuickAction"
            @schedule-detail="store.showToast('排班详情暂未开放')"
            @schedule-punch="store.showToast('打卡成功')"
          />
          <ABAnnouncementCard
            :announcement="store.latestAnnouncement"
            :time-layout="announcementTimeLayout"
            @detail="store.showToast('AB 测试中暂不打开公告详情')"
            @history="store.showToast('AB 测试中暂不打开历史公告')"
          />
        </template>
        <template v-else>
          <ABAnnouncementCard
            :announcement="store.latestAnnouncement"
            :time-layout="announcementTimeLayout"
            @detail="store.showToast('AB 测试中暂不打开公告详情')"
            @history="store.showToast('AB 测试中暂不打开历史公告')"
          />
          <ABQuickActionsPanel
            :actions="localActions"
            :drag-mode="dragMode"
            :drag-hint="dragHint"
            attention-feature="__ab-disabled__"
            @add="store.showToast('AB 测试中暂不添加入口')"
            @edit="store.showToast('请通过删除或拖拽完成测试')"
            @remove="removeQuickAction"
            @reorder="reorderQuickAction"
            @select="selectQuickAction"
            @schedule-detail="store.showToast('排班详情暂未开放')"
            @schedule-punch="store.showToast('打卡成功')"
          />
        </template>
      </div>
      <footer class="footer">嘉虹健康　copyright © 2017-2026　鄂ICP备2024037712号-1</footer>
    </div>
    <Teleport to="body">
      <div v-if="scheduleVisible" class="ab-schedule-mask" @click.self="scheduleVisible = false">
        <section v-if="testKey === 'schedule-status' && variant === 'a'" class="ab-schedule-modal ab-schedule-modal--large" role="dialog" aria-modal="true" aria-labelledby="ab-schedule-title-a">
          <header class="ab-schedule-head">
            <h2 id="ab-schedule-title-a">今日排班</h2>
            <button type="button" aria-label="关闭今日排班" @click="scheduleVisible = false">×</button>
          </header>
          <div class="ab-schedule-large-toolbar">
            <div class="ab-schedule-date">
              <strong>6月3日</strong>
              <strong>星期三</strong>
              <span>已打卡：1　待打卡：3</span>
            </div>
            <div class="ab-schedule-actions">
              <button type="button">查看详情</button>
              <button type="button" class="primary">立即打卡</button>
            </div>
          </div>
          <div class="ab-day-board">
            <section class="ab-day-column">
              <h3>上午　00:00–12:00</h3>
              <div class="ab-hour-grid">
                <span v-for="hour in morningHours" :key="hour" class="ab-hour-label">{{ hour }}:00</span>
                <article class="ab-block ab-block--ended">
                  <strong>饿了么后方-固定值班 <span>✓</span></strong>
                  <em>已结束</em>
                </article>
                <article class="ab-block ab-block--active">
                  <strong>饿了么后方-固定值班 <span>!</span></strong>
                  <em>8:00-11:00</em>
                  <b>进行中</b>
                </article>
                <div class="ab-now-line"><i></i></div>
                <div class="ab-missed-callout">该时段未打卡</div>
              </div>
            </section>
            <section class="ab-day-column">
              <h3>下午　12:00–24:00</h3>
              <div class="ab-hour-grid">
                <span v-for="hour in afternoonHours" :key="hour" class="ab-hour-label">{{ hour }}:00</span>
                <article class="ab-block ab-block--orange">
                  <strong>九州通美团-兜底科室报班</strong>
                  <em>14:00-15:00</em>
                </article>
                <article class="ab-block ab-block--purple">
                  <strong>妙手阿里-兜底科室报班</strong>
                  <em>14:00-15:00</em>
                </article>
              </div>
            </section>
          </div>
        </section>

        <section
          v-else
          :class="['ab-schedule-image-modal', { 'ab-schedule-image-modal--small': testKey === 'schedule-punch-layout' }]"
          role="dialog"
          aria-modal="true"
          aria-label="今日排班"
        >
          <img :src="scheduleImageSource" alt="今日排班" />
          <button type="button" aria-label="关闭今日排班" @click="scheduleVisible = false"></button>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import scheduleBModalImage from "@/assets/ab/schedule-b-modal.png";
import schedulePunchAImage from "@/assets/ab/schedule-punch-a.png";
import schedulePunchBImage from "@/assets/ab/schedule-punch-b.png";
import schedulePunchCImage from "@/assets/ab/schedule-punch-c.png";
import schedulePunchDImage from "@/assets/ab/schedule-punch-d.png";
import { useAppStore } from "@/stores/app";
import ABAnnouncementCard from "@/components/ab/ABAnnouncementCard.vue";
import ABQuickActionsPanel from "@/components/ab/ABQuickActionsPanel.vue";
import { ConsultEntryCard, ServiceStatusCard, WaitingStatusCard } from "@jiahong/ui";

const props = defineProps({
  variant: {
    type: String,
    default: "a",
    validator: (value) => ["a", "b", "c", "d"].includes(value)
  },
  testKey: {
    type: String,
    default: "quick-entry"
  }
});

const store = useAppStore();
const localActions = ref([]);
const scheduleVisible = ref(false);
const morningHours = Array.from({ length: 12 }, (_, index) => index);
const afternoonHours = Array.from({ length: 12 }, (_, index) => index + 12);
const queueItems = computed(() => [
  { key: "text", label: "图文问诊", value: store.waitingQueue.byType.text },
  { key: "video", label: "视频问诊", value: store.waitingQueue.byType.video },
  { key: "consult", label: "图文咨询", value: store.waitingQueue.byType.consult }
]);
const consultEntryVariant = computed(() => (store.waitingQueue.total > 0 ? "yellow" : "blue"));
const isAnnouncementRight = computed(() => props.testKey === "announcement-position" && props.variant === "b");
const announcementTimeLayout = computed(() => (props.testKey === "announcement-time" ? props.variant : "a"));
const dragMode = computed(() => (props.testKey === "quick-entry" && props.variant === "b" ? "card" : "handle"));
const dragHint = computed(() =>
  props.testKey === "quick-entry" ? (props.variant === "a" ? "请拖动卡片左上角按钮调整顺序" : "长按并拖动整张卡片调整顺序") : ""
);
const schedulePunchImages = {
  a: schedulePunchAImage,
  b: schedulePunchBImage,
  c: schedulePunchCImage,
  d: schedulePunchDImage
};
const scheduleImageSource = computed(() =>
  props.testKey === "schedule-punch-layout" ? schedulePunchImages[props.variant] : scheduleBModalImage
);

watch(
  () => store.quickActions,
  (actions) => {
    localActions.value = JSON.parse(JSON.stringify(actions || []));
  },
  { immediate: true }
);

function removeQuickAction({ index }) {
  const action = localActions.value[index];
  if (!action || action.isAdd) return;
  localActions.value.splice(index, 1);
  if (!localActions.value.some((item) => item.isAdd)) {
    localActions.value.push({ title: "", desc: "添加快捷入口", icon: "plus", isAdd: true });
  }
  store.showToast("已删除快捷入口");
}

function reorderQuickAction({ fromIndex, toIndex }) {
  const source = localActions.value[fromIndex];
  const target = localActions.value[toIndex];
  if (!source || !target || source.isAdd || target.isAdd || fromIndex === toIndex) return;
  const [action] = localActions.value.splice(fromIndex, 1);
  localActions.value.splice(toIndex, 0, action);
  store.showToast("已调整快捷入口顺序");
}

function selectQuickAction({ action }) {
  if ((props.testKey === "schedule-status" || props.testKey === "schedule-punch-layout") && action.feature === "schedule") {
    scheduleVisible.value = true;
    return;
  }
  store.showToast(action.title || action.desc);
}
</script>

<style scoped>
.row--bottom-announcement-right > .quick-entry-card {
  grid-column: 1 / span 2;
}

.row--bottom-announcement-right > .notice-card {
  grid-column: 3;
}

.ab-schedule-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(9, 30, 66, 0.42);
}

.ab-schedule-modal {
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  color: #1e2939;
  box-shadow: 0 84px 64px -20px rgba(16, 42, 67, 0.18), 0 8px 16px -4px rgba(16, 42, 67, 0.1);
}

.ab-schedule-modal--large {
  width: min(1280px, calc(100vw - 96px));
  transform: scale(0.5);
  transform-origin: center center;
}

.ab-schedule-modal--compact {
  width: min(1380px, calc(100vw - 80px));
}

.ab-schedule-image-modal {
  position: relative;
  width: min(2216px, calc(100vw - 64px));
  transform: scale(0.7);
  transform-origin: center center;
}

.ab-schedule-image-modal--small {
  width: min(1548px, calc(100vw - 64px));
  max-height: calc(100vh - 48px);
  transform: scale(0.8928);
}

.ab-schedule-image-modal img {
  display: block;
  width: 100%;
  max-height: calc(100vh - 48px);
  height: auto;
  object-fit: contain;
  user-select: none;
}

.ab-schedule-image-modal button {
  position: absolute;
  top: 24px;
  right: 48px;
  width: 56px;
  height: 56px;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.ab-schedule-head {
  display: flex;
  height: 72px;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  border-bottom: 1px solid #e5e8eb;
  background: #f2f3f4;
}

.ab-schedule-head--compact {
  height: 64px;
  padding: 0 24px;
}

.ab-schedule-head h2 {
  margin: 0;
  font-size: 26px;
  line-height: 34px;
}

.ab-schedule-head--compact h2 {
  font-size: 22px;
  line-height: 30px;
  font-weight: 400;
}

.ab-schedule-head button {
  border: 0;
  background: transparent;
  color: #99a4b1;
  cursor: pointer;
  font-size: 40px;
  line-height: 1;
}

.ab-schedule-head--compact button {
  font-size: 34px;
}

.ab-schedule-large-toolbar,
.ab-compact-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ab-schedule-large-toolbar {
  padding: 34px 42px 22px;
}

.ab-schedule-date,
.ab-compact-toolbar > div {
  display: flex;
  align-items: center;
  gap: 28px;
}

.ab-schedule-date strong {
  color: #374151;
  font-size: 30px;
  line-height: 40px;
}

.ab-schedule-date span,
.ab-compact-toolbar span {
  padding: 5px 18px;
  border-radius: 6px;
  background: #f8f8f9;
  color: rgba(0, 0, 0, 0.6);
}

.ab-schedule-actions,
.ab-compact-toolbar > div:last-child {
  display: flex;
  gap: 24px;
}

.ab-schedule-actions button,
.ab-compact-toolbar button {
  min-width: 138px;
  height: 48px;
  border: 1px solid #d8dde1;
  border-radius: 8px;
  background: #fff;
  color: rgba(0, 0, 0, 0.6);
  cursor: pointer;
  font-size: 24px;
}

.ab-schedule-actions .primary,
.ab-compact-toolbar .primary {
  border: 0;
  background: linear-gradient(270deg, #3b92ff, #006ef9);
  color: #fff;
}

.ab-day-board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 0 42px 40px;
  overflow: hidden;
  border: 2px solid #e5e8eb;
  border-radius: 12px;
}

.ab-day-column + .ab-day-column {
  border-left: 2px solid #e8ecf2;
}

.ab-day-column h3 {
  margin: 0;
  padding: 24px 34px;
  border-bottom: 1px solid #e8ecf2;
  background: #f8f8f9;
  color: #374151;
  font-size: 30px;
  font-weight: 400;
}

.ab-hour-grid {
  position: relative;
  display: grid;
  grid-template-columns: 112px 1fr;
  grid-template-rows: repeat(12, 70px);
  background: repeating-linear-gradient(to bottom, transparent 0, transparent 69px, #eef1f4 70px);
}

.ab-hour-label {
  grid-column: 1;
  padding-top: 24px;
  color: rgba(0, 0, 0, 0.4);
  font-size: 22px;
  text-align: center;
}

.ab-block {
  position: absolute;
  left: 122px;
  right: 12px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 18px 22px;
  border-radius: 6px;
  font-size: 22px;
}

.ab-block strong {
  color: rgba(0, 0, 0, 0.78);
}

.ab-block em {
  color: #2b8cff;
  font-style: normal;
}

.ab-block--ended {
  top: 280px;
  height: 140px;
  background: rgba(0, 0, 0, 0.06);
  border-left: 5px solid #a9adb3;
}

.ab-block--ended em,
.ab-block--ended strong {
  color: rgba(0, 0, 0, 0.38);
}

.ab-block--active {
  top: 560px;
  height: 230px;
  background: #e4f1ff;
  border-left: 5px solid #2388ff;
}

.ab-block--active b {
  position: absolute;
  right: 22px;
  bottom: 20px;
  color: rgba(0, 0, 0, 0.35);
  font-size: 26px;
  transform: rotate(-15deg);
}

.ab-block--orange {
  top: 140px;
  height: 130px;
  background: #fff1e8;
  border-left: 5px solid #ff7a1a;
}

.ab-block--purple {
  top: 420px;
  height: 260px;
  background: #f0eaff;
  border-left: 5px solid #7b61ff;
}

.ab-now-line {
  position: absolute;
  left: 112px;
  right: 12px;
  top: 629px;
  z-index: 3;
  height: 1px;
  background: #df3131;
}

.ab-now-line i {
  position: absolute;
  left: -7px;
  top: -6px;
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 9px solid #df3131;
}

.ab-missed-callout {
  position: absolute;
  left: 260px;
  top: 494px;
  z-index: 4;
  padding: 10px 18px;
  border: 1px solid #d8dde1;
  border-radius: 6px;
  background: #fff;
  color: rgba(0, 0, 0, 0.6);
  font-size: 24px;
}

.ab-compact-toolbar {
  height: 112px;
  padding: 26px 32px 24px;
}

.ab-compact-toolbar strong {
  color: #374151;
  font-size: 24px;
  line-height: 32px;
}

.ab-compact-toolbar span {
  padding: 6px 18px;
  font-size: 16px;
  line-height: 24px;
}

.ab-compact-toolbar button {
  min-width: 112px;
  height: 42px;
  font-size: 18px;
}

.ab-compact-board {
  margin: 0 32px 32px;
  overflow: hidden;
  border: 1px solid #e8ecf2;
  border-radius: 8px;
}

.ab-compact-board section {
  display: grid;
  grid-template-columns: 72px 1fr;
  min-height: 140px;
}

.ab-compact-board section + section {
  border-top: 1px solid #e8ecf2;
}

.ab-compact-board header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e8ecf2;
  background: #f8f8f9;
}

.ab-compact-board header b {
  color: #374151;
  font-size: 20px;
  line-height: 28px;
}

.ab-compact-board header span {
  color: rgba(0, 0, 0, 0.35);
  font-size: 15px;
  line-height: 22px;
  text-align: center;
}

.ab-compact-row {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: 38px 102px;
}

.ab-compact-row > span {
  padding-left: 8px;
  border-right: 1px solid #f4f5f6;
  border-bottom: 1px solid #e8ecf2;
  color: rgba(0, 0, 0, 0.4);
  font-size: 15px;
  line-height: 38px;
}

.ab-compact-block {
  position: absolute;
  top: 50px;
  height: 82px;
  padding: 14px 12px;
  border-radius: 6px;
  font-size: 16px;
}

.ab-compact-block strong {
  display: block;
  margin-bottom: 30px;
  color: rgba(0, 0, 0, 0.78);
  font-weight: 600;
  line-height: 22px;
}

.ab-compact-block em {
  color: #2b8cff;
  font-style: normal;
  line-height: 22px;
}

.ab-compact-block--ended {
  left: 25%;
  width: 16.6667%;
  background: rgba(0, 0, 0, 0.06);
  border-left: 4px solid #a9adb3;
  color: rgba(0, 0, 0, 0.36);
}

.ab-compact-block--active {
  left: 66.6667%;
  width: 25%;
  background: #e4f1ff;
  border-left: 4px solid #2388ff;
}

.ab-compact-block--active em {
  color: #2b8cff;
}

.ab-compact-block--orange {
  left: 25%;
  width: 16.6667%;
  background: #fff1e8;
  border-left: 4px solid #ff7a1a;
}

.ab-compact-block--orange em {
  color: #ff7a1a;
}

.ab-compact-block--purple {
  left: 58.3333%;
  width: 33.3333%;
  background: #f0eaff;
  border-left: 4px solid #7b61ff;
}

.ab-compact-block--purple em {
  color: #7b61ff;
}

.ab-compact-now-line {
  position: absolute;
  left: 66.4%;
  top: 0;
  bottom: 0;
  z-index: 3;
  width: 1px;
  background: #df3131;
}

.ab-compact-now-line::before {
  position: absolute;
  left: -6px;
  top: -1px;
  width: 0;
  height: 0;
  border-right: 7px solid transparent;
  border-left: 7px solid transparent;
  border-top: 8px solid #df3131;
  content: "";
}

.ab-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 1px 8px;
  border-radius: 999px;
  font-style: normal;
  line-height: 20px;
}

.ab-status--muted {
  background: rgba(31, 41, 55, 0.08);
  color: rgba(0, 0, 0, 0.36);
}

.ab-status--danger {
  margin-left: 8px;
  background: #ffe9e9;
  color: #df3131;
}

.ab-status-dot {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  line-height: 18px;
}

.ab-status-dot--done {
  background: rgba(31, 41, 55, 0.16);
}

.ab-status-dot--warn {
  background: #df3131;
}
</style>
