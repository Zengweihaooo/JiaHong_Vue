<template>
  <section v-if="step === 'landing'" class="ab-landing">
    <header class="ab-landing__header">
      <span class="ab-logo">嘉虹健康</span>
    </header>
    <main class="ab-landing__main">
      <section class="ab-landing__title">
        <div class="ab-landing__icon">A/B</div>
        <div>
          <h1>嘉虹健康医生PC端AB测试</h1>
          <p>请选择需要查看的 AB 测试页面</p>
        </div>
      </section>

      <section class="ab-test-grid">
        <button
          v-for="(item, index) in testItems"
          :key="item"
          :class="['ab-test-card', { 'is-disabled': index > 2 }]"
          type="button"
          @click="openTest(index)"
        >
          <span class="ab-test-card__preview" aria-hidden="true">
            <span class="ab-mini-screen">
              <span class="ab-mini-side"></span>
              <span class="ab-mini-top"></span>
              <span class="ab-mini-line ab-mini-line--one"></span>
              <span class="ab-mini-line ab-mini-line--two"></span>
              <span class="ab-mini-card ab-mini-card--blue"></span>
              <span class="ab-mini-card ab-mini-card--white"></span>
              <span class="ab-mini-card ab-mini-card--wide"></span>
            </span>
          </span>
          <span class="ab-test-card__foot">
            <span>{{ item }}</span>
            <span class="ab-test-card__arrow">›</span>
          </span>
        </button>
      </section>
    </main>
  </section>

  <WorkspaceShell
    v-else
    :collapsed="store.sidebarCollapsed"
    :expanded="!store.sidebarCollapsed && store.sidebarInteractionStarted"
  >
    <template #topbar>
      <Topbar />
    </template>
    <template #sidebar>
      <WorkspaceSidebar
        :menu-groups="store.menuGroups"
        :collapsed="store.sidebarCollapsed"
        @toggle="store.toggleSidebarCollapsed()"
      />
    </template>

    <nav v-if="step === 'test'" class="ab-test-nav" aria-label="AB 测试页面切换">
      <button
        v-for="option in activeGuide.options"
        :key="option.key"
        type="button"
        :disabled="variant === option.key"
        @click="enterVariant(option.key)"
      >
        去 {{ option.label }} 页面
      </button>
      <button type="button" @click="step = 'landing'">返回首页</button>
    </nav>
    <button v-else class="ab-back" type="button" @click="step = 'landing'">返回测试首页</button>
    <ABHomeDashboard :variant="variant" :test-key="activeTestKey" />

    <div v-if="step === 'guide'" class="ab-guide-stage" role="button" tabindex="0" @click="showGuideChoice" @keydown.enter="showGuideChoice">
      <img :src="activeGuideImage" :alt="`${activeGuide.name}引导页`" />
    </div>

    <div v-if="step === 'guide' && guideChoiceVisible" class="ab-guide-mask">
      <section class="ab-guide" role="dialog" aria-modal="true" aria-labelledby="ab-guide-title" @click.stop>
        <h1 id="ab-guide-title">
          {{ activeGuide.titleBefore }}<strong>{{ activeGuide.primary }}</strong>{{ activeGuide.titleMiddle }}<strong>{{ activeGuide.secondary }}</strong>
        </h1>
        <p>测试项目：{{ activeGuide.name }}</p>
        <p>{{ activeGuide.desc }}</p>
        <div class="ab-guide__actions">
          <button v-for="option in activeGuide.options" :key="option.key" type="button" @click="enterVariant(option.key)">
            <strong>选项 {{ option.label }}</strong>
            <span>{{ option.desc }}</span>
          </button>
        </div>
      </section>
    </div>

    <template #dialogs>
      <AppDialogs />
    </template>
  </WorkspaceShell>
</template>

<script setup>
import { computed, ref } from "vue";
import guideQuickEntryImage from "@/assets/ab/guide-quick-entry.png";
import guideScheduleStatusImage from "@/assets/ab/guide-schedule-status.png";
import guideSchedulePunchLayoutImage from "@/assets/ab/guide-schedule-punch-layout.png";
import AppDialogs from "@/components/common/AppDialogs.vue";
import ABHomeDashboard from "@/components/ab/ABHomeDashboard.vue";
import Topbar from "@/components/layout/Topbar.vue";
import { useAppStore } from "@/stores/app";
import { WorkspaceShell, WorkspaceSidebar } from "@jiahong/ui";

const store = useAppStore();
const step = ref("landing");
const variant = ref("a");
const activeTestKey = ref("quick-entry");
const guideChoiceVisible = ref(false);
const testItems = [
  "编辑高频操作入口",
  "今日排班管理现状态",
  "排班管理打卡按钮布局",
  "首页最新公告位置",
  "公告时间信息布局",
  "标签与按钮显现形式",
  "智能与快速回复布局",
  "问诊室信息区布局"
];
const guideMap = {
  "quick-entry": {
    name: "编辑高频操作入口",
    titleBefore: "请点击",
    primary: "编辑",
    titleMiddle: "然后进行快捷操作入口的",
    secondary: "删除和移动",
    desc: "进入测试页后，请先点击“编辑”。A 方案拖动卡片左上角按钮排序，B 方案直接拖动整张卡片排序。",
    options: [
      { key: "a", label: "A", desc: "拖动每张卡片左上角按钮来改变位置" },
      { key: "b", label: "B", desc: "直接拖动整张卡片来改变位置" }
    ]
  },
  "schedule-status": {
    name: "今日排班管理现状态",
    titleBefore: "请点击",
    primary: "排班管理",
    titleMiddle: "查看今日排班的",
    secondary: "当前状态",
    desc: "进入测试页后，请点击“排班管理”快捷入口。A 方案显示大尺寸日程弹窗，B 方案显示横向紧凑排班弹窗。",
    options: [
      { key: "a", label: "A", desc: "点击排班管理后显示大尺寸排班状态弹窗" },
      { key: "b", label: "B", desc: "点击排班管理后显示横向紧凑排班弹窗" }
    ]
  },
  "schedule-punch-layout": {
    name: "排班管理打卡按钮布局",
    titleBefore: "请点击",
    primary: "排班管理",
    titleMiddle: "并留意",
    secondary: "立即打卡的位置",
    desc: "进入测试页后，请点击“排班管理”快捷入口。A、B、C、D 方案分别展示不同的打卡按钮布局。",
    options: [
      { key: "a", label: "A", desc: "查看详情与立即打卡位于弹窗底部右侧" },
      { key: "b", label: "B", desc: "查看详情与立即打卡位于弹窗顶部右侧" },
      { key: "c", label: "C", desc: "横向排班弹窗底部右侧展示操作按钮" },
      { key: "d", label: "D", desc: "横向排班弹窗顶部右侧展示操作按钮" }
    ]
  }
};
const activeGuide = computed(() => guideMap[activeTestKey.value]);
const guideImageMap = {
  "quick-entry": guideQuickEntryImage,
  "schedule-status": guideScheduleStatusImage,
  "schedule-punch-layout": guideSchedulePunchLayoutImage
};
const activeGuideImage = computed(() => guideImageMap[activeTestKey.value]);

function openTest(index) {
  if (index > 2) {
    store.showToast("这个测试项目稍后接入");
    return;
  }
  activeTestKey.value = ["quick-entry", "schedule-status", "schedule-punch-layout"][index];
  variant.value = "a";
  guideChoiceVisible.value = false;
  step.value = "guide";
}

function showGuideChoice() {
  guideChoiceVisible.value = true;
}

function enterVariant(nextVariant) {
  variant.value = nextVariant;
  step.value = "test";
}
</script>

<style scoped>
.ab-landing {
  min-height: var(--jh-viewport-height, 100vh);
  background: #f8f8f9;
}

.ab-landing__header {
  display: flex;
  height: 52px;
  align-items: center;
  padding: 0 24px;
  background: #ffffff;
  box-shadow: 0 1px 1px rgba(16, 42, 67, 0.04);
}

.ab-logo {
  color: var(--jh-blue);
  font-size: 18px;
  font-weight: 700;
}

.ab-landing__main {
  width: min(1336px, calc(100vw - 64px));
  margin: 0 auto;
  padding: 55px 0;
}

.ab-landing__title {
  display: flex;
  gap: 22px;
  align-items: flex-start;
}

.ab-landing__icon {
  display: flex;
  width: 55px;
  height: 55px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #eff6ff;
  color: var(--jh-blue);
  font-size: 18px;
  font-weight: 700;
}

.ab-landing__title h1 {
  margin: 0;
  color: #1e2939;
  font-size: 33px;
  font-weight: 700;
  line-height: 41px;
}

.ab-landing__title p {
  margin: 5px 0 0;
  color: #99a1af;
  font-size: 19px;
  line-height: 27px;
}

.ab-test-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px 39px;
  margin-top: 44px;
}

.ab-test-card {
  display: flex;
  height: 300px;
  flex-direction: column;
  overflow: hidden;
  padding: 1px;
  border: 1px solid #e5e8eb;
  border-radius: 19px;
  background: #ffffff;
  box-shadow: var(--jh-shadow-soft);
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.ab-test-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px -14px rgba(16, 42, 67, 0.24), 0 2px 8px rgba(16, 42, 67, 0.08);
}

.ab-test-card.is-disabled {
  opacity: 0.54;
}

.ab-test-card__preview {
  position: relative;
  height: 237px;
  background: #f4f5f6;
}

.ab-mini-screen {
  position: absolute;
  left: 20px;
  top: 19px;
  width: calc(100% - 40px);
  height: 198px;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #e8edf3;
}

.ab-mini-side {
  position: absolute;
  left: 0;
  top: 0;
  width: 34px;
  height: 100%;
  border-radius: 10px 0 0 10px;
  background: #ffffff;
  box-shadow: inset -1px 0 #edf0f3;
}

.ab-mini-top,
.ab-mini-line,
.ab-mini-card {
  position: absolute;
  border-radius: 6px;
}

.ab-mini-top {
  left: 34px;
  top: 0;
  width: calc(100% - 34px);
  height: 24px;
  background: #ffffff;
  box-shadow: inset 0 -1px #edf0f3;
}

.ab-mini-line {
  left: 54px;
  height: 10px;
  background: #e9f3ff;
}

.ab-mini-line--one {
  top: 42px;
  width: 74px;
}

.ab-mini-line--two {
  top: 62px;
  width: 142px;
}

.ab-mini-card {
  top: 92px;
  width: 66px;
  height: 56px;
  background: #ffffff;
  border: 1px solid #e5e8eb;
}

.ab-mini-card--blue {
  left: 54px;
  background: linear-gradient(270deg, #3b92ff, #006ef9);
}

.ab-mini-card--white {
  left: 132px;
}

.ab-mini-card--wide {
  left: 54px;
  top: 162px;
  width: 154px;
  height: 14px;
  background: #d1e5fe;
  border: 0;
}

.ab-test-card__foot {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  color: #364153;
  font-size: 19px;
  font-weight: 700;
  line-height: 27px;
}

.ab-test-card__arrow {
  color: #99a1af;
  font-size: 24px;
}

.ab-back {
  position: fixed;
  right: 32px;
  bottom: 28px;
  z-index: 20;
  height: 32px;
  padding: 0 14px;
  border: 1px solid #cfe3ff;
  border-radius: 999px;
  background: #ffffff;
  color: var(--jh-blue);
  box-shadow: var(--jh-shadow-soft);
  cursor: pointer;
}

.ab-test-nav {
  position: fixed;
  right: 32px;
  bottom: 28px;
  z-index: 20;
  display: inline-flex;
  gap: 10px;
  padding: 8px;
  border: 1px solid #e5e8eb;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: var(--jh-shadow-soft);
}

.ab-test-nav button {
  height: 32px;
  padding: 0 14px;
  border: 1px solid #cfe3ff;
  border-radius: 999px;
  background: #ffffff;
  color: var(--jh-blue);
  cursor: pointer;
}

.ab-test-nav button:disabled {
  border-color: #d8dde1;
  background: #f2f3f4;
  color: #99a1af;
  cursor: not-allowed;
}

.ab-guide-stage {
  position: fixed;
  inset: 0;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #d7dbe1;
  cursor: pointer;
}

.ab-guide-stage img {
  display: block;
  width: 96.6%;
  height: 96.6%;
  object-fit: contain;
  user-select: none;
}

.ab-guide-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.34);
}

.ab-guide {
  width: min(920px, calc(100vw - 72px));
  padding: 30px 34px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 18px 50px rgba(16, 42, 67, 0.18);
}

.ab-guide h1 {
  margin: 0 0 18px;
  color: #424751;
  font-size: 32px;
  font-weight: 400;
  line-height: 44px;
}

.ab-guide strong {
  font-weight: 700;
}

.ab-guide p {
  margin: 8px 0;
  color: var(--jh-text-secondary);
  font-size: 16px;
  line-height: 26px;
}

.ab-guide__actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.ab-guide__actions button {
  padding: 18px;
  border: 1px solid #e5e8eb;
  border-radius: 10px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
}

.ab-guide__actions button:hover {
  border-color: var(--jh-blue);
  background: #f5f9ff;
}

.ab-guide__actions strong {
  display: block;
  margin-bottom: 8px;
  color: var(--jh-blue);
  font-size: 22px;
  line-height: 28px;
}

.ab-guide__actions span {
  color: var(--jh-text-secondary);
  font-size: 14px;
  line-height: 22px;
}
</style>
