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
          :class="['ab-test-card', { 'is-disabled': index > 7 }]"
          type="button"
          @click="openTest(index)"
        >
          <span class="ab-test-card__preview" aria-hidden="true">
            <img :src="testThumbnails[index]" :alt="`${item}缩略图`" />
          </span>
          <span class="ab-test-card__foot">
            <span>{{ item }}</span>
            <span class="ab-test-card__arrow">›</span>
          </span>
        </button>
      </section>
    </main>
  </section>

  <ABConsultTagTestView
    v-else-if="step === 'test' && activeTestKey === 'tag-button-style'"
    :variant="variant"
    @back="step = 'landing'"
    @switch-variant="enterVariant"
  />

  <ABSmartReplyTestView
    v-else-if="step === 'test' && activeTestKey === 'smart-quick-reply-layout'"
    :variant="variant"
    @back="step = 'landing'"
    @switch-variant="enterVariant"
  />

  <ABSelectPresentationTestView
    v-else-if="step === 'test' && activeTestKey === 'select-presentation'"
    :variant="variant"
    @back="step = 'landing'"
    @switch-variant="enterVariant"
  />

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
      <img v-if="usesImageGuide" :src="activeGuideImage" :alt="`${activeGuide.name}引导页`" />
      <div v-else class="ab-announcement-guide" aria-label="首页最新公告位置引导页">
        <p class="ab-announcement-guide__title">
          请选择您喜欢的 <strong>最新公告布局</strong>（偏左或偏右）
        </p>
        <section class="ab-announcement-guide__card">
          <header>
            <span>最新公告</span>
            <time>2026-04-08</time>
          </header>
          <article>
            <div>
              <strong>嘉虹健康医生端新功能发布</strong>
              <em>未读</em>
            </div>
            <p>
              一、图文问诊未回复提醒确认机制：图文问诊未回复弹框确认持续3秒，若患者未回复，禁止开具处方。
            </p>
            <p>二、处方驳回流程调整：取消医生端驳回处方修改功能，药师端驳回处方的同时即作废该处方。</p>
            <a>……展开详情</a>
            <footer>成都双流九价通互联网医院</footer>
          </article>
          <button type="button">查看全部公告</button>
        </section>
      </div>
    </div>

    <div v-if="step === 'guide' && guideChoiceVisible" class="ab-guide-mask">
      <section class="ab-guide" role="dialog" aria-modal="true" aria-labelledby="ab-guide-title" @click.stop>
        <h1 id="ab-guide-title">
          {{ activeGuide.titleBefore }}<strong>{{ activeGuide.primary }}</strong>{{ activeGuide.titleMiddle }}<strong>{{ activeGuide.secondary }}</strong>{{ activeGuide.titleAfter || "" }}
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
import guideAnnouncementPositionImage from "@/assets/ab/guide-announcement-position.png";
import guideAnnouncementTimeImage from "@/assets/ab/guide-announcement-time.png";
import guideTagButtonStyleImage from "@/assets/ab/guide-tag-button-style.png";
import guideSmartQuickReplyImage from "@/assets/ab/guide-smart-quick-reply.png";
import guideSelectPresentationImage from "@/assets/ab/guide-select-presentation.png";
import thumbTest1 from "@/assets/ab/thumb-test-1.png";
import thumbTest2 from "@/assets/ab/thumb-test-2.png";
import thumbTest3 from "@/assets/ab/thumb-test-3.png";
import thumbTest4 from "@/assets/ab/thumb-test-4.png";
import thumbTest5 from "@/assets/ab/thumb-test-5.png";
import thumbTest6 from "@/assets/ab/thumb-test-6.png";
import thumbTest7 from "@/assets/ab/thumb-test-7.png";
import thumbTest8 from "@/assets/ab/thumb-test-8.png";
import AppDialogs from "@/components/common/AppDialogs.vue";
import ABConsultTagTestView from "@/components/ab/ABConsultTagTestView.vue";
import ABHomeDashboard from "@/components/ab/ABHomeDashboard.vue";
import ABSelectPresentationTestView from "@/components/ab/ABSelectPresentationTestView.vue";
import ABSmartReplyTestView from "@/components/ab/ABSmartReplyTestView.vue";
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
  "选择框的呈现"
];
const testThumbnails = [thumbTest1, thumbTest2, thumbTest3, thumbTest4, thumbTest5, thumbTest6, thumbTest7, thumbTest8];
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
  },
  "announcement-position": {
    name: "首页最新公告位置",
    titleBefore: "请选择您喜欢的",
    primary: "最新公告布局",
    titleMiddle: "（",
    secondary: "偏左或偏右",
    titleAfter: "）",
    desc: "进入测试页后，请比较最新公告在首页底部区域偏左或偏右时的浏览效率。",
    options: [
      { key: "a", label: "A", desc: "最新公告位于高频操作入口左侧" },
      { key: "b", label: "B", desc: "最新公告位于高频操作入口右侧" }
    ]
  },
  "announcement-time": {
    name: "公告时间信息布局",
    titleBefore: "请选择您喜欢的",
    primary: "最新公告时间布局",
    titleMiddle: "",
    secondary: "",
    desc: "进入测试页后，请比较公告时间位于卡片头部、公告标题区域或底部信息区域时的阅读效率。",
    options: [
      { key: "a", label: "A", desc: "时间显示在最新公告卡片右上角" },
      { key: "b", label: "B", desc: "时间显示在公告标题下方" },
      { key: "c", label: "C", desc: "时间显示在公告底部信息区" }
    ]
  },
  "tag-button-style": {
    name: "标签与按钮显现形式",
    titleBefore: "请选择您认为",
    primary: "迎检与中药",
    titleMiddle: "更像是",
    secondary: "标签",
    titleAfter: "而不是可点击按钮的页面",
    desc: "进入测试页后，请比较问诊室顶部“迎检”和“中药”的视觉呈现是否更像状态标签。",
    options: [
      { key: "a", label: "A", desc: "使用弱化填充的标签样式展示迎检与中药" },
      { key: "b", label: "B", desc: "使用描边按钮样式展示迎检与中药" }
    ]
  },
  "smart-quick-reply-layout": {
    name: "智能与快速回复布局",
    titleBefore: "请选择您喜欢的",
    primary: "智能回复",
    titleMiddle: "和",
    secondary: "快捷回复布局形式",
    desc: "进入测试页后，请点击智能推荐回复或智能回复按钮，比较三种展开方式。",
    options: [
      { key: "a", label: "A", desc: "点击“智能推荐回复”后自动上拉展开" },
      { key: "b", label: "B", desc: "点击“智能回复”按钮后自动上拉展开" },
      { key: "c", label: "C", desc: "点击“智能回复”按钮后跳出弹窗" }
    ]
  },
  "select-presentation": {
    name: "选择框的呈现",
    titleBefore: "请选择您喜欢的",
    primary: "下拉选择框",
    titleMiddle: "",
    secondary: "呈现形式",
    desc: "进入测试页后，请点击药品表格中的“用法”“服用频次”或“用量”输入框，比较两种选项呈现方式。",
    options: [
      { key: "a", label: "A", desc: "模糊搜索时直接展开全部选项，不需要滚动" },
      { key: "b", label: "B", desc: "模糊搜索时选项收纳在框内，需要滚动查看" }
    ]
  }
};
const activeGuide = computed(() => guideMap[activeTestKey.value]);
const guideImageMap = {
  "quick-entry": guideQuickEntryImage,
  "schedule-status": guideScheduleStatusImage,
  "schedule-punch-layout": guideSchedulePunchLayoutImage,
  "announcement-position": guideAnnouncementPositionImage,
  "announcement-time": guideAnnouncementTimeImage,
  "tag-button-style": guideTagButtonStyleImage,
  "smart-quick-reply-layout": guideSmartQuickReplyImage,
  "select-presentation": guideSelectPresentationImage
};
const activeGuideImage = computed(() => guideImageMap[activeTestKey.value]);
const usesImageGuide = computed(() => Boolean(activeGuideImage.value));

function openTest(index) {
  if (index > 7) {
    store.showToast("这个测试项目稍后接入");
    return;
  }
  activeTestKey.value = [
    "quick-entry",
    "schedule-status",
    "schedule-punch-layout",
    "announcement-position",
    "announcement-time",
    "tag-button-style",
    "smart-quick-reply-layout",
    "select-presentation"
  ][index];
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
  display: flex;
  align-items: center;
  justify-content: center;
  height: 237px;
  padding: 12px;
  background: #f4f5f6;
}

.ab-test-card__preview img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: contain;
  user-select: none;
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

.ab-announcement-guide {
  position: relative;
  width: min(1248px, calc(100vw - 64px));
  height: min(702px, calc(100vh - 48px));
  border-radius: 2px;
  background:
    linear-gradient(rgba(151, 160, 174, 0.72), rgba(151, 160, 174, 0.72)),
    linear-gradient(90deg, #eef3f8 0 108px, transparent 108px),
    #f5f7fb;
  box-shadow: 0 24px 70px rgba(16, 42, 67, 0.16);
  transform-origin: center center;
}

.ab-announcement-guide::before,
.ab-announcement-guide::after {
  position: absolute;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.42);
  content: "";
}

.ab-announcement-guide::before {
  left: 184px;
  top: 72px;
  width: 320px;
  height: 202px;
}

.ab-announcement-guide::after {
  left: 520px;
  top: 72px;
  width: 344px;
  height: 202px;
  background: rgba(0, 110, 249, 0.45);
}

.ab-announcement-guide__title {
  position: absolute;
  left: 140px;
  top: 184px;
  z-index: 2;
  margin: 0;
  padding: 14px 20px;
  border-radius: 10px;
  background: #ffffff;
  color: #424751;
  font-size: 28px;
  line-height: 40px;
  box-shadow: 0 8px 24px rgba(16, 42, 67, 0.1);
}

.ab-announcement-guide__title strong {
  font-weight: 700;
}

.ab-announcement-guide__card {
  position: absolute;
  left: 140px;
  top: 276px;
  z-index: 2;
  width: 372px;
  padding: 30px 28px;
  border-radius: 14px;
  background: #ffffff;
  color: #424751;
  box-shadow: 0 12px 32px rgba(16, 42, 67, 0.16);
}

.ab-announcement-guide__card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 22px;
}

.ab-announcement-guide__card article {
  margin-top: 22px;
  padding: 24px 28px 18px;
  border-radius: 8px;
  background: #f8f9fb;
  font-size: 14px;
  line-height: 22px;
}

.ab-announcement-guide__card article div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.ab-announcement-guide__card article strong {
  font-size: 15px;
}

.ab-announcement-guide__card em {
  flex: 0 0 auto;
  padding: 2px 7px;
  border-radius: 4px;
  background: #fff0e5;
  color: #f97316;
  font-size: 12px;
  font-style: normal;
}

.ab-announcement-guide__card p {
  margin: 4px 0;
  color: rgba(0, 0, 0, 0.58);
}

.ab-announcement-guide__card a {
  color: #006ef9;
}

.ab-announcement-guide__card footer {
  margin-top: 18px;
  color: rgba(0, 0, 0, 0.48);
  text-align: right;
}

.ab-announcement-guide__card button {
  width: 100%;
  height: 42px;
  margin-top: 22px;
  border: 1px solid #3b92ff;
  border-radius: 6px;
  background: #ffffff;
  color: #006ef9;
  font-size: 14px;
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
