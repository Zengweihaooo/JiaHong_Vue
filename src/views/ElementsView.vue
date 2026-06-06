<template>
  <main class="elements-page">
    <aside class="elements-nav" aria-label="组件目录">
      <div class="elements-nav__brand">
        <strong>JH Elements</strong>
        <span>嘉虹医生端组件系统</span>
      </div>
      <nav>
        <a v-for="section in sections" :key="section.id" :href="`#${section.id}`">
          <span>{{ section.name }}</span>
          <small>{{ section.count }}</small>
        </a>
      </nav>
    </aside>

    <section class="elements-main" aria-label="组件总览">
      <header class="elements-hero">
        <p>Design System</p>
        <h1>嘉虹医生端 Elements</h1>
        <span>沉淀当前 Vue 工程中可复用的基础组件、业务状态组件和样式 token，组件来源统一指向 @jiahong/ui。</span>
      </header>

      <section id="foundations" class="elements-section">
        <div class="elements-section__head">
          <p>Foundation</p>
          <h2>基础变量</h2>
        </div>
        <div class="elements-token-grid">
          <article v-for="token in colorTokens" :key="token.name" class="elements-token">
            <span class="elements-token__swatch" :style="{ background: token.value }"></span>
            <strong>{{ token.name }}</strong>
            <code>{{ token.value }}</code>
          </article>
        </div>
      </section>

      <section id="catalog" class="elements-section">
        <div class="elements-section__head">
          <p>Catalog</p>
          <h2>组件总览</h2>
        </div>
        <div class="elements-component-grid">
          <article v-for="component in componentCatalog" :key="component.name" class="elements-component-card">
            <strong>{{ component.name }}</strong>
            <span>{{ component.description }}</span>
            <code>{{ component.importName }}</code>
          </article>
        </div>
      </section>

      <section id="basics" class="elements-section">
        <div class="elements-section__head">
          <p>Basics</p>
          <h2>基础组件</h2>
        </div>
        <div class="elements-demo-row">
          <Avatar name="张医生" />
          <Avatar name="嘉虹" size="lg" />
          <Button tone="primary">确认</Button>
          <Button tone="secondary">取消</Button>
          <Button tone="danger">删除</Button>
          <Button tone="text">文字按钮</Button>
        </div>
        <div class="elements-demo-row">
          <StatusBadge status="online" />
          <StatusBadge status="busy" />
          <StatusBadge status="offline" />
          <ReadTag status="unread" />
          <ReadTag status="read" />
          <DurationChip :seconds="180" label="问诊持续时长：" />
          <DurationChip :seconds="930" label="问诊持续时长：" />
        </div>
        <div class="elements-basic-grid">
          <Card title="基础内容容器">
            <p class="elements-card-copy">用于承载跨端通用内容，不绑定业务数据。</p>
          </Card>
          <EmptyState :image="assetUrl('assets/room-empty.svg')" title="暂无记录" description="稍后有新内容时会展示在这里" />
          <div class="elements-message-demo">
            <button v-for="item in consultationTypes" :key="item.type" :class="['message-item', `message-item--${item.type}`]" type="button">
              <span class="message-item__stripe" aria-hidden="true"></span>
              <TypeIcon :type="item.type" />
              <span class="message-item__body">
                <span class="message-item__title">{{ item.title }}</span>
                <span class="message-item__preview">{{ item.preview }}</span>
              </span>
              <span v-if="item.badge" class="message-item__badge">{{ item.badge }}</span>
            </button>
          </div>
        </div>
      </section>

      <section id="workspace" class="elements-section">
        <div class="elements-section__head">
          <p>Workspace</p>
          <h2>首页与问诊室组件</h2>
        </div>
        <div class="elements-workspace-grid">
          <article class="elements-preview elements-preview--wide">
            <h3>WorkspaceShell / WorkspaceSidebar</h3>
            <WorkspaceShell :collapsed="false" :expanded="true">
              <template #topbar>
                <header class="topbar elements-mini-topbar">顶部栏</header>
              </template>
              <template #sidebar>
                <WorkspaceSidebar :menu-groups="workspaceMenuGroups" :collapsed="false" />
              </template>
              <main class="elements-mini-main">工作台内容</main>
            </WorkspaceShell>
          </article>

          <article class="elements-preview">
            <h3>WaitingStatusCard</h3>
            <WaitingStatusCard :total="6" :items="workspaceQueueItems" />
          </article>

          <article class="elements-preview elements-preview--wide">
            <h3>ConsultEntryCard</h3>
            <div class="elements-consult-card-pair">
              <ConsultEntryCard variant="blue" />
              <ConsultEntryCard variant="yellow" :has-queue="true" />
            </div>
          </article>

          <article class="elements-preview">
            <h3>ServiceStatusCard</h3>
            <ServiceStatusCard status="online" :services="workspaceServices" />
          </article>

          <article class="elements-preview elements-preview--wide">
            <h3>QuickActionsPanel</h3>
            <QuickActionsPanel :actions="workspaceQuickActions" />
          </article>

          <article class="elements-preview elements-preview--wide">
            <h3>RoomPendingWorkspace</h3>
            <RoomPendingWorkspace :skeleton-count="3" />
          </article>
        </div>
      </section>

      <section id="consultation" class="elements-section">
        <div class="elements-section__head">
          <p>Consultation</p>
          <h2>视频问诊与处方组件</h2>
        </div>
        <div class="elements-consult-grid">
          <article class="elements-preview elements-preview--wide">
            <h3>VideoCallWindow</h3>
            <VideoCallWindow :camera-on="false" :mic-on="true" camera-status-text="摄像头已关闭" />
          </article>

          <article class="elements-preview">
            <h3>ConsultInfoCard</h3>
            <ConsultInfoCard
              title="咨询信息"
              description="咳嗽三天，有黄痰，夜间咳嗽明显，体温 37.4。"
              :images="voucherImages.slice(0, 2)"
              :voices="voucherVoices.slice(0, 1)"
            />
          </article>

          <article class="elements-preview">
            <h3>FollowUpVoucher</h3>
            <FollowUpVoucher title="复诊凭证" variant="mixed" :images="voucherImages" :voices="voucherVoices" />
          </article>

          <article class="elements-preview elements-preview--wide">
            <h3>MedicineRiskTip</h3>
            <MedicineRiskTip
              title="药品风险提示 · 盐酸氨溴索片"
              level="severe"
              level-label="严重警告"
              :categories="['用法用量']"
              message="[警示信息]盐酸氨溴索片当前频次与用量需核对，请确认是否符合患者咳嗽咳痰情况。"
              suggestion="[建议信息]请调整服用频次或用量后，再提交处方。"
              :active-medicine-index="1"
            />
          </article>
        </div>
      </section>

      <section id="icons" class="elements-section">
        <div class="elements-section__head">
          <p>Icons</p>
          <h2>工作台图标</h2>
        </div>
        <div class="elements-icon-grid">
          <article v-for="icon in workspaceIconAssets" :key="icon.name" class="elements-icon-card">
            <img :src="assetUrl(icon.path)" :alt="icon.name" />
            <strong>{{ icon.name }}</strong>
            <code>{{ icon.path }}</code>
          </article>
        </div>
      </section>

      <section id="forms" class="elements-section">
        <div class="elements-section__head">
          <p>Primitives</p>
          <h2>表单与控制样式</h2>
        </div>
        <div class="elements-form-grid">
          <label>
            <span>诊断输入</span>
            <input class="jh-input-field jh-input-field--lg diagnosis-select-input" type="text" placeholder="请选择诊断" aria-label="请选择诊断" />
          </label>
          <label>
            <span>处理意见</span>
            <textarea class="jh-input-field jh-input-field--lg consultation-treatment-input" placeholder="请输入治疗处理意见" aria-label="请输入治疗处理意见"></textarea>
          </label>
          <label>
            <span>搜索框</span>
            <span class="jh-search-field medicine-search">
              <span class="jh-search-field__icon" aria-hidden="true">
                <img :src="assetUrl('assets/search-icon.png')" alt="" />
              </span>
              <input type="text" placeholder="请输入药品名称或首字母做模糊查询" aria-label="请输入药品名称或首字母做模糊查询" />
            </span>
          </label>
          <div class="elements-control-row">
            <button class="jh-switch is-on" type="button" aria-label="切换出诊状态" aria-pressed="true"></button>
            <button class="jh-switch" type="button" aria-label="切换出诊状态" aria-pressed="false"></button>
            <span class="jh-checkbox is-selected">
              <span class="jh-checkbox__icon" aria-hidden="true">
                <img class="jh-checkbox__mark" :src="assetUrl('assets/figma-home/checkmark.svg')" alt="" />
              </span>
              <span>已选择</span>
            </span>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import {
  Avatar,
  Button,
  Card,
  ConsultEntryCard,
  ConsultInfoCard,
  DurationChip,
  EmptyState,
  FollowUpVoucher,
  MedicineRiskTip,
  QuickActionsPanel,
  ReadTag,
  RoomPendingWorkspace,
  ServiceStatusCard,
  StatusBadge,
  TypeIcon,
  VideoCallWindow,
  WaitingStatusCard,
  WorkspaceShell,
  WorkspaceSidebar,
  assetUrl
} from "@jiahong/ui";

const sections = [
  { id: "foundations", name: "基础变量", count: "6" },
  { id: "catalog", name: "组件总览", count: "19" },
  { id: "basics", name: "基础组件", count: "8" },
  { id: "workspace", name: "工作台", count: "6" },
  { id: "consultation", name: "问诊处方", count: "4" },
  { id: "icons", name: "工作台图标", count: "19" },
  { id: "forms", name: "表单控制", count: "CSS" }
];

const componentCatalog = [
  { name: "Avatar", importName: "Avatar", description: "医生、患者、药师头像" },
  { name: "Button", importName: "Button", description: "基础操作按钮" },
  { name: "Card", importName: "Card", description: "通用内容容器" },
  { name: "ConsultEntryCard", importName: "ConsultEntryCard", description: "进入问诊室入口" },
  { name: "ConsultInfoCard", importName: "ConsultInfoCard", description: "病情和附件信息" },
  { name: "DurationChip", importName: "DurationChip", description: "问诊持续时长" },
  { name: "EmptyState", importName: "EmptyState", description: "空状态展示" },
  { name: "FollowUpVoucher", importName: "FollowUpVoucher", description: "复诊凭证" },
  { name: "MedicineRiskTip", importName: "MedicineRiskTip", description: "药品风险提示" },
  { name: "QuickActionsPanel", importName: "QuickActionsPanel", description: "高频操作入口" },
  { name: "ReadTag", importName: "ReadTag", description: "已读未读状态" },
  { name: "RoomPendingWorkspace", importName: "RoomPendingWorkspace", description: "待接诊问诊室" },
  { name: "ServiceStatusCard", importName: "ServiceStatusCard", description: "服务状态开关" },
  { name: "StatusBadge", importName: "StatusBadge", description: "通用状态标签" },
  { name: "TypeIcon", importName: "TypeIcon", description: "问诊类型图标" },
  { name: "VideoCallWindow", importName: "VideoCallWindow", description: "视频问诊画面" },
  { name: "WaitingStatusCard", importName: "WaitingStatusCard", description: "候诊状态卡片" },
  { name: "WorkspaceShell", importName: "WorkspaceShell", description: "工作台外壳" },
  { name: "WorkspaceSidebar", importName: "WorkspaceSidebar", description: "工作台侧边栏" }
];

const colorTokens = [
  { name: "--jh-color-primary", value: "#1677ff" },
  { name: "--jh-color-success", value: "#20b26b" },
  { name: "--jh-color-warning", value: "#f59e0b" },
  { name: "--jh-color-danger", value: "#e5484d" },
  { name: "--jh-text-primary", value: "rgba(0, 0, 0, 0.9)" },
  { name: "--jh-text-secondary", value: "rgba(0, 0, 0, 0.6)" }
];

const consultationTypes = [
  { type: "video", title: "嘉虹健康视频问诊", preview: "患者等待视频接入", badge: 1 },
  { type: "text", title: "武汉市好药师大药房光谷店", preview: "患者补充了症状描述", badge: 2 },
  { type: "consult", title: "武汉市好药师大药房", preview: "图文咨询处理意见待填写", badge: 0 }
];

const voucherImages = [
  { title: "图片凭证1", image: "assets/consult-materials/allergic-rhinitis.png" },
  { title: "图片凭证2", image: "assets/consult-materials/pediatric-fever.png" },
  { title: "图片凭证3", image: "assets/consult-materials/sore-throat.png" }
];

const voucherVoices = [
  { title: "语音凭证1", duration: 8 },
  { title: "语音凭证2", duration: 7 }
];

const workspaceMenuGroups = [
  {
    title: "工作台",
    items: [
      { label: "首页", icon: "home", active: true },
      { label: "数据看板", icon: "dashboard" }
    ]
  },
  {
    title: "问诊管理",
    items: [
      { label: "三方问诊", icon: "circle" },
      { label: "问诊记录", icon: "clipboard" },
      { label: "驳回处方", icon: "checkSquare" }
    ]
  },
  {
    title: "运营相关",
    items: [
      { label: "出诊管理", icon: "briefcase" },
      { label: "值班打卡", icon: "calendar" }
    ]
  },
  {
    title: "账户",
    items: [
      { label: "个人中心", icon: "user" },
      { label: "医生佣金", icon: "shield" }
    ]
  }
];

const workspaceIconAssets = [
  { name: "首页", path: "assets/figma-home/home.svg" },
  { name: "数据看板", path: "assets/figma-home/trello.svg" },
  { name: "三方问诊", path: "assets/figma-home/disc.svg" },
  { name: "问诊记录", path: "assets/figma-home/clipboard.svg" },
  { name: "驳回处方", path: "assets/figma-home/check-square.svg" },
  { name: "出诊管理", path: "assets/figma-home/briefcase.svg" },
  { name: "值班打卡", path: "assets/figma-home/calendar.svg" },
  { name: "个人中心", path: "assets/figma-home/user.svg" },
  { name: "医生佣金", path: "assets/figma-home/pocket.svg" },
  { name: "菜单收起", path: "assets/figma-home/menu-icon.svg" },
  { name: "问诊入口", path: "assets/figma-home/consult-icon.svg" },
  { name: "排班底图", path: "assets/figma-home/quick-schedule-box.svg" },
  { name: "排班标记", path: "assets/figma-home/quick-schedule-mark.svg" },
  { name: "快捷文档", path: "assets/figma-home/quick-doc.svg" },
  { name: "新增入口", path: "assets/figma-home/quick-plus.svg" },
  { name: "时钟底图", path: "assets/figma-home/quick-clock-circle.svg" },
  { name: "时钟指针", path: "assets/figma-home/quick-clock-hand.svg" },
  { name: "勾选", path: "assets/figma-home/checkmark.svg" },
  { name: "搜索", path: "assets/search-icon.png" }
];

const workspaceQueueItems = [
  { key: "text", label: "图文问诊", value: 1 },
  { key: "video", label: "视频问诊", value: 3 },
  { key: "consult", label: "图文咨询", value: 2 }
];

const workspaceServices = [
  { key: "text", label: "图文问诊", enabled: true },
  { key: "video", label: "视频问诊", enabled: true },
  { key: "consult", label: "图文咨询", enabled: true }
];

const workspaceQuickActions = [
  { title: "排班管理", desc: "查看值班安排", icon: "quickCalendar", feature: "schedule" },
  { title: "历史问诊", desc: "历史病历查询", icon: "clock", feature: "history" },
  { title: "组件系统", desc: "查看 Elements", icon: "document", feature: "elements" },
  { title: "", desc: "添加快捷入口", icon: "plus", isAdd: true }
];
</script>

<style scoped>
.elements-page {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 100vh;
  background: var(--jh-bg);
  color: var(--jh-text-primary);
}

.elements-nav {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 28px 20px;
  border-right: 1px solid var(--jh-line);
  background: var(--jh-card);
}

.elements-nav__brand {
  display: grid;
  gap: 6px;
}

.elements-nav__brand strong {
  font-size: 20px;
  line-height: 28px;
}

.elements-nav__brand span,
.elements-hero span,
.elements-section__head p,
.elements-component-card span {
  color: var(--jh-text-secondary);
}

.elements-nav nav {
  display: grid;
  gap: 6px;
}

.elements-nav a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 6px;
  color: var(--jh-text-primary);
  text-decoration: none;
  font-size: 14px;
}

.elements-nav a:hover {
  background: #eef5ff;
  color: var(--jh-blue);
}

.elements-nav small {
  color: var(--jh-text-tertiary);
  font-size: 12px;
}

.elements-main {
  width: min(1180px, 100%);
  padding: 32px;
}

.elements-hero,
.elements-section {
  border: 1px solid var(--jh-line);
  border-radius: 8px;
  background: var(--jh-card);
  box-shadow: var(--jh-shadow);
}

.elements-hero {
  margin-bottom: 20px;
  padding: 28px;
}

.elements-hero p,
.elements-section__head p {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 20px;
  text-transform: uppercase;
}

.elements-hero h1,
.elements-section__head h2,
.elements-preview h3 {
  margin: 4px 0 0;
}

.elements-section {
  margin-bottom: 20px;
  padding: 24px;
}

.elements-section__head {
  margin-bottom: 18px;
}

.elements-token-grid,
.elements-component-grid,
.elements-basic-grid,
.elements-workspace-grid,
.elements-consult-grid,
.elements-icon-grid,
.elements-form-grid {
  display: grid;
  gap: 12px;
}

.elements-token-grid,
.elements-component-grid,
.elements-icon-grid {
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}

.elements-basic-grid,
.elements-form-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.elements-workspace-grid,
.elements-consult-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.elements-token,
.elements-component-card,
.elements-icon-card,
.elements-preview {
  border: 1px solid var(--jh-line);
  border-radius: 8px;
  background: #ffffff;
}

.elements-token {
  display: grid;
  grid-template-columns: 36px 1fr;
  grid-template-areas:
    "swatch name"
    "swatch code";
  gap: 4px 12px;
  align-items: center;
  min-height: 72px;
  padding: 12px;
}

.elements-token__swatch {
  grid-area: swatch;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.elements-token strong {
  grid-area: name;
  font-size: 14px;
}

.elements-token code,
.elements-component-card code,
.elements-icon-card code {
  overflow: hidden;
  color: var(--jh-text-tertiary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.elements-component-card {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 14px;
}

.elements-icon-card {
  display: grid;
  min-width: 0;
  min-height: 132px;
  justify-items: center;
  gap: 6px;
  padding: 14px 10px;
  text-align: center;
}

.elements-icon-card img {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.elements-component-card strong {
  font-size: 15px;
  line-height: 22px;
}

.elements-icon-card strong {
  color: var(--jh-text-primary);
  font-size: 13px;
  line-height: 20px;
}

.elements-component-card span {
  font-size: 13px;
  line-height: 20px;
}

.elements-demo-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.elements-basic-grid {
  align-items: stretch;
}

.elements-card-copy {
  margin: 0;
  color: var(--jh-text-secondary);
  font-size: 14px;
  line-height: 22px;
}

.elements-message-demo {
  display: grid;
  gap: 8px;
  align-content: start;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--jh-line);
  border-radius: 8px;
}

.elements-message-demo .message-item {
  width: 100%;
}

.elements-preview {
  min-width: 0;
  padding: 14px;
  overflow: hidden;
}

.elements-preview--wide {
  grid-column: 1 / -1;
}

.elements-preview h3 {
  margin-bottom: 12px;
  color: var(--jh-text-primary);
  font-size: 15px;
  line-height: 22px;
}

.elements-mini-topbar {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  height: var(--jh-topbar-height);
  padding: 0 18px;
  background: #ffffff;
  box-shadow: var(--jh-shadow);
  color: var(--jh-text-secondary);
  font-size: 14px;
}

.elements-mini-main {
  grid-column: 2;
  grid-row: 2;
  display: grid;
  place-items: center;
  margin: 0;
  background: #f2f3f4;
  color: var(--jh-text-tertiary);
}

.elements-form-grid label {
  display: grid;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
}

.elements-form-grid .consultation-treatment-input {
  min-height: 92px;
  resize: vertical;
}

.elements-control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.elements-preview :deep(.app-shell) {
  width: 100%;
  min-width: 0;
  min-height: 680px;
  height: 680px;
}

.elements-preview :deep(.sidebar) {
  position: relative;
  height: 680px;
}

.elements-preview :deep(.waiting-card),
.elements-preview :deep(.consult-card),
.elements-preview :deep(.service-card),
.elements-preview :deep(.quick-entry-card),
.elements-preview :deep(.room-card--pending-consult),
.elements-preview :deep(.video-window),
.elements-preview :deep(.consult-info-card),
.elements-preview :deep(.jh-voucher),
.elements-preview :deep(.medicine-risk-tip) {
  width: 100%;
  margin: 0;
}

.elements-preview :deep(.quick-entry-card) {
  min-height: 360px;
  padding: 20px;
}

.elements-consult-card-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
}

.elements-preview :deep(.quick-grid) {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.elements-preview :deep(.quick-card) {
  min-height: 124px;
}

.elements-preview :deep(.room-card--pending-consult) {
  position: relative;
  height: 360px;
  min-height: 360px;
}

.elements-preview :deep(.room-card--pending-consult .consult-workspace) {
  grid-template-columns: minmax(260px, 1fr) minmax(360px, 1.45fr);
}

.elements-preview :deep(.video-window),
.elements-preview :deep(.video-window__stage) {
  min-height: 260px;
}

@media (max-width: 900px) {
  .elements-page {
    grid-template-columns: 1fr;
  }

  .elements-nav {
    position: static;
    height: auto;
  }

  .elements-main {
    padding: 18px;
  }

  .elements-workspace-grid,
  .elements-consult-grid {
    grid-template-columns: 1fr;
  }
}
</style>
