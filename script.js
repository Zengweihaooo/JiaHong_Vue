const icons = {
  logo: `
    <svg class="brand-mark" viewBox="0 0 79 20" fill="none" aria-label="嘉虹健康">
      <circle cx="10" cy="10" r="9" fill="#0D8BFF"/>
      <path d="M5.6 10.1c2.4-3.8 5.3-5.2 8.6-4.2-1.7.9-2.8 2.2-3.3 3.9 1.7-.5 3.5-.2 5.5.9-2.2 2.7-5.2 3.8-9 3.4.8-.8 1.4-1.7 1.7-2.8-1.1-.2-2.3-.6-3.5-1.2Z" fill="#fff"/>
      <text x="24" y="9" font-family="Microsoft YaHei UI, Arial, sans-serif" font-size="7" fill="#1492FF">JiaHongHealth</text>
      <text x="24" y="18" font-family="Microsoft YaHei UI, Arial, sans-serif" font-size="9" font-weight="700" fill="#1492FF">嘉虹健康</text>
    </svg>`,
  home: `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 7.1 8 2.5l5.5 4.6v6.1a.8.8 0 0 1-.8.8H3.3a.8.8 0 0 1-.8-.8V7.1Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/>
      <path d="M6.2 14V9.3h3.6V14" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
    </svg>`,
  dashboard: `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="3" width="11" height="10" rx="1.2" stroke="currentColor" stroke-width="1.25"/>
      <path d="M5 6h2.2M5 8.4h6M5 10.8h6" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
    </svg>`,
  circle: `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.25"/>
      <circle cx="8" cy="8" r="1.6" fill="currentColor"/>
    </svg>`,
  clipboard: `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5.5 3.5h-1A1.5 1.5 0 0 0 3 5v7A1.5 1.5 0 0 0 4.5 13.5h7A1.5 1.5 0 0 0 13 12V5a1.5 1.5 0 0 0-1.5-1.5h-1" stroke="currentColor" stroke-width="1.25"/>
      <rect x="5.5" y="2.5" width="5" height="2.5" rx="1" stroke="currentColor" stroke-width="1.25"/>
    </svg>`,
  checkSquare: `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.6" y="2.8" width="10.8" height="10.8" rx="1.4" stroke="currentColor" stroke-width="1.25"/>
      <path d="m5.3 8 1.8 1.8 3.8-4" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  briefcase: `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5.8 4.8V3.7c0-.7.5-1.2 1.2-1.2h2c.7 0 1.2.5 1.2 1.2v1.1" stroke="currentColor" stroke-width="1.25"/>
      <rect x="2.5" y="4.8" width="11" height="8.2" rx="1.4" stroke="currentColor" stroke-width="1.25"/>
      <path d="M2.7 8h10.6" stroke="currentColor" stroke-width="1.25"/>
    </svg>`,
  calendar: `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" stroke-width="1.25"/>
      <path d="M5.4 2.5v2M10.6 2.5v2M3 6.5h10" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
    </svg>`,
  user: `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5.4" r="2.4" stroke="currentColor" stroke-width="1.25"/>
      <path d="M3.6 13.2c.7-2.2 2.1-3.3 4.4-3.3s3.7 1.1 4.4 3.3" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
    </svg>`,
  shield: `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2.5 12.5 4v3.6c0 2.9-1.7 5-4.5 5.9-2.8-.9-4.5-3-4.5-5.9V4L8 2.5Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/>
      <path d="m5.8 7.7 1.4 1.4 3-3" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  menu: `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 5h10M3 8h10M3 11h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`,
  stethoscope: `
    <svg viewBox="0 0 88 88" width="74" height="74" fill="none" aria-hidden="true">
      <path d="M28 18v21c0 12 8 21 19 21s19-9 19-21V18" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <path d="M40 60v5c0 8 7 14 15 14s15-6 15-14v-7" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <circle cx="70" cy="53" r="8" stroke="#fff" stroke-width="5"/>
      <path d="M21 18h14M59 18h14" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <path d="M39 29h16" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  quickCalendar: `
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <rect x="5" y="5.5" width="14" height="15" rx="2" stroke="currentColor" stroke-width="1.8"/>
      <path d="M8 3.5v4M16 3.5v4M7 10h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  document: `
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <path d="M7 4h8l3 3v13H7V4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M14.8 4v4h4M9.5 12h5M9.5 15.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  clock: `
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/>
      <path d="M12 7.5v5l3.5 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  plus: `
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="#A9B2BC" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
};

const menuGroups = [
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

const quickActions = [
  { title: "排班管理", desc: "查看值班安排", icon: "quickCalendar" },
  { title: "医生佣金条", desc: "查看当月佣金明细", icon: "document" },
  { title: "历史问诊", desc: "历史病历查询", icon: "clock" },
  { title: "", desc: "添加快捷入口", icon: "plus" }
];

const services = ["图文问诊", "视频问诊", "图文咨询"];

function renderMenu() {
  return menuGroups
    .map(
      (group) => `
        <div class="menu-section">${group.title}</div>
        ${group.items
          .map(
            (item) => `
              <button class="menu-item${item.active ? " is-active" : ""}" type="button" data-menu="${item.label}">
                ${icons[item.icon]}
                <span>${item.label}</span>
              </button>`
          )
          .join("")}`
    )
    .join("");
}

function renderSidebar() {
  return `
    <aside class="sidebar" aria-label="主菜单">
      <div class="sidebar__brand">${icons.logo}</div>
      <nav class="sidebar__content">${renderMenu()}</nav>
      <div class="sidebar__footer">${icons.menu}</div>
    </aside>`;
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div class="topbar__right">
        <div class="certificate">
          <span>证书到期时间</span>
          <span>2027-01-15</span>
        </div>
        <div class="topbar__actions">
          <button class="btn btn--primary" type="button">在线客服</button>
          <button class="btn btn--outline" type="button">医生招聘</button>
        </div>
        <div class="user-chip">
          <div class="user-chip__body">
            <span class="avatar" aria-hidden="true"></span>
            <span>张医生</span>
          </div>
        </div>
      </div>
    </header>`;
}

function renderWaitingCard() {
  return `
    <section class="card card--compact waiting-card" aria-label="当前候诊状态">
      <div class="waiting-card__left">
        <div class="waiting-card__heading">
          <h1 class="card__title">当前候诊状态</h1>
          <p class="waiting-card__label">当前候诊人数</p>
        </div>
        <p class="waiting-card__number">2</p>
        <p class="waiting-card__hint">请及时接诊患者</p>
      </div>
      <div class="waiting-card__right">
        <div class="queue-chip">
          <span class="queue-chip__name">图文问诊</span>
          <span class="queue-chip__value">1</span>
        </div>
        <div class="queue-chip">
          <span class="queue-chip__name">视频问诊</span>
          <span class="queue-chip__value">1</span>
        </div>
      </div>
    </section>`;
}

function renderConsultCard() {
  return `
    <button class="consult-card" type="button" aria-label="进入问诊室">
      <div class="consult-card__content">
        <div class="consult-card__icon">${icons.stethoscope}</div>
        <h2>进入问诊室</h2>
        <p>点击开始接诊患者</p>
      </div>
    </button>`;
}

function renderServiceCard() {
  return `
    <section class="card card--compact service-card" aria-label="接诊状态与服务开关">
      <h2 class="card__title">接诊状态与服务开关</h2>
      <div class="status-row">
        <div class="status-row__left">
          <span>出诊状态</span>
          <span class="badge" data-status-text>在线</span>
        </div>
        <button class="switch is-on" type="button" aria-label="切换出诊状态" aria-pressed="true"></button>
      </div>
      <div class="service-list">
        ${services
          .map(
            (service) => `
              <button class="service-tile" type="button" role="checkbox" aria-checked="true" data-service="${service}">
                <span class="check-icon" aria-hidden="true"></span>
                <span>${service}</span>
              </button>`
          )
          .join("")}
      </div>
    </section>`;
}

function renderNoticeCard() {
  return `
    <section class="card notice-card" aria-label="最新公告">
      <div class="notice-card__inner">
        <div class="notice-card__head">
          <div class="notice-card__title-row">
            <h2 class="card__title">最新公告</h2>
            <span class="notice-card__date">2026-04-08</span>
          </div>
          <div class="divider"></div>
        </div>
        <article class="announcement">
          <div class="announcement__top">
            <div class="announcement__title-row">
              <h3 class="announcement__title">嘉虹健康医生端新功能发布</h3>
              <span class="tag">未读</span>
            </div>
            <div class="announcement__body">
              <p>一、图文问诊未回复弹框确认机制：图文问诊未回复弹框确认持续3秒。若顾客未回复，禁止开具处方。</p>
              <p>二、处方驳回流程调整：取消医生端驳回处方修改功能。药师端驳回处方的同时即作废该处方。医生开方前需谨慎核对。</p>
              <p class="link">……展开详情</p>
            </div>
          </div>
          <p class="announcement__footer">成都双流九州通互联网医院</p>
        </article>
        <button class="btn btn--outline btn--block" type="button">查看全部公告</button>
      </div>
    </section>`;
}

function renderQuickActions() {
  return `
    <section class="card quick-entry-card" aria-label="高频操作入口">
      <h2 class="card__title">高频操作入口</h2>
      <div class="quick-grid">
        ${quickActions
          .map(
            (action) => `
              <button class="quick-card" type="button" data-action="${action.desc}">
                <span class="quick-card__body">
                  <span class="icon-box">${icons[action.icon]}</span>
                  ${
                    action.title
                      ? `<span class="quick-card__title">${action.title}</span>`
                      : ""
                  }
                  <span class="quick-card__desc">${action.desc}</span>
                </span>
              </button>`
          )
          .join("")}
      </div>
    </section>`;
}

function renderMain() {
  return `
    <main class="main">
      <div class="content-stack">
        <div class="row row--top">
          ${renderWaitingCard()}
          ${renderConsultCard()}
          ${renderServiceCard()}
        </div>
        <div class="row row--bottom">
          ${renderNoticeCard()}
          ${renderQuickActions()}
        </div>
        <footer class="footer">嘉虹健康　copyright © 2017-2026　鄂ICP备2024037712号-1</footer>
      </div>
    </main>`;
}

function renderApp() {
  document.getElementById("app").innerHTML = `
    <div class="app-shell">
      ${renderTopbar()}
      ${renderSidebar()}
      ${renderMain()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

function showToast(message) {
  const toast = document.querySelector(".toast");
  window.clearTimeout(showToast.timer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1500);
}

function bindInteractions() {
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".menu-item").forEach((node) => {
        node.classList.remove("is-active");
      });
      item.classList.add("is-active");
    });
  });

  const statusText = document.querySelector("[data-status-text]");
  const switchButton = document.querySelector(".switch");
  switchButton.addEventListener("click", () => {
    const nextState = !switchButton.classList.contains("is-on");
    switchButton.classList.toggle("is-on", nextState);
    switchButton.setAttribute("aria-pressed", String(nextState));
    statusText.textContent = nextState ? "在线" : "离线";
    statusText.style.color = nextState ? "" : "#747c85";
    statusText.style.background = nextState ? "" : "#eceef0";
  });

  document.querySelectorAll(".service-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      const enabled = tile.getAttribute("aria-checked") === "true";
      tile.setAttribute("aria-checked", String(!enabled));
    });
  });

  document.querySelector(".consult-card").addEventListener("click", () => {
    showToast("进入问诊室");
  });

  document.querySelectorAll(".quick-card").forEach((card) => {
    card.addEventListener("click", () => {
      showToast(card.dataset.action);
    });
  });

  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("click", () => {
      showToast(button.textContent.trim());
    });
  });
}

renderApp();
bindInteractions();
